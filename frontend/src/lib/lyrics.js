const BLOCK_END_TAG = /<\/(?:article|div|h[1-6]|li|p|section)>/gi;
const HTML_TAG = /<[^>]*>/g;

function decodeEntities(value) {
    if (typeof DOMParser !== 'undefined') {
        const document = new DOMParser().parseFromString(value, 'text/html');
        return document.body.textContent || '';
    }

    return value
        .replace(/&nbsp;/gi, ' ')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#(?:39|x27);/gi, "'")
        // Last, so "&amp;lt;" stays the literal text "&lt;".
        .replace(/&amp;/gi, '&');
}

export function lyricsToPlainText(value) {
    const withoutMarkup = String(value || '')
        .replace(/\r\n?/g, '\n')
        .replace(/<br\s*\/?>\n?/gi, '\n')
        .replace(BLOCK_END_TAG, '\n')
        .replace(HTML_TAG, '')
        // Stray brackets left by nested fragments such as "<<b>p>". Escaped
        // brackets (&lt; &gt;) are still decoded below.
        .replace(/[<>]/g, '');

    return decodeEntities(withoutMarkup)
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
