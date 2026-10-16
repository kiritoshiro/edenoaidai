<template>
    <div class="public-page home-page">
        <header class="page-header home-page__header">
            <div>
                <h1>Edeno Aidai</h1>
                <p>Pasirinkite giesmę pagal numerį arba pavadinimą.</p>
            </div>
            <button class="update-button" @click="goToInstallPage">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M20 6v5h-5M4 18v-5h5M18.5 9A7 7 0 0 0 6.2 6.2L4 8M5.5 15A7 7 0 0 0 17.8 17.8L20 16" />
                </svg>
                Atnaujinti
            </button>
        </header>

        <search-box v-model="filter" class="home-page__search" />

        <p v-if="activeQuery && results.length" class="home-page__count">
            Rasta: {{ results.length }}
        </p>

        <div v-if="activeQuery && !results.length" class="empty-state">
            <div>
                <h2>Giesmių nerasta</h2>
                <p>Patikrinkite įrašą arba pabandykite trumpesnę frazę.</p>
            </div>
        </div>
        <list v-else :songs="visibleSongs" :search-matches="searchMatches" />
    </div>
</template>

<script>
import List from '../components/List.vue';
import SearchBox from '../components/SearchBox.vue';
import { debounce } from '../lib/debounce.js';
import { compareSongIds } from '../lib/songNumber';
import { createSongSearchResults } from '../lib/songSearch.js';

export default {
    name: 'Home',
    components: {
        List,
        SearchBox,
    },
    data() {
        return {
            songs: [],
            loadedAt: null,
            filter: '',
            activeQuery: '',
        };
    },
    computed: {
        // Every match, ranked like the search page: number, title, lyrics
        results() {
            return this.activeQuery
                ? createSongSearchResults(this.songs, this.activeQuery, 0)
                : [];
        },
        visibleSongs() {
            return this.activeQuery
                ? this.results.map(result => result.song)
                : this.songs;
        },
        searchMatches() {
            return Object.fromEntries(
                this.results.map(result => [String(result.song.songId), result]),
            );
        },
    },
    watch: {
        filter(value) {
            const query = value.trim();
            if (query) {
                this.applyFilter(query);
            } else {
                // Clearing shows the full list straight away
                this.applyFilter.cancel();
                this.activeQuery = '';
            }
        },
    },
    created() {
        this.applyFilter = debounce(query => {
            this.activeQuery = query;
        }, 150);
        this.load();
    },
    activated() {
        // Reload the list if the database was refreshed while this
        // view was kept alive
        if (this.loadedAt !== localStorage.getItem('lastInstall')) {
            this.load();
        }
    },
    methods: {
        load() {
            this.loadedAt = localStorage.getItem('lastInstall');
            this.$songs
                .orderBy('id')
                .toArray()
                .then(songs => {
                    // orderBy('id') alone happens to match hymn-number order
                    // today only because Install.vue bulk-inserts rows in
                    // the order the API returned them in, which is itself
                    // sorted — three unrelated things staying coincidentally
                    // aligned. Sorting explicitly here doesn't depend on any
                    // of that.
                    this.songs = [...songs].sort((a, b) =>
                        compareSongIds(a.songId, b.songId),
                    );
                })
                .catch(error => console.error(error));
        },
        goToInstallPage() {
            this.$router.push({ name: 'install', query: { refresh: '1' } });
        },
    },
};
</script>

<style lang="scss">
.home-page__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
}

.update-button {
    display: inline-flex;
    min-height: 44px;
    flex: 0 0 auto;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
    padding: 0 13px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    color: var(--app-muted);
    background: var(--app-surface);
    box-shadow: var(--app-shadow-small);
    font-weight: 700;
    cursor: pointer;

    svg {
        width: 18px;
        height: 18px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
}

.update-button:hover {
    color: var(--app-text);
    background: var(--app-surface-soft);
}

.home-page__search {
    position: sticky;
    top: 10px;
    z-index: 5;
}

.home-page__count {
    margin: -5px 4px 12px;
    color: var(--app-muted);
    font-size: 13px;
}

@media (max-width: 560px) {
    .home-page__header {
        align-items: stretch;
        flex-direction: column;
        gap: 13px;
    }

    .update-button {
        align-self: flex-start;
        margin-top: 0;
    }
}
</style>
