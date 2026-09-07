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
        <list :songs="songs" />
    </div>
</template>

<script>
import List from '../components/List.vue';
import { compareSongIds } from '../lib/songNumber';

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
