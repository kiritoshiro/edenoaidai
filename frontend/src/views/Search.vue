<template>
    <div class="form">
        <div class="input-container">
            <input
                type="text"
                placeholder="Rašykite čia..."
                :value="query"
                @input="onInput"
            />
        </div>
        <list :songs="songs" />
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
.form {
    display: grid;

    margin: 0 10px;

    grid-gap: 20px;
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;

    .input-container {
        display: grid;

        grid-gap: 5px;
        grid-auto-flow: row;

        font-size: 16px;

        input {
            width: 100%;

            box-sizing: border-box;
            border-radius: 10px;

            padding: 10px;

            border: 1px solid rgba(0, 0, 0, 0.01);
            box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.1);
        }
    }
}
</style>
