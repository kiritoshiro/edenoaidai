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

        <div class="adm-status-slot" aria-live="polite">
            <p v-if="error" class="adm-status adm-status--error">{{ error }}</p>
            <p v-else-if="message" class="adm-status adm-status--ok">{{ message }}</p>
        </div>

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
                            kiekvieno paprasto stulpelio. „Priegiesmio dalys“
                            skaidrėse atskiriamos, o giesmės tekste sujungiamos į
                            vieną priegiesmį.
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
                    :class="{
                        'lyrics-slide--chorus': slide.type === 'chorus',
                        'lyrics-slide--chorus-part': slide.type === 'chorusPart',
                    }"
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
                        :ref="`slideText-${slide.key}`"
                        v-model="slide.text"
                        rows="6"
                        placeholder="Įrašykite šio stulpelio žodžius…"
                    ></textarea>

                    <div class="lyrics-slide__repeat-tools">
                        <button
                            type="button"
                            class="adm-button adm-button--ghost"
                            @click="wrapSlideRepeat(slide)"
                        >
                            /: Pažymėti kartojimą :/
                        </button>
                        <small>
                            Pažymėkite kartojamą tekstą arba padėkite žymeklį ten,
                            kur norite įterpti ženklus.
                        </small>
                    </div>

                    <div class="lyrics-slide__options">
                        <label class="lyrics-slide__type">
                            <span>Tipas</span>
                            <select
                                v-model="slide.type"
                                @change="onSlideTypeChange(slide)"
                            >
                                <option value="verse">Posmas</option>
                                <option value="chorus">Priegiesmis (pradžia)</option>
                                <option value="chorusPart">Priegiesmio dalis</option>
                            </select>
                        </label>
                        <label v-if="slide.type === 'verse' && hasChorus">
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
                Rodomi tik serveryje esantys SVG ir JPG failai. Naują natų puslapį
                pridėkite atitinkamo formato mygtuku.
            </p>
            <section
                v-for="format in ['svg', 'jpg']"
                :key="format"
                class="note-format-editor"
            >
                <div class="note-format-editor__header">
                    <h3>{{ format.toUpperCase() }}</h3>
                    <button
                        type="button"
                        class="adm-button adm-button--ghost"
                        :disabled="!canAddNote(format)"
                        @click="addNoteSlot(format)"
                    >
                        + Pridėti natų puslapį
                    </button>
                </div>

                <p v-if="!files.notes[format].length" class="adm-muted">
                    Šio formato natų failų nėra.
                </p>
                <table v-else class="adm-table">
                    <thead>
                        <tr>
                            <th style="width: 40%">Failas</th>
                            <th>Būsena</th>
                            <th style="text-align: right">Veiksmai</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="entry in files.notes[format]" :key="`${format}-${entry.page}`">
                            <td>{{ entry.file }}</td>
                            <td>
                                <a
                                    v-if="entry.exists"
                                    :href="`${apiUrl}/files/notes/${format}/${entry.file}`"
                                    target="_blank"
                                    rel="noopener"
                                >Yra – peržiūrėti ↗</a>
                                <span v-else class="adm-muted">Laukiama failo</span>
                            </td>
                            <td style="text-align: right">
                                <label
                                    v-if="!entry.exists"
                                    class="adm-button adm-button--ghost"
                                    style="display: inline-block; cursor: pointer"
                                >
                                    Pasirinkti {{ format.toUpperCase() }}
                                    <input
                                        type="file"
                                        :accept="format === 'svg' ? '.svg,image/svg+xml' : '.jpg,.jpeg,image/jpeg'"
                                        style="display: none"
                                        @change="onUploadNotes(format, entry.page, $event)"
                                    />
                                </label>
                                <button
                                    v-if="entry.exists"
                                    type="button"
                                    class="adm-button adm-button--danger"
                                    @click="onDeleteNotes(format, entry.page)"
                                >
                                    Šalinti
                                </button>
                                <button
                                    v-else
                                    type="button"
                                    class="adm-button adm-button--danger"
                                    style="margin-left: 6px"
                                    @click="removeNoteSlot(format, entry.page)"
                                >
                                    Atšaukti
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>
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
    const blocks = [];

    slides.forEach(slide => {
        const lyrics = newlinesToBr(slide.text);
        const previousBlock = blocks[blocks.length - 1];
        if (slide.isChorus && slide.chorusPart && previousBlock?.isChorus) {
            previousBlock.html += `<br><br>${lyrics}`;
            return;
        }

        blocks.push({
            isChorus: slide.isChorus,
            html: slide.isChorus
                ? `<span class="priegiesmis">Priegiesmis:</span><br>${lyrics}`
                : lyrics,
        });
    });

    return blocks.map(block => block.html).join('<br><br>');
}

let nextSlideKey = 1;

function createSlide(values = {}) {
    const type =
        values.type === 'chorusPart' || values.chorusPart === true
            ? 'chorusPart'
            : values.type === 'chorus' || values.isChorus === true
              ? 'chorus'
              : 'verse';
    return {
        key: nextSlideKey++,
        text: brToNewlines(values.text || ''),
        type,
        chorusAfter: type !== 'verse'
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
            return this.song?.slides?.some(slide => slide.type === 'chorus') === true;
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
            slide.chorusAfter = slide.type === 'verse';
        },
        slideLabel(slide, index) {
            if (slide.type === 'chorus') return `Priegiesmis (${index + 1})`;
            if (slide.type === 'chorusPart') {
                return `Priegiesmio dalis (${index + 1})`;
            }
            return `Stulpelis ${index + 1}`;
        },
        wrapSlideRepeat(slide) {
            const raw = String(slide.text || '');
            const ref = this.$refs[`slideText-${slide.key}`];
            const textarea = Array.isArray(ref) ? ref[0] : ref;
            const start = Number.isInteger(textarea?.selectionStart)
                ? textarea.selectionStart
                : raw.length;
            const end = Number.isInteger(textarea?.selectionEnd)
                ? textarea.selectionEnd
                : start;
            const selected = raw.slice(start, end);
            const prefix = '/: ';
            const suffix = ' :/';
            slide.text = `${raw.slice(0, start)}${prefix}${selected}${suffix}${raw.slice(end)}`;

            this.$nextTick(() => {
                const nextRef = this.$refs[`slideText-${slide.key}`];
                const nextTextarea = Array.isArray(nextRef) ? nextRef[0] : nextRef;
                if (!nextTextarea) return;
                const selectionStart = start + prefix.length;
                nextTextarea.focus();
                nextTextarea.setSelectionRange(
                    selectionStart,
                    selectionStart + selected.length,
                );
            });
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
                const files = await api.songFiles(this.songId);
                files.notes = files.notes || {};
                for (const format of ['svg', 'jpg']) {
                    files.notes[format] = (files.notes[format] || [])
                        .filter(entry => entry.exists)
                        .map(entry => ({ ...entry, temporary: false }));
                }
                this.files = files;
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
                    .map(({ text, type, chorusAfter }) => ({
                        text: lyricsToPlainText(text),
                        isChorus: type === 'chorus' || type === 'chorusPart',
                        chorusPart: type === 'chorusPart',
                        chorusAfter:
                            type === 'verse' ? chorusAfter !== false : false,
                    }))
                    .filter(slide => slide.text !== '');
                if (slides.length === 0) {
                    throw new Error('Pridėkite bent vieną netuščią teksto stulpelį.');
                }

                let chorusOpen = false;
                slides.forEach((slide, index) => {
                    if (!slide.isChorus) {
                        chorusOpen = false;
                    } else if (!slide.chorusPart) {
                        chorusOpen = true;
                    } else if (!chorusOpen) {
                        throw new Error(
                            `Priegiesmio dalis ${index + 1} turi eiti iškart po priegiesmio pradžios arba kitos jo dalies.`,
                        );
                    }
                });

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
        noteFileName(format, page) {
            return page === 0
                ? `${this.songId}.${format}`
                : `${this.songId}_${page}.${format}`;
        },
        canAddNote(format) {
            const entries = this.files?.notes?.[format] || [];
            return entries.length < 9 && !entries.some(entry => !entry.exists);
        },
        addNoteSlot(format) {
            if (!this.canAddNote(format)) return;
            const entries = this.files.notes[format];
            const occupied = new Set(entries.map(entry => Number(entry.page)));
            let page = 0;
            while (occupied.has(page) && page <= 8) page += 1;
            if (page > 8) return;
            entries.push({
                page,
                file: this.noteFileName(format, page),
                exists: false,
                temporary: true,
            });
            entries.sort((a, b) => a.page - b.page);
        },
        removeNoteSlot(format, page) {
            const entries = this.files?.notes?.[format];
            if (!entries) return;
            const index = entries.findIndex(entry => entry.page === page && !entry.exists);
            if (index >= 0) entries.splice(index, 1);
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

.note-format-editor {
    margin: 18px 0 24px;

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;

        h3 {
            margin: 0;
        }
    }
}

.lyrics-slide {
    margin-bottom: 14px;
    padding: 14px;
    border: 1px solid var(--adm-border);
    border-left: 5px solid var(--adm-card-edge);
    border-radius: 8px;
    color: var(--adm-text);
    background: var(--adm-card);

    &--chorus {
        border-left-color: var(--adm-card-chorus-edge);
        background: var(--adm-card-chorus);
    }

    &--chorus-part {
        border-left-color: var(--adm-card-chorus-part-edge);
        border-left-style: dashed;
        background: var(--adm-card-chorus-part);
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

    &__repeat-tools {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 12px;
        margin-top: 8px;

        button {
            padding: 6px 10px;
        }

        small {
            max-width: 520px;
            color: var(--adm-muted);
        }
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
            background: var(--adm-option);
            cursor: pointer;
        }

        select {
            min-width: 190px;
            padding: 5px 8px;
        }
    }
}

@media (max-width: 640px) {
    .lyrics-editor__header {
        flex-direction: column;
    }
}
</style>
