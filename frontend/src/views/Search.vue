<template>
    <div class="public-page search-page">
        <header class="page-header">
            <h1>Paieška</h1>
            <p>Ieškokite pagal giesmės numerį, pavadinimą arba žodžius.</p>
        </header>

        <search-box :model-value="query" @update:model-value="onInput" />

        <p v-if="query && results.length" class="search-page__count">
            Rasta: {{ results.length }}
        </p>

        <div v-if="results.length" class="search-results">
            <template v-for="group in resultGroups" :key="group.type">
                <section
                    v-if="group.songs.length"
                    class="search-results__group"
                    :aria-labelledby="`search-results-${group.type}`"
                >
                    <h2
                        :id="`search-results-${group.type}`"
                        class="search-results__heading"
                    >
                        {{ group.label }}
                        <span>{{ group.songs.length }}</span>
                    </h2>
                    <list
                        :songs="group.songs"
                        :search-matches="searchMatches"
                    />
                </section>
            </template>
        </div>

        <div v-else-if="query" class="empty-state">
            <div>
                <h2>Giesmių nerasta</h2>
                <p>Patikrinkite įrašą arba pabandykite trumpesnę frazę.</p>
            </div>
        </div>

        <div v-else class="search-page__hint">
            <span aria-hidden="true">⌕</span>
            <p>Pradėkite rašyti – rezultatai pasirodys čia.</p>
        </div>
    </div>
</template>

<script>
import List from '../components/List.vue';
import SearchBox from '../components/SearchBox.vue';
import { debounce } from '../lib/debounce.js';
import { createSongSearchResults } from '../lib/songSearch.js';

export default {
    name: 'Search',
    components: {
        List,
        SearchBox,
    },
    props: {
        query: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            results: [],
            searchRequestId: 0,
        };
    },
    computed: {
        resultGroups() {
            const groups = [
                { type: 'number', label: 'Pagal numerį' },
                { type: 'title', label: 'Pagal pavadinimą' },
                { type: 'content', label: 'Giesmės žodžiuose' },
            ];

            return groups.map(group => ({
                ...group,
                songs: this.results
                    .filter(result => result.matchType === group.type)
                    .map(result => result.song),
            }));
        },
        searchMatches() {
            return Object.fromEntries(
                this.results.map(result => [String(result.song.songId), result]),
            );
        },
    },
    watch: {
        // The prop only follows the search route, so opening a song from
        // the results no longer re-runs the whole search in the background.
        query() {
            this.searchSongs();
        },
    },
    created() {
        this.updateSearchUri = debounce(this.updateSearchUri, 300);
        this.searchSongs();
    },
    deactivated() {
        // A keystroke just before leaving must not pull the user back here
        this.updateSearchUri.cancel();
    },
    methods: {
        onInput(value) {
            this.updateSearchUri(value.trim());
        },
        updateSearchUri(query) {
            if (this.$route.name !== 'search') return;

            // Replace while typing so history is not spammed per keystroke
            this.$router.replace(
                query ? { name: 'search', params: { query } } : { name: 'search' },
            );
        },
        searchSongs() {
            const search = (this.query || '').trim();
            const requestId = ++this.searchRequestId;
            if (!search) {
                this.results = [];
                return;
            }

            this.$songs
                .toArray()
                .then(songs => {
                    if (requestId !== this.searchRequestId) return;
                    this.results = createSongSearchResults(
                        songs || [],
                        search,
                        300,
                    );
                })
                .catch(error => {
                    if (requestId === this.searchRequestId) this.results = [];
                    console.error(error);
                });
        },
    },
};
</script>

<style lang="scss">
.search-page {
    &__count {
        margin: -5px 4px 12px;
        color: var(--app-muted);
        font-size: 13px;
    }

    &__hint {
        display: grid;
        min-height: 190px;
        place-items: center;
        padding: 24px;
        color: var(--app-muted);
        text-align: center;

        span {
            display: block;
            margin-bottom: 8px;
            color: var(--app-accent-strong);
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 42px;
        }

        p {
            margin: 0;
        }
    }
}

.search-results {
    display: grid;
    gap: 22px;

    &__group {
        min-width: 0;
    }

    &__heading {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 4px 9px;
        color: var(--app-text);
        font-size: 15px;
        font-weight: 750;

        span {
            display: inline-flex;
            min-width: 24px;
            height: 24px;
            align-items: center;
            justify-content: center;
            padding: 0 7px;
            border-radius: 999px;
            color: var(--app-accent-strong);
            background: var(--app-accent-soft);
            font-size: 12px;
            font-variant-numeric: tabular-nums;
        }
    }
}
</style>
