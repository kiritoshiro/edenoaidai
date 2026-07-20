<template>
    <div class="list">
        <router-link
            v-for="song in songs"
            :id="`song-${song.songId}`"
            :key="song.id"
            class="element"
            :to="`/song/${song.songId}`"
        >
            <span class="element__number">{{ song.songId }}</span>

            <p class="element__title">{{ song.title }}</p>

            <div class="icons">
                <song-icon v-for="type in song.lists" :key="type" :name="type" />
            </div>
        </router-link>
    </div>
</template>

<script>
import SongIcon from './SongIcon.vue';

export default {
    name: 'List',
    components: {
        SongIcon,
    },
    props: {
        songs: {
            type: Array,
            required: true,
        },
    },
    watch: {
        songs() {
            this.tryScrollToLast();
        },
    },
    mounted() {
        this.tryScrollToLast();
    },
    activated() {
        this.tryScrollToLast();
    },
    methods: {
        // When returning from a song view, centre the list on that song
        tryScrollToLast() {
            const target = window.__scrollToSong;
            if (!target) return;

            this.$nextTick(() => {
                const element = document.getElementById(`song-${target}`);
                if (element) {
                    element.scrollIntoView({ block: 'center' });
                    window.__scrollToSong = null;
                }
            });
        },
    },
};
</script>

<style lang="scss">
.element {
    display: grid;

    grid-template-columns: auto 1fr auto;
    align-items: center;

    font-size: 16px;
    line-height: 1.5;

    color: var(--app-text);
    text-decoration: none;

    overflow: hidden;
    background-color: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: 14px;
    box-shadow: 0 5px 18px rgba(47, 38, 26, 0.06);

    margin: 10px 0;

    &__number {
        display: flex;

        align-self: stretch;
        align-items: center;

        padding: 0 15px;

        min-width: 32px;
        justify-content: center;
        background-color: var(--app-accent);
        color: #2b2114;
        font-weight: 700;
    }

    &__title {
        display: inline-block;
        text-align: left;

        padding: 10px;
        margin: 0;
    }

    transition: box-shadow ease-in-out 0.2s;

    &:hover {
        background-color: var(--app-hover);
        box-shadow: 0 10px 24px rgba(47, 38, 26, 0.12);
    }
}
.icons {
    display: flex;
    align-items: center;
}
.icon-audio {
    width: 2em;
    height: 2em;
    stroke-width: 0;
    stroke: currentColor;
    fill: currentColor;
    padding-top: 10px;
    padding-bottom: 10px;

    margin: 0;
}
.icon-audio--img {
    object-fit: contain;
    padding-top: 10px;
    padding-bottom: 10px;
}
.icon-audio--letter {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.6em;
    height: 1.6em;
    padding: 0;
    margin: 0 0.2em;
    border-radius: 50%;
    background-color: var(--app-accent);
    color: #2b2114;
    font-size: 14px;
    font-weight: bold;
}
</style>
