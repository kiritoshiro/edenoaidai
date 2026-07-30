import Dexie from 'dexie';
import { appConfig } from './config';

/**
 * Returns initialized Dexie database instance
 *
 */
function getDatabaseInstance() {
    const database = new Dexie('edenoAidai');

    database.version(1).stores({
        songs: '++id, &songId, *title, verse, body, copyright, favorited, lists',
    });

    return database;
}

export async function initializeDatabase(app, router) {
    const database = getDatabaseInstance();
    const { cacheVersion } = appConfig;
    const storedVersion = localStorage.getItem('dbVersion');

    app.config.globalProperties.$songs = database.songs;
    app.provide('songs', database.songs);

    const songCount = await database.songs.count();
    const needsRefresh = storedVersion !== cacheVersion;
    if (
        (songCount === 0 || needsRefresh) &&
        router.currentRoute.value.path !== '/install'
    ) {
        await router.replace({ name: 'install' });
    }

    return database;
}
