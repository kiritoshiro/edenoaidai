<template>
    <list v-if="songs.length" :songs="songs" />
    <h2 v-else class="favorites-empty">
        Tuščia. Pridėkite prie mėgstamų paspausdami žvaigždutę
    </h2>
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

<style>
.favorites-empty {
    text-align: center;
}
</style>
