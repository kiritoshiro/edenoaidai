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
</template>

<script>
import { config } from '../lib/config';
import SongIcon from '../components/SongIcon.vue';

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
    },
    watch: {
        songId() {
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
    methods: {
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
</style>
