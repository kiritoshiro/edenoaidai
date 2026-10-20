import test from 'node:test';
import assert from 'node:assert/strict';

import {
    availableNoteFormats,
    normalizeNoteFormat,
    noteFormatLabel,
    notePageIndexes,
    noteUploadAccept,
    parseNotesFilename,
} from './noteFormats.js';

test('visitors see #1 for SVG and #2 for AVIF', () => {
    assert.equal(noteFormatLabel('svg'), '#1');
    assert.equal(noteFormatLabel('avif'), '#2');
    assert.equal(noteFormatLabel('jpg'), '');
});

test('a remembered JPG choice becomes AVIF', () => {
    assert.equal(normalizeNoteFormat('svg'), 'svg');
    assert.equal(normalizeNoteFormat('avif'), 'avif');
    assert.equal(normalizeNoteFormat('jpg'), 'avif');
    assert.equal(normalizeNoteFormat(null), 'avif');
});

test('formats come from the detected pages, SVG first', () => {
    const song = { notePages: { avif: [0, 1], svg: [0] } };
    assert.deepEqual(availableNoteFormats(song), ['svg', 'avif']);
    assert.deepEqual(notePageIndexes(song, 'avif'), [0, 1]);
    assert.deepEqual(
        availableNoteFormats({ notePages: { svg: [], avif: [0] } }),
        ['avif'],
    );
    assert.deepEqual(availableNoteFormats({ notePages: { svg: [], avif: [] } }), []);
});

test('an offline snapshot from before the switch reads its JPG pages as AVIF', () => {
    const song = { notePages: { svg: [0], jpg: [0, 1] }, pages: 2 };
    assert.deepEqual(availableNoteFormats(song), ['svg', 'avif']);
    assert.deepEqual(notePageIndexes(song, 'avif'), [0, 1]);
    // A current snapshot wins over a leftover jpg list.
    assert.deepEqual(
        notePageIndexes({ notePages: { avif: [0], jpg: [0, 1] } }, 'avif'),
        [0],
    );
});

test('very old snapshots with only a page count offer both formats', () => {
    const song = { pages: 2 };
    assert.deepEqual(availableNoteFormats(song), ['svg', 'avif']);
    assert.deepEqual(notePageIndexes(song, 'svg'), [0, 1]);
    assert.deepEqual(availableNoteFormats({}), []);
});

test('without AVIF support only SVG is offered, if the song has it', () => {
    const both = { notePages: { svg: [0], avif: [0] } };
    assert.deepEqual(availableNoteFormats(both, false), ['svg']);
    const avifOnly = { notePages: { svg: [], avif: [0] } };
    assert.deepEqual(availableNoteFormats(avifOnly, false), ['avif']);
});

test('the AVIF folder accepts images the server converts', () => {
    assert.equal(noteUploadAccept('svg'), '.svg');
    assert.equal(noteUploadAccept('avif'), '.avif,.jpg,.jpeg,.png,.webp');
    assert.deepEqual(parseNotesFilename('27 A_2.avif', 'avif'), { songId: '27 A', page: 2 });
    assert.deepEqual(parseNotesFilename('185.JPG', 'avif'), { songId: '185', page: 0 });
    assert.deepEqual(parseNotesFilename('185_1.svg', 'svg'), { songId: '185', page: 1 });
    assert.equal(parseNotesFilename('185.jpg', 'svg'), null);
    assert.equal(parseNotesFilename('185.svg', 'avif'), null);
    // Page 9 is not a page suffix, so it stays part of the song ID.
    assert.deepEqual(parseNotesFilename('185_9.avif', 'avif'), { songId: '185_9', page: 0 });
});
