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

        <section v-if="!loading && !error" class="adm-credits">
            <h2>Autorių rodyklė</h2>
            <p class="adm-file-note">
                Sudaroma iš giesmių autorystės (copyright) laukų.
                {{ creditIndex.length }} asmenys;
                {{ songsWithoutCredits }} giesmių be atpažinto autoriaus.
            </p>

            <div class="adm-toolbar">
                <input
                    v-model="creditSearch"
                    class="adm-input"
                    type="search"
                    placeholder="Ieškoti autoriaus…"
                    style="flex: 1; min-width: 200px"
                />
                <label>
                    <span class="adm-sr-only">Vaidmuo</span>
                    <select v-model="creditRole">
                        <option value="">Visi vaidmenys</option>
                        <option v-for="(label, key) in roleLabels" :key="key" :value="key">
                            {{ label }}
                        </option>
                    </select>
                </label>
            </div>

            <p v-if="!filteredCredits.length" class="adm-muted">Nieko nerasta.</p>
            <ul v-else class="adm-credits__list">
                <li v-for="entry in filteredCredits" :key="entry.name">
                    <div class="adm-credits__person">
                        <strong>{{ entry.name }}</strong>
                        <span
                            v-for="role in entry.roles"
                            :key="role"
                            class="adm-pill adm-credits__role"
                        >
                            {{ roleLabels[role] || role }}
                        </span>
                        <small class="adm-muted">{{ entry.count }}</small>
                    </div>
                    <div class="adm-credits__songs">
                        <router-link
                            v-for="songId in entry.songIds"
                            :key="songId"
                            :to="{ name: 'admin-song-edit', params: { songId } }"
                            class="adm-credits__song"
                        >
                            {{ songId }}
                        </router-link>
                    </div>
                </li>
            </ul>
        </section>
    </div>
</template>

<script>
import { api } from '../../lib/api';
import { buildCreditIndex, parseCredits, ROLE_LABELS } from '../../lib/credits';

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
            creditSearch: '',
            creditRole: '',
            roleLabels: ROLE_LABELS,
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
        creditIndex() {
            return buildCreditIndex(this.songs);
        },
        songsWithoutCredits() {
            return this.songs.filter(
                song => parseCredits(song.copyright).length === 0,
            ).length;
        },
        filteredCredits() {
            const needle = fold(this.creditSearch.trim());
            return this.creditIndex.filter(entry => {
                if (this.creditRole && !entry.roles.includes(this.creditRole)) {
                    return false;
                }
                return !needle || fold(entry.name).includes(needle);
            });
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

<style lang="scss">
.adm-credits {
    margin-top: 34px;
    padding-top: 22px;
    border-top: 1px solid var(--adm-border);

    h2 {
        margin: 0 0 6px;
    }
}

.adm-credits__list {
    display: grid;
    gap: 10px;
    margin: 14px 0 0;
    padding: 0;
    list-style: none;

    li {
        padding: 10px 12px;
        border: 1px solid var(--adm-border);
        border-radius: 8px;
        background: var(--adm-surface);
    }
}

.adm-credits__person {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.adm-credits__role {
    font-size: 12px;
}

.adm-credits__songs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}

.adm-credits__song {
    padding: 1px 8px;
    border: 1px solid var(--adm-border);
    border-radius: 6px;
    color: inherit;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    text-decoration: none;

    &:hover {
        background: var(--adm-surface-soft, var(--adm-border));
    }
}

// Defined here as well as in AdminUpdates.vue: admin routes are lazily
// loaded, so that file's stylesheet isn't present on this page.
.adm-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
}
</style>
