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
        };
    },
    created() {
        // Independent of the GitHub check below, so it still shows something
        // useful even if GitHub is unreachable or rate-limited.
        this.loadCurrent();
        this.loadVersions();
    },
    methods: {
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
</style>
