<template>
    <div>
        <h2>Įrašų tipai (instrumentai)</h2>
        <p class="adm-file-note">
            Kiekvienas <b>server/files/audio/</b> viduje esantis aplankas yra
            kategorija. MP3 vardas turi sutapti su giesmės numeriu, o kategorijos
            ikona laikoma tame pačiame aplanke kaip <b>icon.svg</b>,
            <b>icon.png</b>, <b>icon.webp</b> arba <b>icon.jpg</b>.
            Sąrašas automatiškai perskenuojamas atidarius šį puslapį.
        </p>

        <div class="adm-status-slot" aria-live="polite">
            <p v-if="error" class="adm-status adm-status--error">{{ error }}</p>
            <p v-else-if="message" class="adm-status adm-status--ok">{{ message }}</p>
        </div>

        <table v-if="tracks.length" class="adm-table">
            <thead>
                <tr>
                    <th>Tipas</th>
                    <th>Pavadinimas</th>
                    <th>Giesmių</th>
                    <th>Ikona</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="track in tracks" :key="track.name">
                    <td><span class="adm-pill">{{ track.name }}</span></td>
                    <td>
                        <input
                            v-model="track.label"
                            class="adm-input"
                            type="text"
                            @change="saveLabel(track)"
                        />
                    </td>
                    <td>{{ (track.tracks || []).length }}</td>
                    <td>
                        <img
                            v-if="track.icon"
                            :src="iconUrl(track.icon)"
                            alt=""
                            style="width: 28px; height: 28px; vertical-align: middle"
                        />
                        <span v-else class="adm-muted">nėra</span>
                        <label
                            class="adm-button adm-button--ghost"
                            style="margin-left: 8px; display: inline-block; cursor: pointer"
                        >
                            Įkelti ikoną
                            <input
                                type="file"
                                accept=".svg,.png,.webp,.jpg,.jpeg,image/*"
                                style="display: none"
                                @change="uploadIcon(track, $event)"
                            />
                        </label>
                    </td>
                    <td style="text-align: right">
                        <button
                            class="adm-button adm-button--danger"
                            @click="remove(track)"
                        >
                            Šalinti
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>

        <h2>Naujas tipas</h2>
        <form class="adm-toolbar" @submit.prevent="create">
            <input
                v-model="newTrack.name"
                class="adm-input"
                type="text"
                placeholder="techninis vardas (pvz. gitara)"
                pattern="[a-z0-9&+_-]{1,40}"
                title="Mažosios raidės, skaičiai ir & + _ -"
                required
            />
            <input
                v-model="newTrack.label"
                class="adm-input"
                type="text"
                placeholder="Rodomas pavadinimas (pvz. Gitara)"
            />
            <button class="adm-button">Pridėti</button>
        </form>
        <p class="adm-file-note">
            Techninis vardas naudojamas failų keliuose, todėl vėliau jo keisti
            nereikėtų.
        </p>
    </div>
</template>

<script>
import { api } from '../../lib/api';
import { config } from '../../lib/config';

export default {
    name: 'AdminTracks',
    data() {
        return {
            tracks: [],
            newTrack: { name: '', label: '' },
            error: '',
            message: '',
            filesBase: `${config.apiUrl}/files`,
            legacyIconsBase: `${config.apiUrl}/files/icons`,
        };
    },
    created() {
        this.load();
    },
    methods: {
        iconUrl(icon) {
            if (!icon) return '';
            if (/^(https?:)?\/\//i.test(icon) || icon.startsWith('/')) return icon;
            return icon.includes('/')
                ? `${this.filesBase}/${icon}`
                : `${this.legacyIconsBase}/${icon}`;
        },
        async load() {
            try {
                this.tracks = (await api.tracks()) || [];
            } catch (error) {
                this.error = error.message;
            }
        },
        flash(message) {
            this.message = message;
            this.error = '';
            setTimeout(() => {
                this.message = '';
            }, 2500);
        },
        async saveLabel(track) {
            try {
                await api.updateTrack(track.name, { label: track.label });
                this.flash('Išsaugota.');
            } catch (error) {
                this.error = error.message;
            }
        },
        async uploadIcon(track, event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            try {
                const updated = await api.uploadTrackIcon(track.name, file);
                track.icon = updated.icon;
                this.flash('Ikona įkelta.');
            } catch (error) {
                this.error = error.message;
            } finally {
                event.target.value = '';
            }
        },
        async create() {
            try {
                await api.createTrack({
                    name: this.newTrack.name.trim(),
                    label: this.newTrack.label.trim(),
                });
                this.newTrack = { name: '', label: '' };
                this.flash('Tipas pridėtas.');
                await this.load();
            } catch (error) {
                this.error = error.message;
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
            try {
                await api.deleteTrack(track.name);
                this.flash('Tipas pašalintas.');
                await this.load();
            } catch (error) {
                this.error = error.message;
            }
        },
    },
};
</script>
