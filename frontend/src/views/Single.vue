<!-- eslint-disable vue/no-v-html -->
<template>
    <div v-if="song" class="song">
        <h2 class="song__title">{{ song.songId }} {{ song.title }}</h2>
        <div class="song__buttons">
            <button
                class="song__navigation-button song__navigation-button--previous"
                :disabled="!previousSongId"
                :aria-label="previousSongId ? `Ankstesnė giesmė ${previousSongId}` : 'Ankstesnės giesmės nėra'"
                @click="goTo(previousSongId)"
            >
                <span aria-hidden="true">←</span>
                <span>{{ previousSongId || '—' }}</span>
            </button>

            <div class="song__action-group">
                <button
                    class="song__action-button"
                    aria-label="Mažinti giesmės tekstą"
                    title="Mažinti tekstą"
                    @click="adjustFontSize(-1)"
                >
                    A−
                </button>
                <button
                    class="song__action-button"
                    aria-label="Didinti giesmės tekstą"
                    title="Didinti tekstą"
                    @click="adjustFontSize(1)"
                >
                    A+
                </button>

                <button
                    v-if="sourceSlides.length"
                    class="song__slideshow-button"
                    @click="openSlideshow"
                >
                    <span aria-hidden="true">▣</span>
                    <span class="song__slideshow-label">Skaidrės</span>
                </button>

                <button
                    v-if="sourceSlides.length"
                    class="song__presenter-button"
                    :class="{ 'is-active': presenterConnected }"
                    :aria-label="presenterConnected ? 'Rodyti prijungtą pristatymo langą' : 'Rodyti skaidres kitame ekrane'"
                    :title="presenterConnected ? 'Pristatymo langas prijungtas' : 'Kitas ekranas'"
                    @click="openPresenterWindow"
                >
                    <span aria-hidden="true">▱</span>
                    <span class="song__presenter-label">Kitas ekranas</span>
                </button>

                <button
                    class="song__favorite-button"
                    :class="{ 'is-active': song.favorited }"
                    :aria-label="song.favorited ? 'Pašalinti iš išsaugotų' : 'Išsaugoti giesmę'"
                    :title="song.favorited ? 'Išsaugota' : 'Išsaugoti'"
                    @click="toggleFavorite"
                >
                    <svg class="icon">
                        <use v-if="song.favorited" href="#icon-star-full"></use>
                        <use v-else href="#icon-star-empty"></use>
                    </svg>
                </button>

                <button
                    class="song__theme-button"
                    :aria-label="isDark ? 'Įjungti šviesią temą' : 'Įjungti tamsią temą'"
                    :title="isDark ? 'Šviesi tema' : 'Tamsi tema'"
                    @click="toggleTheme"
                >
                    <span aria-hidden="true">{{ isDark ? '☀' : '☾' }}</span>
                    <span class="song__theme-label">
                        {{ isDark ? 'Šviesi' : 'Tamsi' }}
                    </span>
                </button>
            </div>

            <button
                class="song__navigation-button song__navigation-button--next"
                :disabled="!nextSongId"
                :aria-label="nextSongId ? `Kita giesmė ${nextSongId}` : 'Kitos giesmės nėra'"
                @click="goTo(nextSongId)"
            >
                <span>{{ nextSongId || '—' }}</span>
                <span aria-hidden="true">→</span>
            </button>
        </div>
        <div v-if="presenterConnected" class="song__presenter-controls">
            <strong>Kitas ekranas</strong>
            <button
                type="button"
                :disabled="slideshowIndex === 0"
                aria-label="Ankstesnė skaidrė kitame ekrane"
                @click="previousSlide"
            >
                ←
            </button>
            <span>{{ slideshowSlides.length ? slideshowIndex + 1 : 0 }} / {{ slideshowSlides.length }}</span>
            <button
                type="button"
                :disabled="slideshowSlides.length === 0 || slideshowIndex === slideshowSlides.length - 1"
                aria-label="Kita skaidrė kitame ekrane"
                @click="nextSlide"
            >
                →
            </button>
            <button type="button" @click="closePresenterWindow">Uždaryti</button>
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
            :class="{
                'lyrics-show--light': slideshowTheme === 'light',
                'lyrics-show--no-wrap': !slideshowWrapLines,
            }"
            :style="slideshowStyle"
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
                @click.stop="toggleSlideshowSettings"
            >
                &#9881;
            </button>

            <button
                class="lyrics-show__presenter-button"
                :class="{ 'is-active': presenterConnected }"
                aria-label="Rodyti skaidres kitame ekrane"
                title="Kitas ekranas"
                @click.stop="openPresenterWindow"
            >
                ▱
            </button>

            <button
                class="lyrics-show__close"
                aria-label="Uždaryti skaidres"
                title="Uždaryti (Esc)"
                @click.stop="requestCloseSlideshow"
            >
                ×
            </button>

            <header class="lyrics-show__header">
                <span>{{ song.songId }} {{ song.title }}</span>
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
                        @click="closeSlideshowSettings"
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
                        <output>
                            {{ fittedSlideshowFontSize }} px
                            <small v-if="fittedSlideshowFontSize !== slideshowFontSize">
                                (norimas {{ slideshowFontSize }})
                            </small>
                        </output>
                    </div>
                    <div class="lyrics-show__font-control">
                        <button
                            type="button"
                            :disabled="slideshowFontSize <= 8"
                            @click="adjustSlideshowFontSize(-4)"
                        >
                            A−
                        </button>
                        <input
                            v-model.number="slideshowFontSize"
                            type="range"
                            min="8"
                            max="320"
                            step="2"
                        />
                        <button
                            type="button"
                            :disabled="slideshowFontSize >= 320"
                            @click="adjustSlideshowFontSize(4)"
                        >
                            A+
                        </button>
                    </div>
                    <p v-if="!slideshowStrictSize">
                        Tai didžiausias norimas dydis. Ilgesnis posmelis
                        automatiškai sumažinamas, kad visas tilptų skaidrėje.
                    </p>
                    <p v-else>
                        Naudojamas tikslus dydis. Netelpančios skaidrės bus
                        pažymėtos žemiau.
                    </p>
                </section>

                <section class="lyrics-show__setting-group">
                    <button
                        type="button"
                        class="lyrics-show__more-button"
                        :aria-expanded="advancedSettingsOpen"
                        @click="advancedSettingsOpen = !advancedSettingsOpen"
                    >
                        <span>Daugiau</span>
                        <span aria-hidden="true">{{ advancedSettingsOpen ? '⌃' : '⌄' }}</span>
                    </button>

                    <div v-if="advancedSettingsOpen" class="lyrics-show__advanced">
                        <label class="lyrics-show__toggle-row">
                            <input v-model="slideshowStrictSize" type="checkbox" />
                            <span>
                                <strong>Naudoti tikslų teksto dydį</strong>
                                <small>Tekstas nebus automatiškai mažinamas.</small>
                            </span>
                        </label>

                        <div class="lyrics-show__advanced-block">
                            <h3>Eilučių laužymas</h3>
                            <div class="lyrics-show__theme-buttons">
                                <button
                                    type="button"
                                    :class="{ selected: slideshowWrapLines }"
                                    @click="slideshowWrapLines = true"
                                >
                                    Laužyti
                                </button>
                                <button
                                    type="button"
                                    :class="{ selected: !slideshowWrapLines }"
                                    @click="slideshowWrapLines = false"
                                >
                                    Nelaužyti
                                </button>
                            </div>
                        </div>

                        <div class="lyrics-show__advanced-block">
                            <div class="lyrics-show__setting-title">
                                <h3>Teksto pozicija</h3>
                                <output>{{ slideshowOffsetX }}, {{ slideshowOffsetY }}</output>
                            </div>
                            <div class="lyrics-show__position-control" aria-label="Teksto pozicija">
                                <button type="button" aria-label="Pakelti tekstą" @click="moveSlideshowText(0, -5)">↑</button>
                                <button type="button" aria-label="Perkelti tekstą į kairę" @click="moveSlideshowText(-5, 0)">←</button>
                                <button type="button" aria-label="Atstatyti teksto poziciją" @click="resetSlideshowPosition">●</button>
                                <button type="button" aria-label="Perkelti tekstą į dešinę" @click="moveSlideshowText(5, 0)">→</button>
                                <button type="button" aria-label="Nuleisti tekstą" @click="moveSlideshowText(0, 5)">↓</button>
                            </div>
                            <p>Vienas paspaudimas perkelia tekstą 5 % ekrano.</p>
                        </div>

                        <div
                            v-if="hasSlideOverflow"
                            class="lyrics-show__overflow-alert"
                            role="alert"
                        >
                            <strong>! {{ slideshowOverflowIndexes.length }} skaidrė(-ės) netelpa.</strong>
                            <span>Prie jų sąraše parodytas šauktukas.</span>
                        </div>
                    </div>
                </section>

                <section class="lyrics-show__setting-group">
                    <div class="lyrics-show__setting-title">
                        <div>
                            <h3>Rodomi stulpeliai</h3>
                            <p>
                                Išjunkite bet kurį konkretų posmą arba priegiesmį
                                galutinėje skaidrių sekoje.
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
                            v-for="(slide, index) in slideshowSequence"
                            :key="index"
                            class="lyrics-show__slide-option"
                            :class="{
                                'lyrics-show__slide-option--chorus': slide.isChorus,
                                'lyrics-show__slide-option--overflow': slideOverflows(index),
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
                                <strong
                                    v-if="slideOverflows(index)"
                                    class="lyrics-show__overflow-mark"
                                    title="Šis tekstas netelpa su pasirinktais nustatymais"
                                    aria-label="Tekstas netelpa"
                                >
                                    !
                                </strong>
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

    <Teleport to="body">
        <div
            v-if="song && sourceSlides.length"
            ref="slideshowMeasureStage"
            class="lyrics-measure-stage"
            :class="{ 'lyrics-measure-stage--no-wrap': !slideshowWrapLines }"
            :style="measurementStyle"
            aria-hidden="true"
        >
            <div></div>
            <div ref="slideshowMeasureArea" class="lyrics-measure-stage__area">
                <div ref="slideshowMeasureContent" class="lyrics-measure-stage__content"></div>
            </div>
            <div></div>
        </div>
    </Teleport>
</template>

<script>
import { config } from '../lib/config';
import { lyricsToPlainText } from '../lib/lyrics';
import { appTheme, toggleAppTheme } from '../lib/theme';
import SongIcon from '../components/SongIcon.vue';

const MAX_SLIDESHOW_FONT_SIZE = 320;
let presenterWindow = null;
let presenterPollTimer = null;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
}

function slidesFromBody(body) {
    const text = lyricsToPlainText(body);
    const blocks = text
        .split(/\n\s*\n+/)
        .map(value => value.trim())
        .filter(Boolean);
    return blocks.map(value => {
        let isChorus = false;
        const cleanText = value
            .replace(
                /(^|\n)[\t ]*priegiesmis(?:[\t ]*:[\t ]*|[\t ]*(?=\n|$))/giu,
                (_, lineStart) => {
                    isChorus = true;
                    return lineStart;
                },
            )
            .trim();
        return {
            text: cleanText,
            isChorus,
            chorusAfter: false,
        };
    });
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
                MAX_SLIDESHOW_FONT_SIZE,
                Math.max(
                    8,
                    parseInt(localStorage.getItem('slideshowFontSize'), 10) || 56,
                ),
            ),
            fittedSlideshowFontSize: 56,
            slideshowFontLimit: MAX_SLIDESHOW_FONT_SIZE,
            slideshowOptions: [],
            advancedSettingsOpen: false,
            slideshowStrictSize:
                localStorage.getItem('slideshowStrictSize') === 'true',
            slideshowWrapLines:
                localStorage.getItem('slideshowWrapLines') !== 'false',
            slideshowOffsetX: clamp(
                localStorage.getItem('slideshowOffsetX'),
                -35,
                35,
            ),
            slideshowOffsetY: clamp(
                localStorage.getItem('slideshowOffsetY'),
                -35,
                35,
            ),
            slideshowOverflowIndexes: [],
            overflowSettingsConfirmed: false,
            slideValidationFrame: 0,
            presenterConnected: false,
        };
    },
    computed: {
        isDark() {
            return appTheme.value === 'dark';
        },
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
        slideshowSequence() {
            const choruses = this.sourceSlides.filter(slide => slide.isChorus);
            const verses = this.sourceSlides.filter(slide => !slide.isChorus);

            if (verses.length === 0) return choruses;

            const sequence = [];
            verses.forEach(verse => {
                sequence.push({
                    text: verse.text,
                    isChorus: false,
                    chorusAfter: verse.chorusAfter,
                });
                if (choruses.length > 0 && verse.chorusAfter !== false) {
                    sequence.push(...choruses);
                }
            });
            return sequence;
        },
        slideshowSlides() {
            return this.slideshowSequence.filter(
                (_, index) => this.slideshowOptions[index]?.enabled !== false,
            );
        },
        currentSlide() {
            return this.slideshowSlides[this.slideshowIndex] || null;
        },
        currentSlideText() {
            return lyricsToPlainText(this.currentSlide?.text);
        },
        hasSlideOverflow() {
            return this.slideshowOverflowIndexes.length > 0;
        },
        slideshowStyle() {
            return {
                '--lyrics-font-size': `${this.fittedSlideshowFontSize}px`,
                '--lyrics-offset-x': `${this.slideshowOffsetX}vw`,
                '--lyrics-offset-y': `${this.slideshowOffsetY}vh`,
            };
        },
        measurementStyle() {
            return {
                '--lyrics-font-size': `${this.slideshowFontSize}px`,
                '--lyrics-offset-x': `${this.slideshowOffsetX}vw`,
                '--lyrics-offset-y': `${this.slideshowOffsetY}vh`,
            };
        },
    },
    watch: {
        songId() {
            this.closePresenterWindow();
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
            this.renderPresenterWindow();
        },
        slideshowFontSize(value) {
            const normalized = Math.min(
                MAX_SLIDESHOW_FONT_SIZE,
                Math.max(4, Number(value) || 56),
            );
            localStorage.setItem('slideshowFontSize', String(normalized));
            this.overflowSettingsConfirmed = false;
            this.scheduleSlideFit();
            this.scheduleSlideValidation();
        },
        slideshowStrictSize(value) {
            localStorage.setItem('slideshowStrictSize', String(value));
            this.overflowSettingsConfirmed = false;
            this.scheduleSlideFit();
            this.scheduleSlideValidation();
        },
        slideshowWrapLines(value) {
            localStorage.setItem('slideshowWrapLines', String(value));
            this.overflowSettingsConfirmed = false;
            this.scheduleSlideFit();
            this.scheduleSlideValidation();
        },
        slideshowOffsetX(value) {
            localStorage.setItem('slideshowOffsetX', String(value));
            this.overflowSettingsConfirmed = false;
            this.scheduleSlideFit();
            this.scheduleSlideValidation();
        },
        slideshowOffsetY(value) {
            localStorage.setItem('slideshowOffsetY', String(value));
            this.overflowSettingsConfirmed = false;
            this.scheduleSlideFit();
            this.scheduleSlideValidation();
        },
        currentSlideText() {
            this.scheduleSlideFit();
            this.renderPresenterWindow();
        },
        fittedSlideshowFontSize() {
            this.renderPresenterWindow();
        },
        slideshowSlides(value) {
            if (value.length === 0) {
                this.slideshowIndex = 0;
            } else if (this.slideshowIndex >= value.length) {
                this.slideshowIndex = value.length - 1;
            }
            this.scheduleSlideFit();
            this.scheduleSlideValidation();
            this.renderPresenterWindow();
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
        document.fonts?.ready.then(() => {
            this.scheduleSlideFit();
            this.scheduleSlideValidation();
        });
        this.scheduleSlideValidation();
    },
    beforeUnmount() {
        document.removeEventListener('keydown', this.onSlideshowKeydown);
        document.removeEventListener('fullscreenchange', this.onFullscreenChange);
        window.removeEventListener('resize', this.scheduleSlideFit);
        if (this.slideValidationFrame) {
            window.cancelAnimationFrame(this.slideValidationFrame);
        }
        this.closePresenterWindow();
        this.closeSlideshow();
    },
    methods: {
        toggleTheme() {
            toggleAppTheme();
        },
        toggleSlideshowSettings() {
            if (this.slideshowSettingsOpen) {
                this.closeSlideshowSettings();
            } else {
                this.slideshowSettingsOpen = true;
                this.scheduleSlideValidation();
            }
        },
        closeSlideshowSettings() {
            this.validateAllSlides();
            if (!this.confirmUnsafeSettings()) return;
            this.slideshowSettingsOpen = false;
        },
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
        requestCloseSlideshow() {
            if (this.slideshowSettingsOpen && !this.confirmUnsafeSettings()) {
                return;
            }
            this.closeSlideshow();
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
            if (!this.slideshowOpen && !this.presenterConnected) return;
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
                if (this.slideshowOpen) this.requestCloseSlideshow();
                else this.closePresenterWindow();
            }
        },
        prepareSlideshowOptions() {
            if (this.slideshowOptions.length === this.slideshowSequence.length) return;
            this.slideshowOptions = this.slideshowSequence.map(() => ({
                enabled: true,
            }));
        },
        setAllSlidesEnabled(enabled) {
            this.slideshowOptions.forEach(option => {
                option.enabled = enabled;
            });
        },
        adjustSlideshowFontSize(delta) {
            const current = Math.min(
                MAX_SLIDESHOW_FONT_SIZE,
                Math.max(4, Number(this.slideshowFontSize) || 56),
            );
            this.slideshowFontSize = Math.min(
                MAX_SLIDESHOW_FONT_SIZE,
                Math.max(4, current + delta),
            );
        },
        moveSlideshowText(deltaX, deltaY) {
            this.slideshowOffsetX = clamp(
                this.slideshowOffsetX + deltaX,
                -35,
                35,
            );
            this.slideshowOffsetY = clamp(
                this.slideshowOffsetY + deltaY,
                -35,
                35,
            );
        },
        resetSlideshowPosition() {
            this.slideshowOffsetX = 0;
            this.slideshowOffsetY = 0;
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
                MAX_SLIDESHOW_FONT_SIZE,
                Math.max(4, Number(this.slideshowFontSize) || 56),
            );
            if (!content || !this.currentSlide) {
                this.fittedSlideshowFontSize = preferred;
                this.slideshowFontLimit = MAX_SLIDESHOW_FONT_SIZE;
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
            let high = MAX_SLIDESHOW_FONT_SIZE;
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

            const displayed = this.slideshowStrictSize
                ? preferred
                : Math.min(preferred, best);
            content.style.fontSize = `${displayed}px`;
            this.slideshowFontLimit = best;
            this.fittedSlideshowFontSize = displayed;
            this.scheduleSlideValidation();
        },
        scheduleSlideValidation() {
            if (this.slideValidationFrame) {
                window.cancelAnimationFrame(this.slideValidationFrame);
            }
            this.$nextTick(() => {
                this.slideValidationFrame = window.requestAnimationFrame(() => {
                    this.slideValidationFrame = 0;
                    this.validateAllSlides();
                });
            });
        },
        validateAllSlides() {
            const area = this.$refs.slideshowMeasureArea;
            const content = this.$refs.slideshowMeasureContent;
            if (!area || !content || this.slideshowSequence.length === 0) {
                this.slideshowOverflowIndexes = [];
                return [];
            }

            const preferred = clamp(
                this.slideshowFontSize,
                4,
                MAX_SLIDESHOW_FONT_SIZE,
            );
            const areaRect = area.getBoundingClientRect();
            const overflowIndexes = [];

            const dimensionsFit = size => {
                content.style.fontSize = `${size}px`;
                return (
                    content.scrollHeight <= content.clientHeight + 1 &&
                    content.scrollWidth <= content.clientWidth + 1
                );
            };

            this.slideshowSequence.forEach((slide, index) => {
                content.textContent = lyricsToPlainText(slide.text);
                let displayed = preferred;

                if (!this.slideshowStrictSize) {
                    let low = 4;
                    let high = MAX_SLIDESHOW_FONT_SIZE;
                    let best = 4;
                    while (low <= high) {
                        const size = Math.floor((low + high) / 2);
                        if (dimensionsFit(size)) {
                            best = size;
                            low = size + 1;
                        } else {
                            high = size - 1;
                        }
                    }
                    displayed = Math.min(preferred, best);
                }

                content.style.fontSize = `${displayed}px`;
                const rect = content.getBoundingClientRect();
                const fits =
                    dimensionsFit(displayed) &&
                    rect.left >= areaRect.left - 1 &&
                    rect.right <= areaRect.right + 1 &&
                    rect.top >= areaRect.top - 1 &&
                    rect.bottom <= areaRect.bottom + 1;
                if (!fits) overflowIndexes.push(index);
            });

            content.textContent = '';
            this.slideshowOverflowIndexes = overflowIndexes;
            return overflowIndexes;
        },
        slideOverflows(index) {
            return this.slideshowOverflowIndexes.includes(index);
        },
        confirmUnsafeSettings() {
            const overflowIndexes = this.validateAllSlides();
            if (overflowIndexes.length === 0 || this.overflowSettingsConfirmed) {
                return true;
            }

            const accepted = window.confirm(
                `${overflowIndexes.length} skaidrė(-ės) netelpa su pasirinktais nustatymais. Ar tikrai norite juos naudoti?`,
            );
            this.overflowSettingsConfirmed = accepted;
            return accepted;
        },
        async openPresenterWindow() {
            if (this.sourceSlides.length === 0) return;
            this.prepareSlideshowOptions();
            this.validateAllSlides();
            if (!this.confirmUnsafeSettings()) {
                if (!this.slideshowOpen) this.openSlideshow();
                this.slideshowSettingsOpen = true;
                return;
            }

            if (presenterWindow && !presenterWindow.closed) {
                presenterWindow.focus();
                this.renderPresenterWindow();
                return;
            }

            presenterWindow = window.open(
                '',
                'edeno-aidai-presenter',
                'popup=yes,width=1280,height=720,left=40,top=40',
            );
            if (!presenterWindow) {
                window.alert('Naršyklė užblokavo pristatymo langą. Leiskite iššokančius langus ir bandykite dar kartą.');
                return;
            }

            this.initializePresenterWindow();
            this.presenterConnected = true;
            this.renderPresenterWindow();

            if (presenterPollTimer) window.clearInterval(presenterPollTimer);
            presenterPollTimer = window.setInterval(() => {
                if (!presenterWindow || presenterWindow.closed) {
                    this.presenterConnected = false;
                    presenterWindow = null;
                    window.clearInterval(presenterPollTimer);
                    presenterPollTimer = null;
                }
            }, 500);

            if (typeof window.getScreenDetails === 'function') {
                try {
                    const details = await window.getScreenDetails();
                    const target = details.screens.find(
                        screen => screen !== details.currentScreen,
                    );
                    if (target && presenterWindow && !presenterWindow.closed) {
                        presenterWindow.moveTo(target.availLeft, target.availTop);
                        presenterWindow.resizeTo(target.availWidth, target.availHeight);
                        window.setTimeout(() => this.renderPresenterWindow(), 150);
                    }
                } catch {
                    // The separate window still works when screen permission is denied.
                }
            }
        },
        initializePresenterWindow() {
            if (!presenterWindow || presenterWindow.closed) return;
            presenterWindow.document.open();
            presenterWindow.document.write(`<!doctype html>
<html lang="lt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Edeno Aidai – skaidrės</title><style>
*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0;overflow:hidden;font-family:Avenir,Helvetica,Arial,sans-serif}body{color:#fff;background:radial-gradient(circle at 50% 45%,#263447 0,#111923 48%,#080b10 100%)}body.light{color:#17130d;background:radial-gradient(circle at 50% 45%,#fff 0,#f4efe6 58%,#e8dfd1 100%)}#stage{display:grid;grid-template-rows:76px minmax(0,1fr) 52px;width:100vw;height:100vh}#title{display:flex;align-items:center;justify-content:center;padding:12px 5vw;color:rgba(255,255,255,.72);font-size:clamp(16px,2vw,24px)}body.light #title{color:rgba(23,19,13,.68)}#area{display:grid;min-height:0;overflow:hidden}#content{align-self:center;justify-self:center;width:min(1200px,86vw);max-height:100%;overflow:hidden;padding:30px 0;font-weight:600;line-height:1.32;text-align:center;text-wrap:balance;white-space:pre-line;overflow-wrap:anywhere;text-shadow:0 3px 16px rgba(0,0,0,.55);transform:translate(var(--offset-x),var(--offset-y));pointer-events:none}body.light #content{text-shadow:0 2px 10px rgba(75,52,20,.18)}body.no-wrap #content{white-space:pre;text-wrap:nowrap;overflow-wrap:normal}#counter{display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.68);font-size:18px}body.light #counter{color:rgba(23,19,13,.68)}.zone{position:fixed;top:0;bottom:0;width:50%;border:0;background:transparent;cursor:pointer}.zone.left{left:0}.zone.right{right:0}
</style></head><body><div id="stage"><div id="title"></div><div id="area"><div id="content"></div></div><div id="counter"></div></div><button class="zone left" aria-label="Ankstesnė skaidrė"></button><button class="zone right" aria-label="Kita skaidrė"></button></body></html>`);
            presenterWindow.document.close();
            presenterWindow.document.querySelector('.zone.left').onclick = () =>
                this.previousSlide();
            presenterWindow.document.querySelector('.zone.right').onclick = () =>
                this.nextSlide();
            presenterWindow.addEventListener('keydown', this.onSlideshowKeydown);
        },
        renderPresenterWindow() {
            if (!presenterWindow || presenterWindow.closed) return;
            const doc = presenterWindow.document;
            const content = doc.getElementById('content');
            const title = doc.getElementById('title');
            const counter = doc.getElementById('counter');
            if (!content || !title || !counter) return;

            doc.body.classList.toggle('light', this.slideshowTheme === 'light');
            doc.body.classList.toggle('no-wrap', !this.slideshowWrapLines);
            doc.body.style.setProperty('--offset-x', `${this.slideshowOffsetX}vw`);
            doc.body.style.setProperty('--offset-y', `${this.slideshowOffsetY}vh`);
            title.textContent = `${this.song.songId} ${this.song.title}`;
            content.textContent = this.currentSlideText || 'Nėra pasirinktų skaidrių';
            counter.textContent = `${this.slideshowSlides.length ? this.slideshowIndex + 1 : 0} / ${this.slideshowSlides.length}`;

            const preferred = clamp(
                this.slideshowFontSize,
                4,
                MAX_SLIDESHOW_FONT_SIZE,
            );
            let displayed = preferred;
            if (!this.slideshowStrictSize && this.currentSlide) {
                let low = 4;
                let high = MAX_SLIDESHOW_FONT_SIZE;
                let best = 4;
                while (low <= high) {
                    const size = Math.floor((low + high) / 2);
                    content.style.fontSize = `${size}px`;
                    const fits =
                        content.scrollHeight <= content.clientHeight + 1 &&
                        content.scrollWidth <= content.clientWidth + 1;
                    if (fits) {
                        best = size;
                        low = size + 1;
                    } else {
                        high = size - 1;
                    }
                }
                displayed = Math.min(preferred, best);
            }
            content.style.fontSize = `${displayed}px`;
        },
        closePresenterWindow() {
            if (presenterPollTimer) {
                window.clearInterval(presenterPollTimer);
                presenterPollTimer = null;
            }
            if (presenterWindow && !presenterWindow.closed) {
                presenterWindow.close();
            }
            presenterWindow = null;
            this.presenterConnected = false;
        },
        slideOptionTitle(slide, index) {
            const number = this.slideshowSequence
                .slice(0, index + 1)
                .filter(item => item.isChorus === slide.isChorus).length;
            return slide.isChorus ? `Priegiesmis ${number}` : `Posmas ${number}`;
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
    border: 1px solid var(--app-border);
    border-radius: 20px;
    color: var(--app-text);
    background-color: var(--app-surface);
    box-shadow: 0 5px 14px rgba(0, 0, 0, 0.12);
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
    color: var(--app-text);
    transition: background-color 0.3s, color 0.3s;
    font-weight: normal;
}

.image-format-button.selected {
    background-color: var(--app-accent);
    color: #2b2114;
    font-weight: bold;
}

.image-format-button:hover:not(.selected) {
    background-color: var(--app-hover);
    color: var(--app-text);
}

.song__navigation-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-width: 70px;
    min-height: 46px;
    padding: 8px 13px;
    border: 0;
    border-radius: 13px;
    color: var(--app-text);
    background: var(--app-surface-soft);
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.18s ease, transform 0.18s ease;
}

.song__navigation-button:focus {
    outline: none;
}

.song__navigation-button:hover:not([disabled]) {
    background-color: var(--app-hover);
    transform: translateY(-1px);
}

.song__slideshow-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 42px;
    padding: 8px 13px;
    border: 0;
    border-radius: 11px;
    color: #2b2114;
    background: #d9b26f;
    font-weight: 700;
    cursor: pointer;
}

.song__presenter-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 42px;
    padding: 7px 10px;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    color: var(--app-text);
    background: transparent;
    font-weight: 700;
    cursor: pointer;

    &.is-active {
        border-color: var(--app-accent);
        background: var(--app-accent-soft);
    }
}

.song__action-group {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-right: 1px solid var(--app-border);
    border-left: 1px solid var(--app-border);
}

.song__action-button {
    min-width: 42px;
    min-height: 42px;
    padding: 7px;
    border: 0;
    border-radius: 11px;
    color: var(--app-text);
    background: transparent;
    font-weight: 700;
    cursor: pointer;
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
    color: var(--app-text);
    fill: currentColor;
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
    background-color: var(--app-hover);
}

.song {
    &__title {
        font-size: 20px;
        text-align: center;
        width: auto;
        margin: 0 0 10px;
        padding: 2px 70px 12px;
        border-bottom: 1px solid var(--app-border);
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
        justify-content: space-between;
        align-items: center;
        display: flex;
        gap: 6px;
        width: min(720px, 100%);
        box-sizing: border-box;
        margin: 12px auto 14px;
        padding: 7px;
        border: 1px solid var(--app-border);
        border-radius: 18px;
        background: var(--app-surface);
        box-shadow: var(--app-shadow);
    }

    &__favorite-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 42px;
        min-height: 42px;
        font-size: 20px;
        line-height: 1;
        padding: 7px;
        border: none;
        border-radius: 11px;
        color: rgba(228, 179, 99, 1);
        background: transparent;
        cursor: pointer;

        &.is-active {
            background: var(--app-accent-soft);
        }
    }

    &__theme-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 42px;
        padding: 7px 10px;
        border: 0;
        border-radius: 11px;
        color: var(--app-text);
        background: transparent;
        font-weight: 700;
        cursor: pointer;
    }

    &__presenter-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        width: fit-content;
        max-width: 100%;
        margin: -4px auto 14px;
        padding: 7px 10px;
        border: 1px solid var(--app-border);
        border-radius: 12px;
        background: var(--app-surface-soft);
        font-size: 13px;

        button {
            min-height: 30px;
            padding: 4px 9px;
            border: 1px solid var(--app-border);
            border-radius: 8px;
            color: var(--app-text);
            background: var(--app-surface);
            cursor: pointer;
        }

        button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
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

@media (max-width: 560px) {
    .song {
        &__title {
            padding-right: 8px;
            padding-left: 8px;
        }

        &__buttons {
            gap: 3px;
            padding: 5px;
            border-radius: 15px;
        }
    }

    .song__navigation-button {
        min-width: 49px;
        min-height: 42px;
        gap: 4px;
        padding: 6px 7px;
        font-size: 15px;
    }

    .song__action-group {
        gap: 1px;
        padding: 2px 4px;
    }

    .song__action-button,
    .song__favorite-button,
    .song__theme-button,
    .song__presenter-button {
        min-width: 34px;
        min-height: 38px;
        padding: 5px;
    }

    .song__theme-label,
    .song__presenter-label,
    .song__slideshow-label {
        display: none;
    }

    .song__slideshow-button {
        min-width: 36px;
        min-height: 38px;
        padding: 6px;
        font-size: 14px;
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
    &__settings-button,
    &__presenter-button {
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

    &__presenter-button {
        right: 142px;
        font-size: 28px;
        line-height: 42px;

        &.is-active {
            border-color: #d9b26f;
            color: #17130d;
            background: #d9b26f;
        }
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
        transform: translate(
            var(--lyrics-offset-x, 0),
            var(--lyrics-offset-y, 0)
        );
        pointer-events: none;
    }

    &--no-wrap &__content {
        white-space: pre;
        text-wrap: nowrap;
        overflow-wrap: normal;
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
    &__slide-option {
        display: flex;
        align-items: center;
    }

    &__more-button {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--lyrics-show-border);
        border-radius: 9px;
        color: var(--lyrics-show-text);
        background: var(--lyrics-show-control);
        font-weight: 700;
        cursor: pointer;
    }

    &__advanced {
        display: grid;
        gap: 16px;
        margin-top: 14px;
    }

    &__advanced-block {
        h3 {
            margin-bottom: 8px;
        }
    }

    &__toggle-row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 11px;
        border-radius: 9px;
        background: var(--lyrics-show-panel-soft);
        cursor: pointer;

        input {
            width: 19px;
            height: 19px;
            accent-color: #d9b26f;
        }

        strong,
        small {
            display: block;
        }

        small {
            margin-top: 3px;
            color: var(--lyrics-show-muted);
        }
    }

    &__position-control {
        display: grid;
        grid-template-columns: repeat(3, 42px);
        grid-template-rows: repeat(3, 38px);
        justify-content: center;
        gap: 5px;

        button {
            border: 1px solid var(--lyrics-show-border);
            border-radius: 8px;
            color: var(--lyrics-show-text);
            background: var(--lyrics-show-control);
            font-size: 19px;
            cursor: pointer;

            &:nth-child(1) {
                grid-column: 2;
            }

            &:nth-child(2) {
                grid-row: 2;
                grid-column: 1;
            }

            &:nth-child(3) {
                grid-row: 2;
                grid-column: 2;
            }

            &:nth-child(4) {
                grid-row: 2;
                grid-column: 3;
            }

            &:nth-child(5) {
                grid-row: 3;
                grid-column: 2;
            }
        }
    }

    &__overflow-alert {
        display: grid;
        gap: 4px;
        padding: 11px 12px;
        border: 1px solid #ef9b5d;
        border-radius: 9px;
        color: #fff4e9;
        background: rgba(174, 71, 26, 0.42);
        font-size: 13px;
    }

    &--light &__overflow-alert {
        color: #712600;
        background: #fff0df;
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

        &--overflow {
            outline: 1px solid #ef9b5d;
            background: rgba(174, 71, 26, 0.2);
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

    &__overflow-mark {
        display: grid;
        flex: 0 0 auto;
        width: 25px;
        height: 25px;
        place-items: center;
        border-radius: 50%;
        color: #281003;
        background: #ef9b5d;
        font-size: 17px;
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

        &__presenter-button {
            top: 10px;
            right: 110px;
            width: 42px;
            height: 42px;
            font-size: 24px;
            line-height: 36px;
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

.lyrics-measure-stage {
    position: fixed;
    inset: 0;
    z-index: -1000;
    display: grid;
    grid-template-rows: 76px minmax(0, 1fr) 82px;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    visibility: hidden;
    pointer-events: none;

    &__area {
        display: grid;
        min-height: 0;
        overflow: hidden;
    }

    &__content {
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
        transform: translate(
            var(--lyrics-offset-x, 0),
            var(--lyrics-offset-y, 0)
        );
    }

    &--no-wrap &__content {
        white-space: pre;
        text-wrap: nowrap;
        overflow-wrap: normal;
    }
}
</style>
