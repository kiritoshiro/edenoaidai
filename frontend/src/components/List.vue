<template>
    <div class="list">
        <article
            v-for="song in songs"
            :id="`song-${song.songId}`"
            :key="song.id"
            class="element"
        >
            <router-link class="element__main" :to="`/song/${song.songId}`">
                <span class="element__number">
                    <template
                        v-for="(segment, index) in numberSegments(song)"
                        :key="`number-${index}`"
                    >
                        <mark v-if="segment.highlighted">{{ segment.text }}</mark>
                        <span v-else>{{ segment.text }}</span>
                    </template>
                </span>

                <div class="element__copy">
                    <p class="element__title">
                        <template
                            v-for="(segment, index) in titleSegments(song)"
                            :key="`title-${index}`"
                        >
                            <mark v-if="segment.highlighted">{{ segment.text }}</mark>
                            <span v-else>{{ segment.text }}</span>
                        </template>
                    </p>
                    <p
                        v-if="excerptSegments(song).length"
                        class="element__excerpt"
                    >
                        <template
                            v-for="(segment, index) in excerptSegments(song)"
                            :key="`excerpt-${index}`"
                        >
                            <mark v-if="segment.highlighted">{{ segment.text }}</mark>
                            <span v-else>{{ segment.text }}</span>
                        </template>
                    </p>
                </div>
            </router-link>

            <div class="icons">
                <router-link
                    v-for="type in song.lists"
                    :key="type"
                    class="icons__choice"
                    :to="{
                        name: 'single',
                        params: { songId: song.songId },
                        query: { audio: type },
                    }"
                    :aria-label="`Atidaryti giesmę ${song.songId} su įrašu ${type}`"
                    :title="`Atidaryti su įrašu: ${type}`"
                >
                    <song-icon :name="type" />
                </router-link>
            </div>
        </article>
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
        searchMatches: {
            type: Object,
            default: () => ({}),
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
        matchFor(song) {
            return this.searchMatches[String(song?.songId || '')] || null;
        },
        numberSegments(song) {
            const segments = this.matchFor(song)?.numberSegments;
            return Array.isArray(segments) && segments.length
                ? segments
                : [{ text: String(song?.songId || ''), highlighted: false }];
        },
        titleSegments(song) {
            const segments = this.matchFor(song)?.titleSegments;
            const title = Array.isArray(song?.title)
                ? song.title.filter(Boolean).join(' ')
                : String(song?.title || '');
            return Array.isArray(segments) && segments.length
                ? segments
                : [{ text: title, highlighted: false }];
        },
        excerptSegments(song) {
            const segments = this.matchFor(song)?.excerptSegments;
            return Array.isArray(segments) ? segments : [];
        },
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
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    min-height: 66px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 16px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-small);
    font-size: 16px;
    line-height: 1.45;
    transition: border-color 0.18s ease, box-shadow 0.18s ease,
        transform 0.18s ease;

    &__main {
        display: grid;
        grid-template-columns: 58px minmax(0, 1fr);
        align-items: center;
        align-self: stretch;
        color: var(--app-text);
        text-decoration: none;
    }

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

    &__copy {
        min-width: 0;
        padding: 12px 8px 12px 2px;
    }

    &__title {
        min-width: 0;
        margin: 0;
        font-weight: 650;
    }

    &__excerpt {
        margin: 4px 0 0;
        color: var(--app-muted);
        font-size: 13px;
        line-height: 1.45;
    }

    mark {
        padding: 0 0.08em;
        border-radius: 3px;
        color: inherit;
        background: color-mix(in srgb, var(--app-accent) 34%, transparent);
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
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

    &__choice {
        display: grid;
        width: 36px;
        height: 36px;
        place-items: center;
        border-radius: 10px;
        color: var(--app-text);
        text-decoration: none;

        &:hover {
            color: var(--app-accent-strong);
            background: var(--app-accent-soft);
        }
    }
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
        grid-template-columns: minmax(0, 1fr) auto;
        min-height: 62px;
        border-radius: 14px;

        &__main {
            grid-template-columns: 52px minmax(0, 1fr);
        }

        &__number {
            min-width: 38px;
            min-height: 38px;
            font-size: 14px;
        }

        &__copy {
            padding-top: 10px;
            padding-bottom: 10px;
        }

        &__title {
            font-size: 15px;
        }

        &__excerpt {
            font-size: 12px;
        }
    }

    .icons {
        gap: 1px;
        padding-right: 8px;

        &__choice {
            width: 34px;
            height: 34px;
        }
    }

    .icon-audio,
    .icon-audio--img,
    .icon-audio--letter {
        width: 24px;
        height: 24px;
    }
}
</style>
