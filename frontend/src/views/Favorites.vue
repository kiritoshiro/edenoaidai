<template>
    <div class="public-page favorites-page">
        <header class="page-header">
            <h1>Išsaugotos giesmės</h1>
            <p>Giesmės, kurias pažymėjote žvaigždute.</p>
        </header>

        <list v-if="songs.length" :songs="songs" />
        <div v-else class="empty-state favorites-empty">
            <div>
                <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
                </svg>
                <h2>Kol kas tuščia</h2>
                <p>Atidarę giesmę paspauskite žvaigždutę – ją rasite čia.</p>
            </div>
        </div>
    </div>
</template>

<script>
import List from '../components/List.vue';

export default {
    name: 'Favorites',
    components: {
        List,
    },
    data() {
        return {
            songs: [],
        };
    },
    created() {
        this.load();
    },
    activated() {
        // Favourites can change while this view is kept alive
        this.load();
    },
    methods: {
        load() {
            this.$songs
                .where({ favorited: 1 })
                .toArray()
                .then(songs => {
                    this.songs = songs;
                })
                .catch(error => console.error(error));
        },
    },
};
</script>

<style lang="scss">
.favorites-empty svg {
    width: 42px;
    height: 42px;
    margin-bottom: 14px;
    fill: none;
    stroke: var(--app-accent-strong);
    stroke-width: 1.5;
    stroke-linejoin: round;
}
</style>
