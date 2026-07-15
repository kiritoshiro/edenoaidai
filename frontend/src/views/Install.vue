<template>
    <div class="install-message">
        <template v-if="status === 'ready'">Paruošta!</template>

        <template v-else-if="status === 'error'">
            <p>Įvyko klaida: {{ error }}</p>
            <button class="update-button install-retry" @click="start">
                Bandyti dar kartą
            </button>
        </template>

        <template v-else>
            <p>{{ message }}</p>
            <p v-if="total">{{ current }}/{{ total }}</p>
        </template>
    </div>
</template>

<script>
import { db, setTrackTypes } from '../db';
import { config } from '../lib/config';

export default {
    name: 'Install',
    data() {
        return {
            status: '',
            message: 'Ruošiama…',
            error: '',
            total: 0,
            current: 0,
        };
    },
    created() {
        this.start();
    },
    methods: {
        async start() {
            this.status = '';
            this.error = '';
            this.message = 'Ruošiama…';
            this.total = 0;
            this.current = 0;

            try {
                const refresh =
                    this.$route.query.refresh === '1' ||
                    (await db.songs.count()) > 0;

                if (refresh) {
                    // Forget previously cached audio / sheet music / JSON so
                    // updated files on the server are actually re-downloaded
                    this.message = 'Valomi seni duomenys…';
                    await this.clearRuntimeCaches();
                }

                this.message = 'Siunčiama giesmių duomenų bazė…';
                const [songs, trackLists] = await Promise.all([
                    this.fetchJson(config.dbUrl),
                    this.fetchJson(config.tracksUrl).catch(() => []),
                ]);

                if (!Array.isArray(songs) || !songs.length) {
                    throw new Error('Gauta tuščia arba netinkama duomenų bazė');
                }

                const tracks = Array.isArray(trackLists) ? trackLists : [];

                this.message = 'Įrašoma…';
                await this.importSongs(songs, tracks);

                setTrackTypes(
                    tracks.map(({ name, label, icon }) => ({
                        name,
                        label: label || name,
                        icon: icon || null,
                    })),
                );
                localStorage.setItem('lastInstall', String(Date.now()));

                this.success();
            } catch (error) {
                console.error(error);
                this.status = 'error';
                this.error = error && error.message ? error.message : String(error);
            }
        },

        // Deletes every runtime cache (audio, notes, icons, leftovers of the
        // old app) while keeping the precached app shell intact.
        async clearRuntimeCaches() {
            if (!('caches' in window)) return;
            try {
                const keys = await caches.keys();
                await Promise.all(
                    keys
                        .filter(key => !key.includes('precache'))
                        .map(key => caches.delete(key)),
                );
            } catch (error) {
                console.error('Nepavyko išvalyti podėlio:', error);
            }
        },

        async fetchJson(url) {
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
        },

        async importSongs(songs, trackLists) {
            this.total = songs.length;
            this.current = 0;

            const rows = songs.map(song => {
                const { songId, title, verse, body, copyright, pages } = song;
                const lists = trackLists
                    .filter(
                        type =>
                            Array.isArray(type.tracks) &&
                            type.tracks.includes(songId),
                    )
                    .map(type => type.name);

                return {
                    songId,
                    title,
                    verse,
                    body,
                    copyright,
                    pages: pages || null,
                    favorited: 0,
                    lists,
                };
            });

            // Keep the user's favourites across refreshes
            const favorites = new Set(
                (await db.songs.where('favorited').equals(1).toArray()).map(
                    song => song.songId,
                ),
            );
            rows.forEach(row => {
                if (favorites.has(row.songId)) row.favorited = 1;
            });

            await db.transaction('rw', db.songs, async () => {
                await db.songs.clear();
                const CHUNK = 100;
                for (let i = 0; i < rows.length; i += CHUNK) {
                    await db.songs.bulkAdd(rows.slice(i, i + CHUNK));
                    this.current = Math.min(i + CHUNK, rows.length);
                }
            });
        },

        success() {
            this.status = 'ready';
            setTimeout(() => this.$router.replace('/'), 800);
        },
    },
};
</script>

<style>
.install-message {
    text-align: center;
}
.install-retry {
    max-width: 300px;
}
</style>
