import assert from 'node:assert/strict';
import test from 'node:test';

import { lyricsToPlainText, plainTextToLyricsHtml } from './lyrics.js';

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
    assert.equal(lyricsToPlainText('<<b>script>alert(1)<</b>/script>'), 'script>alert(1)/script>');
});

test('lone brackets survive as text, so editor saves keep them', () => {
    assert.equal(lyricsToPlainText('a < b'), 'a < b');
    assert.equal(lyricsToPlainText('<3 tau'), '<3 tau');
    assert.equal(lyricsToPlainText('5 > 3'), '5 > 3');
    assert.equal(lyricsToPlainText(lyricsToPlainText('&lt;3')), '<3');
});

test('line-break variants and CRLF become newlines', () => {
    assert.equal(lyricsToPlainText('a<BR />b<br/>c</div>d</li>e\r\nf'), 'a\nb\nc\nd\ne\nf');
});

test('empty input gives an empty string', () => {
    assert.equal(lyricsToPlainText(null), '');
    assert.equal(plainTextToLyricsHtml(null), '');
});

test('plain text survives a trip through body HTML', () => {
    assert.equal(plainTextToLyricsHtml('a <b>\r\nTom & Jerry'), 'a &lt;b&gt;<br>Tom &amp; Jerry');
    for (const text of ['Mylim <tave> visada', '<3 tau', 'Tom & Jerry', '&lt;b&gt;x', 'a\nb']) {
        assert.equal(lyricsToPlainText(plainTextToLyricsHtml(text)), text);
    }
});
