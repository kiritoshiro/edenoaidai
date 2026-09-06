<template>
    <div>
        <h2>GitHub atnaujinimas</h2>

        <div class="adm-current-version">
            <h3 class="adm-subheading">Dabartinė versija</h3>
            <p v-if="versionLoading" class="adm-muted">Tikrinama…</p>
            <template v-else-if="current">
                <p class="adm-current-version__line">
                    <b>{{ current.shortSha }}</b> · {{ firstLine(current.message) }}
                    <span v-if="current.dirty" class="adm-pill adm-pill--warn">
                        su vietiniais pakeitimais
                    </span>
                </p>
                <small class="adm-muted">
                    {{ current.branch }} · {{ formatDate(current.date) }}
                    <template v-if="current.builtAt">
                        · sukurta {{ formatDate(current.builtAt) }}
                    </template>
                </small>
            </template>
            <p v-else class="adm-muted">
                Versija nežinoma – serveryje nėra <code>version.json</code>
                (įdiegta rankiniu būdu su senesniu build.mjs arba failas
                pašalintas).
            </p>
        </div>

        <p class="adm-file-note">
            Repository: <b>{{ repository || 'kraunama…' }}</b>, šaka:
            <b>{{ branch || 'v2' }}</b>. Pasirinkite commit’ą arba release’ą,
            kurio <b>server/</b> versiją norite įdiegti.
        </p>

        <div class="adm-toolbar">
            <button class="adm-button" :disabled="busy || loading" @click="loadVersions">
                {{ loading ? 'Tikrinama…' : 'Patikrinti GitHub' }}
            </button>
            <label>
                <span class="adm-sr-only">Versijos tipas</span>
                <select v-model="source" :disabled="busy">
                    <option value="release">Release</option>
                    <option value="commit">Commit</option>
                </select>
            </label>
        </div>

        <div v-if="source === 'release'" class="adm-update-list">
            <label v-for="item in releases" :key="item.tag" class="adm-update-option">
                <input v-model="selectedRef" type="radio" name="github-version" :value="item.tag" />
                <span>
                    <b>{{ item.name || item.tag }}</b>
                    <small>{{ item.tag }} · {{ formatDate(item.date) }}{{ item.prerelease ? ' · prerelease' : '' }}</small>
                </span>
            </label>
            <p v-if="!releases.length" class="adm-muted">Release’ų nerasta.</p>
        </div>

        <div v-else class="adm-update-list">
            <label v-for="item in commits" :key="item.sha" class="adm-update-option">
                <input v-model="selectedRef" type="radio" name="github-version" :value="item.sha" />
                <span>
                    <b>{{ item.shortSha }} · {{ firstLine(item.message) }}</b>
                    <span v-if="isCurrentCommit(item)" class="adm-pill adm-pill--current">
                        dabartinė
                    </span>
                    <small>{{ item.author }} · {{ formatDate(item.date) }}</small>
                </span>
            </label>
            <p v-if="!commits.length" class="adm-muted">Commit’ų nerasta.</p>
        </div>

        <div class="adm-status-slot" aria-live="polite">
            <p v-if="error" class="adm-status adm-status--error">{{ error }}</p>
            <p v-else-if="message" class="adm-status adm-status--ok">{{ message }}</p>
        </div>

        <button class="adm-button" :disabled="!selectedRef || busy || loading" @click="update">
            {{ busy ? 'Atnaujinama…' : 'Atnaujinti pasirinktą versiją' }}
        </button>
        <p class="adm-file-note">
            Atnaujinant išsaugomi <b>api/config.php</b>, duomenų bazė,
            MP3/natų failai ir <b>storage/</b>. Po sėkmingo atnaujinimo išvalykite
            naršyklės PWA duomenis tik tada, jei programėlė nerodo naujos versijos.
        </p>

        <h2>Garso ir natų failų atsarginės kopijos</h2>
        <p class="adm-file-note">
            Šios kopijos apima tik fizinius MP3 ir natų failus. Giesmių
            tekstams, skaidrėms ir kategorijoms naudokite duomenų bazės
            atsarginę kopiją „Duomenų bazė“ skiltyje.
        </p>

        <div class="adm-status-slot" aria-live="polite">
            <p v-if="mediaError" class="adm-status adm-status--error">{{ mediaError }}</p>
            <p v-else-if="mediaMessage" class="adm-status adm-status--ok">{{ mediaMessage }}</p>
        </div>

        <h3 class="adm-subheading">Atsisiųsti</h3>
        <div class="adm-media-grid">
            <div class="adm-media-card">
                <h3>Garso įrašai</h3>
                <label
                    v-for="type in mediaOptions.audio"
                    :key="type.name"
                    class="adm-checkbox-row"
                >
                    <input v-model="selectedAudioTypes" type="checkbox" :value="type.name" />
                    <span>{{ type.label }} <small>({{ type.count }})</small></span>
                </label>
                <p v-if="!mediaOptions.audio.length" class="adm-muted">Kategorijų nėra.</p>
                <button
                    class="adm-button"
                    :disabled="!selectedAudioTypes.length || mediaBusy"
                    @click="downloadMediaKind('audio', selectedAudioTypes)"
                >
                    Atsisiųsti pasirinktus
                </button>
            </div>
            <div class="adm-media-card">
                <h3>Natos</h3>
                <label
                    v-for="format in mediaOptions.notes"
                    :key="format.name"
                    class="adm-checkbox-row"
                >
                    <input v-model="selectedNoteFormats" type="checkbox" :value="format.name" />
                    <span>{{ format.label }} <small>({{ format.count }})</small></span>
                </label>
                <p v-if="!mediaOptions.notes.length" class="adm-muted">Formatų nėra.</p>
                <button
                    class="adm-button"
                    :disabled="!selectedNoteFormats.length || mediaBusy"
                    @click="downloadMediaKind('notes', selectedNoteFormats)"
                >
                    Atsisiųsti pasirinktus
                </button>
            </div>
        </div>

        <h3 class="adm-subheading">Atkurti</h3>
        <p class="adm-file-note">
            Įkelkite anksčiau šiame puslapyje atsisiųstą ZIP archyvą.
            Pasirinktų kategorijų/formatų failai bus pridėti arba perrašyti;
            kiti failai serveryje nekeičiami.
        </p>
        <div class="adm-toolbar">
            <label>
                <span class="adm-sr-only">Atkuriamo archyvo tipas</span>
                <select v-model="restoreKind">
                    <option value="audio">Garso įrašai</option>
                    <option value="notes">Natos</option>
                </select>
            </label>
            <input
                ref="mediaFileInput"
                class="adm-input"
                type="file"
                accept=".zip,application/zip"
                :disabled="mediaBusy"
                @change="mediaFile = pick($event)"
            />
            <button
                class="adm-button"
                :disabled="!mediaFile || !restoreSelection.length || mediaBusy"
                @click="restoreMedia"
            >
                Įkelti archyvą
            </button>
        </div>
        <p v-if="mediaFile && !restoreSelection.length" class="adm-file-note">
            Pasirinkite bent vieną
            {{ restoreKind === 'audio' ? 'audio kategoriją' : 'natų formatą' }}
            aukščiau, kuriai priklauso archyvo failai.
        </p>
    </div>
</template>

<script>
import { api } from '../../lib/api';

export default {
    name: 'AdminUpdates',
    data() {
        return {
            current: null,
            versionLoading: false,
            source: 'release',
            commits: [],
            releases: [],
            selectedRef: '',
            repository: '',
            branch: 'v2',
            loading: false,
            busy: false,
            error: '',
            message: '',
            mediaOptions: { audio: [], notes: [] },
            selectedAudioTypes: [],
            selectedNoteFormats: [],
            restoreKind: 'audio',
            mediaFile: null,
            mediaBusy: false,
            mediaError: '',
            mediaMessage: '',
        };
    },
    computed: {
        restoreSelection() {
            return this.restoreKind === 'audio' ? this.selectedAudioTypes : this.selectedNoteFormats;
        },
    },
    created() {
        // Independent of the GitHub check below, so it still shows something
        // useful even if GitHub is unreachable or rate-limited.
        this.loadCurrent();
        this.loadVersions();
        this.loadMediaOptions();
    },
    methods: {
        pick(event) {
            return (event.target.files && event.target.files[0]) || null;
        },
        async loadCurrent() {
            this.versionLoading = true;
            try {
                const result = await api.githubCurrent();
                this.current = result?.deployed || null;
            } catch (error) {
                console.error(error);
            } finally {
                this.versionLoading = false;
            }
        },
        isCurrentCommit(item) {
            return Boolean(this.current?.sha) && item.sha === this.current.sha;
        },
        async loadVersions() {
            this.loading = true;
            this.error = '';
            try {
                const [releases, commits] = await Promise.all([
                    api.githubReleases(),
                    api.githubCommits(),
                ]);
                this.releases = releases.items || [];
                this.commits = commits.items || [];
                this.repository = releases.repository || commits.repository || '';
                this.branch = releases.branch || commits.branch || 'v2';
                const choices = this.source === 'release' ? this.releases : this.commits;
                this.selectedRef = choices[0]?.tag || choices[0]?.sha || '';
                this.message = 'GitHub versijos atnaujintos.';
            } catch (error) {
                this.error = error.message;
            } finally {
                this.loading = false;
            }
        },
        firstLine(message) {
            return String(message || '').split(/\r?\n/u)[0] || 'Be pavadinimo';
        },
        formatDate(value) {
            if (!value) return 'data nežinoma';
            try {
                return new Date(value).toLocaleString('lt-LT');
            } catch {
                return value;
            }
        },
        async update() {
            if (!this.selectedRef || !window.confirm('Atnaujinti svetainę į pasirinktą GitHub versiją?')) {
                return;
            }
            this.busy = true;
            this.error = '';
            this.message = '';
            try {
                await api.updateFromGithub(this.source, this.selectedRef);
                this.message = 'Atnaujinimas baigtas. Perkraukite puslapį, kad įsijungtų nauja administravimo versija.';
                await this.loadCurrent();
            } catch (error) {
                this.error = error.message;
            } finally {
                this.busy = false;
            }
        },
        async loadMediaOptions() {
            try {
                this.mediaOptions = await api.mediaOptions();
            } catch (error) {
                console.error(error);
            }
        },
        async downloadMediaKind(kind, values) {
            if (!values.length) return;
            this.mediaBusy = true;
            this.mediaError = '';
            this.mediaMessage = '';
            try {
                await api.downloadMedia(kind, values);
                this.mediaMessage = 'Archyvas atsisiųstas.';
            } catch (error) {
                this.mediaError = error.message;
            } finally {
                this.mediaBusy = false;
            }
        },
        async restoreMedia() {
            const values = this.restoreSelection;
            if (!this.mediaFile || !values.length) return;
            if (
                !window.confirm(
                    'Atkurti pasirinktų kategorijų/formatų failus iš archyvo? Sutampantys failai bus perrašyti.',
                )
            ) {
                return;
            }
            this.mediaBusy = true;
            this.mediaError = '';
            this.mediaMessage = '';
            try {
                const result = await api.importMedia(this.restoreKind, values, this.mediaFile);
                const skipped = result.skipped ? `, praleista ${result.skipped}` : '';
                this.mediaMessage = `Įkelta ${result.imported} failų${skipped}.`;
                this.mediaFile = null;
                if (this.$refs.mediaFileInput) this.$refs.mediaFileInput.value = '';
                await this.loadMediaOptions();
            } catch (error) {
                this.mediaError = error.message;
            } finally {
                this.mediaBusy = false;
            }
        },
    },
    watch: {
        source() {
            const choices = this.source === 'release' ? this.releases : this.commits;
            this.selectedRef = choices[0]?.tag || choices[0]?.sha || '';
        },
    },
};
</script>

<style lang="scss">
.adm-current-version {
    padding: 12px 16px;
    margin-bottom: 16px;
    border: 1px solid var(--adm-border);
    border-radius: 10px;
    background: var(--adm-surface);

    &__line {
        margin: 0;
    }
}

.adm-update-list {
    display: grid;
    gap: 8px;
    max-height: 440px;
    overflow: auto;
    margin: 12px 0 16px;
}

.adm-update-option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--adm-border);
    border-radius: 8px;
    background: var(--adm-surface);
    cursor: pointer;

    span {
        display: grid;
        gap: 3px;
    }

    small {
        color: var(--adm-muted);
    }
}

.adm-pill--current {
    justify-self: start;
    color: var(--adm-accent-strong, #75480b);
    background: var(--adm-accent-soft, #f3e2c3);
}

.adm-pill--warn {
    justify-self: start;
    color: #a43b32;
    background: rgba(178, 61, 49, 0.12);
}

.adm-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
}

.adm-media-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
}

.adm-media-card {
    min-width: 0;
    padding: 16px;
    border: 1px solid var(--adm-border);
    border-radius: 10px;
    background: var(--adm-surface);

    h3 {
        margin: 0 0 10px;
        font-size: 17px;
    }

    .adm-button {
        margin-top: 10px;
    }
}

.adm-checkbox-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    cursor: pointer;

    small {
        color: var(--adm-muted);
    }
}

@media (max-width: 640px) {
    .adm-media-grid {
        grid-template-columns: 1fr;
    }
}
</style>
