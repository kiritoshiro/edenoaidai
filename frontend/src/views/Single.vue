<!-- eslint-disable vue/no-v-html -->
<template>
    <div v-if="song" class="song">
        <h2 class="song__title">{{ song.songId }} {{ song.title }}</h2>
        <div class="song__buttons">
            <button
                class="song__navigation-button"
                :disabled="!previousSongId"
                @click="goTo(previousSongId)"
            >
                {{ previousSongId }} ←
            </button>

            <button class="song__font-size-button" @click="adjustFontSize(1)">
                Aa++
            </button>
            <button class="song__font-size-button" @click="adjustFontSize(-1)">
                Aa--
            </button>

            <button
                v-if="slideshowSlides.length"
                class="song__slideshow-button"
                @click="openSlideshow"
            >
                Skaidrės
            </button>

            <button
                class="song__favorite-button"
                :title="song.favorited ? 'Išsaugota' : 'Pamėgti'"
                @click="toggleFavorite"
            >
                <svg class="icon">
                    <use v-if="song.favorited" href="#icon-star-full"></use>
                    <use v-else href="#icon-star-empty"></use>
                </svg>
            </button>

            <button
                class="song__navigation-button"
                :disabled="!nextSongId"
                @click="goTo(nextSongId)"
            >
                → {{ nextSongId }}
            </button>
        </div>
        <p class="song__verse">
            <em>{{ song.verse }}</em>
        </p>

        <div v-for="type in song.lists" :key="type" class="audio-container">
            <div class="audio-icon">
                <song-icon :name="type" />
            </div>
            <div class="audio-player">
                <audio
                    :key="`${type}-${song.songId}`"
                    preload="metadata"
                    controls
                >
                    <source :src="audioUrl(type)" type="audio/mpeg" />
                    Naršyklė nepalaiko audio elementų.
                </audio>
            </div>
        </div>

        <div style="text-align: center; margin-top: 20px">
            <div
                class="song__body"
                :style="fontSizeStyle"
                v-html="song.body"
            ></div>
        </div>

        <div class="image-format-container" style="margin-top: 20px">
            <button
                :class="[
                    'song__font-size-button',
                    'image-format-button',
                    { selected: imageType === 'svg' },
                ]"
                @click="imageType = 'svg'"
            >
                Natos 1#
            </button>
            <button
                :class="[
                    'song__font-size-button',
                    'image-format-button',
                    { selected: imageType === 'jpg' },
                ]"
                @click="imageType = 'jpg'"
            >
                Natos 2#
            </button>
        </div>

        <div class="song-image">
            <div v-for="(url, index) in imageUrls" :key="url">
                <div v-if="!imageLoaded[index]" class="image-loader"></div>
                <img
                    v-if="!imageErrored[index]"
                    v-show="imageLoaded[index]"
                    :src="url"
                    alt=""
                    @load="imageLoaded[index] = true"
                    @error="onImageError(index)"
                />
            </div>
        </div>

        <small class="song__copyright" v-html="song.copyright"></small>
    </div>

    <Teleport to="body">
        <div
            v-if="slideshowOpen"
            ref="slideshow"
            class="lyrics-show"
            role="dialog"
            aria-modal="true"
            aria-label="Giesmės skaidrės"
        >
            <button
                class="lyrics-show__click-zone lyrics-show__click-zone--left"
                :disabled="slideshowIndex === 0"
                tabindex="-1"
                aria-label="Ankstesnė skaidrė"
                @click="previousSlide"
            ></button>
            <button
                class="lyrics-show__click-zone lyrics-show__click-zone--right"
                :disabled="slideshowIndex === slideshowSlides.length - 1"
                tabindex="-1"
                aria-label="Kita skaidrė"
                @click="nextSlide"
            ></button>

            <button
                class="lyrics-show__close"
                aria-label="Uždaryti skaidres"
                title="Uždaryti (Esc)"
                @click.stop="closeSlideshow"
            >
                ×
            </button>

            <header class="lyrics-show__header">
                <span>{{ song.songId }} {{ song.title }}</span>
                <strong v-if="currentSlide?.isChorus">Priedainis</strong>
            </header>

            <main class="lyrics-show__content">{{ currentSlideText }}</main>

            <footer class="lyrics-show__controls" @click.stop>
                <button
                    :disabled="slideshowIndex === 0"
                    aria-label="Ankstesnė skaidrė"
                    @click="previousSlide"
                >
                    ←
                </button>
                <span>{{ slideshowIndex + 1 }} / {{ slideshowSlides.length }}</span>
                <button
                    :disabled="slideshowIndex === slideshowSlides.length - 1"
                    aria-label="Kita skaidrė"
                    @click="nextSlide"
                >
                    →
                </button>
            </footer>
        </div>
    </Teleport>
</template>

<script>
import { config } from '../lib/config';
import SongIcon from '../components/SongIcon.vue';

function slidesFromBody(body) {
    const text = String(body || '')
        .replace(/\r\n?/g, '\n')
        .replace(/<br\s*\/?>\n?/gi, '\n');
    const blocks = text
        .split(/\n\s*\n+/)
        .map(value => value.trim())
        .filter(Boolean);
    return blocks.map(value => ({
        text: value,
        isChorus: false,
        chorusAfter: false,
    }));
}

export default {
    name: 'Single',
    components: {
        SongIcon,
    },
    props: {
        songId: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            song: null,
            songIds: [],
            imageType: 'jpg',
            imageLoaded: [],
            imageErrored: [],
            fontSize: parseInt(localStorage.getItem('fontSize'), 10) || 24,
            slideshowOpen: false,
            slideshowIndex: 0,
            fullscreenActive: false,
            previousBodyOverflow: '',
        };
    },
    computed: {
        fontSizeStyle() {
            return { fontSize: `${this.fontSize}px` };
        },
        notePageIndexes() {
            const detected = this.song?.notePages?.[this.imageType];
            if (Array.isArray(detected)) {
                return detected;
            }

            // Compatibility with data cached by older installed versions.
            const legacyCount = (this.song && Number(this.song.pages)) || 0;
            return Array.from({ length: legacyCount }, (_, index) => index);
        },
        imageUrls() {
            if (!this.song) return [];
            const base = `${config.notesBase}/${this.imageType}/${this.song.songId}`;
            return this.notePageIndexes.map(page =>
                page === 0
                    ? `${base}.${this.imageType}`
                    : `${base}_${page}.${this.imageType}`,
            );
        },
        currentIndex() {
            return this.song ? this.songIds.indexOf(this.song.songId) : -1;
        },
        previousSongId() {
            return this.currentIndex > 0
                ? this.songIds[this.currentIndex - 1]
                : '';
        },
        nextSongId() {
            return this.currentIndex >= 0 &&
                this.currentIndex < this.songIds.length - 1
                ? this.songIds[this.currentIndex + 1]
                : '';
        },
        sourceSlides() {
            if (!this.song) return [];
            const saved = Array.isArray(this.song.slides)
                ? this.song.slides
                      .filter(slide => slide && String(slide.text || '').trim() !== '')
                      .map(slide => ({
                          text: String(slide.text).trim(),
                          isChorus: slide.isChorus === true,
                          chorusAfter:
                              slide.isChorus === true
                                  ? false
                                  : slide.chorusAfter !== false,
                      }))
                : [];
            return saved.length > 0 ? saved : slidesFromBody(this.song.body);
        },
        slideshowSlides() {
            const choruses = this.sourceSlides.filter(slide => slide.isChorus);
            const verses = this.sourceSlides.filter(slide => !slide.isChorus);
            if (verses.length === 0) return choruses;

            const sequence = [];
            verses.forEach(verse => {
                sequence.push(verse);
                if (choruses.length > 0 && verse.chorusAfter !== false) {
                    sequence.push(...choruses.map(chorus => ({ ...chorus })));
                }
            });
            return sequence;
        },
        currentSlide() {
            return this.slideshowSlides[this.slideshowIndex] || null;
        },
        currentSlideText() {
            return String(this.currentSlide?.text || '').replace(/\r\n?/g, '\n');
        },
    },
    watch: {
        songId() {
            this.closeSlideshow();
            this.fetchSong();
        },
        imageUrls() {
            this.resetImages();
        },
        fontSize(value) {
            localStorage.setItem('fontSize', String(value));
        },
    },
    created() {
        this.fetchSongIds();
        this.fetchSong();
    },
    mounted() {
        document.addEventListener('keydown', this.onSlideshowKeydown);
        document.addEventListener('fullscreenchange', this.onFullscreenChange);
    },
    beforeUnmount() {
        document.removeEventListener('keydown', this.onSlideshowKeydown);
        document.removeEventListener('fullscreenchange', this.onFullscreenChange);
        this.closeSlideshow();
    },
    methods: {
        openSlideshow() {
            if (this.slideshowSlides.length === 0) return;
            this.slideshowIndex = 0;
            this.previousBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            this.slideshowOpen = true;
            this.$nextTick(() => {
                const element = this.$refs.slideshow;
                if (!element?.requestFullscreen) return;
                element
                    .requestFullscreen()
                    .then(() => {
                        this.fullscreenActive = true;
                    })
                    .catch(() => {
                        this.fullscreenActive = false;
                    });
            });
        },
        closeSlideshow() {
            if (!this.slideshowOpen && !this.fullscreenActive) return;
            this.slideshowOpen = false;
            document.body.style.overflow = this.previousBodyOverflow;
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
            this.fullscreenActive = false;
        },
        previousSlide() {
            this.slideshowIndex = Math.max(0, this.slideshowIndex - 1);
        },
        nextSlide() {
            this.slideshowIndex = Math.min(
                this.slideshowSlides.length - 1,
                this.slideshowIndex + 1,
            );
        },
        onSlideshowKeydown(event) {
            if (!this.slideshowOpen) return;
            if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
                event.preventDefault();
                this.nextSlide();
            } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
                event.preventDefault();
                this.previousSlide();
            } else if (event.key === 'Home') {
                event.preventDefault();
                this.slideshowIndex = 0;
            } else if (event.key === 'End') {
                event.preventDefault();
                this.slideshowIndex = this.slideshowSlides.length - 1;
            } else if (event.key === 'Escape') {
                this.closeSlideshow();
            }
        },
        onFullscreenChange() {
            if (
                this.slideshowOpen &&
                this.fullscreenActive &&
                !document.fullscreenElement
            ) {
                this.slideshowOpen = false;
                this.fullscreenActive = false;
                document.body.style.overflow = this.previousBodyOverflow;
            }
        },
        resetImages() {
            this.imageLoaded = this.imageUrls.map(() => false);
            this.imageErrored = this.imageUrls.map(() => false);
        },
        onImageError(index) {
            this.imageLoaded[index] = true;
            this.imageErrored[index] = true;
        },
        audioUrl(type) {
            return `${config.audioBase}/${type}/${this.song.songId}.mp3`;
        },
        fetchSongIds() {
            this.$songs
                .orderBy('id')
                .toArray()
                .then(songs => {
                    this.songIds = songs.map(song => song.songId);
                })
                .catch(error => console.error(error));
        },
        fetchSong() {
            this.$songs
                .where('songId')
                .equals(this.songId)
                .first()
                .then(song => {
                    this.song = song || null;
                    this.resetImages();
                })
                .catch(error => console.error(error));
        },
        goTo(songId) {
            if (songId) this.$router.push(`/song/${songId}`);
        },
        toggleFavorite() {
            const next = this.song.favorited ? 0 : 1;
            this.$songs
                .update(this.song.id, { favorited: next })
                .then(updated => {
                    if (updated) this.song.favorited = next;
                })
                .catch(error => console.error(error));
        },
        adjustFontSize(delta) {
            this.fontSize = Math.min(72, Math.max(12, this.fontSize + delta));
        },
    },
};
</script>

<style lang="scss">
%button-shadow {
    border: none;
    border-radius: 20px;
    background-color: white;
    box-shadow: 2px 2px 5px 0 rgba(0, 0, 0, 0.4);
}

.image-format-container {
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
}

.image-format-button {
    font-size: 16px;
    line-height: 1.5;
    background-color: transparent;
    border: none;
    border-radius: 20px;
    padding: 10px 20px;
    margin-right: 10px;
    color: black;
    transition: background-color 0.3s, color 0.3s;
    font-weight: normal;
}

.image-format-button.selected {
    background-color: dodgerblue;
    color: black;
    font-weight: bold;
}

.image-format-button:hover:not(.selected) {
    background-color: lightgray;
    color: white;
}

.song__navigation-button {
    font-size: 18px;
    line-height: 1.5;
    @extend %button-shadow;
    background-color: lightblue;
    color: black;
    padding: 8px 12px;
    font-weight: 500;
}

.song__navigation-button:focus {
    outline: none;
}

.song__navigation-button:hover:not([disabled]) {
    background-color: dodgerblue;
}

.song__slideshow-button {
    font-size: 16px;
    line-height: 1.5;
    padding: 7px 13px;
    color: #111;
    @extend %button-shadow;
    background: #d9b26f;
}

.audio-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
}

.audio-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    margin-left: 10px;
    width: 40px;
    height: 40px;
    fill: black;
}

.audio-player {
    justify-content: center;
    display: flex;
    margin: 10px;
}

.song-image {
    justify-content: center;
    display: grid;
    margin: 20px;
}

.song-image img {
    max-width: 100%;
    width: auto;
    height: auto;
    shape-rendering: crispEdges;
    image-rendering: optimizeQuality;

    object-fit: cover;
}

.song__buttons button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
}

.song__buttons button:hover:not([disabled]) {
    background-color: lightgray;
}

.song {
    &__title {
        font-size: 20px;
        text-align: center;
        width: auto;
        margin: 0 0 10px;
        border-bottom: 1px solid black;
    }

    &__verse {
        font-size: 16px;
        text-align: center;
        margin: 0 0 20px;
    }

    &__body {
        display: inline-block;
        text-align: left;
        font-size: 24px;
        margin-bottom: 20px;
    }

    &__buttons {
        justify-content: center;
        align-items: center;
        display: flex;
        padding: 10px 0;

        > :not(:last-child) {
            margin-right: 10px;
        }
    }

    &__favorite-button {
        display: inline-block;
        font-size: 20px;
        line-height: 1;
        vertical-align: bottom;
        padding: 0 2px;
        border: none;
        color: rgba(228, 179, 99, 1);
        @extend %button-shadow;
    }

    &__font-size-button {
        font-size: 16px;
        line-height: 1.5;
        @extend %button-shadow;
    }

    &__copyright {
        text-align: center;
        justify-content: center;
        display: flex;
    }

    .icon-audio {
        display: block;
        margin: 0 auto;
    }
    .image-loader {
        display: inline-block;
        position: relative;
        width: 80px;
        height: 80px;
    }

    .image-loader::after {
        content: ' ';
        display: block;
        width: 64px;
        height: 64px;
        margin: 8px;
        border-radius: 50%;
        border: 6px solid #000;
        border-color: #000 transparent #000 transparent;
        animation: image-loader 1.2s linear infinite;
    }

    @keyframes image-loader {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
}

.lyrics-show {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    overflow: hidden;
    color: #fff;
    background:
        radial-gradient(circle at 50% 45%, #263447 0, #111923 48%, #080b10 100%);

    &__click-zone {
        position: absolute;
        top: 0;
        bottom: 0;
        z-index: 1;
        width: 50%;
        padding: 0;
        border: 0;
        outline: 0;
        background: transparent;
        cursor: pointer;

        &--left {
            left: 0;
        }

        &--right {
            right: 0;
        }

        &:disabled {
            cursor: default;
        }

        &:not(:disabled):hover {
            background: rgba(255, 255, 255, 0.025);
        }
    }

    &__close {
        position: absolute;
        top: 18px;
        right: 22px;
        z-index: 4;
        width: 48px;
        height: 48px;
        padding: 0;
        border: 1px solid rgba(255, 255, 255, 0.35);
        border-radius: 50%;
        color: #fff;
        background: rgba(0, 0, 0, 0.35);
        font-size: 34px;
        line-height: 42px;
        cursor: pointer;
    }

    &__header {
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        min-height: 76px;
        padding: 14px 80px;
        box-sizing: border-box;
        color: rgba(255, 255, 255, 0.72);
        font-size: clamp(16px, 2vw, 24px);
        text-align: center;
        pointer-events: none;

        strong {
            padding: 5px 11px;
            border-radius: 999px;
            color: #1b1408;
            background: #d9b26f;
            font-size: 0.7em;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
    }

    &__content {
        z-index: 2;
        align-self: center;
        justify-self: center;
        width: min(1200px, 86vw);
        max-height: 100%;
        overflow: auto;
        padding: 30px 0;
        box-sizing: border-box;
        font-size: clamp(30px, 5vw, 76px);
        font-weight: 600;
        line-height: 1.32;
        text-align: center;
        text-wrap: balance;
        white-space: pre-line;
        text-shadow: 0 3px 16px rgba(0, 0, 0, 0.55);
        pointer-events: none;
    }

    &__controls {
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        min-height: 82px;
        color: rgba(255, 255, 255, 0.75);

        button {
            width: 52px;
            height: 44px;
            border: 1px solid rgba(255, 255, 255, 0.35);
            border-radius: 22px;
            color: #fff;
            background: rgba(255, 255, 255, 0.1);
            font-size: 25px;
            cursor: pointer;

            &:disabled {
                opacity: 0.25;
                cursor: default;
            }
        }
    }
}

@media (max-width: 640px) {
    .lyrics-show {
        &__header {
            min-height: 64px;
            padding: 10px 66px 10px 18px;
        }

        &__close {
            top: 10px;
            right: 10px;
            width: 42px;
            height: 42px;
            font-size: 29px;
            line-height: 36px;
        }

        &__content {
            width: 88vw;
            font-size: clamp(26px, 8vw, 54px);
        }

        &__controls {
            min-height: 68px;
        }
    }
}
</style>
