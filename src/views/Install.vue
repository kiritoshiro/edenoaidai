<template>
    <div v-if="status === 'ready'" :class="'install-message'">Paruošta!</div>
    <div v-else :class="'install-message'">
        {{ message }}
        {{ progress }}
    </div>
</template>

<script>
import { appConfig } from '../config';
import { reportError } from '../helpers/reportError';

const FETCH_TIMEOUT_MS = 15000;
const MAX_RESPONSE_CHARACTERS = 5_000_000;
const MAX_SONGS = 1000;
const MAX_TRACK_LISTS = 10;
const SONG_ID_PATTERN = /^\d{1,3}(?: A)?$/u;
const TRACK_NAMES = new Set(['piano', 'piano&violin', 'synthesizer', 'vocal']);

function requiredString(value, field, maxLength) {
    if (typeof value !== 'string') {
        throw new Error(`Neteisingas laukas „${field}“.`);
    }

    const normalized = value.trim();
    if (!normalized || normalized.length > maxLength) {
        throw new Error(`Neteisingas lauko „${field}“ ilgis.`);
    }

    return normalized;
}

function optionalString(value, field, maxLength) {
    if (value == null) {
        return '';
    }
    if (typeof value !== 'string' || value.length > maxLength) {
        throw new Error(`Neteisingas laukas „${field}“.`);
    }
    return value;
}

function normalizeSongs(payload) {
    if (!Array.isArray(payload) || payload.length === 0 || payload.length > MAX_SONGS) {
        throw new Error('Giesmių duomenų formatas neteisingas.');
    }

    const seenSongIds = new Set();
    return payload.map((song, index) => {
        if (!song || typeof song !== 'object' || Array.isArray(song)) {
            throw new Error(`Neteisingas giesmės įrašas Nr. ${index + 1}.`);
        }

        const songId = String(song.songId ?? '').trim();
        if (!SONG_ID_PATTERN.test(songId) || seenSongIds.has(songId)) {
            throw new Error(`Neteisingas arba pasikartojantis giesmės numeris „${songId}“.`);
        }
        seenSongIds.add(songId);

        return {
            songId,
            title: requiredString(song.title, 'title', 300),
            verse: optionalString(song.verse, 'verse', 2000),
            body: requiredString(song.body, 'body', 100_000),
            copyright: optionalString(song.copyright, 'copyright', 10_000),
        };
    });
}

function normalizeTrackLists(payload) {
    if (!Array.isArray(payload) || payload.length > MAX_TRACK_LISTS) {
        throw new Error('Garso įrašų duomenų formatas neteisingas.');
    }

    return payload.map((trackList, index) => {
        if (
            !trackList ||
            typeof trackList !== 'object' ||
            !TRACK_NAMES.has(trackList.name) ||
            !Array.isArray(trackList.tracks) ||
            trackList.tracks.length > MAX_SONGS
        ) {
            throw new Error(`Neteisingas garso įrašų sąrašas Nr. ${index + 1}.`);
        }

        const tracks = new Set(
            trackList.tracks.map(songId => {
                const normalized = String(songId).trim();
                if (!SONG_ID_PATTERN.test(normalized)) {
                    throw new Error(`Neteisingas garso įrašo numeris „${normalized}“.`);
                }
                return normalized;
            }),
        );

        return {
            name: trackList.name,
            tracks,
        };
    });
}

export default {
    data() {
        return {
            message: 'Ruošiama',
            status: '',
            total: 0,
            current: 0,
        };
    },
    computed: {
        progress() {
            return `${this.current}/${this.total}`;
        },
    },

    async beforeMount() {
        try {
            await this.fetchAndStoreData();
        } catch (error) {
            this.message = `Įvyko klaida: ${error.message}`;
            reportError(error);
        }
    },

    methods: {
        async fetchAndStoreData() {
            const [rawSongs, rawTracks] = await Promise.all([
                this.fetchData(appConfig.songsUrl),
                this.fetchData(appConfig.tracksUrl),
            ]);
            const songs = normalizeSongs(rawSongs);
            const tracks = normalizeTrackLists(rawTracks);

            await this.importSongs(songs, tracks);
            this.success();
        },

        /**
         * Fetches songs from JSON API
         *
         */

        async fetchData(url) {
            if (!url) {
                throw new Error('Trūksta duomenų šaltinio adreso.');
            }

            const requestUrl = new URL(url, window.location.origin);
            const isAllowedProtocol =
                requestUrl.protocol === 'https:' ||
                requestUrl.origin === window.location.origin ||
                (import.meta.env.DEV && requestUrl.protocol === 'http:');
            if (!isAllowedProtocol) {
                throw new Error('Duomenų šaltinis privalo naudoti HTTPS.');
            }
            requestUrl.searchParams.set('_', Date.now().toString());

            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

            try {
                const response = await fetch(requestUrl, {
                    cache: 'no-store',
                    headers: {
                        Accept: 'application/json',
                    },
                    signal: controller.signal,
                });
                if (!response.ok) {
                    throw new Error(`Duomenų šaltinis grąžino HTTP ${response.status}.`);
                }

                const contentType = response.headers.get('content-type') || '';
                if (!contentType.toLowerCase().includes('json')) {
                    throw new Error('Duomenų šaltinis grąžino ne JSON turinį.');
                }

                const responseText = await response.text();
                if (responseText.length > MAX_RESPONSE_CHARACTERS) {
                    throw new Error('Duomenų failas yra per didelis.');
                }

                return JSON.parse(responseText);
            } catch (error) {
                if (error.name === 'AbortError') {
                    throw new Error('Duomenų užklausa truko per ilgai.', {
                        cause: error,
                    });
                }
                throw error;
            } finally {
                window.clearTimeout(timeoutId);
            }
        },

        /**
         * Load songs from array into browser database using Dexie API
         *
         * @param {Dexie} table Database table
         * @param {array} songs Array of songs
         * @param {array} tracks Array of tracks
         */
        async importSongs(songs, tracks) {
            this.total = songs.length;
            this.current = 0;

            const favorites = new Set(
                (await this.$songs.where('favorited').equals(1).toArray()).map(
                    song => song.songId,
                ),
            );
            const songObjects = songs.map(song => ({
                ...song,
                favorited: favorites.has(song.songId) ? 1 : 0,
                lists: tracks
                    .filter(trackList => trackList.tracks.has(song.songId))
                    .map(trackList => trackList.name),
            }));

            await this.$songs.db.transaction('rw', this.$songs, async () => {
                await this.$songs.clear();
                await this.$songs.bulkPut(songObjects);
            });

            this.current = this.total;
        },

        success() {
            this.status = 'ready';
            localStorage.setItem('dbVersion', appConfig.cacheVersion);
            localStorage.removeItem('databaseUpdated');
            setTimeout(() => this.$router.push('/'), 1000);
        },
    },
};
</script>

<style>
.install-message {
    text-align: center;
}
</style>
