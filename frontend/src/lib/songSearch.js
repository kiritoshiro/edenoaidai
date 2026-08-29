import { lyricsToPlainText } from './lyrics.js';
import { songNumberKey } from './songNumber.js';

const LT_MAP = {
    ą: 'a',
    č: 'c',
    ę: 'e',
    ė: 'e',
    į: 'i',
    š: 's',
    ų: 'u',
    ū: 'u',
    ž: 'z',
};

const WORD_PATTERN = /[\p{L}\p{N}]+/gu;
const WORD_CHARACTER = /[\p{L}\p{N}]/u;
const SONG_ID_COLLATOR = new Intl.Collator('lt', {
    numeric: true,
    sensitivity: 'base',
});
const MATCH_RANK = {
    number: 0,
    title: 1,
    content: 2,
};

function foldToken(value) {
    return Array.from(String(value || '').toLocaleLowerCase('lt-LT'))
        .map(character => LT_MAP[character] || character)
        .join('');
}

function tokenize(value) {
    const text = String(value || '');
    return Array.from(text.matchAll(WORD_PATTERN), match => ({
        text: match[0],
        folded: foldToken(match[0]),
        start: match.index,
        end: match.index + match[0].length,
    }));
}

function sourcePrefixLength(source, foldedPrefix) {
    return Array.from(source).slice(0, Array.from(foldedPrefix).length).join('')
        .length;
}

export function findWordPrefixMatch(value, query) {
    const words = tokenize(value);
    const queryWords = tokenize(query).map(word => word.folded);
    if (!queryWords.length || queryWords.length > words.length) return null;

    for (let index = 0; index <= words.length - queryWords.length; index += 1) {
        const matchingWords = words.slice(index, index + queryWords.length);
        const matches = matchingWords.every((word, wordIndex) =>
            word.folded.startsWith(queryWords[wordIndex]),
        );
        if (!matches) continue;

        const ranges = matchingWords.map((word, wordIndex) => ({
            start: word.start,
            end:
                word.start +
                sourcePrefixLength(word.text, queryWords[wordIndex]),
        }));

        return {
            start: ranges[0].start,
            end: ranges[ranges.length - 1].end,
            ranges,
            wordIndex: index,
        };
    }

    return null;
}

function normalizeRanges(ranges, textLength) {
    return (Array.isArray(ranges) ? ranges : [])
        .map(range => ({
            start: Math.max(0, Math.min(textLength, Number(range.start) || 0)),
            end: Math.max(0, Math.min(textLength, Number(range.end) || 0)),
        }))
        .filter(range => range.end > range.start)
        .sort((left, right) => left.start - right.start)
        .reduce((merged, range) => {
            const previous = merged[merged.length - 1];
            if (previous && range.start <= previous.end) {
                previous.end = Math.max(previous.end, range.end);
            } else {
                merged.push(range);
            }
            return merged;
        }, []);
}

export function highlightSegments(value, ranges = []) {
    const text = String(value || '');
    const normalizedRanges = normalizeRanges(ranges, text.length);
    const segments = [];
    let position = 0;

    normalizedRanges.forEach(range => {
        if (range.start > position) {
            segments.push({
                text: text.slice(position, range.start),
                highlighted: false,
            });
        }
        segments.push({
            text: text.slice(range.start, range.end),
            highlighted: true,
        });
        position = range.end;
    });

    if (position < text.length) {
        segments.push({ text: text.slice(position), highlighted: false });
    }

    return segments.length ? segments : [{ text, highlighted: false }];
}

function numberPrefixMatch(songId, query) {
    const queryKey = songNumberKey(query);
    const idKey = songNumberKey(songId);
    if (!queryKey || !idKey.startsWith(queryKey)) return null;

    const positions = [];
    Array.from(String(songId || '')).forEach((character, index) => {
        if (/\d/u.test(character) || character === 'a' || character === 'A') {
            positions.push(index);
        }
    });

    const ranges = positions.slice(0, queryKey.length).reduce((list, position) => {
        const previous = list[list.length - 1];
        if (previous && previous.end === position) {
            previous.end = position + 1;
        } else {
            list.push({ start: position, end: position + 1 });
        }
        return list;
    }, []);

    return {
        exact: idKey === queryKey,
        ranges,
    };
}

function songTitle(song) {
    return Array.isArray(song?.title)
        ? song.title.filter(Boolean).join(' ')
        : String(song?.title || '');
}

function isWordCharacter(character) {
    return Boolean(character && WORD_CHARACTER.test(character));
}

function normalizeExcerptSegments(segments) {
    return segments
        .map(segment => ({
            ...segment,
            text: segment.text.replace(/\s+/gu, ' '),
        }))
        .filter(segment => segment.text)
        .reduce((merged, segment) => {
            const previous = merged[merged.length - 1];
            if (previous && previous.highlighted === segment.highlighted) {
                previous.text += segment.text;
            } else {
                merged.push({ ...segment });
            }
            return merged;
        }, []);
}

export function createSearchExcerpt(value, match, contextLength = 85) {
    const text = String(value || '');
    if (!text || !match?.ranges?.length) return [];

    let start = Math.max(0, match.start - contextLength);
    let end = Math.min(text.length, match.end + contextLength);

    while (start > 0 && isWordCharacter(text[start - 1])) start -= 1;
    while (end < text.length && isWordCharacter(text[end])) end += 1;
    while (start < match.start && /\s/u.test(text[start])) start += 1;
    while (end > match.end && /\s/u.test(text[end - 1])) end -= 1;

    const ranges = match.ranges.map(range => ({
        start: range.start - start,
        end: range.end - start,
    }));
    const segments = normalizeExcerptSegments(
        highlightSegments(text.slice(start, end), ranges),
    );

    if (start > 0) {
        segments.unshift({ text: '… ', highlighted: false });
    }
    if (end < text.length) {
        segments.push({ text: ' …', highlighted: false });
    }

    return segments;
}

export function createSongSearchResults(songs, query, limit = 300) {
    const search = String(query || '').trim();
    if (!search) return [];

    const numberQuery = songNumberKey(search);
    const queryHasWords = tokenize(search).length > 0;
    if (!numberQuery && !queryHasWords) return [];

    const results = (Array.isArray(songs) ? songs : []).flatMap(song => {
        const numberMatch = numberQuery
            ? numberPrefixMatch(song?.songId, search)
            : null;
        const title = songTitle(song);
        const body = lyricsToPlainText(song?.body);

        // Numeric input is deliberately kept out of lyrics: verse numbers
        // would otherwise make almost every song look like a useful match.
        const titleMatch = numberQuery
            ? null
            : findWordPrefixMatch(title, search);
        const contentMatch = numberQuery
            ? null
            : findWordPrefixMatch(body, search);

        if (!numberMatch && !titleMatch && !contentMatch) return [];

        const matchType = numberMatch
            ? 'number'
            : titleMatch
              ? 'title'
              : 'content';
        const matchPosition =
            titleMatch?.start ?? contentMatch?.start ?? Number.MAX_SAFE_INTEGER;

        return [
            {
                song,
                matchType,
                matchPosition,
                exactNumberMatch: numberMatch?.exact === true,
                numberSegments: highlightSegments(
                    song?.songId,
                    numberMatch?.ranges,
                ),
                titleSegments: highlightSegments(title, titleMatch?.ranges),
                excerptSegments: contentMatch
                    ? createSearchExcerpt(body, contentMatch)
                    : [],
            },
        ];
    });

    results.sort((left, right) => {
        const rankDifference =
            MATCH_RANK[left.matchType] - MATCH_RANK[right.matchType];
        if (rankDifference) return rankDifference;

        if (left.matchType === 'number') {
            const exactDifference =
                Number(right.exactNumberMatch) -
                Number(left.exactNumberMatch);
            if (exactDifference) return exactDifference;
        }

        const positionDifference = left.matchPosition - right.matchPosition;
        if (positionDifference) return positionDifference;

        return SONG_ID_COLLATOR.compare(
            String(left.song?.songId || ''),
            String(right.song?.songId || ''),
        );
    });

    const parsedLimit = Number.parseInt(limit, 10);
    return Number.isFinite(parsedLimit) && parsedLimit > 0
        ? results.slice(0, parsedLimit)
        : results;
}
