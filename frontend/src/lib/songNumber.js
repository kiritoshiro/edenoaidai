const ID_COLLATOR = new Intl.Collator('lt', { numeric: true, sensitivity: 'base' });

// Matches the server's own ordering (`CAST(song_id AS UNSIGNED), song_id`
// in common.php's build_public_db()): numeric first, "27" before "27 A".
export function compareSongIds(a, b) {
    return ID_COLLATOR.compare(String(a ?? ''), String(b ?? ''));
}

export function songNumberKey(value) {
    const match = String(value ?? '')
        .trim()
        .match(/^0*(\d+)\s*([aA.,])?$/u);

    if (!match) return '';

    const number = match[1].replace(/^0+(?=\d)/u, '');
    return `${number}${match[2] ? 'A' : ''}`;
}

export function formatSongNumber(value) {
    const key = songNumberKey(value);
    if (!key) return '';

    return key.endsWith('A') ? `${key.slice(0, -1)} A` : key;
}

export function maximumSongNumber(songIds) {
    return (Array.isArray(songIds) ? songIds : []).reduce((maximum, songId) => {
        const key = songNumberKey(songId);
        const number = Number.parseInt(key, 10);
        return Number.isFinite(number) ? Math.max(maximum, number) : maximum;
    }, 0);
}

export function sanitizeSongNumberInput(value, maximum = 0) {
    let digits = '';
    let suffix = '';

    for (const character of String(value ?? '')) {
        if (/\d/u.test(character)) {
            if (!suffix) digits += character;
        } else if (
            (character === 'a' ||
                character === 'A' ||
                character === '.' ||
                character === ',') &&
            digits &&
            !suffix
        ) {
            suffix = character;
        }
    }

    digits = digits.replace(/^0+(?=\d)/u, '');

    const upperBound = Number.parseInt(maximum, 10);
    if (Number.isFinite(upperBound) && upperBound > 0) {
        digits = digits.slice(0, String(upperBound).length);
        while (digits && Number.parseInt(digits, 10) > upperBound) {
            digits = digits.slice(0, -1);
        }
    }

    return digits ? `${digits}${suffix}` : '';
}

export function findSongIdByNumber(value, songIds) {
    const key = songNumberKey(value);
    if (!key) return '';

    return (
        (Array.isArray(songIds) ? songIds : []).find(
            songId => songNumberKey(songId) === key,
        ) || ''
    );
}
