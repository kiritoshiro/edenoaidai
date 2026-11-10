import test from 'node:test';
import assert from 'node:assert/strict';

import { audioVersionsByType, buildSongRows, buildTrackTypes } from './dataRows.js';

const songs = [
    {
        songId: '1',
        title: 'Pirma',
        verse: '',
        body: 'a',
        slides: [{ text: 'a' }],
        copyright: '',
        pages: 2,
        notePages: { svg: [0, 1], avif: [] },
        noteVersions: { svg: { 0: 10, 1: 11 }, avif: {} },
    },
    { songId: '2', title: 'Antra', body: 'b' },
];
const tracks = [
    { name: 'choras', label: 'Choras', icon: 'audio/choras/icon.svg', tracks: ['1'], versions: { 1: 20 } },
    { name: 'pianinas', tracks: ['1', '2'] },
    { name: 'tuscias' },
];

test('builds rows with lists, note versions and favourites', () => {
    const rows = buildSongRows(songs, tracks, new Set(['2']));
    assert.deepEqual(rows[0], {
        songId: '1',
        title: 'Pirma',
        verse: '',
        body: 'a',
        slides: [{ text: 'a' }],
        copyright: '',
        pages: 2,
        notePages: { svg: [0, 1], avif: [] },
        noteVersions: { svg: { 0: 10, 1: 11 }, avif: {} },
        favorited: 0,
        lists: ['choras', 'pianinas'],
    });
    assert.equal(rows[1].favorited, 1);
    assert.deepEqual(rows[1].lists, ['pianinas']);
    assert.deepEqual(rows[1].slides, []);
    assert.equal(rows[1].noteVersions, null);
    assert.equal(rows[1].pages, null);
});

test('keeps track versions and fills missing labels', () => {
    assert.deepEqual(buildTrackTypes(tracks), [
        { name: 'choras', label: 'Choras', icon: 'audio/choras/icon.svg', versions: { 1: 20 } },
        { name: 'pianinas', label: 'pianinas', icon: null, versions: {} },
        { name: 'tuscias', label: 'tuscias', icon: null, versions: {} },
    ]);
});

test('maps stored track types to versions per type', () => {
    assert.deepEqual(
        audioVersionsByType([{ name: 'choras', versions: { 1: 20 } }, { name: 'senas' }, null]),
        { choras: { 1: 20 }, senas: {} },
    );
    assert.deepEqual(audioVersionsByType(undefined), {});
});
