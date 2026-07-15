import Dexie from 'dexie';

export const db = new Dexie('edenoAidai');

// v1 – kept so existing installations upgrade cleanly
db.version(1).stores({
    songs: '++id, &songId, *title, verse, body, copyright, favorited, lists',
});

// v2 – only the indexes that are actually queried
// (all other fields are still stored on the objects, just not indexed)
db.version(2).stores({
    songs: '++id, &songId, favorited',
});

export async function isInstalled() {
    try {
        return (await db.songs.count()) > 0;
    } catch (error) {
        console.error(error);
        return true;
    }
}

const TRACK_TYPES_KEY = 'trackTypes';

export function getTrackTypes() {
    try {
        return JSON.parse(localStorage.getItem(TRACK_TYPES_KEY) || '[]');
    } catch {
        return [];
    }
}

export function setTrackTypes(list) {
    localStorage.setItem(TRACK_TYPES_KEY, JSON.stringify(list || []));
}
