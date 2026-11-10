import test from 'node:test';
import assert from 'node:assert/strict';

import { createExclusive } from './exclusive.js';

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

test('a task started during another waits for it', async () => {
    const run = createExclusive();
    const log = [];
    const first = deferred();

    const a = run(async () => {
        log.push('a start');
        await first.promise;
        log.push('a end');
        return 'a';
    });
    const b = run(async () => {
        log.push('b start');
        return 'b';
    });

    await tick();
    assert.deepEqual(log, ['a start']);
    assert.equal(run.busy(), true);

    first.resolve();
    assert.deepEqual(await Promise.all([a, b]), ['a', 'b']);
    assert.deepEqual(log, ['a start', 'a end', 'b start']);
    assert.equal(run.busy(), false);
});

test('a failed task releases the lock and its error reaches the caller', async () => {
    const run = createExclusive();
    const failing = deferred();

    const a = run(() => failing.promise);
    const b = run(async () => 'b');
    failing.reject(new Error('offline'));

    await assert.rejects(a, /offline/);
    assert.equal(await b, 'b');
    assert.equal(run.busy(), false);
});

test('three waiting tasks still run one at a time', async () => {
    const run = createExclusive();
    let active = 0;
    let most = 0;
    const task = async () => {
        active++;
        most = Math.max(most, active);
        await tick();
        active--;
    };

    await Promise.all([run(task), run(task), run(task)]);
    assert.equal(most, 1);
});
