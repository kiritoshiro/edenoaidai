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
.list {
    display: grid;
    gap: 10px;
}

.element {
    display: grid;
    grid-template-columns: 58px minmax(0, 1fr) auto;
    align-items: center;
    min-height: 66px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 16px;
    color: var(--app-text);
    background: var(--app-surface);
    box-shadow: var(--app-shadow-small);
    font-size: 16px;
    line-height: 1.45;
    text-decoration: none;
    transition: border-color 0.18s ease, box-shadow 0.18s ease,
        transform 0.18s ease;

    &__number {
        display: inline-flex;
        min-width: 42px;
        min-height: 42px;
        align-items: center;
        justify-content: center;
        justify-self: center;
        padding: 4px 7px;
        border-radius: 12px;
        color: var(--app-accent-strong);
        background: var(--app-accent-soft);
        font-size: 15px;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
    }

    &__title {
        min-width: 0;
        padding: 12px 8px 12px 2px;
        margin: 0;
        font-weight: 650;
    }

    &:hover {
        border-color: color-mix(in srgb, var(--app-accent) 45%, transparent);
        background: var(--app-surface);
        box-shadow: 0 10px 26px rgba(47, 38, 26, 0.12);
        transform: translateY(-1px);
    }
}

.icons {
    display: flex;
    align-items: center;
    gap: 3px;
    padding-right: 12px;
}

.icon-audio {
    width: 27px;
    height: 27px;
    stroke-width: 0;
    stroke: currentColor;
    fill: currentColor;
    margin: 0;
}

.icon-audio--img {
    width: 27px;
    height: 27px;
    object-fit: contain;
}

.icon-audio--letter {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 27px;
    height: 27px;
    padding: 0;
    margin: 0;
    border-radius: 50%;
    color: var(--app-accent-strong);
    background: var(--app-accent-soft);
    font-size: 12px;
    font-weight: bold;
}

@media (max-width: 480px) {
    .element {
        grid-template-columns: 52px minmax(0, 1fr) auto;
        min-height: 62px;
        border-radius: 14px;

        &__number {
            min-width: 38px;
            min-height: 38px;
            font-size: 14px;
        }

        &__title {
            padding-top: 10px;
            padding-bottom: 10px;
            font-size: 15px;
        }
    }

    .icons {
        gap: 1px;
        padding-right: 8px;
    }

    .icon-audio,
    .icon-audio--img,
    .icon-audio--letter {
        width: 24px;
        height: 24px;
    }
}
</style>
