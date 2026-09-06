<template>
    <div>
        <h2>GitHub atnaujinimas</h2>
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

        <h2>Audio ir natų failų atsarginės kopijos</h2>
        <p class="adm-file-note">
            Archyvuose išsaugoma aplankų struktūra: <b>audio/&lt;tipas&gt;/</b>
            ir <b>notes/&lt;formatas&gt;/</b>. Įkeliant atkuriami tik pažymėti
            tipai arba formatai; kiti archyvo failai paliekami nepakeisti.
        </p>

        <div class="adm-media-grid">
            <section class="adm-media-card">
                <h3>Muzikos failai (MP3)</h3>
                <p class="adm-media-help">Pasirinkite įrašų tipus, kuriuos norite atsisiųsti arba įkelti.</p>
                <div class="adm-selection-actions">
                    <button type="button" class="adm-button adm-button--ghost" :disabled="mediaBusy" @click="selectAll('audio')">
                        Pažymėti visus
                    </button>
                    <button type="button" class="adm-button adm-button--ghost" :disabled="mediaBusy" @click="clearSelection('audio')">
                        Atžymėti visus
                    </button>
                </div>
                <div v-if="mediaLoading" class="adm-muted">Kraunami audio tipai…</div>
                <div v-else-if="!audioTypes.length" class="adm-muted">Audio tipų nerasta.</div>
                <div v-else class="adm-media-options">
                    <label v-for="item in audioTypes" :key="item.name" class="adm-media-option">
                        <input v-model="selectedAudioTypes" type="checkbox" :value="item.name" :disabled="mediaBusy" />
                        <span>
                            <b>{{ item.label }}</b>
                            <small>{{ item.name }} · {{ item.count }} fail.</small>
                        </span>
                    </label>
                </div>
                <div class="adm-toolbar">
                    <button
                        type="button"
                        class="adm-button"
                        :disabled="!selectedAudioTypes.length || mediaBusy || mediaLoading"
                        @click="downloadMedia('audio')"
                    >
                        {{ mediaBusy && mediaAction === 'download-audio' ? 'Kuriamas archyvas…' : 'Atsisiųsti MP3 ZIP' }}
                    </button>
                </div>
                <div class="adm-toolbar">
                    <input
                        ref="audioFileInput"
                        class="adm-input"
                        type="file"
                        accept=".zip,application/zip"
                        :disabled="mediaBusy"
                        @change="audioArchiveFile = pick($event)"
                    />
                    <button
                        type="button"
                        class="adm-button adm-button--ghost"
                        :disabled="!audioArchiveFile || !selectedAudioTypes.length || mediaBusy || mediaLoading"
                        @click="uploadMedia('audio')"
                    >
                        Įkelti MP3 ZIP
                    </button>
                </div>
            </section>

            <section class="adm-media-card">
                <h3>Natų failai</h3>
                <p class="adm-media-help">Pasirinkite natų failų formatus, kuriuos norite atsisiųsti arba įkelti.</p>
                <div class="adm-selection-actions">
                    <button type="button" class="adm-button adm-button--ghost" :disabled="mediaBusy" @click="selectAll('notes')">
                        Pažymėti visus
                    </button>
                    <button type="button" class="adm-button adm-button--ghost" :disabled="mediaBusy" @click="clearSelection('notes')">
                        Atžymėti visus
                    </button>
                </div>
                <div v-if="mediaLoading" class="adm-muted">Kraunami natų formatai…</div>
                <div v-else class="adm-media-options">
                    <label v-for="item in noteFormats" :key="item.name" class="adm-media-option">
                        <input v-model="selectedNoteFormats" type="checkbox" :value="item.name" :disabled="mediaBusy" />
                        <span>
                            <b>{{ item.label }}</b>
                            <small>{{ item.name }} · {{ item.count }} fail.</small>
                        </span>
                    </label>
                </div>
                <div class="adm-toolbar">
                    <button
                        type="button"
                        class="adm-button"
                        :disabled="!selectedNoteFormats.length || mediaBusy || mediaLoading"
                        @click="downloadMedia('notes')"
                    >
                        {{ mediaBusy && mediaAction === 'download-notes' ? 'Kuriamas archyvas…' : 'Atsisiųsti natų ZIP' }}
                    </button>
                </div>
                <div class="adm-toolbar">
                    <input
                        ref="notesFileInput"
                        class="adm-input"
                        type="file"
                        accept=".zip,application/zip"
                        :disabled="mediaBusy"
                        @change="notesArchiveFile = pick($event)"
                    />
                    <button
                        type="button"
                        class="adm-button adm-button--ghost"
                        :disabled="!notesArchiveFile || !selectedNoteFormats.length || mediaBusy || mediaLoading"
                        @click="uploadMedia('notes')"
                    >
                        Įkelti natų ZIP
                    </button>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
import { api } from '../../lib/api';

export default {
    name: 'AdminUpdates',
    data() {
        return {
            source: 'release',
            commits: [],
            releases: [],
            selectedRef: '',
            repository: '',
            branch: 'v2',
            loading: false,
            busy: false,
            mediaLoading: false,
            mediaBusy: false,
            mediaAction: '',
            audioTypes: [],
            noteFormats: [],
            selectedAudioTypes: [],
            selectedNoteFormats: [],
            audioArchiveFile: null,
            notesArchiveFile: null,
            error: '',
            message: '',
        };
    },
    created() {
        this.loadVersions();
        this.loadMediaOptions();
    },
    methods: {
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
            } catch (error) {
                this.error = error.message;
            } finally {
                this.busy = false;
            }
        },
        async loadMediaOptions() {
            this.mediaLoading = true;
            this.error = '';
            try {
                const result = await api.mediaOptions();
                this.audioTypes = result.audio || [];
                this.noteFormats = result.notes || [];
                this.selectedAudioTypes = this.audioTypes.map(item => item.name);
                this.selectedNoteFormats = this.noteFormats.map(item => item.name);
            } catch (error) {
                this.error = error.message;
            } finally {
                this.mediaLoading = false;
            }
        },
        selectAll(kind) {
            if (kind === 'audio') {
                this.selectedAudioTypes = this.audioTypes.map(item => item.name);
            } else {
                this.selectedNoteFormats = this.noteFormats.map(item => item.name);
            }
        },
        clearSelection(kind) {
            if (kind === 'audio') {
                this.selectedAudioTypes = [];
            } else {
                this.selectedNoteFormats = [];
            }
        },
        async downloadMedia(kind) {
            const selection = kind === 'audio' ? this.selectedAudioTypes : this.selectedNoteFormats;
            if (!selection.length) return;
            this.mediaBusy = true;
            this.mediaAction = `download-${kind}`;
            this.error = '';
            this.message = '';
            try {
                await api.downloadMedia(kind, selection);
                this.message = kind === 'audio'
                    ? 'MP3 archyvas paruoštas.'
                    : 'Natų archyvas paruoštas.';
            } catch (error) {
                this.error = error.message;
            } finally {
                this.mediaBusy = false;
                this.mediaAction = '';
            }
        },
        async uploadMedia(kind) {
            const isAudio = kind === 'audio';
            const selection = isAudio ? this.selectedAudioTypes : this.selectedNoteFormats;
            const file = isAudio ? this.audioArchiveFile : this.notesArchiveFile;
            if (!file || !selection.length) return;
            if (!window.confirm(
                isAudio
                    ? 'Įkelti archyvą ir pakeisti pažymėtus MP3 failus?'
                    : 'Įkelti archyvą ir pakeisti pažymėtus natų failus?',
            )) {
                return;
            }
            this.mediaBusy = true;
            this.mediaAction = `upload-${kind}`;
            this.error = '';
            this.message = '';
            try {
                const result = await api.importMedia(kind, selection, file);
                const skipped = result.skipped ? ` Praleista: ${result.skipped}.` : '';
                this.message = `Atkurta failų: ${result.imported || 0}.${skipped}`;
                if (isAudio) {
                    this.audioArchiveFile = null;
                    if (this.$refs.audioFileInput) this.$refs.audioFileInput.value = '';
                } else {
                    this.notesArchiveFile = null;
                    if (this.$refs.notesFileInput) this.$refs.notesFileInput.value = '';
                }
                await this.loadMediaOptions();
            } catch (error) {
                this.error = error.message;
            } finally {
                this.mediaBusy = false;
                this.mediaAction = '';
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
}

.adm-media-card {
    min-width: 0;
    padding: 16px;
    border: 1px solid var(--adm-border);
    border-radius: 10px;
    background: var(--adm-surface);

    h3 {
        margin: 0 0 6px;
        font-size: 17px;
    }

