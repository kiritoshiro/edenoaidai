<template>
    <div>
        <button class="update-button" @click="goToInstallPage">
            Atnaujinti duomenis
        </button>
        <list :songs="songs" />
    </div>
</template>

<script>
import List from '../components/List.vue';

export default {
    name: 'Home',
    components: {
        List,
    },
    data() {
        return {
            songs: [],
            loadedAt: null,
        };
    },
    created() {
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
                    this.songs = songs;
                })
                .catch(error => console.error(error));
        },
        goToInstallPage() {
            this.$router.push({ name: 'install', query: { refresh: '1' } });
        },
    },
};
</script>

<style>
.update-button {
    display: block;
    width: 100%;
    margin: 0 auto 10px;
    padding: 10px 20px;
    font-size: 16px;
    background-color: var(--app-accent);
    color: #2b2114;
    border: 1px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    box-shadow: 2px 5px 10px 0 rgba(0, 0, 0, 0.1);
    text-decoration: none;
    text-align: center;
    transition: box-shadow ease-in-out 0.2s;
}
.update-button:hover {
    background-color: var(--app-accent-soft);
    color: var(--app-text);
    box-shadow: 2px 5px 10px 0 rgba(0, 0, 0, 0.3);
}
</style>
