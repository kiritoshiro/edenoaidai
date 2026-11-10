// Pure helpers for render-notes-avif.mjs (tested in lib.test.mjs).

import path from 'node:path';
import { crc32 } from 'node:zlib';

export const SONG_ID_RE = /^[A-Za-z0-9 _-]{1,20}$/;

export function naturalCompare(a, b) {
    return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
}

// A page number from db.json: an integer 0–8, as on the server.
export function isPageNumber(value) {
    return Number.isInteger(value) && value >= 0 && value <= 8;
}

// "<songId>" is page 0, "<songId>_<n>" page n; null for anything else, so a
// hostile db.json cannot put "../" or other path parts into a file name.
export function pageBase(songId, page) {
    if (typeof songId !== 'string' || !SONG_ID_RE.test(songId) || !isPageNumber(page)) {
        return null;
    }
    return page === 0 ? songId : `${songId}_${page}`;
}

// The song ID of a page file name without its extension, or null.
export function songIdOf(base) {
    const match = String(base).match(/^(.+?)(?:_([1-8]))?$/u);
    return match && SONG_ID_RE.test(match[1]) ? match[1] : null;
}

// Resolves name inside dir; throws if the result would be anywhere else.
export function insideDir(dir, name) {
    const root = path.resolve(dir);
    const target = path.resolve(root, name);
    if (path.dirname(target) !== root) {
        throw new Error(`Refusing a path outside ${root}: ${name}`);
    }
    return target;
}

// The SVG pages listed in db.json, with their JPG for comparison. Pages whose
// song ID or page number is not valid are returned in `invalid`.
export function pagesFromDb(songs, site, query = '') {
    const pages = [];
    const invalid = [];
    const jpgWithoutSvg = [];
    const url = (format, base) =>
        `${site}/files/notes/${format}/${encodeURIComponent(base)}.${format}${query}`;
    for (const song of Array.isArray(songs) ? songs : []) {
        const notePages = song?.notePages || {};
        const svgPages = Array.isArray(notePages.svg) ? notePages.svg : [];
        const jpgPages = Array.isArray(notePages.jpg) ? notePages.jpg : [];
        for (const page of svgPages) {
            const base = pageBase(song?.songId, page);
            if (!base) {
                invalid.push(`${JSON.stringify(song?.songId)} page ${JSON.stringify(page)}`);
                continue;
            }
            pages.push({
                base,
                songId: song.songId,
                svg: { url: url('svg', base) },
                // Tried even when db.json no longer lists JPG pages (after the
                // AVIF switch is deployed): the files stay until deleted.
                jpg: { url: url('jpg', base) },
            });
        }
        for (const page of jpgPages) {
            const base = pageBase(song?.songId, page);
            if (base && !svgPages.includes(page)) jpgWithoutSvg.push(`${base}.jpg`);
        }
    }
    return { pages, invalid, jpgWithoutSvg };
}

// A store-only ZIP (AVIF is already compressed) in the layout the admin
// media import expects: notes/avif/<file>.avif.
export function storedZip(entries) {
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

// The ZIP's entries, read back through its central directory.
export function readStoredZip(zip) {
    const end = zip.length - 22;
    if (zip.readUInt32LE(end) !== 0x06054b50) throw new Error('No end of central directory');
    const count = zip.readUInt16LE(end + 10);
    let position = zip.readUInt32LE(end + 16);
    const entries = [];
    for (let i = 0; i < count; i++) {
        if (zip.readUInt32LE(position) !== 0x02014b50) throw new Error('Bad central header');
        const crc = zip.readUInt32LE(position + 16);
        const size = zip.readUInt32LE(position + 24);
        const nameLength = zip.readUInt16LE(position + 28);
        const localOffset = zip.readUInt32LE(position + 42);
        const name = zip.subarray(position + 46, position + 46 + nameLength).toString('utf8');
        if (zip.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('Bad local header');
        const dataStart = localOffset + 30 + zip.readUInt16LE(localOffset + 26) + zip.readUInt16LE(localOffset + 28);
        const data = zip.subarray(dataStart, dataStart + size);
        if (crc32(data) !== crc) throw new Error(`CRC mismatch for ${name}`);
        entries.push({ name, data });
        position += 46 + nameLength;
    }
    return entries;
}
