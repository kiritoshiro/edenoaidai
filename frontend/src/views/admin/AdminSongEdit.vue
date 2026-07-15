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
            <label class="adm-field">
                <span>Tekstas (Enter – nauja eilutė)</span>
                <textarea v-model="song.body" rows="14"></textarea>
            </label>
            <label class="adm-field">
                <span>Autorystė (copyright)</span>
                <input v-model="song.copyright" class="adm-input" />
            </label>
            <label class="adm-field" style="max-width: 200px">
                <span>Natų puslapių skaičius</span>
                <input
                    v-model.number="song.pages"
                    class="adm-input"
                    type="number"
                    min="1"
                    max="9"
                />
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
                Puslapių skaičius nustatomas lauke „Natų puslapių skaičius“
                (išsaugokite giesmę, kad pasikeistų sąrašas). „Natos 1#“ –
                SVG failai, „Natos 2#“ – JPG failai.
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

// Saugykloje eilučių lūžiai laikomi kaip <br>, o redaktoriuje rodomi
// kaip paprastos naujos eilutės (Enter). Konvertuojama abiem kryptimis.
function brToNewlines(value) {
    return String(value || '')
        .replace(/\r\n?/g, '\n')
        .replace(/<br\s*\/?>\n?/gi, '\n');
}

function newlinesToBr(value) {
    return String(value || '')
        .replace(/\r\n?/g, '\n')
        .replace(/\n/g, '<br>');
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
                    copyright: '',
                    pages: 3,
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
                copyright: song.copyright || '',
                pages: Number(song.pages) || 3,
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
                const { lists, ...editableSong } = this.song;
                const payload = {
                    ...editableSong,
                    body: newlinesToBr(this.song.body),
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
