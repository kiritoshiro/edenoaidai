<template>
    <div>
        <div class="adm-toolbar">
            <router-link :to="{ name: 'admin-songs' }">
                <button class="adm-button adm-button--ghost">← Atgal į sąrašą</button>
            </router-link>
            <h2 style="margin: 0">
                {{ isNew ? 'Nauja giesmė' : `Giesmė ${songId}` }}
            </h2>
        </div>

        <p v-if="error" class="adm-status adm-status--error">{{ error }}</p>
        <p v-if="message" class="adm-status adm-status--ok">{{ message }}</p>

        <form v-if="song" @submit.prevent="save">
            <label class="adm-field" style="max-width: 200px">
                <span>Numeris</span>
                <input
                    v-model="song.songId"
                    class="adm-input"
                    :disabled="!isNew"
                    pattern="[A-Za-z0-9 _-]{1,20}"
                    title="Raidės, skaičiai, tarpas, _ ir -"
                    required
                />
            </label>
            <label class="adm-field">
                <span>Pavadinimas</span>
                <input v-model="song.title" class="adm-input" required />
            </label>
            <label class="adm-field">
                <span>Posmelis / eilutė (verse)</span>
                <input v-model="song.verse" class="adm-input" />
            </label>
            <section class="lyrics-editor">
                <div class="lyrics-editor__header">
                    <div>
                        <h3>Teksto stulpeliai / skaidrės</h3>
                        <p class="adm-file-note">
                            Kiekvienas stulpelis skaidrių režime rodomas atskirai.
                            Priegiesmio stulpeliai pagal nutylėjimą kartojami po
                            kiekvieno paprasto stulpelio.
                        </p>
                    </div>
                    <button
                        type="button"
                        class="adm-button adm-button--ghost"
                        @click="addSlide"
                    >
                        + Pridėti stulpelį
                    </button>
                </div>

                <article
                    v-for="(slide, index) in song.slides"
                    :key="slide.key"
                    class="lyrics-slide"
                    :class="{ 'lyrics-slide--chorus': slide.isChorus }"
                >
                    <div class="lyrics-slide__toolbar">
                        <strong>{{ slideLabel(slide, index) }}</strong>
                        <div>
                            <button
                                type="button"
                                class="adm-button adm-button--ghost lyrics-slide__move"
                                :disabled="index === 0"
                                title="Perkelti aukštyn"
                                @click="moveSlide(index, -1)"
                            >
                                ↑
                            </button>
                            <button
                                type="button"
                                class="adm-button adm-button--ghost lyrics-slide__move"
                                :disabled="index === song.slides.length - 1"
                                title="Perkelti žemyn"
                                @click="moveSlide(index, 1)"
                            >
                                ↓
                            </button>
                            <button
                                type="button"
                                class="adm-button adm-button--danger"
                                :disabled="song.slides.length === 1"
                                @click="removeSlide(index)"
                            >
                                Šalinti
                            </button>
                        </div>
                    </div>

                    <textarea
                        v-model="slide.text"
                        rows="6"
                        placeholder="Įrašykite šio stulpelio žodžius…"
                    ></textarea>

                    <div class="lyrics-slide__options">
                        <label>
                            <input
                                v-model="slide.isChorus"
                                type="checkbox"
                                @change="onSlideTypeChange(slide)"
                            />
                            Priegiesmis
                        </label>
                        <label v-if="!slide.isChorus && hasChorus">
                            <input v-model="slide.chorusAfter" type="checkbox" />
                            Rodyti priegiesmį po šio stulpelio
                        </label>
                    </div>
                </article>
            </section>
            <label class="adm-field">
                <span>Autorystė (copyright)</span>
                <input v-model="song.copyright" class="adm-input" />
            </label>
            <div class="adm-field">
                <span>Įrašų tipai (audio)</span>
                <p class="adm-file-note">
                    Nustatomi automatiškai: jeigu kategorijos aplanke yra
                    <b>{{ song.songId || 'giesmėsNr' }}.mp3</b>, kategorijos ikona
                    bus rodoma prie šios giesmės.
                </p>
            </div>

            <div class="adm-toolbar">
                <button class="adm-button" :disabled="busy">
                    {{ busy ? 'Saugoma…' : 'Išsaugoti' }}
                </button>
                <button
                    v-if="!isNew"
                    type="button"
                    class="adm-button adm-button--danger"
                    @click="removeSong"
                >
                    Šalinti giesmę
                </button>
            </div>
        </form>

        <template v-if="!isNew && song && files">
            <h2>Audio failai</h2>
            <p class="adm-file-note">
                Failai saugomi šiame serveryje: /files/audio/&lt;tipas&gt;/{{ songId }}.mp3.
                Jei programėlė audio ima iš kito adreso (VITE_AUDIO_BASE),
                įkeltus failus reikės perkelti ten.
            </p>
            <table class="adm-table">
                <thead>
                    <tr>
                        <th>Tipas</th>
                        <th>Būsena</th>
                        <th style="text-align: right">Veiksmai</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="track in allTracks" :key="track.name">
                        <td><span class="adm-pill">{{ track.label || track.name }}</span></td>
                        <td>
                            <a
                                v-if="files.audio[track.name]"
                                :href="`${apiUrl}/files/audio/${track.name}/${songId}.mp3`"
                                target="_blank"
                                rel="noopener"
                            >Yra – klausyti ↗</a>
                            <span v-else class="adm-muted">Nėra</span>
                        </td>
                        <td style="text-align: right">
                            <label class="adm-button adm-button--ghost" style="display: inline-block; cursor: pointer">
                                Įkelti MP3
                                <input
                                    type="file"
                                    accept=".mp3,audio/mpeg"
                                    style="display: none"
                                    @change="onUploadAudio(track.name, $event)"
                                />
                            </label>
                            <button
                                v-if="files.audio[track.name]"
                                class="adm-button adm-button--danger"
                                style="margin-left: 6px"
                                @click="onDeleteAudio(track.name)"
                            >
                                Šalinti
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <h2>Natos</h2>
            <p class="adm-file-note">
                Puslapiai aptinkami automatiškai pagal SVG ir JPG failus.
                Tuščia eilutė po paskutinio failo skirta kitam puslapiui įkelti.
            </p>
            <table v-for="format in ['svg', 'jpg']" :key="format" class="adm-table" style="margin-bottom: 20px">
                <thead>
                    <tr>
                        <th style="width: 40%">{{ format.toUpperCase() }} failas</th>
                        <th>Būsena</th>
                        <th style="text-align: right">Veiksmai</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="entry in files.notes[format]" :key="entry.file">
                        <td>{{ entry.file }}</td>
                        <td>
                            <a
                                v-if="entry.exists"
                                :href="`${apiUrl}/files/notes/${format}/${entry.file}`"
                                target="_blank"
                                rel="noopener"
                            >Yra – peržiūrėti ↗</a>
                            <span v-else class="adm-muted">Nėra</span>
                        </td>
                        <td style="text-align: right">
                            <label class="adm-button adm-button--ghost" style="display: inline-block; cursor: pointer">
                                Įkelti {{ format.toUpperCase() }}
                                <input
                                    type="file"
                                    :accept="format === 'svg' ? '.svg,image/svg+xml' : '.jpg,.jpeg,image/jpeg'"
                                    style="display: none"
                                    @change="onUploadNotes(format, entry.page, $event)"
                                />
                            </label>
                            <button
                                v-if="entry.exists"
                                class="adm-button adm-button--danger"
                                style="margin-left: 6px"
                                @click="onDeleteNotes(format, entry.page)"
                            >
                                Šalinti
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </template>
    </div>
</template>

<script>
import { api } from '../../lib/api';
import { config } from '../../lib/config';
import { lyricsToPlainText } from '../../lib/lyrics';

// Saugykloje eilučių lūžiai laikomi kaip <br>, o redaktoriuje rodomi
// kaip paprastos naujos eilutės (Enter). Konvertuojama abiem kryptimis.
function brToNewlines(value) {
    return lyricsToPlainText(value);
}

function newlinesToBr(value) {
    return String(value || '')
        .replace(/\r\n?/g, '\n')
        .replace(/\n/g, '<br>');
}

function slidesToBody(slides) {
    return slides
        .map(slide => {
            const lyrics = newlinesToBr(slide.text);
            return slide.isChorus
                ? `<span class="priegiesmis">Priegiesmis:</span><br>${lyrics}`
                : lyrics;
        })
        .join('<br><br>');
}

let nextSlideKey = 1;

function createSlide(values = {}) {
    return {
        key: nextSlideKey++,
        text: brToNewlines(values.text || ''),
        isChorus: values.isChorus === true,
        chorusAfter: values.isChorus === true
            ? false
            : values.chorusAfter !== false,
    };
}

function slidesFromSong(song) {
    if (Array.isArray(song.slides) && song.slides.length > 0) {
        return song.slides.map(createSlide);
    }

    const blocks = brToNewlines(song.body)
        .split(/\n\s*\n+/)
        .map(text => text.trim())
        .filter(Boolean);
    return blocks.length > 0
        ? blocks.map(text => createSlide({ text }))
        : [createSlide()];
}

export default {
    name: 'AdminSongEdit',
    props: {
        songId: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            song: null,
            allTracks: [],
            files: null,
            busy: false,
            error: '',
            message: '',
            apiUrl: config.apiUrl,
        };
    },
    computed: {
        isNew() {
            return this.$route.name === 'admin-song-new';
        },
        hasChorus() {
            return this.song?.slides?.some(slide => slide.isChorus) === true;
        },
    },
    watch: {
        // Covers navigating between songs and the new → edit transition
        // right after a song is created
        async songId(value) {
            if (value && !this.isNew) {
                await this.loadSong();
                await this.loadFiles();
            }
        },
    },
    async created() {
        try {
            this.allTracks = (await api.tracks()) || [];
            if (this.isNew) {
                this.song = {
                    songId: '',
                    title: '',
                    verse: '',
                    body: '',
                    slides: [createSlide()],
                    copyright: '',
                    lists: [],
                };
            } else {
                await this.loadSong();
                await this.loadFiles();
            }
        } catch (error) {
            this.error = error.message;
        }
    },
    methods: {
        addSlide() {
            this.song.slides.push(createSlide());
        },
        removeSlide(index) {
            if (this.song.slides.length > 1) {
                this.song.slides.splice(index, 1);
            }
        },
        moveSlide(index, direction) {
            const target = index + direction;
            if (target < 0 || target >= this.song.slides.length) return;
            const [slide] = this.song.slides.splice(index, 1);
            this.song.slides.splice(target, 0, slide);
        },
        onSlideTypeChange(slide) {
            slide.chorusAfter = slide.isChorus ? false : true;
        },
        slideLabel(slide, index) {
            return slide.isChorus
                ? `Priegiesmis (${index + 1})`
                : `Stulpelis ${index + 1}`;
        },
        flash(message) {
            this.message = message;
            this.error = '';
            setTimeout(() => {
                this.message = '';
            }, 2500);
        },
        async loadSong() {
            const song = await api.song(this.songId);
            this.song = {
                songId: song.songId,
                title: Array.isArray(song.title)
                    ? song.title.join(' / ')
                    : song.title || '',
                verse: song.verse || '',
                body: brToNewlines(song.body),
                slides: slidesFromSong(song),
                copyright: song.copyright || '',
                lists: Array.isArray(song.lists) ? [...song.lists] : [],
            };
        },
        async loadFiles() {
            try {
                this.files = await api.songFiles(this.songId);
            } catch (error) {
                console.error(error);
                this.files = null;
            }
        },
        async save() {
            this.busy = true;
            this.error = '';
            try {
                const slides = this.song.slides
                    .map(({ text, isChorus, chorusAfter }) => ({
                        text: lyricsToPlainText(text),
                        isChorus: isChorus === true,
                        chorusAfter: isChorus === true ? false : chorusAfter !== false,
                    }))
                    .filter(slide => slide.text !== '');
                if (slides.length === 0) {
                    throw new Error('Pridėkite bent vieną netuščią teksto stulpelį.');
                }

                const editableSong = { ...this.song };
                delete editableSong.lists;
                delete editableSong.slides;
                const payload = {
                    ...editableSong,
                    body: slidesToBody(slides),
                    slides,
                };
                if (this.isNew) {
                    await api.createSong(payload);
                    this.$router.replace({
                        name: 'admin-song-edit',
                        params: { songId: this.song.songId },
                    });
                } else {
                    await api.updateSong(this.songId, payload);
                    await this.loadFiles();
                }
                this.flash('Išsaugota.');
            } catch (error) {
                this.error = error.message;
            } finally {
                this.busy = false;
            }
        },
        async removeSong() {
            if (
                !window.confirm(
                    `Šalinti giesmę ${this.songId}? Veiksmas negrįžtamas (failai serveryje lieka).`,
                )
            ) {
                return;
            }
            try {
                await api.deleteSong(this.songId);
                this.$router.push({ name: 'admin-songs' });
            } catch (error) {
                this.error = error.message;
            }
        },
        pickedFile(event) {
            const file = event.target.files && event.target.files[0];
            event.target.value = '';
            return file || null;
        },
        async onUploadAudio(type, event) {
            const file = this.pickedFile(event);
            if (!file) return;
            try {
                await api.uploadAudio(type, this.songId, file);
                this.flash('Audio failas įkeltas.');
                await this.loadFiles();
            } catch (error) {
                this.error = error.message;
            }
        },
        async onDeleteAudio(type) {
            if (!window.confirm('Šalinti šį audio failą?')) return;
            try {
                await api.deleteAudio(type, this.songId);
                this.flash('Audio failas pašalintas.');
                await this.loadFiles();
            } catch (error) {
                this.error = error.message;
            }
        },
        async onUploadNotes(format, page, event) {
            const file = this.pickedFile(event);
            if (!file) return;
            try {
                await api.uploadNotes(format, this.songId, page, file);
                this.flash('Natų failas įkeltas.');
                await this.loadFiles();
            } catch (error) {
                this.error = error.message;
            }
        },
        async onDeleteNotes(format, page) {
            if (!window.confirm('Šalinti šį natų failą?')) return;
            try {
                await api.deleteNotes(format, this.songId, page);
                this.flash('Natų failas pašalintas.');
                await this.loadFiles();
            } catch (error) {
                this.error = error.message;
            }
        },
    },
};
</script>

<style lang="scss">
.lyrics-editor {
    margin: 22px 0;

    &__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 14px;

        h3 {
            margin: 0 0 5px;
        }
    }
}

.lyrics-slide {
    margin-bottom: 14px;
    padding: 14px;
    border: 1px solid #d9d9d9;
    border-left: 5px solid #b5b5b5;
    border-radius: 8px;
    background: #fff;

    &--chorus {
        border-left-color: #d9b26f;
        background: #fffaf0;
    }

    textarea {
        width: 100%;
        box-sizing: border-box;
        margin-top: 10px;
    }

    &__toolbar,
    &__options {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
    }

    &__move {
        min-width: 38px;
        margin-right: 5px;
        font-size: 18px;
    }

    &__options {
        justify-content: flex-start;
        margin-top: 10px;

        label {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 10px;
            border-radius: 6px;
            background: #f2f2f2;
            cursor: pointer;
        }
    }
}

@media (max-width: 640px) {
    .lyrics-editor__header {
        flex-direction: column;
    }
}
</style>
