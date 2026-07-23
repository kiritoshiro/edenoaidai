<!-- eslint-disable vue/no-v-html -->
<template>
    <div v-if="song" class="song">
        <header class="song-topbar">
            <router-link to="/" class="song-topbar__back">
                <svg class="song-ui-icon" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="m15 18-6-6 6-6" />
                </svg>
                <span>Visos giesmės</span>
            </router-link>

            <div class="song-topbar__actions">
                <button
                    class="song-topbar__icon-button song__favorite-button"
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
                    class="song-topbar__icon-button song__theme-button"
                    :aria-label="isDark ? 'Įjungti šviesią temą' : 'Įjungti tamsią temą'"
                    :title="isDark ? 'Šviesi tema' : 'Tamsi tema'"
                    @click="toggleTheme"
                >
                    <span aria-hidden="true">{{ isDark ? '☀' : '☾' }}</span>
                </button>
            </div>
        </header>

        <section class="song-heading" aria-labelledby="song-title">
            <div class="song-heading__number-row">
                <button
                    class="song-heading__navigation song-heading__navigation--previous"
                    :disabled="!previousSongId"
                    :aria-label="previousSongId ? `Ankstesnė giesmė ${previousSongId}` : 'Ankstesnės giesmės nėra'"
                    @click="goTo(previousSongId)"
                >
                    <svg class="song-ui-icon" aria-hidden="true" viewBox="0 0 24 24">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    <strong>{{ previousSongId || '—' }}</strong>
                </button>

                <span class="song-heading__number">
                    <span class="song-heading__number-label">Giesmė</span>
                    <span class="song-heading__number-value">{{ song.songId }}</span>
                </span>

                <button
                    class="song-heading__navigation song-heading__navigation--next"
                    :disabled="!nextSongId"
                    :aria-label="nextSongId ? `Kita giesmė ${nextSongId}` : 'Kitos giesmės nėra'"
                    @click="goTo(nextSongId)"
                >
                    <strong>{{ nextSongId || '—' }}</strong>
                    <svg class="song-ui-icon" aria-hidden="true" viewBox="0 0 24 24">
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                </button>
            </div>
            <h1 id="song-title" ref="songTitle">{{ song.title }}</h1>
            <p
                ref="songVerse"
                class="song-heading__verse"
                :aria-hidden="song.verse ? undefined : 'true'"
            >
                <em>{{ song.verse || '\u00a0' }}</em>
            </p>
        </section>

        <div
            class="song-action-row"
            :class="{
                'song-action-row--audio-only': !sourceSlides.length,
            }"
        >
            <section
                class="song-audio song-panel"
                :class="{ 'song-audio--empty': !audioTypes.length }"
                aria-labelledby="song-audio-title"
            >
                <div class="song-audio__header">
                    <label class="song-audio__selector" for="song-audio-type">
                        <span id="song-audio-title">Garso įrašo tipas</span>
                        <select
                            id="song-audio-type"
                            v-model="selectedAudioType"
                            :disabled="!audioTypes.length"
                        >
                            <option v-if="!audioTypes.length" value="">
                                Garso įrašų nėra
                            </option>
                            <option
                                v-for="type in audioTypes"
                                :key="type"
                                :value="type"
                            >
                                {{ audioTypeLabel(type) }}
                            </option>
                        </select>
                    </label>
                    <div
                        v-if="audioTypes.length > 1"
                        class="song-audio__types"
                        aria-label="Garso įrašo versija"
                    >
                        <button
                            v-for="type in audioTypes"
                            :key="type"
                            type="button"
                            class="song-audio__type"
                            :class="{ 'is-selected': selectedAudioType === type }"
                            :aria-pressed="selectedAudioType === type"
                            :aria-label="`Pasirinkti: ${audioTypeLabel(type)}`"
                            :title="audioTypeLabel(type)"
                            @click="selectedAudioType = type"
                        >
                            <span class="song-audio__type-icon" aria-hidden="true">
                                <song-icon :name="type" />
                            </span>
                        </button>
                    </div>
                    <div
                        v-else-if="audioTypes.length === 1"
                        class="song-audio__type song-audio__type--single is-selected"
                        role="img"
                        :aria-label="audioTypeLabel(audioTypes[0])"
                        :title="audioTypeLabel(audioTypes[0])"
                    >
                        <span class="song-audio__type-icon" aria-hidden="true">
                            <song-icon :name="audioTypes[0]" />
                        </span>
                    </div>
                </div>

                <audio
                    v-if="audioTypes.length"
                    ref="audioElement"
                    :key="`${selectedAudioType}-${song.songId}`"
                    class="song-audio__element"
                    :src="selectedAudioUrl"
                    preload="metadata"
                    @loadedmetadata="syncAudioMetadata"
                    @durationchange="syncAudioMetadata"
                    @timeupdate="syncAudioTime"
                    @play="audioPlaying = true"
                    @pause="audioPlaying = false"
                    @ended="audioPlaying = false"
                ></audio>

                <div class="song-audio__controls">
                    <button
                        type="button"
                        class="song-audio__play"
                        :disabled="!audioTypes.length"
                        :aria-label="audioPlaying ? 'Pristabdyti įrašą' : 'Paleisti įrašą'"
                        @click="toggleAudio"
                    >
                        <span aria-hidden="true">{{ audioPlaying ? '❚❚' : '▶' }}</span>
                        <span>{{ audioPlaying ? 'Pristabdyti' : 'Klausyti' }}</span>
                    </button>
                    <div class="song-audio__timeline">
                        <input
                            class="song-audio__progress"
                            type="range"
                            min="0"
                            :max="audioDuration || 0"
                            step="0.1"
                            :value="audioCurrentTime"
                            :disabled="!audioDuration"
                            aria-label="Įrašo pozicija"
                            @input="seekAudio"
                        />
                        <div class="song-audio__times" aria-hidden="true">
                            <span class="song-audio__time">{{ formatMediaTime(audioCurrentTime) }}</span>
                            <span class="song-audio__time">{{ formatMediaTime(audioDuration) }}</span>
                        </div>
                    </div>
                    <div
                        ref="volumeControl"
                        class="song-audio__volume"
                        :class="{ 'is-open': volumeControlOpen }"
                        @keydown.esc.stop.prevent="volumeControlOpen = false"
                    >
                        <button
                            type="button"
                            class="song-audio__volume-toggle"
                            :disabled="!audioTypes.length"
                            :aria-expanded="volumeControlOpen"
                            aria-label="Keisti garsumą"
                            title="Garsumas"
                            @click="toggleVolumeControl"
                        >
                            <svg
                                class="song-ui-icon"
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                            >
                                <path d="M11 5 6.5 9H3v6h3.5L11 19Z" />
                                <path
                                    v-if="audioVolume > 0"
                                    d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7.5 7.5 0 0 1 0 10"
                                />
                                <path v-else d="m15 9 6 6m0-6-6 6" />
                            </svg>
                        </button>
                        <div
                            v-if="volumeControlOpen"
                            class="song-audio__volume-popover"
                        >
                            <input
                                ref="volumeSlider"
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                :value="audioVolume"
                                :disabled="!audioTypes.length"
                                aria-label="Garsumas"
                                @input="setAudioVolume"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        class="song-audio__mute"
                        :disabled="!audioTypes.length"
                        :aria-pressed="audioVolume === 0"
                        :aria-label="
                            audioVolume === 0
                                ? 'Įjungti garsą'
                                : 'Išjungti garsą'
                        "
                        :title="
                            audioVolume === 0
                                ? 'Įjungti garsą'
                                : 'Išjungti garsą'
                        "
                        @click="toggleAudioMute"
                    >
                        <svg class="song-ui-icon" aria-hidden="true" viewBox="0 0 24 24">
                            <path d="M11 5 6.5 9H3v6h3.5L11 19Z" />
                            <path
                                v-if="audioVolume > 0"
                                d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7.5 7.5 0 0 1 0 10"
                            />
                            <path v-else d="m15 9 6 6m0-6-6 6" />
                        </svg>
                    </button>
                </div>
            </section>

            <section
                v-if="sourceSlides.length"
                class="song-switcher"
                aria-label="Skaidrių veiksmai"
            >
                <button
                    class="song__slideshow-button song-switcher__slideshow"
                    aria-label="Rodyti skaidres"
                    title="Skaidrės"
                    @click="openSlideshow"
                >
                    <svg class="song-ui-icon" aria-hidden="true" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="13" rx="2" />
                        <path d="M8 21h8M12 17v4M7 8h10M7 12h7" />
                    </svg>
                    <span>Skaidrės</span>
                </button>
            </section>
        </div>

        <article class="song-lyrics song-panel" aria-labelledby="song-lyrics-title">
            <header class="song-lyrics__header">
                <h2 id="song-lyrics-title">Giesmės žodžiai</h2>
                <div class="song-lyrics__text-size" aria-label="Teksto dydis">
                    <button
                        type="button"
                        aria-label="Mažinti giesmės tekstą"
                        @click="adjustFontSize(-2)"
                    >
                        A−
                    </button>
                    <span>{{ fontSizePercent }}%</span>
                    <button
                        type="button"
                        aria-label="Didinti giesmės tekstą"
                        @click="adjustFontSize(2)"
                    >
                        A+
                    </button>
                </div>
            </header>

            <div class="song__body" :style="fontSizeStyle">
                <section
                    v-for="(block, index) in readingBlocks"
                    :key="`${block.isChorus ? 'chorus' : 'verse'}-${index}`"
                    :class="block.isChorus ? 'song-chorus' : 'song-stanza'"
                >
                    <template v-if="block.isChorus">
                        <span class="song-chorus__label">Priegiesmis</span>
                        <div class="song-chorus__text">{{ block.text }}</div>
                    </template>
                    <template v-else>
                        <span class="song-stanza__number">{{ block.number }}.</span>
                        <div class="song-stanza__text">{{ block.text }}</div>
                    </template>
                </section>
            </div>
        </article>

        <section v-if="hasNotes" class="song-notes song-panel">
            <div class="song-notes__summary">
                <button
                    type="button"
                    class="song-notes__main"
                    :aria-expanded="notesVisible"
                    @click="notesVisible = !notesVisible"
                >
                    <span class="song-notes__icon" aria-hidden="true">♫</span>
                    <span class="song-notes__copy">
                        <strong>Natos</strong>
                        <small>
                            {{ availableNoteFormats.length }}
                            natų
                            {{ availableNoteFormats.length === 1 ? 'formatas' : 'formatai' }}
                            · {{ imageUrls.length }}
                            {{ imageUrls.length === 1 ? 'puslapis' : 'puslapiai' }}
                        </small>
                    </span>
                    <span class="song-notes__chevron" aria-hidden="true">⌄</span>
                </button>

                <button
                    type="button"
                    class="song-notes__fullscreen"
                    aria-label="Padidinti natas ir atidaryti per visą ekraną"
                    @click="openNotesFullscreen"
                >
                    <span class="song-notes__fullscreen-icon" aria-hidden="true">⛶</span>
                    <span class="song-notes__fullscreen-copy">
                        <strong>Padidinti natas</strong>
                        <small>Atidaryti per visą ekraną</small>
                    </span>
                </button>
            </div>

            <div v-show="notesVisible" class="song-notes__content">
                <div class="song-notes__format-row">
                    <span>Natų formatas</span>
                    <div
                        v-if="availableNoteFormats.length > 1"
                        class="image-format-container"
                        aria-label="Natų formatas"
                    >
                        <button
                            v-for="format in availableNoteFormats"
                            :key="format"
                            type="button"
                            :class="[
                                'image-format-button',
                                { selected: imageType === format },
                            ]"
                            @click="selectNoteFormat(format)"
                        >
                            {{ noteFormatLabel(format) }}
                        </button>
                    </div>
                    <strong v-else class="song-notes__single-format">
                        {{ noteFormatLabel(availableNoteFormats[0]) }}
                    </strong>
                </div>

                <div
                    class="song-image"
                    :class="{ 'song-image--svg': imageType === 'svg' }"
                >
                    <div v-for="(url, index) in imageUrls" :key="url">
                        <div v-if="!imageLoaded[index]" class="image-loader"></div>
                        <img
                            v-if="!imageErrored[index]"
                            v-show="imageLoaded[index]"
                            :src="url"
                            :alt="`Giesmės ${song.songId} natų ${index + 1} puslapis`"
                            @load="imageLoaded[index] = true"
                            @error="onImageError(index)"
                        />
                    </div>
                </div>
            </div>
        </section>

        <section
            v-if="song.copyright"
            class="song-details song-panel"
            aria-labelledby="song-details-title"
        >
            <div class="song-details__icon" aria-hidden="true">i</div>
            <div>
                <h2 id="song-details-title">Apie giesmę</h2>
                <div class="song-details__content" v-html="song.copyright"></div>
            </div>
        </section>
    </div>

    <Teleport to="body">
        <div
            v-if="notesFullscreenOpen && imageUrls.length"
            class="notes-viewer"
            :class="{
                'notes-viewer--dark': isDark,
                'notes-viewer--svg': imageType === 'svg',
            }"
            role="dialog"
            aria-modal="true"
            aria-label="Natos per visą ekraną"
        >
            <header class="notes-viewer__header">
                <strong>{{ song.songId }} {{ song.title }}</strong>
                <div class="notes-viewer__toolbar">
                    <div class="notes-viewer__controls">
                        <div
                            v-if="availableNoteFormats.length > 1"
                            class="notes-viewer__formats"
                        >
                            <button
                                v-for="format in availableNoteFormats"
                                :key="format"
                                type="button"
                                :class="{ selected: imageType === format }"
                                @click="selectNoteFormat(format)"
                            >
                                {{ noteFormatLabel(format) }}
                            </button>
                        </div>
                        <div class="notes-viewer__zoom-controls">
                            <button
                                type="button"
                                aria-label="Mažinti natas"
                                @click="adjustNotesZoom(-0.25)"
                            >
                                −
                            </button>
                            <button
                                type="button"
                                class="notes-viewer__zoom"
                                @click="notesZoom = 1"
                            >
                                {{ Math.round(notesZoom * 100) }}%
                            </button>
                            <button
                                type="button"
                                aria-label="Didinti natas"
                                @click="adjustNotesZoom(0.25)"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="notes-viewer__close"
                        aria-label="Uždaryti natas"
                        @click="closeNotesFullscreen"
                    >
                        <span aria-hidden="true">←</span>
                        Atgal
                    </button>
                </div>
            </header>

            <div ref="notesViewport" class="notes-viewer__viewport">
                <div class="notes-viewer__pages">
                    <img
                        v-for="(url, index) in imageUrls"
                        :key="url"
                        :src="url"
                        :alt="`Giesmės ${song.songId} natų ${index + 1} puslapis`"
                        :style="notesImageStyle"
                    />
                </div>
            </div>
        </div>
    </Teleport>

    <Teleport to="body">
        <div
            v-if="slideshowOpen"
            ref="slideshow"
            class="lyrics-show"
            :class="{
                'lyrics-show--light': slideshowTheme === 'light',
                'lyrics-show--no-wrap': !slideshowWrapLines,
                'lyrics-show--controller': presenterConnected,
            }"
            :style="slideshowStyle"
            role="dialog"
            aria-modal="true"
            aria-label="Giesmės skaidrės"
        >
            <button
                v-if="!presenterConnected"
                class="lyrics-show__click-zone lyrics-show__click-zone--left"
                :disabled="slideshowSettingsOpen || slideshowIndex === 0"
                tabindex="-1"
                aria-label="Ankstesnė skaidrė"
                @click="previousSlide"
            ></button>
            <button
                v-if="!presenterConnected"
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
                :disabled="phoneViewport"
                :aria-label="
                    phoneViewport
                        ? 'Kitas ekranas telefone nepasiekiamas'
                        : presenterConnected
                          ? 'Uždaryti kitą ekraną'
                          : 'Rodyti skaidres kitame ekrane'
                "
                :title="
                    phoneViewport
                        ? 'Telefone ši funkcija nepasiekiama'
                        : presenterConnected
                          ? 'Uždaryti kitą ekraną'
                          : 'Kitas ekranas'
                "
                @click.stop="togglePresenterWindow"
            >
                ▱
            </button>

            <button
                v-if="presenterConnected"
                class="lyrics-show__songs-button"
                aria-label="Atidaryti giesmių galeriją"
                title="Giesmių galerija"
                @click.stop="openSongGallery"
            >
                <span aria-hidden="true">☰</span>
                <span class="lyrics-show__songs-label">Giesmės</span>
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

            <section class="lyrics-show__stage">
                <div v-if="presenterConnected" class="lyrics-show__overview">
                    <button
                        v-for="(slide, index) in slideshowSlides"
                        :key="`${song.songId}-${index}-${slide.text}`"
                        type="button"
                        ref="slidePreviewButtons"
                        class="lyrics-show__preview"
                        :class="{
                            'is-active': index === slideshowIndex,
                            'is-chorus': slide.isChorus,
                        }"
                        @click="selectSlide(index)"
                    >
                        <strong>{{ presentationSlideTitle(slide, index) }}</strong>
                        <span>{{ slide.text }}</span>
                    </button>
                    <p v-if="slideshowSlides.length === 0" class="lyrics-show__empty">
                        Nustatymuose pasirinkite bent vieną stulpelį.
                    </p>

                    <section
                        v-if="audioTypes.length"
                        class="lyrics-show__audio"
                        aria-label="Giesmės garso įrašas"
                    >
                        <div class="lyrics-show__audio-heading">
                            <div>
                                <small>Garso įrašas</small>
                                <strong>{{ audioTypeLabel(selectedAudioType) }}</strong>
                            </div>
                            <select
                                v-if="audioTypes.length > 1"
                                v-model="selectedAudioType"
                                aria-label="Įrašo versija"
                            >
                                <option
                                    v-for="type in audioTypes"
                                    :key="type"
                                    :value="type"
                                >
                                    {{ audioTypeLabel(type) }}
                                </option>
                            </select>
                        </div>

                        <div class="lyrics-show__audio-controls">
                            <button
                                type="button"
                                class="lyrics-show__audio-play"
                                :aria-label="
                                    audioPlaying
                                        ? 'Pristabdyti įrašą'
                                        : 'Paleisti įrašą'
                                "
                                @click="toggleAudio"
                            >
                                <span aria-hidden="true">
                                    {{ audioPlaying ? '❚❚' : '▶' }}
                                </span>
                                {{ audioPlaying ? 'Pristabdyti' : 'Paleisti' }}
                            </button>
                            <span class="lyrics-show__audio-time">
                                {{ formatMediaTime(audioCurrentTime) }}
                            </span>
                            <input
                                class="lyrics-show__audio-progress"
                                type="range"
                                min="0"
                                :max="audioDuration || 0"
                                step="0.1"
                                :value="audioCurrentTime"
                                :disabled="!audioDuration"
                                aria-label="Įrašo pozicija"
                                @input="seekAudio"
                            />
                            <span class="lyrics-show__audio-time">
                                {{ formatMediaTime(audioDuration) }}
                            </span>
                            <label class="lyrics-show__audio-volume" title="Garsumas">
                                <span aria-hidden="true">♪</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    :value="audioVolume"
                                    aria-label="Garsumas"
                                    @input="setAudioVolume"
                                />
                            </label>
                        </div>
                    </section>
                </div>
                <div
                    v-else
                    ref="slideshowContent"
                    class="lyrics-show__content"
                    role="main"
                >
                    <span v-if="currentSlide">{{ currentSlideText }}</span>
                    <span v-else class="lyrics-show__empty">
                        Nustatymuose pasirinkite bent vieną stulpelį.
                    </span>
                </div>
            </section>

            <dialog
                v-if="slideshowSettingsOpen"
                ref="slideshowSettingsDialog"
                class="lyrics-show__settings"
                :style="slideshowSettingsStyle"
                aria-label="Skaidrių nustatymai"
                @cancel.prevent="closeSlideshowSettings"
                @click.stop
            >
                <div
                    class="lyrics-show__settings-header"
                    :class="{
                        'lyrics-show__settings-header--dragging':
                            slideshowSettingsDragging,
                    }"
                    @pointerdown="startSlideshowSettingsDrag"
                >
                    <div class="lyrics-show__settings-heading">
                        <span
                            v-if="!phoneViewport"
                            class="lyrics-show__drag-mark"
                            aria-hidden="true"
                        >
                            ⠿
                        </span>
                        <h2>Skaidrių nustatymai</h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Uždaryti nustatymus"
                        @click="closeSlideshowSettings"
                    >
                        ×
                    </button>
                </div>

                <button
                    type="button"
                    class="lyrics-show__defaults-button"
                    @click="resetSlideshowSettings"
                >
                    <span aria-hidden="true">↺</span>
                    Numatytieji nustatymai
                </button>

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
            </dialog>

            <aside
                v-if="songGalleryOpen"
                class="lyrics-show__song-gallery"
                aria-label="Giesmių galerija"
                @click.stop
            >
                <div class="lyrics-show__settings-header">
                    <div>
                        <h2>Giesmės</h2>
                        <p>Pasirinkta giesmė iš karto pasirodys kitame ekrane.</p>
                    </div>
                    <button
                        type="button"
                        aria-label="Uždaryti giesmių galeriją"
                        @click="songGalleryOpen = false"
                    >
                        ×
                    </button>
                </div>
                <label class="lyrics-show__song-search">
                    <span>Ieškoti</span>
                    <input
                        v-model.trim="songSearch"
                        type="search"
                        placeholder="Numeris arba pavadinimas"
                        autocomplete="off"
                    />
                </label>
                <div class="lyrics-show__song-list">
                    <button
                        v-for="catalogSong in filteredSongCatalog"
                        :key="catalogSong.songId"
                        type="button"
                        :class="{ 'is-active': catalogSong.songId === song.songId }"
                        @click="selectPresentationSong(catalogSong.songId)"
                    >
                        <strong>{{ catalogSong.songId }}</strong>
                        <span>{{ catalogSong.title }}</span>
                    </button>
                    <p v-if="filteredSongCatalog.length === 0">
                        Giesmių nerasta.
                    </p>
                </div>
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
const DEFAULT_LYRICS_FONT_SIZE = 22;
const MOBILE_LYRICS_FONT_SIZE = 18;
const DEFAULT_SLIDESHOW_FONT_SIZE = 36;
let presenterWindow = null;
let presenterPollTimer = null;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
}

function initialLyricsFontSize() {
    const stored = parseInt(localStorage.getItem('fontSize'), 10);
    const compact = window.matchMedia('(max-width: 720px)').matches;
    const migrationKey = 'mobileLyricsDefault18';

    if (compact && localStorage.getItem(migrationKey) !== 'true') {
        localStorage.setItem(migrationKey, 'true');
        if (!stored || [DEFAULT_LYRICS_FONT_SIZE, 24, 20].includes(stored)) {
            localStorage.setItem('fontSize', String(MOBILE_LYRICS_FONT_SIZE));
            return MOBILE_LYRICS_FONT_SIZE;
        }
    }

    return stored || (compact ? MOBILE_LYRICS_FONT_SIZE : DEFAULT_LYRICS_FONT_SIZE);
}

function initialSlideshowFontSize() {
    const stored = parseInt(localStorage.getItem('slideshowFontSize'), 10);
    const migrationKey = 'slideshowDefault36';

    if (localStorage.getItem(migrationKey) !== 'true') {
        localStorage.setItem(migrationKey, 'true');
        if (!stored || stored === 56) {
            localStorage.setItem(
                'slideshowFontSize',
                String(DEFAULT_SLIDESHOW_FONT_SIZE),
            );
            return DEFAULT_SLIDESHOW_FONT_SIZE;
        }
    }

    return stored || DEFAULT_SLIDESHOW_FONT_SIZE;
}

function normalizeSearch(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('lt');
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
            chorusPart: false,
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
            songCatalog: [],
            imageType:
                localStorage.getItem('notesFormat') === 'svg' ? 'svg' : 'jpg',
            preferredNoteFormat:
                localStorage.getItem('notesFormat') === 'svg' ? 'svg' : 'jpg',
            imageLoaded: [],
            imageErrored: [],
            notesFullscreenOpen: false,
            notesHistoryOwned: false,
            notesOpening: false,
            notesVisible: localStorage.getItem('notesVisible') === 'true',
            notesZoom: 1,
            previousNotesBodyOverflow: '',
            selectedAudioType: '',
            audioPlaying: false,
            audioCurrentTime: 0,
            audioDuration: 0,
            audioVolume: 0.85,
            audioVolumeBeforeMute: 0.85,
            volumeControlOpen: false,
            trackLabels: {},
            fontSize: initialLyricsFontSize(),
            slideshowOpen: false,
            slideshowIndex: 0,
            fullscreenActive: false,
            preserveSlideshowOnFullscreenExit: false,
            previousBodyOverflow: '',
            slideshowSettingsOpen: false,
            slideshowSettingsX: null,
            slideshowSettingsY: null,
            slideshowSettingsDragging: false,
            slideshowSettingsDragOffsetX: 0,
            slideshowSettingsDragOffsetY: 0,
            slideshowTheme:
                localStorage.getItem('slideshowTheme') === 'dark'
                    ? 'dark'
                    : 'light',
            slideshowFontSize: clamp(
                initialSlideshowFontSize(),
                8,
                MAX_SLIDESHOW_FONT_SIZE,
            ),
            fittedSlideshowFontSize: DEFAULT_SLIDESHOW_FONT_SIZE,
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
            slideValidationFrame: 0,
            headingFitFrame: 0,
            songNavigationDirection: 0,
            songNavigationIndex: -1,
            songNavigationRepeatCount: 0,
            songNavigationTimer: 0,
            presenterConnected: false,
            presenterOpening: false,
            phoneViewport: window.matchMedia('(max-width: 720px)').matches,
            songGalleryOpen: false,
            songSearch: '',
        };
    },
    computed: {
        isDark() {
            return appTheme.value === 'dark';
        },
        fontSizeStyle() {
            return { fontSize: `${this.fontSize}px` };
        },
        fontSizePercent() {
            const defaultSize = this.phoneViewport
                ? MOBILE_LYRICS_FONT_SIZE
                : DEFAULT_LYRICS_FONT_SIZE;
            return Math.round(
                (this.fontSize / defaultSize) * 100,
            );
        },
        audioTypes() {
            return Array.isArray(this.song?.lists)
                ? this.song.lists.filter(Boolean)
                : [];
        },
        selectedAudioUrl() {
            return this.selectedAudioType
                ? this.audioUrl(this.selectedAudioType)
                : '';
        },
        availableNoteFormats() {
            const detected = this.song?.notePages;
            if (detected && typeof detected === 'object') {
                return ['svg', 'jpg'].filter(
                    format =>
                        Array.isArray(detected[format]) &&
                        detected[format].length > 0,
                );
            }

            const legacyCount = Number(this.song?.pages) || 0;
            return legacyCount > 0 ? ['svg', 'jpg'] : [];
        },
        hasNotes() {
            return this.availableNoteFormats.length > 0;
        },
        notePageIndexes() {
            const detected = this.song?.notePages?.[this.imageType];
            if (Array.isArray(detected)) {
                return detected;
            }

            if (this.song?.notePages && typeof this.song.notePages === 'object') {
                return [];
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
                          chorusPart:
                              slide.isChorus === true &&
                              slide.chorusPart === true,
                          chorusAfter:
                              slide.isChorus === true
                                  ? false
                                  : slide.chorusAfter !== false,
                      }))
                      .filter(slide => slide.text !== '')
                : [];
            return saved.length > 0 ? saved : slidesFromBody(this.song.body);
        },
        readingBlocks() {
            const blocks = [];
            let verseNumber = 0;

            this.sourceSlides.forEach(slide => {
                if (slide.isChorus) {
                    const previousBlock = blocks[blocks.length - 1];
                    if (slide.chorusPart && previousBlock?.isChorus) {
                        previousBlock.text += `\n\n${slide.text}`;
                        return;
                    }

                    blocks.push({
                        text: slide.text,
                        isChorus: true,
                    });
                    return;
                }

                verseNumber += 1;
                const numbered = String(slide.text || '').match(
                    /^\s*(\d+)[.)]\s*/u,
                );
                blocks.push({
                    text: numbered
                        ? String(slide.text).slice(numbered[0].length)
                        : slide.text,
                    isChorus: false,
                    number: numbered ? numbered[1] : verseNumber,
                });
            });

            return blocks;
        },
        slideshowSequence() {
            const choruses = this.sourceSlides.filter(slide => slide.isChorus);
            const verses = this.sourceSlides.filter(slide => !slide.isChorus);

            if (verses.length === 0) return choruses;

            const hasSavedSlides =
                Array.isArray(this.song?.slides) && this.song.slides.length > 0;
            const chorusKeys = choruses.map(slide =>
                lyricsToPlainText(slide.text)
                    .replace(/\s+/g, ' ')
                    .trim()
                    .toLocaleLowerCase('lt'),
            );
            const hasExplicitRepeatedChorus =
                chorusKeys.length > new Set(chorusKeys).size;
            const hasStructuredChorusParts = choruses.some(
                slide => slide.chorusPart,
            );

            // Legacy body text and already repeated choruses describe their final order.
            if (
                !hasSavedSlides ||
                (hasExplicitRepeatedChorus && !hasStructuredChorusParts)
            ) {
                return this.sourceSlides.map(slide => ({ ...slide }));
            }

            const sequence = [];
            for (const slide of this.sourceSlides) {
                if (!slide.isChorus) break;
                sequence.push({ ...slide });
            }
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
        notesImageStyle() {
            return {
                width: `${this.notesZoom * 100}%`,
            };
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
        slideshowSettingsStyle() {
            if (
                this.phoneViewport ||
                this.slideshowSettingsX === null ||
                this.slideshowSettingsY === null
            ) {
                return {};
            }
            return {
                top: `${this.slideshowSettingsY}px`,
                right: 'auto',
                bottom: 'auto',
                left: `${this.slideshowSettingsX}px`,
            };
        },
        measurementStyle() {
            return {
                '--lyrics-font-size': `${this.slideshowFontSize}px`,
                '--lyrics-offset-x': `${this.slideshowOffsetX}vw`,
                '--lyrics-offset-y': `${this.slideshowOffsetY}vh`,
            };
        },
        filteredSongCatalog() {
            const query = normalizeSearch(this.songSearch);
            if (!query) return this.songCatalog;
            return this.songCatalog.filter(song =>
                normalizeSearch(`${song.songId} ${song.title}`).includes(query),
            );
        },
    },
    watch: {
        '$route.query.notes'(value) {
            if (value === 'fullscreen') {
                this.showNotesFullscreen();
            } else {
                this.notesHistoryOwned = false;
                this.finishCloseNotesFullscreen();
            }
        },
        '$route.query.audio'(value) {
            const requested = String(value || '');
            if (this.audioTypes.includes(requested)) {
                this.selectedAudioType = requested;
            }
        },
        songId() {
            this.closeNotesFullscreen();
            this.resetAudioState();
            if (!this.presenterConnected) this.closeSlideshow();
            this.fetchTrackLabels();
            this.fetchSong();
        },
        imageUrls(value) {
            this.resetImages();
            if (value.length === 0) this.closeNotesFullscreen();
        },
        notesVisible(value) {
            localStorage.setItem('notesVisible', String(value));
        },
        availableNoteFormats(formats) {
            this.imageType = formats.includes(this.preferredNoteFormat)
                ? this.preferredNoteFormat
                : formats[0] || this.preferredNoteFormat;
        },
        audioTypes(types) {
            const requested = String(this.$route.query.audio || '');
            if (types.includes(requested)) {
                this.selectedAudioType = requested;
            } else if (!types.includes(this.selectedAudioType)) {
                this.selectedAudioType = types[0] || '';
            }
            if (types.length === 0) this.resetAudioState();
        },
        selectedAudioType() {
            this.onAudioVersionChange();
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
                Math.max(4, Number(value) || DEFAULT_SLIDESHOW_FONT_SIZE),
            );
            localStorage.setItem('slideshowFontSize', String(normalized));
            this.scheduleSlideFit();
            this.scheduleSlideValidation();
            this.renderPresenterWindow();
        },
        slideshowStrictSize(value) {
            localStorage.setItem('slideshowStrictSize', String(value));
            this.scheduleSlideFit();
            this.scheduleSlideValidation();
            this.renderPresenterWindow();
        },
        slideshowWrapLines(value) {
            localStorage.setItem('slideshowWrapLines', String(value));
            this.scheduleSlideFit();
            this.scheduleSlideValidation();
            this.renderPresenterWindow();
        },
        slideshowOffsetX(value) {
            localStorage.setItem('slideshowOffsetX', String(value));
            this.scheduleSlideFit();
            this.scheduleSlideValidation();
            this.renderPresenterWindow();
        },
        slideshowOffsetY(value) {
            localStorage.setItem('slideshowOffsetY', String(value));
            this.scheduleSlideFit();
            this.scheduleSlideValidation();
            this.renderPresenterWindow();
        },
        currentSlideText() {
            this.scheduleSlideFit();
            this.renderPresenterWindow();
            this.scrollActivePreviewIntoView();
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
        this.fetchTrackLabels();
        this.fetchSong();
    },
    mounted() {
        document.addEventListener('keydown', this.onSlideshowKeydown);
        document.addEventListener('keydown', this.onSongNavigationKeydown);
        document.addEventListener('keyup', this.onSongNavigationKeyup);
        document.addEventListener('pointerdown', this.onDocumentPointerDown);
        document.addEventListener('fullscreenchange', this.onFullscreenChange);
        window.addEventListener('blur', this.stopSongNavigationHold);
        window.addEventListener('resize', this.scheduleSlideFit);
        window.addEventListener('resize', this.scheduleHeadingFit);
        window.addEventListener('resize', this.updatePhoneViewport);
        this.updatePhoneViewport();
        document.fonts?.ready.then(() => {
            this.scheduleSlideFit();
            this.scheduleHeadingFit();
            this.scheduleSlideValidation();
        });
        this.scheduleHeadingFit();
        this.scheduleSlideValidation();
    },
    beforeRouteLeave(to, from, next) {
        if (this.notesFullscreenOpen) {
            this.closeNotesFullscreen();
            next(false);
            return;
        }
        if (this.songGalleryOpen) {
            this.songGalleryOpen = false;
            next(false);
            return;
        }
        if (this.slideshowSettingsOpen) {
            this.closeSlideshowSettings();
            next(false);
            return;
        }
        if (this.slideshowOpen) {
            this.closeSlideshow();
            next(false);
            return;
        }
        next();
    },
    beforeUnmount() {
        document.removeEventListener('keydown', this.onSlideshowKeydown);
        document.removeEventListener('keydown', this.onSongNavigationKeydown);
        document.removeEventListener('keyup', this.onSongNavigationKeyup);
        document.removeEventListener('pointerdown', this.onDocumentPointerDown);
        document.removeEventListener('fullscreenchange', this.onFullscreenChange);
        window.removeEventListener('blur', this.stopSongNavigationHold);
        window.removeEventListener('resize', this.scheduleSlideFit);
        window.removeEventListener('resize', this.scheduleHeadingFit);
        window.removeEventListener('resize', this.updatePhoneViewport);
        if (this.headingFitFrame) {
            window.cancelAnimationFrame(this.headingFitFrame);
        }
        if (this.slideValidationFrame) {
            window.cancelAnimationFrame(this.slideValidationFrame);
        }
        this.stopSongNavigationHold();
        this.stopSlideshowSettingsDrag();
        this.closePresenterWindow();
        this.closeSlideshow();
        this.finishCloseNotesFullscreen();
        this.resetAudioState();
    },
    methods: {
        toggleTheme() {
            toggleAppTheme();
        },
        toggleSlideshowSettings() {
            if (this.slideshowSettingsOpen) {
                this.closeSlideshowSettings();
            } else {
                this.songGalleryOpen = false;
                this.slideshowSettingsOpen = true;
                this.scheduleSlideValidation();
                this.$nextTick(() => this.showSlideshowSettingsDialog());
            }
        },
        showSlideshowSettingsDialog() {
            const dialog = this.$refs.slideshowSettingsDialog;
            if (!dialog || dialog.open) return;
            if (this.phoneViewport && typeof dialog.showModal === 'function') {
                try {
                    dialog.showModal();
                    return;
                } catch {
                    // Fall back to a regular open dialog below.
                }
            }
            if (typeof dialog.show === 'function') {
                dialog.show();
            } else {
                dialog.setAttribute('open', '');
            }
        },
        startSlideshowSettingsDrag(event) {
            if (
                this.phoneViewport ||
                event.button !== 0 ||
                event.target.closest('button, input, select, textarea, a')
            ) {
                return;
            }
            const dialog = this.$refs.slideshowSettingsDialog;
            if (!dialog) return;

            const rect = dialog.getBoundingClientRect();
            event.preventDefault();
            this.slideshowSettingsX = rect.left;
            this.slideshowSettingsY = rect.top;
            this.slideshowSettingsDragOffsetX = event.clientX - rect.left;
            this.slideshowSettingsDragOffsetY = event.clientY - rect.top;
            this.slideshowSettingsDragging = true;
            window.addEventListener('pointermove', this.moveSlideshowSettings);
            window.addEventListener('pointerup', this.stopSlideshowSettingsDrag);
            window.addEventListener(
                'pointercancel',
                this.stopSlideshowSettingsDrag,
            );
        },
        moveSlideshowSettings(event) {
            if (!this.slideshowSettingsDragging) return;
            const dialog = this.$refs.slideshowSettingsDialog;
            if (!dialog) return;

            event.preventDefault();
            const rect = dialog.getBoundingClientRect();
            const maxX = Math.max(8, window.innerWidth - rect.width - 8);
            const maxY = Math.max(8, window.innerHeight - rect.height - 8);
            this.slideshowSettingsX = clamp(
                event.clientX - this.slideshowSettingsDragOffsetX,
                8,
                maxX,
            );
            this.slideshowSettingsY = clamp(
                event.clientY - this.slideshowSettingsDragOffsetY,
                8,
                maxY,
            );
        },
        stopSlideshowSettingsDrag() {
            this.slideshowSettingsDragging = false;
            window.removeEventListener('pointermove', this.moveSlideshowSettings);
            window.removeEventListener('pointerup', this.stopSlideshowSettingsDrag);
            window.removeEventListener(
                'pointercancel',
                this.stopSlideshowSettingsDrag,
            );
        },
        clampSlideshowSettingsPosition() {
            if (
                this.phoneViewport ||
                this.slideshowSettingsX === null ||
                this.slideshowSettingsY === null
            ) {
                return;
            }
            this.$nextTick(() => {
                const dialog = this.$refs.slideshowSettingsDialog;
                if (!dialog) return;
                const rect = dialog.getBoundingClientRect();
                this.slideshowSettingsX = clamp(
                    this.slideshowSettingsX,
                    8,
                    Math.max(8, window.innerWidth - rect.width - 8),
                );
                this.slideshowSettingsY = clamp(
                    this.slideshowSettingsY,
                    8,
                    Math.max(8, window.innerHeight - rect.height - 8),
                );
            });
        },
        closeSlideshowSettings() {
            this.validateAllSlides();
            this.stopSlideshowSettingsDrag();
            const dialog = this.$refs.slideshowSettingsDialog;
            if (dialog?.open && typeof dialog.close === 'function') {
                dialog.close();
            }
            this.slideshowSettingsOpen = false;
        },
        resetSlideshowSettings() {
            this.slideshowTheme = 'light';
            this.slideshowFontSize = DEFAULT_SLIDESHOW_FONT_SIZE;
            this.slideshowStrictSize = false;
            this.slideshowWrapLines = true;
            this.slideshowOffsetX = 0;
            this.slideshowOffsetY = 0;
            this.advancedSettingsOpen = false;
            this.slideshowOptions = this.slideshowSequence.map(() => ({
                enabled: true,
            }));
            this.$nextTick(() => {
                this.scheduleSlideFit();
                this.scheduleSlideValidation();
                this.renderPresenterWindow();
            });
        },
        openSlideshow() {
            if (this.sourceSlides.length === 0) return;
            this.prepareSlideshowOptions();
            this.slideshowIndex = 0;
            this.slideshowSettingsX = null;
            this.slideshowSettingsY = null;
            this.slideshowSettingsOpen = this.slideshowSlides.length === 0;
            this.songGalleryOpen = false;
            this.previousBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            this.slideshowOpen = true;
            this.fittedSlideshowFontSize = this.slideshowFontSize;
            this.scheduleSlideFit();
            this.$nextTick(() => {
                this.enterSlideshowFullscreen().finally(() => {
                    this.showSlideshowSettingsDialog();
                });
            });
        },
        enterSlideshowFullscreen() {
            const element = this.$refs.slideshow;
            if (!element?.requestFullscreen || document.fullscreenElement) {
                this.scheduleSlideFit();
                return Promise.resolve(false);
            }
            return element
                .requestFullscreen()
                .then(() => {
                    this.fullscreenActive = true;
                    this.scheduleSlideFit();
                    return true;
                })
                .catch(() => {
                    this.fullscreenActive = false;
                    this.scheduleSlideFit();
                    return false;
                });
        },
        closeSlideshow() {
            if (!this.slideshowOpen && !this.fullscreenActive) return;
            this.slideshowOpen = false;
            this.slideshowSettingsOpen = false;
            this.songGalleryOpen = false;
            this.preserveSlideshowOnFullscreenExit = false;
            this.closePresenterWindow();
            document.body.style.overflow = this.previousBodyOverflow;
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
            this.fullscreenActive = false;
        },
        requestCloseSlideshow() {
            if (this.songGalleryOpen) {
                this.songGalleryOpen = false;
                return;
            }
            if (this.slideshowSettingsOpen) {
                this.closeSlideshowSettings();
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
        selectSlide(index) {
            this.slideshowIndex = clamp(
                index,
                0,
                Math.max(0, this.slideshowSlides.length - 1),
            );
        },
        scrollActivePreviewIntoView() {
            if (!this.presenterConnected) return;
            this.$nextTick(() => {
                const previews = this.$refs.slidePreviewButtons;
                const active = Array.isArray(previews)
                    ? previews[this.slideshowIndex]
                    : previews;
                active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            });
        },
        onSongNavigationKeydown(event) {
            const direction =
                event.key === 'ArrowLeft'
                    ? -1
                    : event.key === 'ArrowRight'
                      ? 1
                      : 0;
            if (!direction) return;
            if (
                event.defaultPrevented ||
                event.ctrlKey ||
                event.metaKey ||
                event.altKey ||
                this.notesFullscreenOpen ||
                this.slideshowOpen ||
                this.presenterConnected ||
                this.songGalleryOpen ||
                this.slideshowSettingsOpen ||
                event.target.closest?.(
                    'input, select, textarea, [contenteditable="true"]',
                )
            ) {
                return;
            }

            event.preventDefault();
            if (event.repeat) return;
            this.startSongNavigationHold(direction);
        },
        onSongNavigationKeyup(event) {
            const direction =
                event.key === 'ArrowLeft'
                    ? -1
                    : event.key === 'ArrowRight'
                      ? 1
                      : 0;
            if (
                direction &&
                direction === this.songNavigationDirection
            ) {
                this.stopSongNavigationHold();
            }
        },
        startSongNavigationHold(direction) {
            this.stopSongNavigationHold();
            this.songNavigationDirection = direction;
            this.songNavigationIndex = this.songIds.indexOf(this.songId);
            this.songNavigationRepeatCount = 0;
            if (!this.stepSongNavigation(direction)) {
                this.stopSongNavigationHold();
                return;
            }
            this.scheduleSongNavigationRepeat(440);
        },
        scheduleSongNavigationRepeat(delay) {
            this.songNavigationTimer = window.setTimeout(() => {
                this.songNavigationTimer = 0;
                if (
                    !this.songNavigationDirection ||
                    !this.stepSongNavigation(this.songNavigationDirection)
                ) {
                    this.stopSongNavigationHold();
                    return;
                }
                this.songNavigationRepeatCount += 1;
                const nextDelay = Math.max(
                    70,
                    220 - this.songNavigationRepeatCount * 18,
                );
                this.scheduleSongNavigationRepeat(nextDelay);
            }, delay);
        },
        stepSongNavigation(direction) {
            if (!this.songIds.length) return false;
            const currentIndex =
                this.songNavigationIndex >= 0
                    ? this.songNavigationIndex
                    : this.songIds.indexOf(this.songId);
            const nextIndex = currentIndex + direction;
            if (nextIndex < 0 || nextIndex >= this.songIds.length) return false;

            this.songNavigationIndex = nextIndex;
            this.goTo(this.songIds[nextIndex]);
            return true;
        },
        stopSongNavigationHold() {
            if (this.songNavigationTimer) {
                window.clearTimeout(this.songNavigationTimer);
            }
            this.songNavigationTimer = 0;
            this.songNavigationDirection = 0;
            this.songNavigationIndex = -1;
            this.songNavigationRepeatCount = 0;
        },
        onSlideshowKeydown(event) {
            if (this.notesFullscreenOpen) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    this.closeNotesFullscreen();
                } else if (['+', '='].includes(event.key)) {
                    event.preventDefault();
                    this.adjustNotesZoom(0.25);
                } else if (event.key === '-') {
                    event.preventDefault();
                    this.adjustNotesZoom(-0.25);
                }
                return;
            }
            if (!this.slideshowOpen && !this.presenterConnected) return;
            const settingsInput = event.target.closest?.(
                '.lyrics-show__settings input, .lyrics-show__settings select, .lyrics-show__settings textarea, .lyrics-show__settings [contenteditable="true"]',
            );
            if (
                event.key !== 'Escape' &&
                event.target.closest?.('.lyrics-show__audio')
            ) {
                return;
            }
            if (this.songGalleryOpen) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    this.songGalleryOpen = false;
                }
                return;
            }
            if (this.slideshowSettingsOpen) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    this.preserveSlideshowOnFullscreenExit = true;
                    window.setTimeout(() => {
                        this.preserveSlideshowOnFullscreenExit = false;
                    }, 1000);
                    this.closeSlideshowSettings();
                }
                if (
                    !this.presenterConnected ||
                    settingsInput ||
                    event.key === ' '
                ) {
                    return;
                }
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
                Math.max(
                    4,
                    Number(this.slideshowFontSize) ||
                        DEFAULT_SLIDESHOW_FONT_SIZE,
                ),
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
        scheduleHeadingFit() {
            this.$nextTick(() => {
                if (this.headingFitFrame) {
                    window.cancelAnimationFrame(this.headingFitFrame);
                }
                this.headingFitFrame = window.requestAnimationFrame(() => {
                    this.headingFitFrame = 0;
                    this.fitHeadingText();
                });
            });
        },
        fitHeadingElement(element, minimum, maximum, singleLineMinimum) {
            if (!element) return;

            const text = element.textContent.trim();
            if (!text) {
                element.style.fontSize = `${maximum}px`;
                return;
            }

            element.style.whiteSpace = 'nowrap';
            element.style.fontSize = `${singleLineMinimum}px`;
            const keepOnOneLine = element.scrollWidth <= element.clientWidth + 1;
            element.style.whiteSpace = keepOnOneLine ? 'nowrap' : '';

            const fits = size => {
                element.style.fontSize = `${size}px`;
                return (
                    element.scrollHeight <= element.clientHeight + 1 &&
                    element.scrollWidth <= element.clientWidth + 1
                );
            };

            let low = keepOnOneLine ? singleLineMinimum : minimum;
            let high = maximum;
            let best = low;
            while (low <= high) {
                const size = Math.floor((low + high) / 2);
                if (fits(size)) {
                    best = size;
                    low = size + 1;
                } else {
                    high = size - 1;
                }
            }
            element.style.fontSize = `${best}px`;
        },
        fitHeadingText() {
            const compact = window.matchMedia('(max-width: 680px)').matches;
            if (compact) {
                [this.$refs.songTitle, this.$refs.songVerse].forEach(element => {
                    if (!element) return;
                    element.style.removeProperty('font-size');
                    element.style.removeProperty('white-space');
                });
                return;
            }

            this.fitHeadingElement(
                this.$refs.songTitle,
                25,
                40,
                32,
            );
            this.fitHeadingElement(
                this.$refs.songVerse,
                13,
                16,
                15,
            );
        },
        fitCurrentSlide() {
            const content = this.$refs.slideshowContent;
            const preferred = Math.min(
                MAX_SLIDESHOW_FONT_SIZE,
                Math.max(
                    4,
                    Number(this.slideshowFontSize) ||
                        DEFAULT_SLIDESHOW_FONT_SIZE,
                ),
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
            let area = this.$refs.slideshowMeasureArea;
            let content = this.$refs.slideshowMeasureContent;
            if (this.presenterConnected && presenterWindow && !presenterWindow.closed) {
                const presenterArea =
                    presenterWindow.document.getElementById('measure-area');
                const presenterContent =
                    presenterWindow.document.getElementById('measure-content');
                if (presenterArea && presenterContent) {
                    area = presenterArea;
                    content = presenterContent;
                }
            }
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
                const textRange = content.ownerDocument.createRange();
                textRange.selectNodeContents(content);
                const textRect = textRange.getBoundingClientRect();
                textRange.detach?.();
                const fits =
                    dimensionsFit(displayed) &&
                    textRect.left >= areaRect.left - 2 &&
                    textRect.right <= areaRect.right + 2 &&
                    textRect.top >= areaRect.top - 2 &&
                    textRect.bottom <= areaRect.bottom + 2;
                if (!fits) overflowIndexes.push(index);
            });

            content.textContent = '';
            this.slideshowOverflowIndexes = overflowIndexes;
            return overflowIndexes;
        },
        slideOverflows(index) {
            return this.slideshowOverflowIndexes.includes(index);
        },
        async togglePresenterWindow() {
            if (this.phoneViewport) return;
            if (this.presenterConnected || (presenterWindow && !presenterWindow.closed)) {
                this.closePresenterWindow();
                return;
            }
            if (this.sourceSlides.length === 0) return;
            this.prepareSlideshowOptions();
            this.validateAllSlides();

            this.presenterOpening = true;
            presenterWindow = window.open(
                '',
                'edeno-aidai-presenter',
                'popup=yes,width=1280,height=720,left=40,top=40',
            );
            if (!presenterWindow) {
                this.presenterOpening = false;
                window.alert('Naršyklė užblokavo pristatymo langą. Leiskite iššokančius langus ir bandykite dar kartą.');
                return;
            }

            this.initializePresenterWindow();
            this.presenterConnected = true;
            this.renderPresenterWindow();
            this.scheduleSlideValidation();
            window.setTimeout(() => {
                this.presenterOpening = false;
            }, 1000);

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
                        window.setTimeout(() => {
                            this.renderPresenterWindow();
                            this.scheduleSlideValidation();
                        }, 150);
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
*{box-sizing:border-box}
html,body{width:100%;height:100%;margin:0;overflow:hidden;font-family:Avenir,Helvetica,Arial,sans-serif}
body{color:#fff;background:radial-gradient(circle at 50% 45%,#263447 0,#111923 48%,#080b10 100%)}
body.light{color:#17130d;background:radial-gradient(circle at 50% 45%,#fff 0,#f4efe6 58%,#e8dfd1 100%)}
#stage{display:grid;grid-template-rows:76px minmax(0,1fr) 82px;width:100vw;height:100vh}
#title{display:flex;align-items:center;justify-content:center;padding:12px 5vw;color:rgba(255,255,255,.72);font-size:clamp(16px,2vw,24px)}
body.light #title{color:rgba(23,19,13,.68)}
#area,#measure-area{display:grid;min-width:0;min-height:0;overflow:hidden}
#measure-area{position:fixed;inset:76px 0 82px;z-index:-1;visibility:hidden;pointer-events:none}
#content,#measure-content{align-self:center;justify-self:stretch;width:100%;min-height:0;height:auto;max-height:100%;overflow:hidden;padding:30px clamp(18px,4vw,72px);font-weight:600;line-height:1.32;text-align:center;text-wrap:balance;white-space:pre-line;overflow-wrap:anywhere;text-shadow:0 3px 16px rgba(0,0,0,.55);transform:translate(var(--offset-x),var(--offset-y));pointer-events:none}
body.light #content,body.light #measure-content{text-shadow:0 2px 10px rgba(75,52,20,.18)}
body.no-wrap #content,body.no-wrap #measure-content{white-space:pre;text-wrap:nowrap;overflow-wrap:normal}
#counter{display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.68);font-size:18px}
body.light #counter{color:rgba(23,19,13,.68)}
.zone{position:fixed;top:0;bottom:0;z-index:5;width:clamp(96px,14vw,260px);padding:0;border:0;color:rgba(255,255,255,.72);background:transparent;cursor:pointer;transition:background .18s ease}
.zone::after{position:absolute;top:50%;opacity:0;font-size:54px;font-weight:300;transform:translateY(-50%);transition:opacity .18s ease,transform .18s ease}
.zone:hover::after{opacity:.82}
.zone.left{left:0}.zone.left::after{content:'‹';left:20px}.zone.left:hover{background:linear-gradient(90deg,rgba(255,255,255,.2),transparent)}.zone.left:hover::after{transform:translate(-3px,-50%)}
.zone.right{right:0}.zone.right::after{content:'›';right:20px}.zone.right:hover{background:linear-gradient(270deg,rgba(255,255,255,.2),transparent)}.zone.right:hover::after{transform:translate(3px,-50%)}
body.light .zone{color:rgba(46,32,13,.72)}
</style></head><body><div id="stage"><div id="title"></div><div id="area"><div id="content"></div></div><div id="counter"></div></div><div id="measure-area"><div id="measure-content"></div></div><button class="zone left" aria-label="Ankstesnė skaidrė"></button><button class="zone right" aria-label="Kita skaidrė"></button></body></html>`);
            presenterWindow.document.close();
            presenterWindow.document.getElementById('area').style.overflow = 'visible';
            const presenterContent = presenterWindow.document.getElementById('content');
            presenterContent.style.overflow = 'visible';
            presenterContent.style.justifySelf = 'stretch';
            presenterContent.style.width = '100%';
            presenterContent.style.boxSizing = 'border-box';
            presenterContent.style.padding = '30px clamp(18px, 4vw, 72px)';
            presenterWindow.document.querySelector('.zone.left').onclick = () =>
                this.previousSlide();
            presenterWindow.document.querySelector('.zone.right').onclick = () =>
                this.nextSlide();
            presenterWindow.addEventListener('keydown', this.onSlideshowKeydown);
            presenterWindow.addEventListener('resize', this.onPresenterResize);
        },
        onPresenterResize() {
            if (!presenterWindow || presenterWindow.closed) return;
            this.renderPresenterWindow();
            this.scheduleSlideValidation();
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
                presenterWindow.removeEventListener(
                    'resize',
                    this.onPresenterResize,
                );
                presenterWindow.close();
            }
            presenterWindow = null;
            this.presenterConnected = false;
            this.presenterOpening = false;
            this.songGalleryOpen = false;
            this.scheduleSlideFit();
        },
        updatePhoneViewport() {
            const isPhone = window.matchMedia('(max-width: 720px)').matches;
            if (isPhone && this.presenterConnected) {
                this.closePresenterWindow();
            }
            this.phoneViewport = isPhone;
            if (isPhone) {
                this.stopSlideshowSettingsDrag();
                this.slideshowSettingsX = null;
                this.slideshowSettingsY = null;
            } else {
                this.clampSlideshowSettingsPosition();
            }
        },
        openSongGallery() {
            if (!this.presenterConnected) return;
            this.slideshowSettingsOpen = false;
            this.songGalleryOpen = true;
            this.songSearch = '';
        },
        selectPresentationSong(songId) {
            if (!songId) return;
            this.songGalleryOpen = false;
            this.songSearch = '';
            this.slideshowIndex = 0;
            if (songId === this.song?.songId) {
                this.renderPresenterWindow();
                return;
            }
            this.$router.push(`/song/${encodeURIComponent(songId)}`);
        },
        presentationSlideTitle(slide, index) {
            return this.sequenceSlideTitle(this.slideshowSlides, slide, index);
        },
        slideOptionTitle(slide, index) {
            return this.sequenceSlideTitle(this.slideshowSequence, slide, index);
        },
        sequenceSlideTitle(slides, slide, index) {
            if (!slide.isChorus) {
                const verseNumber = slides
                    .slice(0, index + 1)
                    .filter(item => !item.isChorus).length;
                return `Posmas ${verseNumber}`;
            }

            let groupStart = index;
            while (
                groupStart > 0 &&
                slides[groupStart]?.chorusPart &&
                slides[groupStart - 1]?.isChorus
            ) {
                groupStart -= 1;
            }

            let groupEnd = groupStart;
            while (
                groupEnd + 1 < slides.length &&
                slides[groupEnd + 1]?.isChorus &&
                slides[groupEnd + 1]?.chorusPart
            ) {
                groupEnd += 1;
            }

            const chorusNumber = Math.max(
                1,
                slides
                    .slice(0, groupStart + 1)
                    .filter(item => item.isChorus && !item.chorusPart).length,
            );
            const partCount = groupEnd - groupStart + 1;
            if (partCount > 1) {
                return `Priegiesmis ${chorusNumber} · ${index - groupStart + 1}/${partCount}`;
            }
            return `Priegiesmis ${chorusNumber}`;
        },
        slideOptionPreview(slide) {
            const firstLine = String(slide.text || '').split(/\r?\n/, 1)[0].trim();
            return firstLine.length > 70 ? `${firstLine.slice(0, 70)}…` : firstLine;
        },
        onFullscreenChange() {
            const wasFullscreen = this.fullscreenActive;
            this.fullscreenActive = Boolean(document.fullscreenElement);

            if (wasFullscreen && !this.fullscreenActive && this.slideshowOpen) {
                if (this.preserveSlideshowOnFullscreenExit) {
                    this.preserveSlideshowOnFullscreenExit = false;
                } else if (this.presenterOpening) {
                    this.presenterOpening = false;
                } else if (this.slideshowSettingsOpen) {
                    this.closeSlideshowSettings();
                    this.$nextTick(() => this.enterSlideshowFullscreen());
                } else {
                    this.closeSlideshow();
                    return;
                }
            }
            if (this.slideshowOpen) {
                this.scheduleSlideFit();
            }
        },
        resetImages() {
            this.imageLoaded = this.imageUrls.map(() => false);
            this.imageErrored = this.imageUrls.map(() => false);
        },
        selectNoteFormat(format) {
            if (!this.availableNoteFormats.includes(format)) return;
            this.preferredNoteFormat = format;
            localStorage.setItem('notesFormat', format);
            this.imageType = format;
            this.notesZoom = 1;
            this.$nextTick(() => this.resetNotesViewport());
        },
        noteFormatLabel(format) {
            return format === 'svg' ? 'SVG' : 'JPG';
        },
        async openNotesFullscreen() {
            if (
                this.imageUrls.length === 0 ||
                this.notesFullscreenOpen ||
                this.notesOpening
            ) {
                return;
            }
            if (this.$route.query.notes === 'fullscreen') {
                this.showNotesFullscreen();
                return;
            }

            this.notesOpening = true;
            try {
                await this.$router.push({
                    query: {
                        ...this.$route.query,
                        notes: 'fullscreen',
                    },
                });
                this.notesHistoryOwned = true;
            } finally {
                this.notesOpening = false;
            }
        },
        showNotesFullscreen() {
            if (this.imageUrls.length === 0 || this.notesFullscreenOpen) return;
            this.previousNotesBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            this.notesZoom = 1;
            this.notesFullscreenOpen = true;
            this.$nextTick(() => this.resetNotesViewport());
        },
        closeNotesFullscreen() {
            if (!this.notesFullscreenOpen) return;
            if (this.$route.query.notes === 'fullscreen') {
                if (this.notesHistoryOwned) {
                    this.$router.back();
                } else {
                    const query = { ...this.$route.query };
                    delete query.notes;
                    this.$router.replace({ query });
                }
                return;
            }
            this.finishCloseNotesFullscreen();
        },
        finishCloseNotesFullscreen() {
            if (!this.notesFullscreenOpen) return;
            this.notesFullscreenOpen = false;
            document.body.style.overflow = this.previousNotesBodyOverflow;
        },
        adjustNotesZoom(delta) {
            this.notesZoom = clamp(this.notesZoom + delta, 1, 3);
        },
        resetNotesViewport() {
            this.$nextTick(() => {
                const viewport = this.$refs.notesViewport;
                if (!viewport) return;
                viewport.scrollTop = 0;
                viewport.scrollLeft = 0;
            });
        },
        onImageError(index) {
            this.imageLoaded[index] = true;
            this.imageErrored[index] = true;
        },
        audioTypeLabel(type) {
            const savedLabel = String(this.trackLabels[type] || '').trim();
            if (savedLabel) return savedLabel;
            const cleaned = String(type || '')
                .replace(/&/g, ' ir ')
                .replace(/[_-]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            return cleaned
                ? cleaned.charAt(0).toLocaleUpperCase('lt') + cleaned.slice(1)
                : 'Įrašas';
        },
        async fetchTrackLabels() {
            try {
                const separator = config.tracksUrl.includes('?') ? '&' : '?';
                const response = await fetch(
                    `${config.tracksUrl}${separator}t=${Date.now()}`,
                    { cache: 'no-store' },
                );
                if (!response.ok) return;
                const tracks = await response.json();
                if (!Array.isArray(tracks)) return;
                this.trackLabels = Object.fromEntries(
                    tracks
                        .filter(track => track?.name)
                        .map(track => [track.name, track.label || track.name]),
                );
            } catch (error) {
                console.warn('Nepavyko atnaujinti įrašų pavadinimų:', error);
            }
        },
        toggleVolumeControl() {
            this.volumeControlOpen = !this.volumeControlOpen;
            if (this.volumeControlOpen) {
                this.$nextTick(() => this.$refs.volumeSlider?.focus());
            }
        },
        onDocumentPointerDown(event) {
            if (
                this.volumeControlOpen &&
                !this.$refs.volumeControl?.contains(event.target)
            ) {
                this.volumeControlOpen = false;
            }
        },
        async toggleAudio() {
            const audio = this.$refs.audioElement;
            if (!audio || !this.selectedAudioType) return;
            if (audio.paused) {
                try {
                    await audio.play();
                } catch (error) {
                    console.error('Nepavyko paleisti įrašo:', error);
                }
            } else {
                audio.pause();
            }
        },
        syncAudioMetadata(event) {
            const audio = event?.currentTarget || this.$refs.audioElement;
            if (!audio) return;
            this.audioDuration = Number.isFinite(audio.duration)
                ? audio.duration
                : 0;
            audio.volume = this.audioVolume;
        },
        syncAudioTime(event) {
            this.audioCurrentTime = event.currentTarget.currentTime || 0;
        },
        seekAudio(event) {
            const audio = this.$refs.audioElement;
            if (!audio) return;
            const next = Number(event.target.value) || 0;
            audio.currentTime = next;
            this.audioCurrentTime = next;
        },
        setAudioVolume(event) {
            const next = clamp(event.target.value, 0, 1);
            this.audioVolume = next;
            if (next > 0) this.audioVolumeBeforeMute = next;
            if (this.$refs.audioElement) this.$refs.audioElement.volume = next;
        },
        toggleAudioMute() {
            if (this.audioVolume > 0) {
                this.audioVolumeBeforeMute = this.audioVolume;
                this.audioVolume = 0;
            } else {
                this.audioVolume = this.audioVolumeBeforeMute || 0.85;
            }
            if (this.$refs.audioElement) {
                this.$refs.audioElement.volume = this.audioVolume;
            }
        },
        onAudioVersionChange() {
            this.resetAudioState();
            this.$nextTick(() => {
                const audio = this.$refs.audioElement;
                if (!audio || !this.selectedAudioType) return;
                audio.volume = this.audioVolume;
                audio.load();
            });
        },
        resetAudioState() {
            const audio = this.$refs.audioElement;
            if (audio && !audio.paused) audio.pause();
            this.volumeControlOpen = false;
            this.audioPlaying = false;
            this.audioCurrentTime = 0;
            this.audioDuration = 0;
        },
        formatMediaTime(seconds) {
            const safeSeconds = Number.isFinite(Number(seconds))
                ? Math.max(0, Number(seconds))
                : 0;
            const minutes = Math.floor(safeSeconds / 60);
            const remainder = Math.floor(safeSeconds % 60);
            return `${minutes}:${String(remainder).padStart(2, '0')}`;
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
                    this.songCatalog = songs.map(song => ({
                        songId: song.songId,
                        title: song.title,
                    }));
                })
                .catch(error => console.error(error));
        },
        fetchSong() {
            const requestedSongId = this.songId;
            this.$songs
                .where('songId')
                .equals(requestedSongId)
                .first()
                .then(song => {
                    if (requestedSongId !== this.songId) return;
                    this.song = song || null;
                    this.slideshowIndex = 0;
                    this.slideshowOptions = [];
                    this.prepareSlideshowOptions();
                    this.resetImages();
                    this.$nextTick(() => {
                        this.scheduleHeadingFit();
                        this.scheduleSlideFit();
                        this.scheduleSlideValidation();
                        this.renderPresenterWindow();
                    });
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
.image-format-container {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
    margin: 0;
}

.image-format-button {
    font-size: 16px;
    line-height: 1.5;
    background-color: transparent;
    border: none;
    border-radius: 20px;
    padding: 8px 15px;
    margin: 0;
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

.song-action-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(150px, 180px);
    align-items: stretch;
    gap: 12px;
    width: 100%;
    margin: 0 0 16px;
    box-sizing: border-box;

    &--audio-only {
        grid-template-columns: minmax(0, 1fr);
    }
}

.song-audio {
    display: grid;
    align-content: center;
    gap: 16px;
    width: 100%;
    min-width: 0;
    height: 100%;
    margin: 0;
    padding: 16px 18px;
    box-sizing: border-box;
    border: 1px solid var(--app-border);
    border-radius: 18px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow);

    &__header,
    &__controls,
    &__times,
    &__types,
    &__type,
    &__volume {
        display: flex;
        align-items: center;
    }

    &__header {
        min-width: 0;
        align-items: flex-end;
        flex-wrap: nowrap;
        justify-content: flex-start;
        gap: 12px 18px;
    }

    &__selector {
        display: grid;
        min-width: 170px;
        flex: 0 1 240px;
        gap: 7px;

        > span {
            color: var(--app-muted);
            font-size: 12px;
            font-weight: 700;
            line-height: 1.2;
            letter-spacing: 0.03em;
            text-transform: uppercase;
        }

        select {
            min-width: 0;
            width: 100%;
            height: 48px;
            padding: 0 34px 0 12px;
            border: 1px solid var(--app-border);
            border-radius: 10px;
            color: var(--app-text);
            background: var(--app-surface-soft);
            font: inherit;
            font-size: 13px;
            font-weight: 700;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            &:focus-visible {
                outline: 2px solid var(--app-accent);
                outline-offset: 2px;
            }

            &:disabled {
                color: var(--app-muted);
                cursor: not-allowed;
                opacity: 0.72;
            }
        }
    }

    &__types {
        min-width: 0;
        flex: 1 1 0;
        align-self: flex-end;
        flex-wrap: nowrap;
        gap: 8px;
    }

    &__type {
        width: 48px;
        min-width: 38px;
        height: 48px;
        flex: 0 1 48px;
        justify-content: center;
        gap: 0;
        padding: 5px;
        box-sizing: border-box;
        border: 1px solid var(--app-border);
        border-radius: 11px;
        color: var(--app-text);
        background: var(--app-surface-soft);
        cursor: pointer;
        transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease;

        &:hover {
            border-color: color-mix(in srgb, var(--app-accent) 55%, transparent);
            background: var(--app-hover);
        }

        &.is-selected {
            border-color: var(--app-accent);
            color: #2b2114;
            background: var(--app-accent);
        }

        &--single {
            min-width: 48px;
            flex: 0 0 48px;
            align-self: flex-end;
            cursor: default;
        }
    }

    &__type-icon {
        display: grid;
        width: min(30px, 100%);
        height: auto;
        flex: 0 1 30px;
        aspect-ratio: 1;
        place-items: center;

        .icon-audio,
        img,
        svg {
            width: 100%;
            height: 100%;
            margin: 0;
        }
    }

    &__element {
        display: none;
    }

    &__controls {
        min-width: 0;
        align-items: center;
        gap: 11px;
    }

    &__play {
        display: inline-flex;
        min-width: 112px;
        height: 50px;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 14px;
        border: 0;
        border-radius: 12px;
        color: #2b2114;
        background: var(--app-accent);
        box-shadow: 0 5px 14px rgba(82, 58, 19, 0.24);
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.18s ease, box-shadow 0.18s ease;

        span:first-child {
            font-size: 13px;
        }

        &:hover {
            transform: translateY(-1px) scale(1.03);
            box-shadow: 0 7px 18px rgba(82, 58, 19, 0.3);
        }

        &:disabled {
            opacity: 0.58;
            cursor: not-allowed;
            box-shadow: none;

            &:hover {
                transform: none;
                box-shadow: none;
            }
        }
    }

    &__progress,
    &__volume input {
        accent-color: var(--app-accent);
        cursor: pointer;

        &:disabled {
            cursor: not-allowed;
        }
    }

    &__progress {
        width: 100%;
        min-width: 60px;
        margin: 0;
    }

    &__timeline {
        display: grid;
        min-width: 0;
        flex: 1;
        align-self: center;
        gap: 2px;
    }

    &__times {
        justify-content: space-between;
    }

    &__time {
        color: var(--app-muted);
        font-size: 12px;
        font-variant-numeric: tabular-nums;
    }

    &__volume {
        position: relative;
        display: block;
        width: 42px;
        height: 42px;
        flex: 0 0 42px;
        align-self: center;
        transform: translateY(-3px);

        input {
            width: 18px;
            height: 62px;
            margin: 0;
            direction: rtl;
            writing-mode: vertical-lr;
        }
    }

    &__volume-toggle {
        display: grid;
        width: 42px;
        height: 42px;
        padding: 0;
        place-items: center;
        border: 1px solid var(--app-border);
        border-radius: 11px;
        color: var(--app-muted);
        background: var(--app-surface-soft);
        cursor: pointer;

        &:hover:not(:disabled),
        &[aria-expanded='true'] {
            color: var(--app-text);
            background: var(--app-hover);
        }

        &:disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }

        .song-ui-icon {
            width: 20px;
            height: 20px;
        }
    }

    &__volume-popover {
        position: absolute;
        bottom: -2px;
        left: 50%;
        z-index: 12;
        display: grid;
        width: 42px;
        height: 82px;
        padding: 8px 0;
        place-items: center;
        box-sizing: border-box;
        border: 1px solid var(--app-border);
        border-radius: 12px;
        background: var(--app-surface);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
        transform: translateX(-50%);
    }

    &__mute {
        display: none;
        width: 42px;
        min-width: 42px;
        height: 42px;
        padding: 0;
        place-items: center;
        border: 1px solid var(--app-border);
        border-radius: 11px;
        color: var(--app-muted);
        background: var(--app-surface-soft);
        cursor: pointer;

        &:hover:not(:disabled) {
            color: var(--app-text);
            background: var(--app-hover);
        }

        &:disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }
    }

    &--empty {
        .song-audio__controls {
            opacity: 0.68;
        }
    }
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

.song-image--svg img {
    background: transparent;
}

:root[data-theme='dark'] .song-image--svg img {
    filter: invert(1) hue-rotate(180deg) brightness(1.16) contrast(0.94);
}

.notes-viewer {
    --notes-background: var(--app-background);
    --notes-surface: rgba(255, 253, 248, 0.96);
    --notes-control: #fffdf8;
    --notes-text: #17130d;
    --notes-muted: #716757;
    --notes-border: rgba(45, 34, 19, 0.2);

    position: fixed;
    inset: 0;
    z-index: 11000;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    color: var(--notes-text);
    background: var(--notes-background);

    &--dark {
        --notes-surface: rgba(24, 31, 42, 0.97);
        --notes-control: #252e3b;
        --notes-text: #f6f1e7;
        --notes-muted: #b9b0a3;
        --notes-border: rgba(255, 255, 255, 0.16);
    }

    &__header,
    &__toolbar,
    &__controls,
    &__formats,
    &__zoom-controls {
        display: flex;
        align-items: center;
    }

    &__header {
        z-index: 3;
        justify-content: space-between;
        gap: 16px;
        min-height: 66px;
        padding: 10px 18px;
        border-bottom: 1px solid var(--notes-border);
        background: var(--notes-surface);
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.1);

        > strong {
            overflow: hidden;
            font-size: 17px;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    &__controls,
    &__formats,
    &__zoom-controls {
        gap: 6px;
    }

    &__toolbar {
        gap: 16px;
    }

    &__toolbar button {
        min-width: 40px;
        height: 40px;
        padding: 5px 10px;
        border: 1px solid var(--notes-border);
        border-radius: 10px;
        color: var(--notes-text);
        background: var(--notes-control);
        font-size: 18px;
        cursor: pointer;

        &:disabled {
            opacity: 0.35;
            cursor: default;
        }

        &.selected {
            border-color: #d9b26f;
            color: #271d0f;
            background: #d9b26f;
            font-weight: 700;
        }
    }

    &__zoom {
        min-width: 66px !important;
        font-size: 13px !important;
        font-variant-numeric: tabular-nums;
    }

    &__close {
        display: inline-flex;
        min-width: 86px !important;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border-color: rgba(174, 54, 48, 0.32) !important;
        border-radius: 10px !important;
        color: #8d2f2b !important;
        background: rgba(190, 66, 58, 0.12) !important;
        font-size: 14px !important;
        font-weight: 800;
        line-height: 1;

        &:hover {
            border-color: rgba(174, 54, 48, 0.5) !important;
            background: rgba(190, 66, 58, 0.2) !important;
        }
    }

    &--dark &__close {
        color: #ffaaa4 !important;
        background: rgba(211, 74, 66, 0.18) !important;
    }

    &__viewport {
        min-width: 0;
        min-height: 0;
        overflow: auto;
        padding: 24px clamp(28px, 6vw, 88px);
        scroll-behavior: smooth;
        overscroll-behavior: contain;

        .notes-viewer__pages {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 18px;
            width: 100%;
        }

        img {
            display: block;
            max-width: none;
            height: auto;
            margin: 0 auto;
            background: #fff;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.2);
            transition: width 0.18s ease;
        }
    }
}

.song {
    .icon-audio {
        display: block;
        margin: 0;
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

.song {
    width: min(920px, 100%);
    margin: 0 auto;
}

.song-ui-icon {
    width: 20px;
    height: 20px;
    flex: 0 0 auto;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.song-panel {
    border: 1px solid var(--app-border);
    border-radius: 20px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow);
}

.song-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 52px;
    margin-bottom: 16px;

    &__back {
        display: inline-flex;
        min-height: 44px;
        align-items: center;
        gap: 8px;
        padding: 0 12px 0 8px;
        border-radius: 12px;
        color: var(--app-muted);
        font-weight: 650;
        text-decoration: none;

        &:hover {
            color: var(--app-text);
            background: var(--app-surface-soft);
        }
    }

    &__actions {
        display: flex;
        gap: 6px;
    }

    &__icon-button {
        display: inline-grid;
        width: 44px;
        min-width: 44px !important;
        height: 44px;
        min-height: 44px !important;
        padding: 0 !important;
        place-items: center;
        border: 0;
        border-radius: 50% !important;
        color: var(--app-muted);
        background: transparent;
        cursor: pointer;

        &:hover {
            color: var(--app-text);
            background: var(--app-surface-soft);
        }

        &.is-active {
            color: var(--app-accent-strong);
            background: var(--app-accent-soft);
        }

        .icon {
            width: 20px;
            height: 20px;
        }
    }
}

.song-heading {
    max-width: 720px;
    margin: 0 auto 20px;
    text-align: center;

    &__number-row {
        display: grid;
        grid-template-columns: 96px 140px 96px;
        align-items: center;
        justify-content: center;
        gap: 16px;
        width: min(420px, 100%);
        margin: 0 auto 10px;
    }

    &__number {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--app-accent-strong);
        line-height: 1;
    }

    &__navigation {
        display: inline-flex;
        width: 100%;
        min-width: 0;
        min-height: 44px;
        align-items: center;
        gap: 5px;
        padding: 0 10px;
        border: 0;
        border-radius: 12px;
        color: var(--app-muted);
        background: transparent;
        cursor: pointer;
        transform: translateY(10px);
        transition: color 0.16s ease, background-color 0.16s ease;

        strong {
            width: 5.25ch;
            flex: 0 0 5.25ch;
            overflow: hidden;
            color: var(--app-accent-strong);
            font-size: 15px;
            font-variant-numeric: tabular-nums;
            text-align: center;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &:hover:not(:disabled) {
            color: var(--app-text);
            background: var(--app-surface-soft);
        }

        &:disabled {
            visibility: hidden;
        }

        &--previous {
            justify-content: flex-end;
        }

        &--next {
            justify-content: flex-start;
        }
    }

    &__number-label {
        margin-bottom: 4px;
        color: var(--app-muted);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    &__number-value {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(42px, 7vw, 58px);
        font-weight: 600;
        letter-spacing: -0.04em;
        white-space: nowrap;
    }

    h1 {
        display: grid;
        height: clamp(60px, 6vw, 68px);
        place-items: center;
        overflow: hidden;
        margin: 0;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(30px, 5vw, 45px);
        font-weight: 600;
        line-height: 1.1;
        text-wrap: balance;
    }

    &__verse {
        display: flex;
        height: 32px;
        align-items: center;
        justify-content: center;
        max-width: 610px;
        overflow: hidden;
        margin: 0 auto;
        color: var(--app-muted);
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 16px;
        line-height: 1.5;
    }
}

.song-switcher {
    display: grid;
    min-width: 0;
    height: 100%;
    margin: 0;

    &__slideshow {
        display: flex;
        width: 100%;
        min-height: 100%;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 9px;
        padding: 18px 14px;
        box-sizing: border-box;
        border: 1px solid color-mix(in srgb, var(--app-accent) 34%, transparent);
        border-radius: 18px;
        color: var(--app-accent-strong);
        background: var(--app-accent-soft);
        box-shadow: var(--app-shadow);
        font-size: 15px;
        font-weight: 750;
        cursor: pointer;

        .song-ui-icon {
            width: 24px;
            height: 24px;
        }

        &:hover {
            border-color: color-mix(in srgb, var(--app-accent) 55%, transparent);
            color: var(--app-accent-strong);
            background: var(--app-surface-soft);
        }
    }
}

.song-audio.song-panel {
    width: 100%;
    margin: 0;
    box-sizing: border-box;
}

.song-lyrics {
    margin-bottom: 16px;
    overflow: hidden;

    &__header {
        display: flex;
        min-height: 64px;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 10px 18px;
        border-bottom: 1px solid var(--app-border);

        h2 {
            margin: 0;
            font-size: 16px;
        }
    }

    &__text-size {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 3px;
        border-radius: 12px;
        background: var(--app-surface-soft);

        button {
            display: grid;
            min-width: 40px;
            height: 38px;
            padding: 0;
            place-items: center;
            border: 0;
            border-radius: 9px;
            color: var(--app-text);
            background: transparent;
            font-weight: 800;
            cursor: pointer;

            &:hover {
                background: var(--app-surface);
            }
        }

        span {
            min-width: 46px;
            color: var(--app-muted);
            font-size: 11px;
            text-align: center;
            font-variant-numeric: tabular-nums;
        }
    }
}

.song .song__body {
    display: block;
    width: fit-content;
    max-width: 100%;
    margin: 0 auto;
    padding: clamp(28px, 6vw, 56px) 24px clamp(38px, 8vw, 72px);
    box-sizing: border-box;
    font-family: Georgia, 'Times New Roman', serif;
    line-height: 1.7;
    text-align: left;
}

.song-stanza {
    display: grid;
    grid-template-columns: clamp(38px, 1.35em, 72px) minmax(0, 1fr);
    column-gap: clamp(10px, 0.4em, 20px);
    margin: 0 0 1.7em;

    &:last-child {
        margin-bottom: 0;
    }

    &__number {
        color: var(--app-accent-strong);
        font-family: Avenir, Helvetica, Arial, sans-serif;
        font-size: 0.82em;
        font-weight: 800;
        line-height: 2.05;
        text-align: right;
    }

    &__text {
        min-width: 0;
        white-space: pre-line;
    }
}

.song-chorus {
    margin: 0.25em 0 1.8em 3.1em;
    padding: 0.8em 0 0.8em 1.1em;
    border-left: 3px solid var(--app-accent);

    &__label {
        display: block;
        margin-bottom: 0.45rem;
        color: var(--app-accent-strong);
        font-family: Avenir, Helvetica, Arial, sans-serif;
        font-size: 0.58em;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    &__text {
        white-space: pre-line;
    }
}

.song-notes.song-panel {
    width: 100%;
    margin: 0 0 16px;
    overflow: hidden;
}

.song-notes {
    &__summary {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        padding: 10px;
    }

    &__main {
        display: grid;
        grid-template-columns: 46px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        min-height: 60px;
        padding: 4px 10px;
        border: 0;
        border-radius: 13px;
        color: var(--app-text);
        background: transparent;
        text-align: left;
        cursor: pointer;

        &:hover {
            background: var(--app-surface-soft);
        }
    }

    &__icon {
        display: grid;
        width: 46px;
        height: 46px;
        place-items: center;
        border-radius: 13px;
        color: var(--app-accent-strong);
        background: var(--app-accent-soft);
        font-size: 21px;
    }

    &__copy {
        min-width: 0;

        strong,
        small {
            display: block;
        }

        small {
            margin-top: 3px;
            color: var(--app-muted);
        }
    }

    &__chevron {
        font-size: 21px;
        transition: transform 0.18s ease;
    }

    &__main[aria-expanded='true'] &__chevron {
        transform: rotate(180deg);
    }

    &__fullscreen {
        display: inline-flex;
        min-height: 54px;
        align-items: center;
        align-self: center;
        gap: 9px;
        padding: 7px 14px;
        border: 0;
        border-radius: 11px;
        color: var(--app-text);
        background: var(--app-surface-soft);
        text-align: left;
        cursor: pointer;

        &:hover {
            background: var(--app-hover);
        }
    }

    &__fullscreen-icon {
        font-size: 21px;
        line-height: 1;
    }

    &__fullscreen-copy {
        strong,
        small {
            display: block;
        }

        strong {
            font-size: 13px;
            font-weight: 800;
        }

        small {
            margin-top: 2px;
            color: var(--app-muted);
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
        }
    }

    &__content {
        padding: 4px 20px 22px;
        border-top: 1px solid var(--app-border);
    }

    &__format-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 0;
        color: var(--app-muted);
        font-size: 13px;
    }

    &__single-format {
        color: var(--app-text);
    }
}

.song-notes .image-format-container {
    gap: 3px;
    padding: 3px;
    border-radius: 10px;
    background: var(--app-surface-soft);
}

.song-notes .image-format-button {
    min-width: 52px;
    min-height: 34px;
    padding: 4px 9px;
    border: 0;
    border-radius: 8px;
    box-shadow: none;
    color: var(--app-muted);
    background: transparent;
    font-size: 13px;

    &.selected {
        color: var(--app-text);
        background: var(--app-surface);
        box-shadow: 0 2px 7px rgba(0, 0, 0, 0.08);
    }
}

.song-notes .song-image {
    margin: 8px 0 0;
}

.song-details {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 14px;
    padding: 18px 20px;
    box-shadow: 0 7px 20px rgba(65, 49, 27, 0.08);

    &__icon {
        display: grid;
        width: 46px;
        height: 46px;
        place-items: center;
        border-radius: 13px;
        color: var(--app-muted);
        background: var(--app-surface-soft);
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 20px;
        font-style: italic;
        font-weight: 700;
    }

    h2 {
        margin: 1px 0 8px;
        font-size: 15px;
    }

    &__content {
        color: var(--app-muted);
        font-size: 13px;
        line-height: 1.65;
    }
}

.notes-viewer--dark.notes-viewer--svg .notes-viewer__viewport img {
    background: transparent;
    filter: invert(1) hue-rotate(180deg) brightness(1.16) contrast(0.94);
}

.notes-viewer--svg .notes-viewer__viewport img {
    background: transparent;
    box-shadow: none;
}

@media (max-width: 720px) {
    .song-action-row,
    .song-action-row--audio-only {
        grid-template-columns: minmax(0, 1fr);
        justify-content: stretch;
        gap: 10px;
    }

    .song-switcher {
        width: 100%;

        &__slideshow {
            min-height: 56px;
            flex-direction: row;
            padding: 12px 14px;
        }
    }
}

@media (max-width: 560px) {
    .song-audio {
        grid-template-columns: 1fr;
        gap: 13px;
        padding: 14px;

        &__controls {
            gap: 7px;
        }

        &__play {
            min-width: 104px;
            width: auto;
            height: 42px;
            padding: 0 12px;
        }
    }

    .song-image {
        margin: 14px 8px;
    }

    .notes-viewer {
        &__header {
            position: relative;
            align-items: stretch;
            flex-direction: column;
            gap: 0;
            min-height: 0;
            padding: 6px 8px 8px;

            > strong {
                display: block;
                height: 34px;
                padding-right: 100px;
                font-size: 15px;
                line-height: 34px;
            }
        }

        &__toolbar {
            display: block;
            margin-top: 3px;
        }

        &__controls {
            display: grid;
            width: 100%;
            min-width: 0;
            gap: 4px;
        }

        &__formats,
        &__zoom-controls {
            justify-content: center;
        }

        &__close {
            position: absolute;
            top: 6px;
            right: 8px;
        }

        &__toolbar button {
            min-width: 34px;
            height: 34px;
            padding: 3px 8px;
        }

        &__viewport {
            padding: 14px 18px;
        }
    }
}

@media (max-width: 680px) {
    .song-topbar {
        margin-bottom: 10px;
    }

    .song-heading {
        margin-bottom: 8px;
        padding: 0 8px;

        &__number-row {
            grid-template-columns: minmax(0, 1fr) 112px minmax(0, 1fr);
            gap: 4px;
            margin-bottom: 6px;
        }

        &__navigation {
            padding: 0 6px;
            transform: translateY(8px);

            strong {
                font-size: 13px;
            }
        }

        h1 {
            height: auto;
            min-height: 30px;
            padding: 2px 0;
            overflow: visible;
            font-size: clamp(16px, 4.5vw, 18px);
            line-height: 1.1;
        }

        &__verse {
            height: auto;
            min-height: 26px;
            margin-top: 2px;
            font-size: 12.5px;
            line-height: 1.35;
        }
    }

    .song-action-row:not(.song-action-row--audio-only) {
        grid-template-columns: minmax(0, 1fr) 48px;
        align-items: stretch;
        gap: 8px;
    }

    .song-action-row--audio-only {
        grid-template-columns: minmax(0, 1fr);
    }

    .song-switcher {
        width: auto;
        height: 100%;

        &__slideshow {
            width: 100%;
            min-height: 100%;
            justify-content: center;
            gap: 0;
            padding: 0;
            border-radius: 16px;
            font-size: 0;

            > span {
                display: none;
            }

            .song-ui-icon {
                width: 22px;
                height: 22px;
            }
        }
    }

    .song-audio.song-panel {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 10px;
        border-radius: 16px;
    }

    .song-audio {
        &__header {
            display: grid;
            grid-template-areas: 'selector types';
            grid-template-columns: minmax(112px, 1fr) auto;
            align-items: end;
            gap: 8px;
        }

        &__types {
            grid-area: types;
            justify-content: flex-end;
            gap: 4px;
        }

        &__selector {
            grid-area: selector;
            min-width: 0;
            width: 100%;
            gap: 2px;

            > span {
                font-size: 10px;
            }

            select {
                height: 34px;
                padding-right: 25px;
                font-size: 12px;
            }
        }

        &__type {
            width: 34px;
            min-width: 34px;
            height: 34px;
            flex-basis: 34px;
            min-height: 34px;
            justify-content: center;
            gap: 0;
            padding: 4px;
            border-radius: 10px;

            &--single {
                grid-area: types;
                justify-self: end;
            }
        }

        &__type-icon {
            width: 22px;
            height: 22px;
            flex-basis: 22px;

            .icon-audio,
            img,
            svg {
                width: 22px;
                height: 22px;
            }
        }

        &__controls {
            display: grid;
            grid-template-columns: auto minmax(64px, 1fr) 36px;
            align-items: center;
            gap: 6px;
        }

        &__play {
            min-width: 90px;
            height: 42px;
            padding: 0 10px;
            gap: 6px;
        }

        &__timeline {
            width: 100%;
        }

        &__volume {
            display: none;
        }

        &__mute {
            display: grid;
            width: 36px;
            min-width: 36px;
            height: 42px;
        }
    }

    .song-lyrics {
        &__header {
            min-height: 58px;
            padding: 8px 12px;
        }
    }

    .song .song__body {
        padding: 32px 16px 48px 10px;
        line-height: 1.65;
    }

    .song-stanza {
        grid-template-columns: 2em minmax(0, 1fr);
        column-gap: 0.55em;
    }

    .song-chorus {
        margin-left: 2.55em;
    }

    .song-notes {
        &__summary {
            grid-template-columns: 1fr;
            gap: 4px;
            padding: 7px;
        }

        &__main {
            grid-template-columns: 42px minmax(0, 1fr) auto;
            min-height: 56px;
            padding: 4px 7px;
        }

        &__icon {
            width: 42px;
            height: 42px;
        }

        &__fullscreen {
            width: 100%;
            justify-content: center;
        }

        &__content {
            padding: 4px 10px 14px;
        }

        &__format-row {
            padding-right: 4px;
            padding-left: 4px;
        }
    }

    .song-details {
        grid-template-columns: 42px minmax(0, 1fr);
        gap: 11px;
        padding: 15px;

        &__icon {
            width: 42px;
            height: 42px;
        }
    }
}

@media (max-width: 390px) {
    .song-topbar__back {
        width: 44px;
        justify-content: center;
        padding: 0;

        span {
            display: none;
        }
    }

    .song-lyrics__text-size > span {
        display: none;
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
    grid-template-rows: 76px minmax(0, 1fr) 82px;
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

        &:disabled {
            opacity: 0.35;
            cursor: not-allowed;
        }

        &.is-active {
            border-color: #d9b26f;
            color: #17130d;
            background: #d9b26f;
        }
    }

    &__songs-button {
        position: absolute;
        top: 18px;
        left: 22px;
        z-index: 4;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 48px;
        padding: 0 16px;
        border: 1px solid var(--lyrics-show-border);
        border-radius: 24px;
        color: var(--lyrics-show-text);
        background: var(--lyrics-show-control);
        font-weight: 700;
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

    &--controller &__header {
        padding-right: 210px;
        padding-left: 160px;
    }

    &__stage {
        z-index: 2;
        display: grid;
        min-width: 0;
        min-height: 0;
        overflow: visible;
        pointer-events: none;
    }

    &__content {
        z-index: 2;
        align-self: center;
        justify-self: stretch;
        width: 100%;
        min-height: 0;
        height: auto;
        max-height: 100%;
        overflow: visible;
        padding: 30px clamp(18px, 4vw, 72px);
        box-sizing: border-box;
        font-size: var(--lyrics-font-size, 36px);
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

        > span {
            display: block;
            width: 100%;
            text-align: center;
        }
    }

    &__overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        align-content: start;
        gap: 14px;
        width: 100%;
        min-height: 0;
        overflow: auto;
        padding: 24px clamp(18px, 4vw, 56px);
        box-sizing: border-box;
        pointer-events: auto;
    }

    &__preview {
        display: grid;
        align-content: start;
        gap: 10px;
        min-height: 180px;
        padding: 18px;
        border: 1px solid var(--lyrics-show-border);
        border-radius: 14px;
        color: var(--lyrics-show-text);
        background: var(--lyrics-show-panel-soft);
        text-align: left;
        cursor: pointer;
        transition: border-color 0.18s ease, background-color 0.18s ease,
            transform 0.18s ease;

        strong {
            color: var(--lyrics-show-muted);
            font-size: 14px;
            letter-spacing: 0.03em;
        }

        span {
            font-size: clamp(16px, 1.65vw, 24px);
            font-weight: 600;
            line-height: 1.3;
            white-space: pre-line;
        }

        &:hover {
            transform: translateY(-2px);
        }

        &.is-chorus {
            box-shadow: inset 4px 0 #d9b26f;
        }

        &.is-active {
            border-color: #d9b26f;
            background: rgba(217, 178, 111, 0.18);
            box-shadow: 0 0 0 2px rgba(217, 178, 111, 0.22);
        }
    }

    &__audio {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: minmax(240px, 0.8fr) minmax(360px, 1.2fr);
        align-items: center;
        justify-self: center;
        gap: 12px;
        width: min(100%, 880px);
        min-width: 0;
        padding: 10px 12px;
        border: 1px solid var(--lyrics-show-border);
        border-radius: 12px;
        color: var(--lyrics-show-text);
        background: var(--lyrics-show-panel);
        box-shadow: 0 7px 22px rgba(0, 0, 0, 0.14);
    }

    &__audio-heading,
    &__audio-controls,
    &__audio-volume {
        display: flex;
        align-items: center;
    }

    &__audio-heading {
        justify-content: space-between;
        gap: 10px;
        min-width: 0;

        small,
        strong {
            display: block;
        }

        small {
            margin-bottom: 3px;
            color: var(--lyrics-show-muted);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.07em;
        }

        strong {
            overflow: hidden;
            font-size: 15px;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        select {
            min-width: min(205px, 32vw);
            max-width: 260px;
            height: 36px;
            padding: 5px 30px 5px 9px;
            border: 1px solid var(--lyrics-show-border);
            border-radius: 8px;
            color: var(--lyrics-show-text);
            background: var(--lyrics-show-control);

            option {
                color: #17130d;
                background: #fff;
            }
        }
    }

    &__audio-controls {
        gap: 7px;
        min-width: 0;
    }

    &__audio-play {
        display: inline-flex;
        min-width: 104px;
        height: 36px;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 0 11px;
        border: 1px solid #d9b26f;
        border-radius: 18px;
        color: #24190b;
        background: #d9b26f;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
    }

    &__audio-progress {
        min-width: 100px;
        flex: 1;
        accent-color: #d9b26f;
    }

    &__audio-time {
        min-width: 40px;
        color: var(--lyrics-show-muted);
        font-size: 13px;
        text-align: center;
        font-variant-numeric: tabular-nums;
    }

    &__audio-volume {
        gap: 6px;
        color: var(--lyrics-show-muted);

        input {
            width: 68px;
            accent-color: #d9b26f;
        }
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
        left: auto;
        z-index: 6;
        width: min(520px, calc(100vw - 40px));
        height: calc(100vh - 158px);
        height: calc(100dvh - 158px);
        max-width: none;
        max-height: none;
        box-sizing: border-box;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-gutter: stable;
        margin: 0;
        padding: 20px;
        border: 1px solid var(--lyrics-show-border);
        border-radius: 16px;
        color: var(--lyrics-show-text);
        background: var(--lyrics-show-panel);
        box-shadow: 0 18px 55px rgba(0, 0, 0, 0.32);

        &::backdrop {
            background: transparent;
        }
    }

    &__song-gallery {
        position: absolute;
        inset: 76px 20px 82px;
        z-index: 7;
        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr);
        gap: 16px;
        box-sizing: border-box;
        overflow: hidden;
        padding: 20px;
        border: 1px solid var(--lyrics-show-border);
        border-radius: 16px;
        color: var(--lyrics-show-text);
        background: var(--lyrics-show-panel);
        box-shadow: 0 18px 55px rgba(0, 0, 0, 0.38);

        p {
            margin: 4px 0 0;
            color: var(--lyrics-show-muted);
            font-size: 13px;
        }
    }

    &__song-search {
        display: grid;
        gap: 6px;
        color: var(--lyrics-show-muted);
        font-size: 13px;

        input {
            width: 100%;
            min-height: 44px;
            padding: 9px 12px;
            border: 1px solid var(--lyrics-show-border);
            border-radius: 10px;
            outline: none;
            color: var(--lyrics-show-text);
            background: var(--lyrics-show-control);

            &:focus {
                border-color: #d9b26f;
                box-shadow: 0 0 0 3px rgba(217, 178, 111, 0.18);
            }
        }
    }

    &__song-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        align-content: start;
        gap: 9px;
        min-height: 0;
        overflow: auto;
        padding-right: 4px;

        > button {
            display: grid;
            grid-template-columns: minmax(44px, auto) 1fr;
            align-items: center;
            gap: 11px;
            min-height: 54px;
            padding: 9px 11px;
            border: 1px solid transparent;
            border-radius: 10px;
            color: var(--lyrics-show-text);
            background: var(--lyrics-show-panel-soft);
            text-align: left;
            cursor: pointer;

            strong {
                color: #d9b26f;
                font-variant-numeric: tabular-nums;
            }

            &.is-active {
                border-color: #d9b26f;
                background: rgba(217, 178, 111, 0.18);
            }
        }
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
        position: sticky;
        top: -20px;
        z-index: 2;
        margin: -20px -20px 0;
        padding: 16px 20px 12px;
        border-bottom: 1px solid var(--lyrics-show-border);
        background: var(--lyrics-show-panel);
        cursor: grab;
        touch-action: none;
        user-select: none;

        &--dragging {
            cursor: grabbing;
        }

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

    &__settings-heading {
        display: flex;
        min-width: 0;
        align-items: center;
        gap: 9px;
    }

    &__drag-mark {
        color: var(--lyrics-show-muted);
        font-size: 22px;
        line-height: 1;
    }

    &__defaults-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        min-height: 42px;
        margin-top: 16px;
        padding: 9px 14px;
        border: 1px solid var(--lyrics-show-border);
        border-radius: 10px;
        color: var(--lyrics-show-text);
        background: var(--lyrics-show-control);
        font-weight: 700;
        cursor: pointer;

        &:hover {
            border-color: #d9b26f;
            background: var(--lyrics-show-panel-soft);
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
        grid-template-rows: 64px minmax(0, 1fr) 68px;

        &__header {
            min-height: 64px;
            padding: 10px 66px 10px 18px;
        }

        &--controller &__header {
            overflow: hidden;
            padding-right: 160px;
            padding-left: 62px;
            font-size: 14px;
            white-space: nowrap;
            text-overflow: ellipsis;
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

        &__songs-button {
            top: 10px;
            left: 10px;
            min-height: 42px;
            padding: 0 12px;
            border-radius: 21px;
        }

        &__songs-label {
            display: none;
        }

        &__settings {
            top: 62px;
            right: 8px;
            bottom: 68px;
            width: calc(100vw - 16px);
            height: calc(100vh - 130px);
            height: calc(100dvh - 130px);
            padding: 15px;
        }

        &__settings-header {
            top: -15px;
            margin: -15px -15px 0;
            padding: 13px 15px 10px;
            cursor: default;
            touch-action: auto;
        }

        &__song-gallery {
            inset: 62px 8px 68px;
            gap: 12px;
            padding: 15px;
        }

        &__overview {
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 10px;
            padding: 14px 10px;
        }

        &__audio {
            grid-template-columns: minmax(0, 1fr);
            gap: 8px;
            width: 100%;
        }

        &__audio-heading {
            flex-wrap: wrap;

            select {
                min-width: min(205px, 52vw);
            }
        }

        &__audio-progress {
            min-width: 70px;
        }

        &__audio-volume {
            display: none;
        }

        &__preview {
            min-height: 150px;
            padding: 14px;
        }

        &__content {
            width: 100%;
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
        justify-self: stretch;
        width: 100%;
        max-height: 100%;
        overflow: hidden;
        padding: 30px clamp(18px, 4vw, 72px);
        box-sizing: border-box;
        font-size: var(--lyrics-font-size, 36px);
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
