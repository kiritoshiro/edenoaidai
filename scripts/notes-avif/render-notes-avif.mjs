#!/usr/bin/env node
// Makes the AVIF sheet-music pages from the site's own SVG pages, on this
// computer rather than on the server (which cannot render SVG):
//
//   1. lists the SVG pages (live db.json, or a local folder),
//   2. renders each one at 1181×1811 px (200 dpi) on white with headless
//      Edge/Chrome, which draws these SVGs correctly,
//   3. encodes it as AVIF with PHP GD (scripts/notes-avif/encode-avif.php),
//   4. compares the AVIF with the page's existing JPG and lists outliers,
//   5. writes <out>/notes/avif/*.avif, report.csv and notes-avif.zip; the
//      ZIP can be restored in Admin → Duomenų bazė → Natos (format AVIF).
//
// Existing files in <out> are kept (rerun to finish an interrupted run) unless
// --force is given. Nothing is uploaded or changed on the server.
//
//   node scripts/notes-avif/render-notes-avif.mjs [options]
//     --site=URL        site to read db.json and files from
//                       (default https://giesmynas.adventistai.lt)
//     --svg-dir=DIR     read SVG pages from a folder instead of the site
//     --jpg-dir=DIR     JPG pages to compare with (with --svg-dir)
//     --out=DIR         output folder (default notes-avif-out)
//     --only=ID,ID      only these song IDs
//     --quality=N       AVIF quality 0–100 (default 60)
//     --speed=N         AVIF encoder speed 0–10, lower is smaller (default 6)
//     --threshold=N     mean grey difference vs JPG that counts as an
//                       outlier, 0–255 (default 12)
//     --jobs=N          pages encoded in parallel (default: half the CPUs)
//     --browser=PATH    Edge or Chrome executable
//     --php=PATH        PHP with GD AVIF support (default php)
//     --force           re-render pages that already exist in <out>

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { availableParallelism, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32 } from 'node:zlib';

const WIDTH = 1181;
const HEIGHT = 1811;
const SONG_ID_RE = /^[A-Za-z0-9 _-]{1,20}$/;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BROWSERS = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function parseArgs(argv) {
    const options = {
        site: 'https://giesmynas.adventistai.lt',
        svgDir: '',
        jpgDir: '',
        out: 'notes-avif-out',
        only: null,
        quality: 60,
        speed: 6,
        threshold: 12,
        jobs: Math.max(1, Math.floor(availableParallelism() / 2)),
        browser: BROWSERS.find(candidate => existsSync(candidate)) || '',
        php: 'php',
        force: false,
    };
    for (const arg of argv) {
        const match = arg.match(/^--([a-z-]+)(?:=(.*))?$/);
        if (!match) throw new Error(`Unknown argument: ${arg}`);
        const [, key, value = ''] = match;
        const name = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        if (name === 'help') {
            console.log(readHelp());
            process.exit(0);
        } else if (name === 'force') {
            options.force = true;
        } else if (name === 'only') {
            options.only = new Set(value.split(',').map(id => id.trim()).filter(Boolean));
        } else if (['quality', 'speed', 'threshold', 'jobs'].includes(name)) {
            const number = Number(value);
            if (!Number.isFinite(number)) throw new Error(`--${key} needs a number`);
            options[name] = number;
        } else if (name in options) {
            options[name] = value;
        } else {
            throw new Error(`Unknown option: --${key}`);
        }
    }
    options.site = options.site.replace(/\/+$/, '');
    if (!options.browser) throw new Error('No Edge or Chrome found; pass --browser=PATH');
    return options;
}

function readHelp() {
    return `See the comment at the top of ${path.relative(process.cwd(), fileURLToPath(import.meta.url))}.`;
}

// "<songId>" is page 0, "<songId>_<n>" page n (1–8), as on the server.
function songIdOf(base) {
    const match = base.match(/^(.+?)(?:_([1-8]))?$/u);
    return match && SONG_ID_RE.test(match[1]) ? match[1] : null;
}

async function listPages(options) {
    const pages = [];
    const jpgWithoutSvg = [];
    if (options.svgDir) {
        for (const name of (await readdir(options.svgDir)).sort(naturalCompare)) {
            if (!/\.svg$/i.test(name)) continue;
            const base = name.replace(/\.svg$/i, '');
            const jpgFile = options.jpgDir ? path.join(options.jpgDir, `${base}.jpg`) : '';
            pages.push({
                base,
                songId: songIdOf(base),
                svg: { file: path.join(options.svgDir, name) },
                jpg: jpgFile && existsSync(jpgFile) ? { file: jpgFile } : null,
            });
        }
    } else {
        const response = await fetchWithRetry(`${options.site}/api/public/db.json`);
        const songs = await response.json();
        // ?fresh= skips Cloudflare's 7-day /files/ cache, so pages fixed on
        // the server recently are read as they are now.
        const fresh = `?fresh=${Date.now()}`;
        for (const song of Array.isArray(songs) ? songs : songs.songs || []) {
            const notePages = song.notePages || {};
            const svgPages = notePages.svg || [];
            const jpgPages = notePages.jpg || [];
            const baseOf = page => (page === 0 ? song.songId : `${song.songId}_${page}`);
            const url = (format, page) =>
                `${options.site}/files/notes/${format}/${encodeURIComponent(baseOf(page))}.${format}${fresh}`;
            for (const page of svgPages) {
                pages.push({
                    base: baseOf(page),
                    songId: SONG_ID_RE.test(song.songId) ? song.songId : null,
                    svg: { url: url('svg', page) },
                    // Tried even when db.json no longer lists JPG pages (after
                    // the AVIF switch is deployed): the files stay until deleted.
                    jpg: { url: url('jpg', page) },
                });
            }
            for (const page of jpgPages) {
                if (!svgPages.includes(page)) jpgWithoutSvg.push(`${baseOf(page)}.jpg`);
            }
        }
    }
    const selected = pages.filter(page => !options.only || options.only.has(page.songId));
    return { pages: selected, jpgWithoutSvg };
}

function naturalCompare(a, b) {
    return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
}

async function fetchWithRetry(url) {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response;
            lastError = new Error(`HTTP ${response.status} for ${url}`);
            if (response.status === 404) break;
        } catch (error) {
            lastError = error;
        }
        await sleep(500 * attempt);
    }
    throw lastError;
}

async function readSource(source) {
    if (source.file) return readFile(source.file);
    return Buffer.from(await (await fetchWithRetry(source.url)).arrayBuffer());
}

const dataUrl = (type, bytes) => `data:${type};base64,${bytes.toString('base64')}`;

// ─── Headless browser over the DevTools protocol ─────────────────────

class Cdp {
    static connect(url) {
        return new Promise((resolve, reject) => {
            const socket = new WebSocket(url);
            socket.onopen = () => resolve(new Cdp(socket));
            socket.onerror = () => reject(new Error('Cannot connect to the browser'));
        });
    }

    constructor(socket) {
        this.socket = socket;
        this.nextId = 1;
        this.pending = new Map();
        socket.onmessage = event => {
            const message = JSON.parse(event.data);
            const waiter = this.pending.get(message.id);
            if (!waiter) return;
            this.pending.delete(message.id);
            if (message.error) waiter.reject(new Error(message.error.message));
            else waiter.resolve(message.result);
        };
    }

    send(method, params = {}, sessionId = undefined) {
        const id = this.nextId++;
        this.socket.send(JSON.stringify({ id, method, params, sessionId }));
        return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    }
}

const PAGE_HELPERS = `
window.loadImage = async (url, width, height) => {
    const image = new Image();
    // An SVG with these attributes is rasterised at the page size itself.
    if (width) { image.width = width; image.height = height; }
    image.src = url;
    await image.decode();
    return image;
};
window.drawPage = (image, width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return context;
};
window.renderSvg = async (url, width, height) =>
    drawPage(await loadImage(url, width, height), width, height).canvas.toDataURL('image/png');
// Grey-level difference: mean (0–255), squared error, and the share of
// pixels off by more than half the range (ink present in one, not the other).
window.comparePages = async (aUrl, bUrl, width, height) => {
    const a = drawPage(await loadImage(aUrl), width, height).getImageData(0, 0, width, height).data;
    const b = drawPage(await loadImage(bUrl), width, height).getImageData(0, 0, width, height).data;
    let sum = 0, squares = 0, ink = 0;
    for (let i = 0; i < a.length; i += 4) {
        const d = Math.abs(
            0.299 * (a[i] - b[i]) + 0.587 * (a[i + 1] - b[i + 1]) + 0.114 * (a[i + 2] - b[i + 2]),
        );
        sum += d;
        squares += d * d;
        if (d > 128) ink++;
    }
    const n = a.length / 4;
    return { mean: sum / n, mse: squares / n, ink: ink / n };
};
true;`;

async function launchBrowser(executable) {
    const profile = await mkdtemp(path.join(tmpdir(), 'notes-avif-browser-'));
    const child = spawn(
        executable,
        [
            '--headless=new',
            '--disable-gpu',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-extensions',
            '--remote-debugging-port=0',
            `--user-data-dir=${profile}`,
            'about:blank',
        ],
        { stdio: 'ignore' },
    );
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 150 && !existsSync(portFile); i++) await sleep(100);
    if (!existsSync(portFile)) throw new Error(`The browser did not start: ${executable}`);
    const [port, wsPath] = (await readFile(portFile, 'utf8')).split('\n');
    const cdp = await Cdp.connect(`ws://127.0.0.1:${port.trim()}${wsPath.trim()}`);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    const evaluate = async expression => {
        const result = await cdp.send(
            'Runtime.evaluate',
            { expression, awaitPromise: true, returnByValue: true },
            sessionId,
        );
        if (result.exceptionDetails) {
            throw new Error(
                result.exceptionDetails.exception?.description || result.exceptionDetails.text,
            );
        }
        return result.result.value;
    };
    await evaluate(PAGE_HELPERS);

    return {
        render: svgUrl =>
            evaluate(`renderSvg(${JSON.stringify(svgUrl)}, ${WIDTH}, ${HEIGHT})`),
        compare: (aUrl, bUrl) =>
            evaluate(`comparePages(${JSON.stringify(aUrl)}, ${JSON.stringify(bUrl)}, ${WIDTH}, ${HEIGHT})`),
        async close() {
            await cdp.send('Browser.close').catch(() => {});
            child.kill();
            await sleep(500);
            await rm(profile, { recursive: true, force: true, maxRetries: 5 }).catch(() => {});
        },
    };
}

// ─── Encoding, ZIP ───────────────────────────────────────────────────

function encodeAvif(options, pngFile, avifFile) {
    return new Promise((resolve, reject) => {
        const child = spawn(
            options.php,
            [
                path.join(HERE, 'encode-avif.php'),
                pngFile,
                avifFile,
                String(options.quality),
                String(options.speed),
            ],
            { stdio: ['ignore', 'ignore', 'pipe'] },
        );
        let errors = '';
        child.stderr.on('data', chunk => (errors += chunk));
        child.on('error', reject);
        child.on('close', code =>
            code === 0 ? resolve() : reject(new Error(errors.trim() || `php exited with ${code}`)),
        );
    });
}

// A store-only ZIP (AVIF is already compressed) in the layout the admin
// media import expects: notes/avif/<file>.avif.
function storedZip(entries) {
    const parts = [];
    const central = [];
    let offset = 0;
    for (const { name, data } of entries) {
        const nameBytes = Buffer.from(name, 'utf8');
        const crc = crc32(data);
        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt16LE(0x0800, 6); // UTF-8 names
        local.writeUInt16LE(0x21, 12); // 1980-01-01
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(data.length, 18);
        local.writeUInt32LE(data.length, 22);
        local.writeUInt16LE(nameBytes.length, 26);
        parts.push(local, nameBytes, data);

        const header = Buffer.alloc(46);
        header.writeUInt32LE(0x02014b50, 0);
        header.writeUInt16LE(20, 4);
        header.writeUInt16LE(20, 6);
        header.writeUInt16LE(0x0800, 8);
        header.writeUInt16LE(0x21, 14);
        header.writeUInt32LE(crc, 16);
        header.writeUInt32LE(data.length, 20);
        header.writeUInt32LE(data.length, 24);
        header.writeUInt16LE(nameBytes.length, 28);
        header.writeUInt32LE(offset, 42);
        central.push(header, nameBytes);
        offset += local.length + nameBytes.length + data.length;
    }
    const centralSize = central.reduce((total, part) => total + part.length, 0);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(entries.length, 8);
    end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(centralSize, 12);
    end.writeUInt32LE(offset, 16);
    return Buffer.concat([...parts, ...central, end]);
}

// ─── Main ────────────────────────────────────────────────────────────

async function processPage(options, browser, page, folders) {
    const avifFile = path.join(folders.avif, `${page.base}.avif`);
    const row = { file: `${page.base}.avif`, status: 'rendered' };
    let svgBytes;
    if (!options.force && existsSync(avifFile)) {
        row.status = 'kept';
    } else {
        svgBytes = await readSource(page.svg);
        const png = await browser.render(dataUrl('image/svg+xml', svgBytes));
        const pngFile = path.join(folders.work, `${page.base}.png`);
        await writeFile(pngFile, Buffer.from(png.split(',')[1], 'base64'));
        try {
            const partial = `${avifFile}.new`;
            await encodeAvif(options, pngFile, partial);
            await rename(partial, avifFile);
            const loss = await browser.compare(png, dataUrl('image/avif', await readFile(avifFile)));
            row.psnr = loss.mse > 0 ? 10 * Math.log10((255 * 255) / loss.mse) : Infinity;
        } finally {
            await unlink(pngFile).catch(() => {});
        }
        row.svgBytes = svgBytes.length;
    }
    row.avifBytes = (await stat(avifFile)).size;
    let jpgBytes = null;
    if (page.jpg) {
        jpgBytes = await readSource(page.jpg).catch(() => null);
        if (!jpgBytes) row.status += ', no JPG to compare';
    }
    if (jpgBytes) {
        const avifUrl = dataUrl('image/avif', await readFile(avifFile));
        const difference = await browser.compare(avifUrl, dataUrl('image/jpeg', jpgBytes));
        row.jpgBytes = jpgBytes.length;
        row.diff = difference.mean;
        row.ink = difference.ink;
    }
    return row;
}

const kb = bytes => (bytes == null ? '' : (bytes / 1024).toFixed(1));
const mb = bytes => (bytes / 1048576).toFixed(1);
const fixed = (value, digits) => (value == null ? '' : Number(value).toFixed(digits));

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const folders = {
        avif: path.join(options.out, 'notes', 'avif'),
        work: path.join(options.out, '.work'),
    };
    await mkdir(folders.avif, { recursive: true });
    await mkdir(folders.work, { recursive: true });

    const { pages, jpgWithoutSvg } = await listPages(options);
    const invalid = pages.filter(page => !page.songId);
    const valid = pages.filter(page => page.songId);
    console.log(
        `${valid.length} SVG pages from ${options.svgDir || options.site}; ` +
            `quality ${options.quality}, speed ${options.speed}, ${options.jobs} jobs; ` +
            `browser ${path.basename(options.browser)}`,
    );

    const browser = await launchBrowser(options.browser);
    const rows = [];
    const failures = [];
    let next = 0;
    let done = 0;
    const worker = async () => {
        while (next < valid.length) {
            const page = valid[next++];
            try {
                const row = await processPage(options, browser, page, folders);
                rows.push(row);
                console.log(
                    `[${++done}/${valid.length}] ${row.file}: ${row.status}, ` +
                        `${kb(row.jpgBytes) || '–'} KB JPG → ${kb(row.avifBytes)} KB AVIF` +
                        (row.diff == null ? '' : `, diff vs JPG ${row.diff.toFixed(2)}`) +
                        (row.psnr == null ? '' : `, ${row.psnr.toFixed(1)} dB vs render`),
                );
            } catch (error) {
                done++;
                failures.push(`${page.base}: ${error.message}`);
                console.log(`[${done}/${valid.length}] ${page.base}: ERROR ${error.message}`);
            }
        }
    };
    try {
        await Promise.all(Array.from({ length: Math.max(1, options.jobs) }, worker));
    } finally {
        await browser.close();
        await rm(folders.work, { recursive: true, force: true }).catch(() => {});
    }

    rows.sort((a, b) => naturalCompare(a.file, b.file));
    const csv = [
        'file,status,svg_bytes,jpg_bytes,avif_bytes,diff_vs_jpg,ink_vs_jpg,psnr_vs_render',
        ...rows.map(row =>
            [
                JSON.stringify(row.file),
                row.status,
                row.svgBytes ?? '',
                row.jpgBytes ?? '',
                row.avifBytes,
                fixed(row.diff, 3),
                fixed(row.ink, 5),
                fixed(row.psnr, 2),
            ].join(','),
        ),
    ];
    await writeFile(path.join(options.out, 'report.csv'), `${csv.join('\n')}\n`);

    const avifNames = (await readdir(folders.avif)).filter(name => name.endsWith('.avif')).sort(naturalCompare);
    const entries = [];
    for (const name of avifNames) {
        entries.push({ name: `notes/avif/${name}`, data: await readFile(path.join(folders.avif, name)) });
    }
    await writeFile(path.join(options.out, 'notes-avif.zip'), storedZip(entries));

    const compared = rows.filter(row => row.diff != null);
    const outliers = compared
        .filter(row => row.diff > options.threshold)
        .sort((a, b) => b.diff - a.diff);
    const jpgTotal = compared.reduce((total, row) => total + row.jpgBytes, 0);
    const avifTotal = compared.reduce((total, row) => total + row.avifBytes, 0);
    const diffs = compared.map(row => row.diff).sort((a, b) => a - b);
    const psnrs = rows.filter(row => row.psnr != null).map(row => row.psnr).sort((a, b) => a - b);

    console.log('');
    console.log(`AVIF pages: ${rows.length} (${rows.filter(row => row.status === 'kept').length} kept from an earlier run)`);
    if (compared.length) {
        console.log(
            `Compared with JPG: ${compared.length}; ${mb(jpgTotal)} MB JPG → ${mb(avifTotal)} MB AVIF ` +
                `(${Math.round(100 * (1 - avifTotal / jpgTotal))} % smaller)`,
        );
        console.log(
            `Mean grey difference vs JPG: median ${diffs[Math.floor(diffs.length / 2)].toFixed(2)}, ` +
                `max ${diffs[diffs.length - 1].toFixed(2)} (outlier above ${options.threshold})`,
        );
    }
    if (psnrs.length) {
        console.log(
            `Encoding loss vs the lossless render: ${psnrs[0].toFixed(1)}–${psnrs[psnrs.length - 1].toFixed(1)} dB PSNR`,
        );
    }
    console.log(`Outliers: ${outliers.length}`);
    for (const row of outliers) {
        console.log(`  ${row.file}: diff ${row.diff.toFixed(2)}, ink ${(100 * row.ink).toFixed(2)} %`);
    }
    if (jpgWithoutSvg.length) {
        console.log(`JPG pages without an SVG (no AVIF made): ${jpgWithoutSvg.join(', ')}`);
    }
    if (invalid.length) {
        console.log(`Skipped, not a sheet-music file name: ${invalid.map(page => page.base).join(', ')}`);
    }
    console.log(`Failures: ${failures.length}`);
    for (const failure of failures) console.log(`  ${failure}`);
    console.log(`Output: ${path.resolve(options.out)} (notes/avif/, report.csv, notes-avif.zip)`);
    process.exitCode = failures.length ? 1 : 0;
}

main().catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
});
