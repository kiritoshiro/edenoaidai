#!/usr/bin/env node
// Makes the AVIF sheet-music pages from the site's own SVG pages, on this
// computer rather than on the server (which cannot render SVG):
//
//   1. lists the SVG pages (live db.json, or a local folder),
//   2. renders each one at 1181×1811 px (200 dpi) on white with headless
//      Edge/Chrome, which draws these SVGs correctly,
//   3. encodes it as AVIF with PHP GD (scripts/notes-avif/encode-avif.php),
//   4. compares the AVIF with the page's existing JPG and lists outliers,
//   5. writes <out>/notes/avif/*.avif, report.csv and notes-avif.zip with
//      this run's pages. Copy notes/avif/ to the server's files/notes/avif/
//      before deploying the AVIF switch; later the ZIP can be restored in
//      Admin → Duomenų bazė → Natos (format AVIF).
//
// A page already in <out> is kept when its SVG and the encoder settings are
// unchanged (sources.json) and the file still decodes; --force re-renders
// everything. Nothing is uploaded or changed on the server.
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
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { availableParallelism, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { insideDir, naturalCompare, pagesFromDb, songIdOf, storedZip } from './lib.mjs';

const WIDTH = 1181;
const HEIGHT = 1811;
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
            console.log(`See the comment at the top of ${fileURLToPath(import.meta.url)}.`);
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

async function listPages(options) {
    let result;
    if (options.svgDir) {
        result = { pages: [], invalid: [], jpgWithoutSvg: [] };
        for (const name of (await readdir(options.svgDir)).sort(naturalCompare)) {
            if (!/\.svg$/i.test(name)) continue;
            const base = name.replace(/\.svg$/i, '');
            const songId = songIdOf(base);
            if (!songId) {
                result.invalid.push(name);
                continue;
            }
            const jpgFile = options.jpgDir ? path.join(options.jpgDir, `${base}.jpg`) : '';
            result.pages.push({
                base,
                songId,
                svg: { file: path.join(options.svgDir, name) },
                jpg: jpgFile && existsSync(jpgFile) ? { file: jpgFile } : null,
            });
        }
    } else {
        const songs = await (await fetchWithRetry(`${options.site}/api/public/db.json`)).json();
        // ?fresh= skips Cloudflare's 7-day /files/ cache, so pages fixed on
        // the server recently are read as they are now.
        result = pagesFromDb(Array.isArray(songs) ? songs : songs?.songs, options.site, `?fresh=${Date.now()}`);
    }
    result.pages = result.pages.filter(page => !options.only || options.only.has(page.songId));
    return result;
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
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

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

    close() {
        try {
            this.socket.close();
        } catch {
            // already closed
        }
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
window.imageSize = async url => {
    const image = await loadImage(url);
    return { width: image.naturalWidth, height: image.naturalHeight };
};
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

// `cleanups` is the set the signal handlers run; the browser's cleanup joins
// it as soon as its profile exists, so Ctrl+C during startup also stops the
// browser and removes the profile.
async function launchBrowser(executable, cleanups) {
    // Synchronous, so no signal can arrive between creating and registering.
    const profile = mkdtempSync(path.join(tmpdir(), 'notes-avif-browser-'));
    let child;
    let cdp;
    let cleaning = null;
    const cleanup = () =>
        (cleaning ??= (async () => {
            if (cdp) {
                await Promise.race([cdp.send('Browser.close').catch(() => {}), sleep(2000)]);
                cdp.close();
            }
            if (child && child.exitCode === null) child.kill();
            await sleep(500);
            await rm(profile, { recursive: true, force: true, maxRetries: 5 }).catch(() => {});
            cleanups.delete(cleanup);
        })());
    cleanups.add(cleanup);
    try {
        child = spawn(
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
        const started = new Promise((_, reject) => child.once('error', reject));
        started.catch(() => {});
        const portFile = path.join(profile, 'DevToolsActivePort');
        for (let i = 0; i < 150 && !existsSync(portFile); i++) {
            await Promise.race([sleep(100), started]);
        }
        if (!existsSync(portFile)) throw new Error(`The browser did not start: ${executable}`);
        const [port, wsPath] = (await readFile(portFile, 'utf8')).split('\n');
        cdp = await Cdp.connect(`ws://127.0.0.1:${port.trim()}${wsPath.trim()}`);
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
            render: svgUrl => evaluate(`renderSvg(${JSON.stringify(svgUrl)}, ${WIDTH}, ${HEIGHT})`),
            size: url => evaluate(`imageSize(${JSON.stringify(url)})`),
            compare: (aUrl, bUrl) =>
                evaluate(`comparePages(${JSON.stringify(aUrl)}, ${JSON.stringify(bUrl)}, ${WIDTH}, ${HEIGHT})`),
            close: cleanup,
        };
    } catch (error) {
        await cleanup();
        throw error;
    }
}

// ─── Encoding ────────────────────────────────────────────────────────

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

// ─── Main ────────────────────────────────────────────────────────────

async function keptFileIsUsable(browser, avifFile) {
    try {
        const size = await browser.size(dataUrl('image/avif', await readFile(avifFile)));
        return size.width === WIDTH && size.height === HEIGHT;
    } catch {
        return false;
    }
}

async function processPage(options, browser, page, folders, sources) {
    const file = `${page.base}.avif`;
    const avifFile = insideDir(folders.avif, file);
    const row = { file, status: 'rendered' };
    const svgBytes = await readSource(page.svg);
    row.svgBytes = svgBytes.length;
    // The SVG and the encoder settings an AVIF was made from: a page is kept
    // only while both are unchanged and the file still decodes.
    const source = `${sha256(svgBytes)} q${options.quality} s${options.speed}`;

    if (
        !options.force &&
        existsSync(avifFile) &&
        sources[page.base] === source &&
        (await keptFileIsUsable(browser, avifFile))
    ) {
        row.status = 'kept';
    } else {
        const png = await browser.render(dataUrl('image/svg+xml', svgBytes));
        const pngFile = insideDir(folders.work, `${page.base}.png`);
        const partial = insideDir(folders.avif, `${file}.new`);
        await writeFile(pngFile, Buffer.from(png.split(',')[1], 'base64'));
        try {
            await encodeAvif(options, pngFile, partial);
            await rename(partial, avifFile);
            const loss = await browser.compare(png, dataUrl('image/avif', await readFile(avifFile)));
            row.psnr = loss.mse > 0 ? 10 * Math.log10((255 * 255) / loss.mse) : Infinity;
        } finally {
            await unlink(pngFile).catch(() => {});
            await unlink(partial).catch(() => {});
        }
        sources[page.base] = source;
    }
    row.avifBytes = (await stat(avifFile)).size;

    const jpgBytes = page.jpg ? await readSource(page.jpg).catch(() => null) : null;
    if (page.jpg && !jpgBytes) row.status += ', no JPG to compare';
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
        avif: path.resolve(options.out, 'notes', 'avif'),
        work: path.resolve(options.out, '.work'),
    };
    await mkdir(folders.avif, { recursive: true });
    await mkdir(folders.work, { recursive: true });
    const sourcesFile = path.resolve(options.out, 'sources.json');
    const sources = existsSync(sourcesFile) ? JSON.parse(await readFile(sourcesFile, 'utf8')) : {};
    let sourcesSaving = Promise.resolve();
    const saveSources = () => {
        sourcesSaving = sourcesSaving.then(async () => {
            await writeFile(`${sourcesFile}.new`, JSON.stringify(sources, null, 1));
            await rename(`${sourcesFile}.new`, sourcesFile);
        });
        return sourcesSaving;
    };

    // Installed before anything that needs cleaning up is started.
    const cleanups = new Set();
    let stopping = false;
    const stop = signal => {
        if (stopping) return;
        stopping = true;
        console.log(`\n${signal}: stopping; finished pages are kept for the next run.`);
        Promise.allSettled([saveSources(), ...[...cleanups].map(cleanup => cleanup())])
            .then(() => rm(folders.work, { recursive: true, force: true }).catch(() => {}))
            // The shell convention: 128 + the signal number.
            .finally(() => process.exit(signal === 'SIGTERM' ? 143 : 130));
    };
    process.once('SIGINT', () => stop('SIGINT'));
    process.once('SIGTERM', () => stop('SIGTERM'));

    const { pages, invalid, jpgWithoutSvg } = await listPages(options);
    console.log(
        `${pages.length} SVG pages from ${options.svgDir || options.site}; ` +
            `quality ${options.quality}, speed ${options.speed}, ${options.jobs} jobs; ` +
            `browser ${path.basename(options.browser)}`,
    );

    const browser = await launchBrowser(options.browser, cleanups);

    const rows = [];
    const failures = [];
    let next = 0;
    let done = 0;
    const worker = async () => {
        while (!stopping && next < pages.length) {
            const page = pages[next++];
            try {
                const row = await processPage(options, browser, page, folders, sources);
                rows.push(row);
                if (row.status === 'rendered') await saveSources();
                console.log(
                    `[${++done}/${pages.length}] ${row.file}: ${row.status}, ` +
                        `${kb(row.jpgBytes) || '–'} KB JPG → ${kb(row.avifBytes)} KB AVIF` +
                        (row.diff == null ? '' : `, diff vs JPG ${row.diff.toFixed(2)}`) +
                        (row.psnr == null ? '' : `, ${row.psnr.toFixed(1)} dB vs render`),
                );
            } catch (error) {
                done++;
                failures.push(`${page.base}: ${error.message}`);
                console.log(`[${done}/${pages.length}] ${page.base}: ERROR ${error.message}`);
            }
        }
    };
    try {
        await Promise.all(Array.from({ length: Math.max(1, options.jobs) }, worker));
    } finally {
        await saveSources();
        await browser.close();
        await rm(folders.work, { recursive: true, force: true }).catch(() => {});
    }
    if (stopping) return;

    rows.sort((a, b) => naturalCompare(a.file, b.file));
    const csv = [
        'file,status,svg_bytes,jpg_bytes,avif_bytes,diff_vs_jpg,ink_vs_jpg,psnr_vs_render',
        ...rows.map(row =>
            [
                JSON.stringify(row.file),
                JSON.stringify(row.status),
                row.svgBytes ?? '',
                row.jpgBytes ?? '',
                row.avifBytes,
                fixed(row.diff, 3),
                fixed(row.ink, 5),
                fixed(row.psnr, 2),
            ].join(','),
        ),
    ];
    await writeFile(path.resolve(options.out, 'report.csv'), `${csv.join('\n')}\n`);

    // Only this run's pages: older files in the folder from other --only runs
    // or pages no longer listed are not packed.
    const entries = [];
    for (const row of rows) {
        entries.push({
            name: `notes/avif/${row.file}`,
            data: await readFile(insideDir(folders.avif, row.file)),
        });
    }
    await writeFile(path.resolve(options.out, 'notes-avif.zip'), storedZip(entries));
    const stray = (await readdir(folders.avif)).filter(
        name => name.endsWith('.avif') && !rows.some(row => row.file === name),
    );

    const compared = rows.filter(row => row.diff != null);
    const outliers = compared
        .filter(row => row.diff > options.threshold)
        .sort((a, b) => b.diff - a.diff);
    const jpgTotal = compared.reduce((total, row) => total + row.jpgBytes, 0);
    const avifTotal = compared.reduce((total, row) => total + row.avifBytes, 0);
    const diffs = compared.map(row => row.diff).sort((a, b) => a - b);
    const psnrs = rows.filter(row => row.psnr != null).map(row => row.psnr).sort((a, b) => a - b);

    console.log('');
    console.log(
        `AVIF pages: ${rows.length} (${rows.filter(row => row.status.startsWith('kept')).length} kept from an earlier run)`,
    );
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
        console.log(`Skipped, not a valid song ID or page: ${invalid.join(', ')}`);
    }
    if (stray.length) {
        console.log(`Not in this run (left in the folder, not in the ZIP): ${stray.length} file(s)`);
    }
    console.log(`Failures: ${failures.length}`);
    for (const failure of failures) console.log(`  ${failure}`);
    console.log(
        `Output: ${path.resolve(options.out)} (notes/avif/, report.csv, notes-avif.zip with ${entries.length} pages)`,
    );
    process.exitCode = failures.length ? 1 : 0;
}

main().catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
});
