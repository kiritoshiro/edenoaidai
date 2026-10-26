import { db, isInstalled, setTrackTypes } from '../db';
import { config } from './config';
import { buildSongRows, buildTrackTypes } from './dataRows';

// Fired on window after a background check imported new data
export const DATA_UPDATED_EVENT = 'edeno:data-updated';

const DATA_VERSION_KEY = 'dataVersion';
const MIN_CHECK_INTERVAL = 60 * 1000;

let lastCheck = 0;
let running = null;

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
export async function downloadData({ requireTracks = true } = {}) {
    const [songs, trackLists] = await Promise.all([
        fetchJson(config.dbUrl),
        requireTracks
            ? fetchJson(config.tracksUrl)
            : fetchJson(config.tracksUrl).catch(() => []),
    ]);

    if (!Array.isArray(songs) || !songs.length) {
        throw new Error('Gauta tuščia arba netinkama duomenų bazė');
    }
    if (requireTracks && !Array.isArray(trackLists)) {
        throw new Error('Gautas netinkamas įrašų sąrašas');
    }
    return { songs, tracks: Array.isArray(trackLists) ? trackLists : [] };
}

// Replaces every song row in one transaction, keeping the user's favourites.
export async function saveData(songs, tracks, onProgress = () => {}) {
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

// Asks the server whether songs or media files changed and, if so, imports
// them quietly. Settings and offline caches stay; nothing is reloaded.
// Resolves to true when new data was imported.
export function checkForDataUpdate({ force = false } = {}) {
    if (running) return running;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return Promise.resolve(false);
    }
    if (!force && Date.now() - lastCheck < MIN_CHECK_INTERVAL) {
        return Promise.resolve(false);
    }

    lastCheck = Date.now();
    running = updateData()
        .catch(error => {
            console.warn('Nepavyko patikrinti giesmių atnaujinimų:', error);
            return false;
        })
        .finally(() => {
            running = null;
        });
    return running;
}

async function updateData() {
    if (!(await isInstalled())) return false;

    // Read before the data, so a change made in between triggers another
    // import on the next check instead of being missed
    const version = await fetchDataVersion();
    if (version === localStorage.getItem(DATA_VERSION_KEY)) return false;

    const { songs, tracks } = await downloadData();
    await saveData(songs, tracks);
    setDataVersion(version);
    window.dispatchEvent(new CustomEvent(DATA_UPDATED_EVENT));
    return true;
}
