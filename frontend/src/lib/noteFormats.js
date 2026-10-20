// Sheet-music formats. Files live in files/notes/<format>/; visitors only
// ever see the labels below, never the technical format names.
export const NOTE_FORMATS = ['svg', 'avif'];
export const DEFAULT_NOTE_FORMAT = 'avif';

const NOTE_FORMAT_LABELS = { svg: '#1', avif: '#2' };

// The server converts JPG, PNG and WebP pages uploaded to the AVIF folder.
const NOTE_UPLOAD_EXTENSIONS = {
    svg: ['svg'],
    avif: ['avif', 'jpg', 'jpeg', 'png', 'webp'],
};

export function noteFormatLabel(format) {
    return NOTE_FORMAT_LABELS[format] || '';
}

// A remembered choice from before the switch is 'jpg', the raster format,
// which is now AVIF.
export function normalizeNoteFormat(value) {
    return NOTE_FORMATS.includes(value) ? value : DEFAULT_NOTE_FORMAT;
}

// Offline snapshots saved before the switch list raster pages under "jpg".
// Every JPG page was converted to an AVIF page with the same name, so that
// list stays valid until the visitor refreshes the data.
function songNotePages(song) {
    const detected = song?.notePages;
    if (!detected || typeof detected !== 'object') return null;
    const pages = {};
    for (const format of NOTE_FORMATS) {
        const list =
            format === 'avif' && !Array.isArray(detected.avif)
                ? detected.jpg
                : detected[format];
        pages[format] = Array.isArray(list) ? list : [];
    }
    return pages;
}

export function availableNoteFormats(song, avifSupported = true) {
    const pages = songNotePages(song);
    let formats;
    if (pages) {
        formats = NOTE_FORMATS.filter(format => pages[format].length > 0);
    } else {
        // Compatibility with data cached by older installed versions.
        formats = Number(song?.pages) > 0 ? [...NOTE_FORMATS] : [];
    }
    // Browsers without AVIF (Safari before iOS 16) are offered #1 only; a
    // song with #2 pages only then has no notes to show (see notesNeedAvif).
    if (!avifSupported) {
        formats = formats.filter(format => format !== 'avif');
    }
    return formats;
}

// True when the song has sheet music, but only in a format this browser
// cannot show.
export function notesNeedAvif(song, avifSupported) {
    return (
        !avifSupported &&
        availableNoteFormats(song, true).length > 0 &&
        availableNoteFormats(song, false).length === 0
    );
}

export function notePageIndexes(song, format) {
    const pages = songNotePages(song);
    if (pages) return pages[format] || [];
    const legacyCount = Number(song?.pages) || 0;
    return Array.from({ length: legacyCount }, (_, index) => index);
}

export function noteUploadAccept(format) {
    return (NOTE_UPLOAD_EXTENSIONS[format] || [format])
        .map(extension => `.${extension}`)
        .join(',');
}

// "<songId>.<ext>" is page 0, "<songId>_<n>.<ext>" is page n (1–8).
export function parseNotesFilename(filename, format) {
    const extensions = (NOTE_UPLOAD_EXTENSIONS[format] || [format]).join('|');
    const pattern = new RegExp(`\\.(?:${extensions})$`, 'iu');
    if (!pattern.test(filename)) return null;
    const stem = filename.replace(pattern, '');
    const match = stem.match(/^(.+?)(?:_([1-8]))?$/u);
    if (!match) return null;
    return { songId: match[1], page: match[2] ? Number(match[2]) : 0 };
}

// A white 1×1 AVIF made with the server's encoder (PHP GD imageavif).
const AVIF_PROBE =
    'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABoAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAABAA0AAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACJtZGF0EgAKCBgABogIaAwgMgwf8D///8WfhwAAbDg=';

let avifSupport = null;

export function supportsAvif() {
    if (!avifSupport) {
        avifSupport = new Promise(resolve => {
            if (typeof Image === 'undefined') {
                resolve(true);
                return;
            }
            const image = new Image();
            image.onload = () => resolve(image.width > 0);
            image.onerror = () => resolve(false);
            image.src = AVIF_PROBE;
        });
    }
    return avifSupport;
}
