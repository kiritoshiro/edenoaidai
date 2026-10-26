import { db, isInstalled, setTrackTypes } from '../db';
import { config } from './config';
import { buildSongRows, buildTrackTypes } from './dataRows';
import { createExclusive } from './exclusive';

// Fired on window after a background check imported new data
export const DATA_UPDATED_EVENT = 'edeno:data-updated';

const DATA_VERSION_KEY = 'dataVersion';
const MIN_CHECK_INTERVAL = 60 * 1000;

let lastCheck = 0;

export async function fetchJson(url) {
    if (!url) {
        throw new Error('Nenurodytas duomenų bazės adresas (VITE_DB_URL)');
    }
    const bust = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${bust}t=${Date.now()}`, {
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error(`Nepavyko parsiųsti (${response.status})`);
    }
    return response.json();
}

export async function fetchDataVersion() {
    const data = await fetchJson(config.versionUrl);
    if (!data || typeof data.version !== 'string' || !data.version) {
        throw new Error('Netinkamas duomenų versijos atsakymas');
    }
    return data.version;
}

// The first install still works without tracks.json; a background update
// keeps the stored recordings instead of wiping them on a failed request.
// tracksLoaded is false when the install went on without recordings.
export async function downloadData({ requireTracks = true } = {}) {
    const [songs, trackLists] = await Promise.all([
        fetchJson(config.dbUrl),
        requireTracks
            ? fetchJson(config.tracksUrl)
            : fetchJson(config.tracksUrl).catch(() => null),
    ]);

    if (!Array.isArray(songs) || !songs.length) {
        throw new Error('Gauta tuščia arba netinkama duomenų bazė');
    }
    const tracksLoaded = Array.isArray(trackLists);
    if (requireTracks && !tracksLoaded) {
        throw new Error('Gautas netinkamas įrašų sąrašas');
    }
    return { songs, tracks: tracksLoaded ? trackLists : [], tracksLoaded };
}

// Replaces the songs, then the recording types and the install time.
export async function saveData(songs, tracks, onProgress) {
    await replaceSongs(songs, tracks, onProgress);
    saveTrackTypes(tracks);
}

// Replaces every song row in one transaction, keeping the user's favourites.
async function replaceSongs(songs, tracks, onProgress = () => {}) {
    await db.transaction('rw', db.songs, async () => {
        const favorites = new Set(
            (await db.songs.where('favorited').equals(1).toArray()).map(
                song => song.songId,
            ),
        );
        const rows = buildSongRows(songs, tracks, favorites);

        await db.songs.clear();
        const CHUNK = 100;
        for (let i = 0; i < rows.length; i += CHUNK) {
            await db.songs.bulkAdd(rows.slice(i, i + CHUNK));
            onProgress(Math.min(i + CHUNK, rows.length), rows.length);
        }
    });
}

function saveTrackTypes(tracks) {
    setTrackTypes(buildTrackTypes(tracks));
    localStorage.setItem('lastInstall', String(Date.now()));
}

export function setDataVersion(version) {
    if (version) {
        localStorage.setItem(DATA_VERSION_KEY, version);
    } else {
        localStorage.removeItem(DATA_VERSION_KEY);
    }
}

// One import at a time, shared by background checks and the install page,
// so an older download can never be saved over a newer one. The install
// may outlive its page (the navbar stays usable), so the lock is held here
// rather than by checking the current route.
export const runExclusive = createExclusive();

// Asks the server whether songs or media files changed and, if so, imports
// them quietly. Settings and offline caches stay; nothing is reloaded.
// Resolves to true when new data was imported.
export function checkForDataUpdate({ force = false } = {}) {
    if (runExclusive.busy()) return Promise.resolve(false);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return Promise.resolve(false);
    }
    if (!force && Date.now() - lastCheck < MIN_CHECK_INTERVAL) {
        return Promise.resolve(false);
    }

    lastCheck = Date.now();
    return runExclusive(updateData).catch(error => {
        console.warn('Nepavyko patikrinti giesmių atnaujinimų:', error);
        return false;
    });
}

async function updateData() {
    if (!(await isInstalled())) return false;

    // Read before the data, so a change made in between triggers another
    // import on the next check instead of being missed
    const version = await fetchDataVersion();
    if (version === localStorage.getItem(DATA_VERSION_KEY)) return false;

    const { songs, tracks } = await downloadData();
    await replaceSongs(songs, tracks);
    try {
        saveTrackTypes(tracks);
        setDataVersion(version);
    } finally {
        // The rows (and their ids) are replaced even if storing the rest
        // failed, so open views reload. Without the new version stored,
        // the next check imports again.
        window.dispatchEvent(new CustomEvent(DATA_UPDATED_EVENT));
    }
    return true;
}
