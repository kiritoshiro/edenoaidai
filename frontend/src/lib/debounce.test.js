import test from 'node:test';
import assert from 'node:assert/strict';

import { debounce } from './debounce.js';

test('runs once with the last arguments after the wait', t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const calls = [];
    const debounced = debounce(value => calls.push(value), 100);

    debounced('a');
    debounced('ab');
    t.mock.timers.tick(99);
    assert.deepEqual(calls, []);
    t.mock.timers.tick(1);
    assert.deepEqual(calls, ['ab']);
});

test('cancel drops a pending call', t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const calls = [];
    const debounced = debounce(value => calls.push(value), 100);

    debounced('a');
    debounced.cancel();
    t.mock.timers.tick(200);
    assert.deepEqual(calls, []);

    debounced('b');
    t.mock.timers.tick(100);
    assert.deepEqual(calls, ['b']);
});
