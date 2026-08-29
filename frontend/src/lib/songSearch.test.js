import test from 'node:test';
import assert from 'node:assert/strict';

import {
    createSongSearchResults,
    findWordPrefixMatch,
    highlightSegments,
} from './songSearch.js';

const songs = [
    {
        id: 1,
        songId: '36 A',
        title: 'Ramybė širdžiai',
        body: 'Mes apgiedame malonę ir viltį.',
    },
    {
        id: 2,
        songId: '36',
        title: 'Giedame Dievo meilę',
        body: 'Pirmoji eilutė.<br />Dievo meilė lydi mus kasdien.',
    },
    {
        id: 3,
        songId: '160',
        title: 'Vilties giesmė',
        body: 'Tyliai giedame prie upės.',
    },
    {
        id: 4,
        songId: '238',
        title: 'Šviesa kelyje',
        body: '<img src=x onerror=alert(1)> Saugi šviesa mums spindi.',
    },
];

test('matches only at the beginning of words', () => {
    assert.ok(findWordPrefixMatch('Tyliai giedame', 'gied'));
    assert.equal(findWordPrefixMatch('Mes apgiedame', 'gied'), null);
});

test('matches Lithuanian text without requiring diacritics', () => {
    const match = findWordPrefixMatch('Šviesa kelyje', 'svie');
    assert.deepEqual(match.ranges, [{ start: 0, end: 4 }]);
});

test('supports consecutive multi-word prefixes', () => {
    const match = findWordPrefixMatch('Giedame Dievo meilę', 'diev mei');
    assert.deepEqual(match.ranges, [
        { start: 8, end: 12 },
        { start: 14, end: 17 },
    ]);
});

test('orders title matches before content matches', () => {
    const results = createSongSearchResults(songs, 'gied');
    assert.deepEqual(
        results.map(result => [result.song.songId, result.matchType]),
        [
            ['36', 'title'],
            ['160', 'content'],
        ],
    );
});

test('orders exact and prefix song-number matches numerically', () => {
    const results = createSongSearchResults(songs, '36');
    assert.deepEqual(
        results.map(result => result.song.songId),
        ['36', '36 A'],
    );
    assert.equal(results[0].matchType, 'number');
});

test('accepts A and decimal-key spellings for song numbers', () => {
    assert.deepEqual(
        createSongSearchResults(songs, '36a').map(result => result.song.songId),
        ['36 A'],
    );
    assert.deepEqual(
        createSongSearchResults(songs, '36.').map(result => result.song.songId),
        ['36 A'],
    );
});

test('creates a safe highlighted excerpt for a content match', () => {
    const [result] = createSongSearchResults(songs, 'saugi');
    const excerpt = result.excerptSegments.map(segment => segment.text).join('');
    const highlighted = result.excerptSegments
        .filter(segment => segment.highlighted)
        .map(segment => segment.text)
        .join('');

    assert.equal(result.matchType, 'content');
    assert.match(excerpt, /Saugi šviesa/u);
    assert.equal(highlighted, 'Saugi');
    assert.doesNotMatch(excerpt, /<img|onerror/u);
});

test('splits highlighted text without adding markup', () => {
    assert.deepEqual(highlightSegments('Dievo meilė', [{ start: 0, end: 4 }]), [
        { text: 'Diev', highlighted: true },
        { text: 'o meilė', highlighted: false },
    ]);
});
