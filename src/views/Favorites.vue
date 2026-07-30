<template>
    <List v-if="songs.length" :songs="songs" />
    <h2 v-else class="empty-message">
        Tuščia. Pridėkite prie mėgstamų paspausdami žvaigždutę
    </h2>
</template>

<script>
import List from '../components/List.vue';
import { reportError } from '../helpers/reportError';

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
        this.$songs
            .where({ favorited: 1 })
            .toArray()
            .then(songs => {
                this.songs = songs;
            })
            .catch(reportError);
    },
};
</script>

<style scoped>
.empty-message {
    text-align: center;
}
</style>
