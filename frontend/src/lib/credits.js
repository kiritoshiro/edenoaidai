/**
 * Parses the free-text `copyright` field into individual credited people.
 *
 * There is no structured author column — authorship lives entirely in one
 * <br>-separated HTML string per song, written by hand, e.g.:
 *
 *   Carl G. Boberg (1859–1940),
 *   Stuart K. Hine (1899–1949) tekstas, 1885 ir 1953
 *   Švedų melodija, 1889
 *   Vertė Vilma Vanagienė, Romualda Adomaitytė-Chabarina, 2000
 *
 * So this is deliberately a best-effort reader of an existing convention,
 * not a strict format. It is used to build an admin-side index; it never
 * rewrites song data.
 */

const COLLATOR = new Intl.Collator('lt', { sensitivity: 'base' });
const NUMERIC_COLLATOR = new Intl.Collator('lt', { numeric: true, sensitivity: 'base' });

export const ROLE_LABELS = {
    text: 'tekstas',
    music: 'muzika',
    translation: 'vertimas',
    arrangement: 'aranžuotė',
    unknown: 'nenurodyta',
};

// Order matters: "tekstas ir muzika" has to be recognised (and removed)
// before the bare "tekstas"/"muzika" patterns get a chance to match it,
// otherwise the shared " ir " would survive and later be mistaken for the
// name separator used in credits like "Jim ir Ann Mills".
// \b is ASCII-only even under /u, so it never matches beside a Lithuanian
// letter — "vertė", "aranžuotė" and "žodžiai" all begin or end on one, and
// a \b-anchored pattern silently fails to match them. Hence the explicit
// Unicode-aware boundaries.
const EDGE_BEFORE = '(?<![\\p{L}\\p{N}])';
const EDGE_AFTER = '(?![\\p{L}\\p{N}])';
const role = (roles, body) => ({
    roles,
    pattern: new RegExp(`${EDGE_BEFORE}(?:${body})${EDGE_AFTER}`, 'giu'),
});

const ROLE_PATTERNS = [
    role(['text', 'music'], 'tekstas\\s+ir\\s+muzika'),
    role(['text'], 'tekstas|žodžiai'),
    role(['music'], 'muzika|melodija'),
    role(['translation'], 'vert[ėe]'),
    role(['arrangement'], 'aran[žz]uot[ėe]|harmonizacij\\p{L}*'),
];

const YEAR_ONLY = /^~?\s*(?:apie\s*)?\d{3,4}(?:\s*(?:ir|–|-)\s*\d{3,4})*\s*(?:m\.)?$/iu;
const CENTURY = /\b[IVXLCDM]+\s*a\./u;

function stripHtml(value) {
    return String(value ?? '')
        .replace(/<[^>]*>/gu, ' ')
        .replace(/&nbsp;/giu, ' ')
        .replace(/&amp;/giu, '&');
}

function splitLines(copyright) {
    return String(copyright ?? '')
        .split(/<br\s*\/?>/iu)
        .map(line => stripHtml(line).replace(/\s+/gu, ' ').trim())
        .filter(Boolean);
}

/**
 * A credit can wrap across several <br> lines, and the role keyword may sit
 * on any of them — "Carl G. Boberg (1859–1940)," carries the "tekstas" that
 * only appears on the following line, while "Vertė Vilma Vanagienė," passes
 * its role forward to the name on the next. A trailing comma is what marks
 * the continuation, so lines are grouped on that and the role is resolved
 * per group rather than per line.
 */
function groupContinuations(lines) {
    const groups = [];
    let current = [];

    lines.forEach(line => {
        current.push(line);
        if (!line.endsWith(',')) {
            groups.push(current.join(' '));
            current = [];
        }
    });
    if (current.length) groups.push(current.join(' '));

    return groups;
}

function extractRoles(group) {
    const roles = new Set();
    let remainder = group;

    ROLE_PATTERNS.forEach(({ roles: matched, pattern }) => {
        const expression = new RegExp(pattern.source, pattern.flags);
        if (expression.test(remainder)) {
            matched.forEach(role => roles.add(role));
            remainder = remainder.replace(
                new RegExp(pattern.source, pattern.flags),
                ' ',
            );
        }
    });

    return { roles: [...roles], remainder };
}

/**
 * Distinguishes a credited person from the traditional/anonymous entries
 * that share the same field ("Švedų melodija", "XIX a. amerikiečių
 * melodija", "oratorijos „Mesijas“ fragmentas"). Once the role keyword is
 * removed those collapse to a single word or an uncapitalised phrase, while
 * every real name in this data carries at least two capitalised parts —
 * including the genitive forms used for arrangements ("Dariaus Kudirkos").
 * A mononym composer would be missed; none appear in the current data.
 */
function looksLikePerson(candidate) {
    if (!candidate || YEAR_ONLY.test(candidate) || CENTURY.test(candidate)) {
        return false;
    }
    const words = candidate.split(/\s+/u).filter(Boolean);
    if (words.length < 2) return false;

    const capitalised = words.filter(word => {
        const first = word[0];
        return first && first === first.toLocaleUpperCase('lt') && first !== first.toLocaleLowerCase('lt');
    });
    return capitalised.length >= 2;
}

function extractNames(remainder) {
    return remainder
        .replace(/\([^)]*\)/gu, ' ') // life years: (1859–1940)
        .replace(/[„“"»«][^„“"»«]*[„“"»«]/gu, ' ') // quoted work titles
        // Names are NOT split on " ir " — couples are credited jointly
        // ("Jim ir Ann Mills"), and splitting would invent a "Jim Mills"
        // that the source never claimed.
        .split(',')
        .map(part => part.replace(/\s+/gu, ' ').trim())
        .filter(looksLikePerson);
}

/** @returns {{name: string, roles: string[]}[]} credits for one song. */
export function parseCredits(copyright) {
    const groups = groupContinuations(splitLines(copyright));
    const credits = [];
    let anyTextRole = false;

    const parsed = groups.map(group => {
        const { roles, remainder } = extractRoles(group);
        if (roles.includes('text')) anyTextRole = true;
        return { roles, names: extractNames(remainder) };
    });

    parsed.forEach(({ roles, names }, index) => {
        // A leading credit with no keyword at all is the lyricist by this
        // hymnal's convention ("Fanny J. Crosby (1820–1915), 1875"). Only
        // applied to the first group, and only when nothing else in the
        // song already claims the text — otherwise a later role-less line
        // (song 20's "George F. Händel (1685–1759), oratorijos ...") would
        // be mislabelled as the lyricist when it is really the composer.
        const resolved =
            roles.length === 0 && index === 0 && !anyTextRole ? ['text'] : roles;

        names.forEach(name => {
            credits.push({ name, roles: resolved.length ? resolved : ['unknown'] });
        });
    });

    return credits;
}

// Lithuanian genitive singular -> nominative. Credits are written in
// whichever case the sentence needed, so the same contributor appears both
// as "Danielius Oželis" (after "Vertė") and "Danieliaus Oželio" (before
// "tekstas") — the same person, split across two index entries.
const GENITIVE_ENDINGS = [
    ['iaus', 'ius'], // Danieliaus -> Danielius
    ['aus', 'us'], // Mikalojaus -> Mikalojus
    ['ės', 'ė'], // Adomaitytės -> Adomaitytė
    ['os', 'a'], // Kudirkos -> Kudirka
    ['io', 'is'], // Oželio -> Oželis
    ['o', 'as'], // Petro -> Petras
];

// Groups spellings that differ only by dash character or letter case. The
// hymnal's most prolific translator is written both as "Adomaitytė-Chabarina"
// and "Adomaitytė–Chabarina" (en dash), which would otherwise be two people.
function indexKey(name) {
    return name.replace(/[‐-―]/gu, '-').toLocaleLowerCase('lt');
}

function toNominative(name) {
    return name
        .split(/\s+/u)
        .map(word =>
            word
                .split('-')
                .map(part => {
                    const lower = part.toLocaleLowerCase('lt');
                    const ending = GENITIVE_ENDINGS.find(([from]) =>
                        lower.endsWith(from),
                    );
                    return ending
                        ? part.slice(0, part.length - ending[0].length) + ending[1]
                        : part;
                })
                .join('-'),
        )
        .join(' ');
}

/**
 * Builds the author index: one entry per credited person, with every role
 * they appear under and every song number they appear in.
 *
 * @returns {{name: string, roles: string[], songIds: string[], count: number}[]}
 */
export function buildCreditIndex(songs) {
    const byName = new Map();

    const add = (key, name, roles, songId) => {
        let entry = byName.get(key);
        if (!entry) {
            entry = { name, roles: new Set(), songIds: new Set(), spellings: new Map() };
            byName.set(key, entry);
        }
        // The same surname is written with both a hyphen and an en dash in
        // this data, so the display name is whichever exact spelling is used
        // most often rather than whichever happened to be read first.
        entry.spellings.set(name, (entry.spellings.get(name) ?? 0) + 1);
        roles.forEach(role => entry.roles.add(role));
        entry.songIds.add(songId);
    };

    (Array.isArray(songs) ? songs : []).forEach(song => {
        const songId = String(song?.songId ?? '');
        if (!songId) return;

        parseCredits(song?.copyright).forEach(({ name, roles }) => {
            add(indexKey(name), name, roles, songId);
        });
    });

    // Only fold a genitive spelling into its nominative when that nominative
    // is independently credited somewhere else. Guessing unconditionally
    // would mangle foreign names that merely look Lithuanian in the
    // genitive — "Carlos" would become "Carla", "Antonio" would become
    // "Antonis" — so an existing entry acts as the evidence that the two
    // spellings really are the same person.
    [...byName.keys()].forEach(key => {
        const entry = byName.get(key);
        if (!entry) return;
        const nominative = toNominative(key);
        if (nominative === key) return;

        const target = byName.get(nominative);
        if (!target) return;

        entry.roles.forEach(role => target.roles.add(role));
        entry.songIds.forEach(songId => target.songIds.add(songId));
        // Deliberately not merging spellings: the target holds the
        // nominative form, which is the one to display even when the
        // genitive is the more frequent spelling in the source data.
        byName.delete(key);
    });

    return [...byName.values()]
        .map(entry => ({
            name: [...entry.spellings.entries()].sort(
                (left, right) => right[1] - left[1],
            )[0][0],
            roles: [...entry.roles],
            songIds: [...entry.songIds].sort((left, right) =>
                NUMERIC_COLLATOR.compare(left, right),
            ),
            count: entry.songIds.size,
        }))
        .sort((left, right) => COLLATOR.compare(left.name, right.name));
}
