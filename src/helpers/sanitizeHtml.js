import DOMPurify from 'dompurify';

const SANITIZE_OPTIONS = Object.freeze({
    ALLOWED_ATTR: ['class'],
    ALLOWED_TAGS: ['br', 'div', 'em', 'span'],
});

export function sanitizeSongHtml(value) {
    return DOMPurify.sanitize(String(value ?? ''), SANITIZE_OPTIONS);
}
