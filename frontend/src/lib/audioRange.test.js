import assert from 'node:assert/strict';
import test from 'node:test';

import { createProgressiveDownload, knownLength, parseRange } from './audioRange.js';

const bytes = Uint8Array.from({ length: 100 }, (_, index) => index);

// A 200 response whose body arrives in chunks, released one by one by calling
// the returned `push()`, or all at once with `pushAll()`.
function slowResponse(chunkSize, headers = {}) {
    let controller;
    let offset = 0;
    const body = new ReadableStream({ start: c => (controller = c) });
    const push = () => {
        if (offset >= bytes.length) return controller.close();
        controller.enqueue(bytes.slice(offset, offset + chunkSize));
        offset += chunkSize;
        if (offset >= bytes.length) controller.close();
    };
    const pushAll = () => {
        while (offset < bytes.length) push();
    };
    const response = new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': String(bytes.length), ...headers },
    });
    return { response, push, pushAll, fail: error => controller.error(error) };
}

const read = async response => new Uint8Array(await response.arrayBuffer());

test('parses open, closed and suffix ranges', () => {
    assert.deepEqual(parseRange('bytes=0-', 100), { start: 0, end: 99 });
    assert.deepEqual(parseRange('bytes=0-1', 100), { start: 0, end: 1 });
    assert.deepEqual(parseRange('bytes=40-500', 100), { start: 40, end: 99 });
    assert.deepEqual(parseRange('bytes=-10', 100), { start: 90, end: 99 });
});

test('rejects unsatisfiable or unsupported ranges', () => {
    assert.equal(parseRange('bytes=100-', 100), null);
    assert.equal(parseRange('bytes=5-2', 100), null);
    assert.equal(parseRange('bytes=-', 100), null);
    assert.equal(parseRange('bytes=0-1,5-6', 100), null);
    assert.equal(parseRange('items=0-1', 100), null);
});

test('knows the length only of plain responses with Content-Length', () => {
    assert.equal(knownLength(slowResponse(10).response), 100);
    assert.equal(knownLength(slowResponse(10, { 'Content-Encoding': 'gzip' }).response), null);
    assert.equal(knownLength(new Response(null)), null);
});

test('answers a range across chunk boundaries with 206 headers', async () => {
    const source = slowResponse(7);
    const download = createProgressiveDownload(source.response);
    source.pushAll();

    const response = download.respond('bytes=10-24');
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Range'), 'bytes 10-24/100');
    assert.equal(response.headers.get('Content-Length'), '15');
    assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
    assert.equal(response.headers.get('Content-Type'), 'audio/mpeg');
    assert.deepEqual(await read(response), bytes.slice(10, 25));
});

test('streams ranges before the download has reached them', async () => {
    const source = slowResponse(10);
    const download = createProgressiveDownload(source.response);

    // Both are requested before any byte has arrived, like a seek during the first play.
    const whole = read(download.respond('bytes=0-'));
    const tail = read(download.respond('bytes=75-'));
    for (let index = 0; index < 10; index++) {
        source.push();
        await new Promise(resolve => setImmediate(resolve));
    }

    assert.deepEqual(await whole, bytes);
    assert.deepEqual(await tail, bytes.slice(75));
    await download.finished;
});

test('keeps downloading when the player stops reading early', async () => {
    const source = slowResponse(8);
    const download = createProgressiveDownload(source.response);
    source.pushAll();

    assert.deepEqual(await read(download.respond('bytes=0-1')), bytes.slice(0, 2));
    await download.finished;
    assert.deepEqual(await read(download.respond('bytes=-5')), bytes.slice(95));
});

test('returns 416 for a range past the end', () => {
    const download = createProgressiveDownload(slowResponse(8).response);
    const response = download.respond('bytes=200-');

    assert.equal(response.status, 416);
    assert.equal(response.headers.get('Content-Range'), 'bytes */100');
});

test('fails waiting ranges when the download fails', async () => {
    const source = slowResponse(10);
    const download = createProgressiveDownload(source.response);
    const tail = read(download.respond('bytes=50-'));
    source.push();
    source.fail(new Error('offline'));

    await assert.rejects(tail, /offline/);
});
