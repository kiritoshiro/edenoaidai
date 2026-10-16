import assert from 'node:assert/strict';
import test from 'node:test';

import { lyricsToPlainText } from './lyrics.js';

test('turns line and block markup into newlines', () => {
    assert.equal(
        lyricsToPlainText('<p>Line one<br>Line two</p><p>Verse &amp; chorus</p>'),
        'Line one\nLine two\nVerse & chorus',
    );
});

test('decodes each entity once', () => {
    assert.equal(lyricsToPlainText('Tom &amp;lt;3'), 'Tom &lt;3');
    assert.equal(lyricsToPlainText('a &lt; b &gt; c'), 'a < b > c');
    assert.equal(lyricsToPlainText('Šlovė&nbsp;Dievui &#39;x&#x27;'), "Šlovė Dievui 'x'");
});

test('nested tag fragments leave no markup behind', () => {
    assert.equal(lyricsToPlainText('<<b>script>alert(1)<</b>/script>'), 'scriptalert(1)/script');
});

test('empty input gives an empty string', () => {
    assert.equal(lyricsToPlainText(null), '');
});
