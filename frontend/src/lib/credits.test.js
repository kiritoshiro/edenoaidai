import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCreditIndex, parseCredits } from './credits.js';

const names = copyright => parseCredits(copyright).map(credit => credit.name);
const roleOf = (copyright, name) =>
    parseCredits(copyright).find(credit => credit.name === name)?.roles ?? [];

test('reads a plain text/music pair', () => {
    const copyright =
        'Ignaz Franz (1719–1790) tekstas, 1774 <br />Heinrich Bone (1813–1893) muzika, 1852';
    assert.deepEqual(names(copyright), ['Ignaz Franz', 'Heinrich Bone']);
    assert.deepEqual(roleOf(copyright, 'Ignaz Franz'), ['text']);
    assert.deepEqual(roleOf(copyright, 'Heinrich Bone'), ['music']);
});

test('"tekstas ir muzika" credits both roles to one person', () => {
    const copyright = 'Diane Ball tekstas ir muzika, 1978';
    assert.deepEqual(names(copyright), ['Diane Ball']);
    assert.deepEqual(roleOf(copyright, 'Diane Ball'), ['text', 'music']);
});

test('keeps jointly credited couples intact rather than inventing a name', () => {
    // " ir " separates the people here, but "Jim Mills" is never actually
    // claimed by the source, so the pair stays as written.
    assert.deepEqual(names('Jim ir Ann Mills tekstas ir muzika, 1979'), [
        'Jim ir Ann Mills',
    ]);
    assert.deepEqual(names('Gloria ir William J. Gaither tekstas, 1971'), [
        'Gloria ir William J. Gaither',
    ]);
});

test('lists every translator after a single "Vertė"', () => {
    assert.deepEqual(
        names('Vertė Vilma Vanagienė, Romualda Adomaitytė-Chabarina, 2000'),
        ['Vilma Vanagienė', 'Romualda Adomaitytė-Chabarina'],
    );
});

test('carries a role across a line that continues after a trailing comma', () => {
    // "tekstas" appears only on the second line but covers both names.
    const copyright =
        'Carl G. Boberg (1859–1940),<br />Stuart K. Hine (1899–1949) tekstas, 1885 ir 1953';
    assert.deepEqual(names(copyright), ['Carl G. Boberg', 'Stuart K. Hine']);
    assert.deepEqual(roleOf(copyright, 'Carl G. Boberg'), ['text']);
});

test('carries a role forward into a continued line', () => {
    const copyright =
        'Vertė Vilma Vanagienė,<br />Romualda Adomaitytė-Chabarina, 2000';
    assert.deepEqual(roleOf(copyright, 'Romualda Adomaitytė-Chabarina'), [
        'translation',
    ]);
});

test('skips traditional and anonymous entries', () => {
    assert.deepEqual(names('Švedų melodija, 1889'), []);
    assert.deepEqual(names('XVII a. vokiečių melodija'), []);
    assert.deepEqual(names('XIX a. Tiuringijos melodija'), []);
    assert.deepEqual(names('Sicilijos melodija'), []);
    assert.deepEqual(names('Indų misionierių melodija'), []);
});

test('drops quoted work titles but keeps the composer', () => {
    const copyright = 'Ludwig van Beethoven (1770–1827) „Odė džiaugsmui“, 1824';
    assert.deepEqual(names(copyright), ['Ludwig van Beethoven']);
});

test('reads genitive-case arrangement credits', () => {
    const copyright = 'Dariaus Kudirkos aranžuotė, 2007';
    assert.deepEqual(names(copyright), ['Dariaus Kudirkos']);
    assert.deepEqual(roleOf(copyright, 'Dariaus Kudirkos'), ['arrangement']);
});

test('treats a leading role-less credit as the lyricist', () => {
    const copyright =
        'Fanny J. Crosby (1820–1915), 1875<br />William H. Doane (1832–1915) muzika, 1875';
    assert.deepEqual(roleOf(copyright, 'Fanny J. Crosby'), ['text']);
});

test('does not guess the lyricist when another line already claims it', () => {
    // Händel is the composer here; the text is credited to Isaac Watts, so
    // the role-less Händel line must not be relabelled as lyrics.
    const copyright =
        'Isaac Watts (1674–1748) tekstas, 1719<br />George F. Händel (1685–1759),<br />oratorijos „Mesijas“ fragmentas, 1742';
    assert.deepEqual(roleOf(copyright, 'George F. Händel'), ['unknown']);
    assert.deepEqual(roleOf(copyright, 'Isaac Watts'), ['text']);
});

test('ignores empty and malformed input', () => {
    assert.deepEqual(parseCredits(''), []);
    assert.deepEqual(parseCredits(null), []);
    assert.deepEqual(parseCredits(undefined), []);
    assert.deepEqual(parseCredits('<br /><br />'), []);
    assert.deepEqual(parseCredits(', 2000, ~ 1998'), []);
});

test('index groups one person across songs and sorts numbers naturally', () => {
    const index = buildCreditIndex([
        { songId: '10', copyright: 'Vertė Danielius Oželis, 1999' },
        { songId: '2', copyright: 'Vertė Danielius Oželis, 2001' },
        { songId: '2 A', copyright: 'Vertė Danielius Oželis, 2001' },
        { songId: '3', copyright: 'Ella Lauder tekstas' },
    ]);

    const ozelis = index.find(entry => entry.name === 'Danielius Oželis');
    assert.deepEqual(ozelis.songIds, ['2', '2 A', '10']);
    assert.equal(ozelis.count, 3);
    assert.deepEqual(ozelis.roles, ['translation']);
});

test('index merges roles and is sorted by name', () => {
    const index = buildCreditIndex([
        { songId: '1', copyright: 'Ella Lauder tekstas' },
        { songId: '2', copyright: 'Ella Lauder muzika' },
        { songId: '3', copyright: 'Diane Ball tekstas ir muzika' },
    ]);

    assert.deepEqual(
        index.map(entry => entry.name),
        ['Diane Ball', 'Ella Lauder'],
    );
    assert.deepEqual(index[1].roles, ['text', 'music']);
});

test('folds a genitive spelling into the nominative one person is credited under', () => {
    const index = buildCreditIndex([
        { songId: '1', copyright: 'Vertė Danielius Oželis, 1999' },
        { songId: '2', copyright: 'Danieliaus Oželio tekstas' },
        { songId: '3', copyright: 'Vertė Romualda Adomaitytė-Chabarina, 2000' },
        { songId: '4', copyright: 'Romualdos Adomaitytės-Chabarinos tekstas' },
    ]);

    assert.deepEqual(
        index.map(entry => entry.name),
        ['Danielius Oželis', 'Romualda Adomaitytė-Chabarina'],
    );
    assert.deepEqual(index[0].songIds, ['1', '2']);
    assert.deepEqual(index[0].roles, ['translation', 'text']);
    // The nominative is the canonical form to display, even where the
    // genitive spelling is the more frequent one in the source data.
    assert.equal(
        buildCreditIndex([
            { songId: '1', copyright: 'Birutės Masiliauskienės tekstas' },
            { songId: '2', copyright: 'Birutės Masiliauskienės tekstas' },
            { songId: '3', copyright: 'Vertė Birutė Masiliauskienė, 1999' },
        ])[0].name,
        'Birutė Masiliauskienė',
    );
    // Hyphenated surnames have to be folded part by part.
    assert.deepEqual(index[1].songIds, ['3', '4']);
});

test('leaves a genitive-looking name alone when no nominative is credited', () => {
    // "Dariaus Kudirkos" only ever appears in the genitive, so there is no
    // evidence for a "Darius Kudirka" entry and it must be left as written.
    const index = buildCreditIndex([
        { songId: '1', copyright: 'Dariaus Kudirkos aranžuotė, 2007' },
    ]);
    assert.deepEqual(index.map(entry => entry.name), ['Dariaus Kudirkos']);
});

test('does not mangle foreign names that merely look genitive', () => {
    // Unconditional de-genitivising would turn these into "Carla Santa"
    // and "Antonis Vivaldi"; without a matching nominative entry as
    // evidence, both must survive untouched.
    const index = buildCreditIndex([
        { songId: '1', copyright: 'Carlos Santos tekstas' },
        { songId: '2', copyright: 'Antonio Vivaldi muzika' },
    ]);
    assert.deepEqual(
        index.map(entry => entry.name),
        ['Antonio Vivaldi', 'Carlos Santos'],
    );
});

test('merges spellings that differ only by dash, keeping the common one', () => {
    // One song writes this surname with an en dash instead of a hyphen; it
    // is the same contributor, and the majority spelling should be shown.
    const index = buildCreditIndex([
        { songId: '1', copyright: 'Vertė Romualda Adomaitytė-Chabarina, 2000' },
        { songId: '2', copyright: 'Vertė Romualda Adomaitytė-Chabarina, 2001' },
        { songId: '3', copyright: 'Vertė Romualda Adomaitytė–Chabarina, 2002' },
    ]);

    assert.equal(index.length, 1);
    assert.equal(index[0].name, 'Romualda Adomaitytė-Chabarina');
    assert.deepEqual(index[0].songIds, ['1', '2', '3']);
});

test('index ignores songs without a usable number', () => {
    const index = buildCreditIndex([
        { songId: '', copyright: 'Ella Lauder tekstas' },
        { copyright: 'Ella Lauder tekstas' },
    ]);
    assert.deepEqual(index, []);
});

test('index tolerates non-array input', () => {
    assert.deepEqual(buildCreditIndex(null), []);
    assert.deepEqual(buildCreditIndex(undefined), []);
});
