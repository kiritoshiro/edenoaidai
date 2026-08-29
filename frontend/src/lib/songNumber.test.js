import test from 'node:test';
import assert from 'node:assert/strict';

import {
    findSongIdByNumber,
    formatSongNumber,
    maximumSongNumber,
    sanitizeSongNumberInput,
    songNumberKey,
} from './songNumber.js';

const songIds = ['1', '36', '36 A', '160', '160 A', '238'];

test('matches a suffix case-insensitively and without requiring a space', () => {
    assert.equal(findSongIdByNumber('36a', songIds), '36 A');
    assert.equal(findSongIdByNumber('36 A', songIds), '36 A');
    assert.equal(findSongIdByNumber('36A', songIds), '36 A');
    assert.equal(findSongIdByNumber('160a', songIds), '160 A');
    assert.equal(findSongIdByNumber('238a', songIds), '');
});

test('formats a song number when editing finishes', () => {
    assert.equal(formatSongNumber('036a'), '36 A');
    assert.equal(formatSongNumber('160 A'), '160 A');
    assert.equal(formatSongNumber('238'), '238');
});

test('keeps only digits and one optional A suffix', () => {
    assert.equal(sanitizeSongNumberInput(' 36 a ', 238), '36a');
    assert.equal(sanitizeSongNumberInput('36aA42', 238), '36a');
    assert.equal(sanitizeSongNumberInput('<b>160</b>', 238), '160');
    assert.equal(sanitizeSongNumberInput('alert(1)', 238), '1');
});

test('rejects digits that would exceed the largest song number', () => {
    assert.equal(maximumSongNumber(songIds), 238);
    assert.equal(sanitizeSongNumberInput('239', 238), '23');
    assert.equal(sanitizeSongNumberInput('9999', 238), '99');
});

test('uses one stable key for supported number spellings', () => {
    assert.equal(songNumberKey('036 a'), '36A');
    assert.equal(songNumberKey('36A'), '36A');
    assert.equal(songNumberKey('36 B'), '');
});
