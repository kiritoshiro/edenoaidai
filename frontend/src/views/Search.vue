<template>
    <div class="public-page search-page">
        <header class="page-header">
            <h1>Paieška</h1>
            <p>Ieškokite pagal giesmės numerį, pavadinimą arba žodžius.</p>
        </header>

        <div class="search-box">
            <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
            </svg>
            <input
                type="text"
                placeholder="Giesmės numeris, pavadinimas ar žodžiai"
                :value="query"
                aria-label="Ieškoti giesmės"
                @input="onInput"
            />
        </div>

        <p v-if="query && songs.length" class="search-page__count">
            Rasta: {{ songs.length }}
        </p>
        <list v-if="songs.length" :songs="songs" />

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

// Lithuanian diacritics folded to their base letters for search
const LT_MAP = {
    ą: 'a',
    č: 'c',
    ę: 'e',
    ė: 'e',
    į: 'i',
    š: 's',
    ų: 'u',
    ū: 'u',
    ž: 'z',
};

function fold(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[ąčęėįšųūž]/g, ch => LT_MAP[ch])
        .replace(/[!–—,.:;?"'()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function debounce(fn, wait) {
    let timeout;
    return function debounced(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
    };
}

export default {
    name: 'Search',
    components: {
        List,
    },
    props: {
        query: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            songs: [],
        };
    },
    watch: {
        $route() {
            this.searchSongs();
        },
    },
    created() {
        this.updateSearchUri = debounce(this.updateSearchUri, 300);
        this.searchSongs();
    },
    methods: {
        onInput({ target: { value } }) {
            this.updateSearchUri(value.trim());
        },
        updateSearchUri(query) {
            const location = query
                ? { name: 'search', params: { query } }
                : { name: 'search' };

            // Replace while typing so history is not spammed per keystroke
            if (this.$route.name === 'search') {
                this.$router.replace(location);
            } else {
                this.$router.push(location);
            }
        },
        searchSongs() {
            const search = (this.query || '').trim();
            if (!search) {
                this.songs = [];
                return;
            }

            // Numeric query – search by song number
            if (Number.isInteger(Number(search))) {
                this.$songs
                    .where('songId')
                    .startsWith(search)
                    .limit(100)
                    .toArray()
                    .then(songs => {
                        this.songs = songs || [];
                    })
                    .catch(error => console.error(error));
                return;
            }

            // Text query – search title and body, diacritics-insensitive
            const needle = fold(search);
            this.$songs
                .filter(song => {
                    const title = Array.isArray(song.title)
                        ? song.title.join(' ')
                        : song.title;
                    return (
                        fold(song.body).includes(needle) ||
                        fold(title).includes(needle)
                    );
                })
                .limit(300)
                .toArray()
                .then(songs => {
                    this.songs = songs || [];
                })
                .catch(error => console.error(error));
        },
    },
};
</script>

<style lang="scss">
.search-box {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    min-height: 58px;
    margin-bottom: 18px;
    padding: 0 16px;
    border: 1px solid var(--app-border);
    border-radius: 17px;
    color: var(--app-muted);
    background: var(--app-surface);
    box-shadow: var(--app-shadow-small);

    &:focus-within {
        border-color: var(--app-accent);
        box-shadow: 0 0 0 3px var(--app-accent-soft);
    }

    svg {
        width: 22px;
        height: 22px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    input {
        width: 100%;
        min-height: 56px;
        padding: 0;
        border: 0;
        outline: 0;
        color: var(--app-text);
        background: transparent;
        font-size: 16px;

        &::placeholder {
            color: var(--app-muted);
        }
    }
}

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
</style>
