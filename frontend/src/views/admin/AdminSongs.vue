<template>
    <div>
        <div class="adm-toolbar">
            <input
                v-model="search"
                class="adm-input"
                type="search"
                placeholder="Ieškoti pagal numerį ar pavadinimą…"
                style="flex: 1; min-width: 200px"
            />
            <router-link :to="{ name: 'admin-song-new' }">
                <button class="adm-button">+ Nauja giesmė</button>
            </router-link>
        </div>

        <div class="adm-status-slot" aria-live="polite">
            <p v-if="error" class="adm-status adm-status--error">{{ error }}</p>
        </div>
        <p v-if="!error && loading" class="adm-muted">Kraunama…</p>
        <p v-else-if="!error && !filtered.length" class="adm-muted">Nieko nerasta.</p>

        <table v-if="filtered.length" class="adm-table">
            <thead>
                <tr>
                    <th>Nr.</th>
                    <th>Pavadinimas</th>
                    <th>Įrašai</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="song in filtered" :key="song.songId">
                    <td><span class="adm-pill">{{ song.songId }}</span></td>
                    <td>{{ title(song) }}</td>
                    <td class="adm-muted">{{ (song.lists || []).join(', ') }}</td>
                    <td style="text-align: right">
                        <router-link
                            :to="{
                                name: 'admin-song-edit',
                                params: { songId: song.songId },
                            }"
                        >
                            <button class="adm-button adm-button--ghost">
                                Redaguoti
                            </button>
                        </router-link>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import { api } from '../../lib/api';

const LT_MAP = {
    ą: 'a', č: 'c', ę: 'e', ė: 'e', į: 'i', š: 's', ų: 'u', ū: 'u', ž: 'z',
};

function fold(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[ąčęėįšųūž]/g, ch => LT_MAP[ch]);
}

export default {
    name: 'AdminSongs',
    data() {
        return {
            songs: [],
            search: '',
            loading: true,
            error: '',
        };
    },
    computed: {
        filtered() {
            const needle = fold(this.search.trim());
            if (!needle) return this.songs;
            return this.songs.filter(
                song =>
                    String(song.songId).startsWith(needle) ||
                    fold(this.title(song)).includes(needle),
            );
        },
    },
    async created() {
        try {
            this.songs = (await api.songs()) || [];
        } catch (error) {
            this.error = error.message;
        } finally {
            this.loading = false;
        }
    },
    methods: {
        title(song) {
            return Array.isArray(song.title)
                ? song.title.join(', ')
                : song.title;
        },
    },
};
</script>
