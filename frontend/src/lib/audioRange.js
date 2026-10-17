// Serves byte ranges of an audio file while the service worker is still
// downloading the whole file into its cache, so playback and seeking work
// during the first play without a second download.

const RANGE_HEADER = /^bytes=(\d*)-(\d*)$/;
const MAX_CHUNK = 256 * 1024;

// Returns inclusive { start, end } byte offsets for a single-range header,
// or null when the range cannot be satisfied for a body of `size` bytes.
export function parseRange(header, size) {
    const match = RANGE_HEADER.exec(String(header).trim().toLowerCase());
    if (!match || (match[1] === '' && match[2] === '')) return null;

    let start;
    let end;
    if (match[1] === '') {
        // Suffix range: the last N bytes.
        start = Math.max(0, size - Number(match[2]));
        end = size - 1;
    } else {
        start = Number(match[1]);
        end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
    }

    if (start > end || start >= size) return null;
    return { start, end };
}

// Body length of a plain (not content-encoded) response, or null if unknown.
export function knownLength(response) {
    const size = Number(response.headers.get('content-length'));
    if (!response.body || response.headers.has('content-encoding')) return null;
    return Number.isSafeInteger(size) && size > 0 ? size : null;
}

// Reads `response` (a full 200 of known length) to the end, keeping its bytes,
// and answers range requests from them with 206 responses whose streams wait
// for bytes that have not arrived yet.
export function createProgressiveDownload(response) {
    const size = knownLength(response);
    const chunks = [];
    let received = 0;
    let done = false;
    let failure = null;
    let wake;
    let arrival = new Promise(resolve => (wake = resolve));

    function signal() {
        const resolve = wake;
        arrival = new Promise(next => (wake = next));
        resolve();
    }

    const finished = (async () => {
        const reader = response.body.getReader();
        try {
            for (;;) {
                const { value, done: end } = await reader.read();
                if (end) break;
                chunks.push(value);
                received += value.byteLength;
                signal();
            }
        } catch (error) {
            failure = error;
        }
        done = true;
        signal();
    })();

    function copy(from, to) {
        const bytes = new Uint8Array(to - from);
        let offset = 0;
        for (const chunk of chunks) {
            const chunkEnd = offset + chunk.byteLength;
            if (chunkEnd > from) {
                const first = Math.max(from - offset, 0);
                const last = Math.min(to - offset, chunk.byteLength);
                bytes.set(chunk.subarray(first, last), offset + first - from);
            }
            offset = chunkEnd;
            if (offset >= to) break;
        }
        return bytes;
    }

    function stream(start, end) {
        let position = start;
        return new ReadableStream({
            async pull(controller) {
                while (position >= received) {
                    if (failure) return controller.error(failure);
                    if (done) return controller.close();
                    await arrival;
                }
                const to = Math.min(end + 1, received, position + MAX_CHUNK);
                controller.enqueue(copy(position, to));
                position = to;
                if (position > end) controller.close();
            },
        });
    }

    function respond(rangeHeader) {
        const range = parseRange(rangeHeader, size);
        if (!range) {
            return new Response(null, {
                status: 416,
                statusText: 'Range Not Satisfiable',
                headers: { 'Content-Range': `bytes */${size}` },
            });
        }

        const headers = new Headers(response.headers);
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Content-Length', String(range.end - range.start + 1));
        headers.set('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
        return new Response(stream(range.start, range.end), {
            status: 206,
            statusText: 'Partial Content',
            headers,
        });
    }

    return { respond, finished };
}
