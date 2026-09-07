<template>
    <div class="adm-credits">
        <button
            type="button"
            class="adm-credits__toggle"
            :aria-expanded="open"
            @click="toggleOpen"
        >
            <span>
                Autorių rodyklė
                <small v-if="loaded" class="adm-muted">({{ creditIndex.length }})</small>
            </span>
            <span aria-hidden="true">{{ open ? '▾' : '▸' }}</span>
        </button>

        <div v-if="open" class="adm-credits__body">
            <p class="adm-file-note">
                Sudaroma iš giesmių autorystės (copyright) laukų.
                <template v-if="loaded">
                    {{ creditIndex.length }} asmenys;
                    {{ songsWithoutCredits }} giesmių be atpažinto autoriaus.
                </template>
            </p>

            <p v-if="loading" class="adm-muted">Kraunama…</p>
            <p v-else-if="error" class="adm-status adm-status--error">{{ error }}</p>

            <template v-else>
                <div class="adm-toolbar">
                    <input
                        v-model="search"
                        class="adm-input"
                        type="search"
                        placeholder="Ieškoti autoriaus…"
                        style="flex: 1; min-width: 200px"
                    />
                    <label>
                        <span class="adm-sr-only">Vaidmuo</span>
                        <select v-model="role">
                            <option value="">Visi vaidmenys</option>
                            <option v-for="(label, key) in roleLabels" :key="key" :value="key">
                                {{ label }}
                            </option>
                        </select>
                    </label>
                    <button type="button" class="adm-button adm-button--ghost" @click="expandAllRows">
                        Išskleisti visus
                    </button>
                    <button type="button" class="adm-button adm-button--ghost" @click="collapseAllRows">
                        Suskleisti visus
                    </button>
                </div>

                <p v-if="!filtered.length" class="adm-muted">Nieko nerasta.</p>
                <ul v-else class="adm-credits__list">
                    <li v-for="entry in filtered" :key="entry.name">
                        <button
                            type="button"
                            class="adm-credits__person"
                            :aria-expanded="isExpanded(entry.name)"
                            @click="toggleRow(entry.name)"
                        >
                            <span aria-hidden="true" class="adm-credits__chevron">
                                {{ isExpanded(entry.name) ? '▾' : '▸' }}
                            </span>
                            <strong>{{ entry.name }}</strong>
                            <span
                                v-for="entryRole in entry.roles"
                                :key="entryRole"
                                class="adm-pill adm-credits__role"
                            >
                                {{ roleLabels[entryRole] || entryRole }}
                            </span>
                            <small class="adm-muted">{{ entry.count }}</small>
                        </button>
                        <div v-if="isExpanded(entry.name)" class="adm-credits__songs">
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
            </template>
        </div>
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
    name: 'CreditIndexPanel',
    data() {
        return {
            open: false,
            loading: false,
            loaded: false,
            error: '',
            songs: [],
            search: '',
            role: '',
            roleLabels: ROLE_LABELS,
            expandedNames: {},
        };
    },
    computed: {
        creditIndex() {
            return buildCreditIndex(this.songs);
        },
        songsWithoutCredits() {
            return this.songs.filter(
                song => parseCredits(song.copyright).length === 0,
            ).length;
        },
        filtered() {
            const needle = fold(this.search.trim());
            return this.creditIndex.filter(entry => {
                if (this.role && !entry.roles.includes(this.role)) return false;
                return !needle || fold(entry.name).includes(needle);
            });
        },
    },
    methods: {
        async toggleOpen() {
            this.open = !this.open;
            // Loaded lazily on first expand: this panel lives on the
            // Duomenų bazė page now, and there's no reason to fetch the
            // full song list on every visit to that page just in case
            // someone opens the index.
            if (this.open && !this.loaded && !this.loading) {
                await this.load();
            }
        },
        async load() {
            this.loading = true;
            this.error = '';
            try {
                this.songs = (await api.songs()) || [];
                this.loaded = true;
            } catch (error) {
                this.error = error.message;
            } finally {
                this.loading = false;
            }
        },
        isExpanded(name) {
            return Boolean(this.expandedNames[name]);
        },
        toggleRow(name) {
            this.expandedNames = {
                ...this.expandedNames,
                [name]: !this.expandedNames[name],
            };
        },
        expandAllRows() {
            const next = {};
            this.filtered.forEach(entry => {
                next[entry.name] = true;
            });
            this.expandedNames = next;
        },
        collapseAllRows() {
            this.expandedNames = {};
        },
    },
};
</script>

<style lang="scss">
.adm-credits {
    margin-top: 34px;
    padding-top: 22px;
    border-top: 1px solid var(--adm-border);
}

.adm-credits__toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    font-size: 19px;
    font-weight: 700;
    text-align: left;
    cursor: pointer;

    small {
        font-weight: 400;
        font-size: 14px;
    }
}

.adm-credits__body {
    margin-top: 12px;
}

.adm-credits__list {
    display: grid;
    gap: 4px;
    max-height: 480px;
    margin: 12px 0 0;
    padding: 2px;
    overflow-y: auto;
    list-style: none;
}

.adm-credits__person {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 8px;
    padding: 6px 10px;
    border: 1px solid var(--adm-border);
    border-radius: 8px;
    background: var(--adm-surface);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;

    strong {
        flex: 1;
        min-width: 0;
    }

    &:hover {
        background: var(--adm-surface-soft, var(--adm-border));
    }
}

.adm-credits__chevron {
    width: 12px;
    color: var(--adm-muted);
}

.adm-credits__role {
    font-size: 11px;
}

.adm-credits__songs {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin: 4px 0 8px 30px;
}

.adm-credits__song {
    padding: 1px 7px;
    border: 1px solid var(--adm-border);
    border-radius: 6px;
    color: inherit;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    text-decoration: none;

    &:hover {
        background: var(--adm-surface-soft, var(--adm-border));
    }
}

// Only otherwise defined in AdminUpdates.vue, a different lazily-loaded
// admin route whose stylesheet isn't present here.
.adm-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
}
</style>
