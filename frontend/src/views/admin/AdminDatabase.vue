<template>
    <div>
        <h2>Kategorijos ir įrašų aplankai</h2>
        <p class="adm-file-note">
            Kiekvienas <b>server/files/audio/</b> aplankas yra kategorija. Čia
            vienoje vietoje galite keisti aplanko (techninį) vardą, rodomą
            pavadinimą ir ikoną. Pervadinant aplanką MP3 failai ir giesmių
            priskyrimai išsaugomi.
        </p>

        <div class="adm-status-slot" aria-live="polite">
            <p v-if="error" class="adm-status adm-status--error">{{ error }}</p>
            <p v-else-if="message" class="adm-status adm-status--ok">{{ message }}</p>
        </div>

        <div v-if="!tracks.length" class="adm-muted">Kategorijų nerasta.</div>
        <div v-else class="adm-table-wrap">
            <table class="adm-table adm-category-table">
                <thead>
                    <tr>
                        <th>Aplanko vardas</th>
                        <th>Rodomas pavadinimas</th>
                        <th>MP3</th>
                        <th>Ikona</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="track in tracks" :key="track.originalName">
                        <td>
                            <input
                                v-model="track.name"
                                class="adm-input adm-category-name"
                                type="text"
                                pattern="[a-z0-9&+_-]{1,40}"
                                title="Mažosios raidės, skaičiai ir & + _ -"
                            />
                        </td>
                        <td>
                            <input
                                v-model="track.label"
                                class="adm-input adm-category-label"
                                type="text"
                                maxlength="100"
                            />
                        </td>
                        <td><span class="adm-pill">{{ (track.tracks || []).length }}</span></td>
                        <td>
                            <img
                                v-if="track.icon"
                                :src="iconUrl(track.icon)"
                                alt=""
                                class="adm-category-icon"
                            />
                            <span v-else class="adm-muted">nėra</span>
                            <label class="adm-button adm-button--ghost adm-icon-upload">
                                Įkelti
                                <input
                                    type="file"
                                    accept=".svg,.png,.webp,.jpg,.jpeg,image/*"
                                    :disabled="busy || track.name !== track.originalName"
                                    :title="track.name !== track.originalName ? 'Pirmiausia išsaugokite aplanko vardą' : ''"
                                    @change="uploadIcon(track, $event)"
                                />
                            </label>
                        </td>
                        <td class="adm-category-actions">
                            <button class="adm-button" :disabled="busy" @click="saveTrack(track)">
                                Išsaugoti
                            </button>
                            <button class="adm-button adm-button--danger" :disabled="busy" @click="remove(track)">
                                Šalinti
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <h2>Nauja kategorija</h2>
        <form class="adm-toolbar" @submit.prevent="create">
            <input
                v-model="newTrack.name"
                class="adm-input"
                type="text"
                placeholder="aplanko vardas (pvz. gitara)"
                pattern="[a-z0-9&+_-]{1,40}"
                title="Mažosios raidės, skaičiai ir & + _ -"
                required
            />
            <input
                v-model="newTrack.label"
                class="adm-input"
                type="text"
                maxlength="100"
                placeholder="Rodomas pavadinimas (pvz. Gitara)"
            />
            <button class="adm-button" :disabled="busy">Pridėti kategoriją</button>
        </form>
        <p class="adm-file-note">
            Nauja kategorija sukuria naują aplanką <b>files/audio/</b> viduje.
            MP3 failo vardas turi sutapti su giesmės numeriu.
        </p>

        <h2>Garso ir natų failai</h2>
        <p class="adm-file-note">
            Atsisiųskite atsargines kopijas pagal kategoriją/formatą, arba
            išskleiskite kategoriją ir tvarkykite pavienius failus – pažymėkite
            kelis atsisiuntimui, pašalinkite arba įkelkite naujus.
        </p>
        <MediaLibraryPanel />

        <h2>Duomenų bazė</h2>
        <h3 class="adm-subheading">Atsisiųsti</h3>
        <div class="adm-toolbar">
            <button class="adm-button" :disabled="busy" @click="exportDb">
                Atsisiųsti visą duomenų bazę
            </button>
        </div>
        <p class="adm-file-note">
            Faile bus giesmių tekstai, skaidrių išdėstymas, įrašų kategorijos ir
            jų priskyrimai. MP3 ir natų failai į JSON neįtraukiami.
        </p>

        <h3 class="adm-subheading">Atkurti duomenų bazę</h3>
        <p class="adm-file-note">
            Galima įkelti šio puslapio atsisiųstą pilną atsarginę kopiją arba seną
            giesmių masyvą. Pilna kopija atkuria tekstus, skaidres, kategorijas
            ir priskyrimus; fiziniai garso bei natų failai turi likti serveryje.
        </p>

        <div class="adm-toolbar">
            <input
                ref="dbFileInput"
                class="adm-input"
                type="file"
                accept=".json,application/json"
                :disabled="busy"
                @change="dbFile = pick($event)"
            />
            <button class="adm-button" :disabled="!dbFile || busy" @click="importDb">
                Įkelti JSON atsarginę kopiją
            </button>
        </div>

        <h3 class="adm-subheading">Atsarginės kopijos</h3>
        <p v-if="!backups.length" class="adm-muted">Kol kas nėra.</p>
        <div v-else class="adm-table-wrap">
            <table class="adm-table">
                <thead>
                    <tr>
                        <th>Failas</th>
                        <th>Dydis</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="backup in backups" :key="backup.file">
                        <td>{{ backup.file }}</td>
                        <td>{{ Math.round(backup.size / 1024) }} KB</td>
                        <td>{{ formatDate(backup.mtime) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
import { api } from '../../lib/api';
import { config } from '../../lib/config';
import MediaLibraryPanel from '../../components/admin/MediaLibraryPanel.vue';

export default {
    name: 'AdminDatabase',
    components: {
        MediaLibraryPanel,
    },
    data() {
        return {
            tracks: [],
            newTrack: { name: '', label: '' },
            dbFile: null,
            backups: [],
            busy: false,
            error: '',
            message: '',
            filesBase: `${config.apiUrl}/files`,
            legacyIconsBase: `${config.apiUrl}/files/icons`,
        };
    },
    created() {
        this.loadTracks();
        this.loadBackups();
    },
    methods: {
        pick(event) {
            return (event.target.files && event.target.files[0]) || null;
        },
        iconUrl(icon) {
            if (!icon) return '';
            if (/^(https?:)?\/\//i.test(icon) || icon.startsWith('/')) return icon;
            return icon.includes('/')
                ? `${this.filesBase}/${icon}`
                : `${this.legacyIconsBase}/${icon}`;
        },
        formatDate(value) {
            try {
                return new Date(value).toLocaleString('lt-LT');
            } catch {
                return value;
            }
        },
        flash(message) {
            this.message = message;
            this.error = '';
            window.setTimeout(() => {
                this.message = '';
            }, 2500);
        },
        async loadTracks() {
            try {
                const tracks = (await api.tracks()) || [];
                this.tracks = tracks.map(track => ({
                    ...track,
                    originalName: track.name,
                }));
            } catch (error) {
                this.error = error.message;
            }
        },
        async saveTrack(track) {
            const originalName = track.originalName;
            const name = String(track.name || '').trim();
            const label = String(track.label || '').trim();
            if (!/^[a-z0-9&+_-]{1,40}$/i.test(name)) {
                this.error = 'Aplanko vardą gali sudaryti tik raidės, skaičiai ir & + _ -.';
                return;
            }
            if (
                name !== originalName &&
                !window.confirm(`Pervadinti aplanką „${originalName}“ į „${name}“?`)
            ) {
                track.name = originalName;
                return;
            }
            this.busy = true;
            this.error = '';
            try {
                const updated = await api.updateTrack(originalName, { name, label });
                Object.assign(track, updated, { originalName: updated.name });
                this.flash(name !== originalName ? 'Kategorija ir aplankas pervadinti.' : 'Kategorija išsaugota.');
            } catch (error) {
                track.name = originalName;
                this.error = error.message;
            } finally {
                this.busy = false;
            }
        },
        async uploadIcon(track, event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            this.busy = true;
            this.error = '';
            try {
                const updated = await api.uploadTrackIcon(track.originalName, file);
                track.icon = updated.icon;
                this.flash('Ikona įkelta.');
            } catch (error) {
                this.error = error.message;
            } finally {
                this.busy = false;
                event.target.value = '';
            }
        },
        async create() {
            this.busy = true;
            this.error = '';
            try {
                await api.createTrack({
                    name: this.newTrack.name.trim(),
                    label: this.newTrack.label.trim(),
                });
                this.newTrack = { name: '', label: '' };
                this.flash('Kategorija pridėta.');
                await this.loadTracks();
            } catch (error) {
                this.error = error.message;
            } finally {
                this.busy = false;
            }
        },
        async remove(track) {
            const count = (track.tracks || []).length;
            if (
                !window.confirm(
                    `Šalinti kategorijos aplanką „${track.name}“? Tai veiks tik jeigu jame nebėra MP3 failų (${count} priskyrimų).`,
                )
            ) {
                return;
            }
            this.busy = true;
            this.error = '';
            try {
                await api.deleteTrack(track.name);
                this.flash('Kategorija pašalinta.');
                await this.loadTracks();
            } catch (error) {
                this.error = error.message;
            } finally {
                this.busy = false;
            }
        },
        async loadBackups() {
            try {
                this.backups = (await api.backups()) || [];
            } catch (error) {
                console.error(error);
            }
        },
        async exportDb() {
            this.busy = true;
            this.error = '';
            this.message = '';
            try {
                await api.exportDatabase();
                this.message = 'Visa duomenų bazė atsisiųsta.';
            } catch (error) {
                this.error = error.message;
            } finally {
                this.busy = false;
            }
        },
        async importDb() {
            if (!window.confirm('Pakeisti VISĄ giesmių duomenų bazę įkeltu failu?')) {
                return;
            }
            this.busy = true;
            this.error = '';
            try {
                const result = await api.importDb(this.dbFile);
                const details = result.format === 'edeno-aidai-database'
                    ? `, ${result.trackTypes} įrašų kategorijų`
                    : '';
                this.message = `Duomenų bazė pakeista (${result.count} giesmių${details}). Programėlėje paspauskite „Atnaujinti duomenis“.`;
                this.dbFile = null;
                if (this.$refs.dbFileInput) this.$refs.dbFileInput.value = '';
                await Promise.all([this.loadTracks(), this.loadBackups()]);
            } catch (error) {
                this.error = error.message;
            } finally {
                this.busy = false;
            }
        },
    },
};
</script>

<style lang="scss">
.adm-table-wrap {
    width: 100%;
    overflow-x: auto;
}

.adm-category-table {
    min-width: 780px;
}

.adm-category-name {
    min-width: 150px;
}

.adm-category-label {
    min-width: 170px;
}

.adm-category-icon {
    width: 28px;
    height: 28px;
    margin-right: 8px;
    vertical-align: middle;
    object-fit: contain;
}

.adm-icon-upload {
    display: inline-block;
    cursor: pointer;

    input {
        display: none;
    }
}

.adm-category-actions {
    min-width: 175px;
    text-align: right;
    white-space: nowrap;

    .adm-button + .adm-button {
        margin-left: 6px;
    }
}

.adm-subheading {
    margin: 20px 0 8px;
    font-size: 16px;
}
</style>
