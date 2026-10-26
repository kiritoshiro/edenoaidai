// Media files keep their name when replaced on the server, and the service
// worker serves them cache-first. Adding the file's modification time makes
// a replaced file a new URL, while unchanged offline copies keep theirs.
export function withVersion(url, version) {
    const value = Number(version);
    if (!url || !Number.isSafeInteger(value) || value <= 0) return url;
    return `${url}${url.includes('?') ? '&' : '?'}v=${value}`;
}
