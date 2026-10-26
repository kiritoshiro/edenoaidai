import test from 'node:test';
import assert from 'node:assert/strict';

import { withVersion } from './mediaUrl.js';

test('appends the version as a query parameter', () => {
    assert.equal(
        withVersion('/files/audio/choras/12.mp3', 1761400000),
        '/files/audio/choras/12.mp3?v=1761400000',
    );
});

test('joins an existing query with &', () => {
    assert.equal(withVersion('/files/x.svg?a=1', '17'), '/files/x.svg?a=1&v=17');
});

test('leaves the URL alone without a usable version', () => {
    for (const version of [undefined, null, '', 0, -5, 1.5, 'abc', NaN]) {
        assert.equal(withVersion('/files/x.svg', version), '/files/x.svg');
    }
    assert.equal(withVersion('', 17), '');
});
