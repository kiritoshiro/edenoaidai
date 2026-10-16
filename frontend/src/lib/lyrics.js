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

function stripTags(value) {
    // Strip until stable so nested fragments such as "<<b>p>" cannot re-form
    // a tag, then drop stray brackets. Escaped ones (&lt; &gt;) are decoded later.
    let text = value;
    let previous;
    do {
        previous = text;
        text = text.replace(HTML_TAG, '');
    } while (text !== previous);
    return text.replace(/[<>]/g, '');
}

export function lyricsToPlainText(value) {
    const withoutMarkup = stripTags(String(value || '')
        .replace(/\r\n?/g, '\n')
        .replace(/<br\s*\/?>\n?/gi, '\n')
        .replace(BLOCK_END_TAG, '\n'));

    return decodeEntities(withoutMarkup)
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
