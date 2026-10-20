import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
    insideDir,
    isPageNumber,
    pageBase,
    pagesFromDb,
    readStoredZip,
    songIdOf,
    storedZip,
} from './lib.mjs';

test('page numbers are integers 0–8', () => {
    for (const page of [0, 1, 8]) assert.equal(isPageNumber(page), true);
    for (const page of [-1, 9, 1.5, '1', '../x', null, undefined, NaN]) {
        assert.equal(isPageNumber(page), false, String(page));
    }
});

test('page names come only from valid song IDs and pages', () => {
    assert.equal(pageBase('1', 0), '1');
    assert.equal(pageBase('101 A', 2), '101 A_2');
    assert.equal(pageBase('1', '../../x'), null);
    assert.equal(pageBase('1', 9), null);
    assert.equal(pageBase('../x', 0), null);
    assert.equal(pageBase('a/b', 0), null);
    assert.equal(pageBase(5, 0), null);
    assert.equal(songIdOf('27 A_3'), '27 A');
    assert.equal(songIdOf('bad name!'), null);
});

test('a hostile db.json cannot name files outside the output folder', () => {
    const songs = [
        { songId: '1', notePages: { svg: [0, 1], jpg: [0, 1, 2] } },
        { songId: '2', notePages: { svg: ['../../evil', 9, -1, 1.5, '1'] } },
        { songId: '../../etc', notePages: { svg: [0] } },
        { songId: '3', notePages: { svg: 'nope' } },
        null,
    ];
    const { pages, invalid, jpgWithoutSvg } = pagesFromDb(songs, 'https://example.test', '?x=1');
    assert.deepEqual(pages.map(page => page.base), ['1', '1_1']);
    assert.equal(invalid.length, 6);
    assert.deepEqual(jpgWithoutSvg, ['1_2.jpg']);
    assert.equal(pages[1].svg.url, 'https://example.test/files/notes/svg/1_1.svg?x=1');
    assert.equal(pages[1].jpg.url, 'https://example.test/files/notes/jpg/1_1.jpg?x=1');
    assert.equal(
        pagesFromDb([{ songId: '101 A', notePages: { svg: [0] } }], 'https://s').pages[0].svg.url,
        'https://s/files/notes/svg/101%20A.svg',
    );
});

test('output paths stay inside their folder', () => {
    const dir = path.resolve('out', 'notes', 'avif');
    assert.equal(insideDir(dir, '101 A.avif'), path.join(dir, '101 A.avif'));
    assert.throws(() => insideDir(dir, '../x.avif'));
    assert.throws(() => insideDir(dir, '../../../x.avif'));
    assert.throws(() => insideDir(dir, 'sub/x.avif'));
    assert.throws(() => insideDir(dir, path.resolve('/elsewhere/x.avif')));
});

test('the ZIP reads back with names, data and CRCs intact', () => {
    const entries = [
        { name: 'notes/avif/1.avif', data: Buffer.from('first page') },
        { name: 'notes/avif/101 A_2.avif', data: Buffer.alloc(70000, 7) },
        { name: 'notes/avif/ė.avif', data: Buffer.alloc(0) },
    ];
    const zip = storedZip(entries);
    const back = readStoredZip(zip);
    assert.deepEqual(back.map(entry => entry.name), entries.map(entry => entry.name));
    back.forEach((entry, index) => assert.ok(entry.data.equals(entries[index].data)));
    assert.deepEqual(readStoredZip(storedZip([])), []);
});
