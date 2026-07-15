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
                v-if="sourceSlides.length"
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
            :class="{ 'lyrics-show--light': slideshowTheme === 'light' }"
            :style="{ '--lyrics-font-size': `${fittedSlideshowFontSize}px` }"
            role="dialog"
            aria-modal="true"
            aria-label="Giesmės skaidrės"
        >
            <button
                class="lyrics-show__click-zone lyrics-show__click-zone--left"
                :disabled="slideshowSettingsOpen || slideshowIndex === 0"
                tabindex="-1"
                aria-label="Ankstesnė skaidrė"
                @click="previousSlide"
            ></button>
            <button
                class="lyrics-show__click-zone lyrics-show__click-zone--right"
                :disabled="
                    slideshowSettingsOpen ||
                    slideshowSlides.length === 0 ||
                    slideshowIndex === slideshowSlides.length - 1
                "
                tabindex="-1"
                aria-label="Kita skaidrė"
                @click="nextSlide"
            ></button>

            <button
                class="lyrics-show__settings-button"
                aria-label="Skaidrių nustatymai"
                title="Skaidrių nustatymai"
                @click.stop="slideshowSettingsOpen = !slideshowSettingsOpen"
            >
                &#9881;
            </button>

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
                <strong v-if="currentSlide?.isChorus">Priegiesmis</strong>
            </header>

            <main ref="slideshowContent" class="lyrics-show__content">
                <span v-if="currentSlide">{{ currentSlideText }}</span>
                <span v-else class="lyrics-show__empty">
                    Nustatymuose pasirinkite bent vieną stulpelį.
                </span>
            </main>

            <aside
                v-if="slideshowSettingsOpen"
                class="lyrics-show__settings"
                aria-label="Skaidrių nustatymai"
                @click.stop
            >
                <div class="lyrics-show__settings-header">
                    <h2>Skaidrių nustatymai</h2>
                    <button
                        type="button"
                        aria-label="Uždaryti nustatymus"
                        @click="slideshowSettingsOpen = false"
                    >
                        ×
                    </button>
                </div>

                <section class="lyrics-show__setting-group">
                    <h3>Vaizdas</h3>
                    <div class="lyrics-show__theme-buttons">
                        <button
                            type="button"
                            :class="{ selected: slideshowTheme === 'dark' }"
                            @click="slideshowTheme = 'dark'"
                        >
                            Tamsus
                        </button>
                        <button
                            type="button"
                            :class="{ selected: slideshowTheme === 'light' }"
                            @click="slideshowTheme = 'light'"
                        >
                            Šviesus
                        </button>
                    </div>
                </section>

                <section class="lyrics-show__setting-group">
                    <div class="lyrics-show__setting-title">
                        <h3>Teksto dydis</h3>
                        <output>{{ fittedSlideshowFontSize }} px</output>
                    </div>
                    <div class="lyrics-show__font-control">
                        <button
                            type="button"
                            :disabled="fittedSlideshowFontSize <= 8"
                            @click="adjustSlideshowFontSize(-4)"
                        >
                            A−
                        </button>
                        <input
                            v-model.number="slideshowFontSize"
                            type="range"
                            min="8"
                            :max="Math.max(8, slideshowFontLimit)"
                            step="2"
                        />
                        <button
                            type="button"
                            :disabled="fittedSlideshowFontSize >= slideshowFontLimit"
                            @click="adjustSlideshowFontSize(4)"
                        >
                            A+
                        </button>
                    </div>
                    <p>
                        Tai didžiausias norimas dydis. Ilgesnis posmelis
                        automatiškai sumažinamas, kad visas tilptų skaidrėje.
                    </p>
                </section>

                <section class="lyrics-show__setting-group">
                    <div class="lyrics-show__setting-title">
                        <div>
                            <h3>Rodomi stulpeliai</h3>
                            <p>
                                Priegiesmio skaičius nurodo, kiek kartų jis rodomas
                                po kiekvieno pasirinkto posmo.
                            </p>
                        </div>
                        <div class="lyrics-show__selection-actions">
                            <button type="button" @click="setAllSlidesEnabled(true)">
                                Visi
                            </button>
                            <button type="button" @click="setAllSlidesEnabled(false)">
                                Nė vieno
                            </button>
                        </div>
                    </div>

                    <div class="lyrics-show__slide-options">
                        <label
                            v-for="(slide, index) in sourceSlides"
                            :key="index"
                            class="lyrics-show__slide-option"
                            :class="{
                                'lyrics-show__slide-option--chorus': slide.isChorus,
                            }"
                        >
                            <template v-if="slideshowOptions[index]">
                                <input
                                    v-model="slideshowOptions[index].enabled"
                                    type="checkbox"
                                />
                                <span>
                                    <strong>{{ slideOptionTitle(slide, index) }}</strong>
                                    <small>{{ slideOptionPreview(slide) }}</small>
                                </span>
                                <span
                                    v-if="slide.isChorus"
                                    class="lyrics-show__repeat-control"
                                >
                                    <input
                                        v-model.number="slideshowOptions[index].repetitions"
                                        type="number"
                                        min="1"
                                        max="10"
                                        aria-label="Priegiesmio kartojimų skaičius"
                                        @change="normalizeRepetitions(slideshowOptions[index])"
                                    />
                                    kart.
                                </span>
                            </template>
                        </label>
                    </div>
                </section>
            </aside>

            <footer class="lyrics-show__controls" @click.stop>
                <button
                    :disabled="slideshowSlides.length === 0 || slideshowIndex === 0"
                    aria-label="Ankstesnė skaidrė"
                    @click="previousSlide"
                >
                    ←
                </button>
                <span>
                    {{ slideshowSlides.length ? slideshowIndex + 1 : 0 }} /
                    {{ slideshowSlides.length }}
                </span>
                <button
                    :disabled="
                        slideshowSlides.length === 0 ||
                        slideshowIndex === slideshowSlides.length - 1
                    "
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
import { lyricsToPlainText } from '../lib/lyrics';
import SongIcon from '../components/SongIcon.vue';

function slidesFromBody(body) {
    const text = lyricsToPlainText(body);
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
            slideshowSettingsOpen: false,
            slideshowTheme:
                localStorage.getItem('slideshowTheme') === 'light'
                    ? 'light'
                    : 'dark',
            slideshowFontSize: Math.min(
                160,
                Math.max(
                    8,
                    parseInt(localStorage.getItem('slideshowFontSize'), 10) || 56,
                ),
            ),
            fittedSlideshowFontSize: 56,
            slideshowFontLimit: 160,
            slideshowOptions: [],
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
                      .filter(slide => slide)
                      .map(slide => ({
                          text: lyricsToPlainText(slide.text),
                          isChorus: slide.isChorus === true,
                          chorusAfter:
                              slide.isChorus === true
                                  ? false
                                  : slide.chorusAfter !== false,
                      }))
                      .filter(slide => slide.text !== '')
                : [];
            return saved.length > 0 ? saved : slidesFromBody(this.song.body);
        },
        slideshowSlides() {
            const selected = this.sourceSlides
                .map((slide, index) => ({
                    ...slide,
                    option: this.slideshowOptions[index] || {
                        enabled: true,
                        repetitions: 1,
                    },
                }))
                .filter(slide => slide.option.enabled);
            const choruses = selected.filter(slide => slide.isChorus);
            const verses = selected.filter(slide => !slide.isChorus);

            const repeatedChoruses = () =>
                choruses.flatMap(chorus =>
                    Array.from(
                        { length: this.repetitionCount(chorus.option) },
                        () => ({
                            text: chorus.text,
                            isChorus: true,
                            chorusAfter: false,
                        }),
                    ),
                );

            if (verses.length === 0) return repeatedChoruses();

            const sequence = [];
            verses.forEach(verse => {
                sequence.push({
                    text: verse.text,
                    isChorus: false,
                    chorusAfter: verse.chorusAfter,
                });
                if (choruses.length > 0 && verse.chorusAfter !== false) {
                    sequence.push(...repeatedChoruses());
                }
            });
            return sequence;
        },
        currentSlide() {
            return this.slideshowSlides[this.slideshowIndex] || null;
        },
        currentSlideText() {
            return lyricsToPlainText(this.currentSlide?.text);
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
        slideshowTheme(value) {
            localStorage.setItem('slideshowTheme', value);
            this.scheduleSlideFit();
        },
        slideshowFontSize(value) {
            const normalized = Math.min(160, Math.max(4, Number(value) || 56));
            localStorage.setItem('slideshowFontSize', String(normalized));
            this.scheduleSlideFit();
        },
        currentSlideText() {
            this.scheduleSlideFit();
        },
        slideshowSlides(value) {
            if (value.length === 0) {
                this.slideshowIndex = 0;
            } else if (this.slideshowIndex >= value.length) {
                this.slideshowIndex = value.length - 1;
            }
            this.scheduleSlideFit();
        },
    },
    created() {
        this.fetchSongIds();
        this.fetchSong();
    },
    mounted() {
        document.addEventListener('keydown', this.onSlideshowKeydown);
        document.addEventListener('fullscreenchange', this.onFullscreenChange);
        window.addEventListener('resize', this.scheduleSlideFit);
        document.fonts?.ready.then(() => this.scheduleSlideFit());
    },
    beforeUnmount() {
        document.removeEventListener('keydown', this.onSlideshowKeydown);
        document.removeEventListener('fullscreenchange', this.onFullscreenChange);
        window.removeEventListener('resize', this.scheduleSlideFit);
        this.closeSlideshow();
    },
    methods: {
        openSlideshow() {
            if (this.sourceSlides.length === 0) return;
            this.prepareSlideshowOptions();
            this.slideshowIndex = 0;
            this.slideshowSettingsOpen = this.slideshowSlides.length === 0;
            this.previousBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            this.slideshowOpen = true;
            this.fittedSlideshowFontSize = this.slideshowFontSize;
            this.scheduleSlideFit();
            this.$nextTick(() => {
                const element = this.$refs.slideshow;
                if (!element?.requestFullscreen) return;
                element
                    .requestFullscreen()
                    .then(() => {
                        this.fullscreenActive = true;
                        this.scheduleSlideFit();
                    })
                    .catch(() => {
                        this.fullscreenActive = false;
                        this.scheduleSlideFit();
                    });
            });
        },
        closeSlideshow() {
            if (!this.slideshowOpen && !this.fullscreenActive) return;
            this.slideshowOpen = false;
            this.slideshowSettingsOpen = false;
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
            if (this.slideshowSlides.length === 0) return;
            this.slideshowIndex = Math.min(
                this.slideshowSlides.length - 1,
                this.slideshowIndex + 1,
            );
        },
        onSlideshowKeydown(event) {
            if (!this.slideshowOpen) return;
            if (this.slideshowSettingsOpen) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    this.slideshowSettingsOpen = false;
                }
                return;
            }
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
        prepareSlideshowOptions() {
            if (this.slideshowOptions.length === this.sourceSlides.length) return;
            this.slideshowOptions = this.sourceSlides.map(() => ({
                enabled: true,
                repetitions: 1,
            }));
        },
        setAllSlidesEnabled(enabled) {
            this.slideshowOptions.forEach(option => {
                option.enabled = enabled;
            });
        },
        repetitionCount(option) {
            return Math.min(10, Math.max(1, parseInt(option?.repetitions, 10) || 1));
        },
        normalizeRepetitions(option) {
            option.repetitions = this.repetitionCount(option);
        },
        adjustSlideshowFontSize(delta) {
            const current = Math.min(
                this.slideshowFontLimit,
                Math.max(4, Number(this.fittedSlideshowFontSize) || 56),
            );
            this.slideshowFontSize = Math.min(
                this.slideshowFontLimit,
                Math.max(4, current + delta),
            );
        },
        scheduleSlideFit() {
            if (!this.slideshowOpen) return;
            this.$nextTick(() => {
                window.requestAnimationFrame(() => this.fitCurrentSlide());
            });
        },
        fitCurrentSlide() {
            const content = this.$refs.slideshowContent;
            const preferred = Math.min(
                160,
                Math.max(4, Number(this.slideshowFontSize) || 56),
            );
            if (!content || !this.currentSlide) {
                this.fittedSlideshowFontSize = preferred;
                this.slideshowFontLimit = 160;
                return;
            }

            const fits = size => {
                content.style.fontSize = `${size}px`;
                return (
                    content.scrollHeight <= content.clientHeight + 1 &&
                    content.scrollWidth <= content.clientWidth + 1
                );
            };

            let low = 4;
            let high = 160;
            let best = 4;
            while (low <= high) {
                const size = Math.floor((low + high) / 2);
                if (fits(size)) {
                    best = size;
                    low = size + 1;
                } else {
                    high = size - 1;
                }
            }

            const displayed = Math.min(preferred, best);
            content.style.fontSize = `${displayed}px`;
            this.slideshowFontLimit = best;
            this.fittedSlideshowFontSize = displayed;
        },
        slideOptionTitle(slide, index) {
            return slide.isChorus
                ? `Priegiesmis · stulpelis ${index + 1}`
                : `Posmas · stulpelis ${index + 1}`;
        },
        slideOptionPreview(slide) {
            const firstLine = String(slide.text || '').split(/\r?\n/, 1)[0].trim();
            return firstLine.length > 70 ? `${firstLine.slice(0, 70)}…` : firstLine;
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
            } else if (this.slideshowOpen) {
                this.scheduleSlideFit();
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
                    this.slideshowOptions = [];
                    this.prepareSlideshowOptions();
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
    --lyrics-show-background:
        radial-gradient(circle at 50% 45%, #263447 0, #111923 48%, #080b10 100%);
    --lyrics-show-text: #fff;
    --lyrics-show-muted: rgba(255, 255, 255, 0.72);
    --lyrics-show-border: rgba(255, 255, 255, 0.35);
    --lyrics-show-control: rgba(255, 255, 255, 0.1);
    --lyrics-show-panel: rgba(18, 25, 35, 0.98);
    --lyrics-show-panel-soft: rgba(255, 255, 255, 0.08);
    --lyrics-show-shadow: 0 3px 16px rgba(0, 0, 0, 0.55);
    --lyrics-show-hover: rgba(255, 255, 255, 0.025);

    position: fixed;
    inset: 0;
    z-index: 10000;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    overflow: hidden;
    color: var(--lyrics-show-text);
    background: var(--lyrics-show-background);

    &--light {
        --lyrics-show-background:
            radial-gradient(circle at 50% 45%, #fff 0, #f4efe6 58%, #e8dfd1 100%);
        --lyrics-show-text: #17130d;
        --lyrics-show-muted: rgba(23, 19, 13, 0.68);
        --lyrics-show-border: rgba(23, 19, 13, 0.28);
        --lyrics-show-control: rgba(255, 255, 255, 0.72);
        --lyrics-show-panel: rgba(255, 253, 248, 0.98);
        --lyrics-show-panel-soft: rgba(67, 48, 20, 0.07);
        --lyrics-show-shadow: 0 2px 10px rgba(75, 52, 20, 0.18);
        --lyrics-show-hover: rgba(67, 48, 20, 0.035);
    }

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
            background: var(--lyrics-show-hover);
        }
    }

    &__close,
    &__settings-button {
        position: absolute;
        top: 18px;
        z-index: 4;
        width: 48px;
        height: 48px;
        padding: 0;
        border: 1px solid var(--lyrics-show-border);
        border-radius: 50%;
        color: var(--lyrics-show-text);
        background: var(--lyrics-show-control);
        cursor: pointer;
    }

    &__close {
        right: 22px;
        font-size: 34px;
        line-height: 42px;
    }

    &__settings-button {
        right: 82px;
        font-size: 27px;
        line-height: 44px;
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
        color: var(--lyrics-show-muted);
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
        overflow: hidden;
        padding: 30px 0;
        box-sizing: border-box;
        font-size: var(--lyrics-font-size, 56px);
        font-weight: 600;
        line-height: 1.32;
        text-align: center;
        text-wrap: balance;
        white-space: pre-line;
        overflow-wrap: anywhere;
        text-shadow: var(--lyrics-show-shadow);
        pointer-events: none;
    }

    &__empty {
        color: var(--lyrics-show-muted);
        font-size: 0.48em;
        font-weight: 400;
    }

    &__settings {
        position: absolute;
        top: 76px;
        right: 20px;
        bottom: 82px;
        z-index: 6;
        width: min(520px, calc(100vw - 40px));
        box-sizing: border-box;
        overflow: auto;
        padding: 20px;
        border: 1px solid var(--lyrics-show-border);
        border-radius: 16px;
        color: var(--lyrics-show-text);
        background: var(--lyrics-show-panel);
        box-shadow: 0 18px 55px rgba(0, 0, 0, 0.32);
    }

    &__settings-header,
    &__setting-title,
    &__font-control,
    &__theme-buttons,
    &__selection-actions,
    &__slide-option,
    &__repeat-control {
        display: flex;
        align-items: center;
    }

    &__settings-header,
    &__setting-title {
        justify-content: space-between;
        gap: 12px;
    }

    &__settings-header {
        h2 {
            margin: 0;
            font-size: 24px;
        }

        button {
            width: 38px;
            height: 38px;
            border: 1px solid var(--lyrics-show-border);
            border-radius: 50%;
            color: var(--lyrics-show-text);
            background: var(--lyrics-show-control);
            font-size: 25px;
            cursor: pointer;
        }
    }

    &__setting-group {
        margin-top: 20px;
        padding-top: 18px;
        border-top: 1px solid var(--lyrics-show-border);

        h3 {
            margin: 0 0 10px;
            font-size: 17px;
        }

        p {
            margin: 3px 0 10px;
            color: var(--lyrics-show-muted);
            font-size: 13px;
            line-height: 1.4;
        }

        output {
            color: var(--lyrics-show-muted);
            font-variant-numeric: tabular-nums;
        }
    }

    &__theme-buttons,
    &__selection-actions {
        gap: 8px;

        button {
            padding: 8px 13px;
            border: 1px solid var(--lyrics-show-border);
            border-radius: 8px;
            color: var(--lyrics-show-text);
            background: var(--lyrics-show-control);
            cursor: pointer;

            &.selected {
                border-color: #d9b26f;
                color: #17130d;
                background: #d9b26f;
                font-weight: 700;
            }
        }
    }

    &__selection-actions {
        flex-shrink: 0;

        button {
            padding: 6px 9px;
            font-size: 12px;
        }
    }

    &__font-control {
        gap: 12px;

        input[type='range'] {
            flex: 1;
            accent-color: #d9b26f;
        }

        button {
            min-width: 45px;
            height: 38px;
            border: 1px solid var(--lyrics-show-border);
            border-radius: 8px;
            color: var(--lyrics-show-text);
            background: var(--lyrics-show-control);
            cursor: pointer;
        }
    }

    &__slide-options {
        display: grid;
        gap: 8px;
    }

    &__slide-option {
        gap: 10px;
        min-height: 50px;
        padding: 9px 10px;
        border-radius: 9px;
        background: var(--lyrics-show-panel-soft);
        cursor: pointer;

        &--chorus {
            box-shadow: inset 4px 0 #d9b26f;
        }

        > input[type='checkbox'] {
            flex: 0 0 auto;
            width: 19px;
            height: 19px;
            accent-color: #d9b26f;
        }

        > span:nth-of-type(1) {
            min-width: 0;
            flex: 1;

            strong,
            small {
                display: block;
            }

            small {
                overflow: hidden;
                margin-top: 3px;
                color: var(--lyrics-show-muted);
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }

    &__repeat-control {
        flex: 0 0 auto;
        gap: 5px;
        color: var(--lyrics-show-muted);
        font-size: 13px;

        input {
            width: 52px;
            box-sizing: border-box;
            padding: 6px;
            border: 1px solid var(--lyrics-show-border);
            border-radius: 7px;
            color: var(--lyrics-show-text);
            background: var(--lyrics-show-control);
        }
    }

    &__controls {
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        min-height: 82px;
        color: var(--lyrics-show-muted);

        button {
            width: 52px;
            height: 44px;
            border: 1px solid var(--lyrics-show-border);
            border-radius: 22px;
            color: var(--lyrics-show-text);
            background: var(--lyrics-show-control);
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

        &__settings-button {
            top: 10px;
            right: 60px;
            width: 42px;
            height: 42px;
            font-size: 24px;
            line-height: 38px;
        }

        &__settings {
            top: 62px;
            right: 8px;
            bottom: 68px;
            width: calc(100vw - 16px);
            padding: 15px;
        }

        &__content {
            width: 88vw;
        }

        &__controls {
            min-height: 68px;
        }
    }
}
</style>
