<template>
    <div class="form">
        <div class="input-container">
            <input
                type="search"
                maxlength="100"
                placeholder="Rašykite čia..."
                :value="query || ''"
                @input="parseSearch"
            >
        </div>
        <list :songs="songs"/>
    </div>
</template>

<script>
    import List from '../components/List.vue';
    import { reportError } from '../helpers/reportError';

    export default {
        components: {
            List,
        },
        props: {
            query: {
                type: String,
                default: null,
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
            this.parseSearch = this.debounce(this.parseSearch, 150);
            this.searchSongs();
        },
        methods: {
            debounce(func, wait, immediate = false) {
                let timeout;
                return function debounced(...args) {
                    const context = this;

                    const later = () => {
                        timeout = null;
                        if (!immediate) func.apply(context, args);
                    };

                    const callNow = immediate && !timeout;

                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) func.apply(context, args);
                };
            },
            parseSearch({ target: { value } }) {
                const query = value.trim().slice(0, 100);
                if (!query) {
                    this.songs = [];
                    this.$router.replace({ name: 'search' });
                    return;
                }
                this.updateSearchUri(query);
            },
            updateSearchUri(query) {
                this.$router.replace({
                    name: 'search',
                    params: { query },
                });
            },
            searchSongs() {
                const search = this.query?.trim().slice(0, 100);
                if (!!search === false) return;

                if (Number.isInteger(Number(search))) {
                    this.$songs
                        .where('songId')
                        .startsWith(search)
                        .limit(100)
                        .toArray()
                        .then(songs => {
                            this.songs = songs || [];
                        })
                        .catch(reportError);
                    return;
                }
                this.$songs
                    .filter(song =>
                        song.body.toLowerCase()
                            .replace(/[!–,.:]/g, '')
                            .replace('  ',' ')
                            .replace(/[ąęėįšųūž]/g, x => ({'ą':'a', 'ę':'e', 'ė':'e','į':'i', 'š':'s', 'ų':'u', 'ū':'u', 'ž':'z',}[x]))
                            .includes(search.toLowerCase()
                                .replace(/[!–,.:]/g, '')
                                .replace(/[ąęėįšųūž]/g, x => ({'ą':'a', 'ę':'e', 'ė':'e','į':'i', 'š':'s', 'ų':'u', 'ū':'u', 'ž':'z',}[x]))),

                    )
                    .limit(300)
                    .toArray()
                    .then(songs => {
                        this.songs = songs || [];
                    })
                    .catch(reportError);
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
