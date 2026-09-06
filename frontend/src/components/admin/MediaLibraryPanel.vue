<template>
    <div class="adm-media-panel">
        <div class="adm-status-slot" aria-live="polite">
            <p v-if="mediaError" class="adm-status adm-status--error">{{ mediaError }}</p>
            <p v-else-if="mediaMessage" class="adm-status adm-status--ok">{{ mediaMessage }}</p>
        </div>

        <div class="adm-toolbar">
            <button class="adm-button adm-button--ghost" :disabled="mediaBusy" @click="expandAll">
                Išskleisti visus failus
            </button>
            <button class="adm-button adm-button--ghost" :disabled="mediaBusy" @click="collapseAll">
                Suskleisti
            </button>
            <button
                v-if="selectedFileCount"
                class="adm-button"
                :disabled="mediaBusy"
                @click="downloadSelectedFiles"
            >
                Atsisiųsti pažymėtus failus ({{ selectedFileCount }})
            </button>
        </div>

        <div class="adm-media-grid">
            <div v-for="group in groups" :key="group.kind" class="adm-media-card">
                <h3>{{ group.title }}</h3>

                <label class="adm-checkbox-row adm-checkbox-row--all">
                    <input
                        type="checkbox"
                        :checked="allBucketsSelected(group.kind)"
                        @change="toggleAllBuckets(group.kind, $event.target.checked)"
                    />
                    <span><b>Žymėti visus</b></span>
                </label>

                <div v-for="bucket in mediaOptions[group.kind]" :key="bucket.name" class="adm-media-bucket">
                    <div class="adm-checkbox-row">
                        <input
                            type="checkbox"
                            :checked="selectedBuckets[group.kind].includes(bucket.name)"
                            @change="toggleBucket(group.kind, bucket.name, $event.target.checked)"
                        />
                        <span class="adm-media-bucket__label">
                            {{ bucket.label }} <small>({{ bucket.count }})</small>
                        </span>
                        <button
                            type="button"
                            class="adm-bucket-toggle"
                            :aria-expanded="isExpanded(group.kind, bucket.name)"
                            :aria-label="isExpanded(group.kind, bucket.name) ? 'Slėpti failus' : 'Rodyti failus'"
                            @click="toggleExpand(group.kind, bucket.name)"
                        >
                            {{ isExpanded(group.kind, bucket.name) ? '▾' : '▸' }}
                        </button>
                        <label class="adm-button adm-button--ghost adm-icon-upload">
                            Įkelti
                            <input
                                type="file"
                                multiple
                                :accept="group.kind === 'audio' ? '.mp3' : `.${bucket.name}`"
                                :disabled="mediaBusy"
                                @change="uploadFiles(group.kind, bucket.name, $event)"
                            />
                        </label>
                    </div>

                    <ul v-if="isExpanded(group.kind, bucket.name)" class="adm-bucket-files">
                        <li v-if="bucketState(group.kind, bucket.name) === 'loading'" class="adm-muted">
                            Kraunama…
                        </li>
                        <li
                            v-else-if="bucketState(group.kind, bucket.name)?.error"
                            class="adm-status adm-status--error"
                        >
                            {{ bucketState(group.kind, bucket.name).error }}
                        </li>
                        <template v-else>
                            <li v-if="!bucketState(group.kind, bucket.name).length" class="adm-muted">
                                Tuščia.
                            </li>
                            <li
                                v-for="file in bucketState(group.kind, bucket.name)"
                                :key="file.name"
                                class="adm-file-row"
                            >
                                <label class="adm-checkbox-row">
                                    <input
                                        type="checkbox"
                                        :checked="isFileSelected(group.kind, bucket.name, file.name)"
                                        @change="toggleFile(group.kind, bucket.name, file.name, $event.target.checked)"
                                    />
                                    <span>{{ file.name }} <small>({{ formatSize(file.size) }})</small></span>
                                </label>
                                <button
                                    type="button"
                                    class="adm-button adm-button--danger adm-button--small"
                                    :disabled="mediaBusy"
                                    @click="deleteFile(group.kind, bucket.name, file.name)"
                                >
                                    Šalinti
                                </button>
                            </li>
                        </template>
                    </ul>
                </div>

                <p v-if="!mediaOptions[group.kind].length" class="adm-muted">{{ group.emptyLabel }}</p>
                <button
                    class="adm-button"
                    :disabled="!selectedBuckets[group.kind].length || mediaBusy"
                    @click="downloadMediaKind(group.kind, selectedBuckets[group.kind])"
                >
                    Atsisiųsti pasirinktas kategorijas
                </button>
            </div>
        </div>

        <h3 class="adm-subheading">Atkurti iš ZIP archyvo</h3>
        <p class="adm-file-note">
            Įkelkite anksčiau atsisiųstą ZIP archyvą. Pasirinktų kategorijų/formatų
            (varnelė prie jų aukščiau) failai bus pridėti arba perrašyti; kiti failai
            serveryje nekeičiami. Pavieniams failams naudokite „Įkelti“ prie
            konkrečios kategorijos.
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

function parseAudioFilename(filename) {
    if (!/\.mp3$/iu.test(filename)) return null;
    const songId = filename.replace(/\.mp3$/iu, '');
    return songId || null;
}

function parseNotesFilename(filename, format) {
    const pattern = new RegExp(`\\.${format}$`, 'iu');
    if (!pattern.test(filename)) return null;
    const stem = filename.replace(pattern, '');
    const match = stem.match(/^(.+?)(?:_([1-8]))?$/u);
    if (!match) return null;
    return { songId: match[1], page: match[2] ? Number(match[2]) : 0 };
}

export default {
    name: 'MediaLibraryPanel',
    data() {
        return {
            mediaOptions: { audio: [], notes: [] },
            selectedBuckets: { audio: [], notes: [] },
            selectedFiles: {},
            expanded: {},
            restoreKind: 'audio',
            mediaFile: null,
            mediaBusy: false,
            mediaError: '',
            mediaMessage: '',
            groups: [
                { kind: 'audio', title: 'Garso įrašai', emptyLabel: 'Kategorijų nėra.' },
                { kind: 'notes', title: 'Natos', emptyLabel: 'Formatų nėra.' },
            ],
        };
    },
    computed: {
        restoreSelection() {
            return this.selectedBuckets[this.restoreKind];
        },
        selectedFileCount() {
            return Object.keys(this.selectedFiles).length;
        },
    },
    created() {
        this.loadMediaOptions();
    },
    methods: {
        pick(event) {
            return (event.target.files && event.target.files[0]) || null;
        },
        formatSize(bytes) {
            return `${Math.round((bytes || 0) / 1024)} KB`;
        },
        flashMedia(message) {
            this.mediaMessage = message;
            this.mediaError = '';
            window.setTimeout(() => {
                this.mediaMessage = '';
            }, 3000);
        },
        bucketKey(kind, bucket) {
            return `${kind}:${bucket}`;
        },
        fileKey(kind, bucket, file) {
            return `${kind}:${bucket}:${file}`;
        },
        async loadMediaOptions() {
            try {
                this.mediaOptions = await api.mediaOptions();
            } catch (error) {
                this.mediaError = error.message;
            }
        },
        allBucketsSelected(kind) {
            const all = this.mediaOptions[kind] || [];
            return all.length > 0 && this.selectedBuckets[kind].length === all.length;
        },
        toggleAllBuckets(kind, checked) {
            this.selectedBuckets[kind] = checked
                ? (this.mediaOptions[kind] || []).map(item => item.name)
                : [];
        },
        toggleBucket(kind, bucket, checked) {
            const list = this.selectedBuckets[kind];
            const index = list.indexOf(bucket);
            if (checked && index === -1) list.push(bucket);
            if (!checked && index !== -1) list.splice(index, 1);
        },
        isExpanded(kind, bucket) {
            return this.bucketKey(kind, bucket) in this.expanded;
        },
        bucketState(kind, bucket) {
            return this.expanded[this.bucketKey(kind, bucket)];
        },
        async toggleExpand(kind, bucket) {
            const key = this.bucketKey(kind, bucket);
            if (key in this.expanded) {
                const next = { ...this.expanded };
                delete next[key];
                this.expanded = next;
                return;
            }
            await this.fetchBucket(kind, bucket);
        },
        async fetchBucket(kind, bucket) {
            const key = this.bucketKey(kind, bucket);
            this.expanded = { ...this.expanded, [key]: 'loading' };
            try {
                const result = await api.mediaFiles(kind, bucket);
                this.expanded = { ...this.expanded, [key]: result.files || [] };
            } catch (error) {
                this.expanded = { ...this.expanded, [key]: { error: error.message } };
            }
        },
        async expandAll() {
            const targets = [];
            for (const kind of ['audio', 'notes']) {
                for (const item of this.mediaOptions[kind] || []) {
                    if (!this.isExpanded(kind, item.name)) targets.push([kind, item.name]);
                }
            }
            await Promise.all(targets.map(([kind, bucket]) => this.fetchBucket(kind, bucket)));
        },
        collapseAll() {
            this.expanded = {};
        },
        isFileSelected(kind, bucket, file) {
            return Boolean(this.selectedFiles[this.fileKey(kind, bucket, file)]);
        },
        toggleFile(kind, bucket, file, checked) {
            const key = this.fileKey(kind, bucket, file);
            const next = { ...this.selectedFiles };
            if (checked) {
                next[key] = { kind, bucket, file };
            } else {
                delete next[key];
            }
            this.selectedFiles = next;
        },
        async downloadMediaKind(kind, values) {
            if (!values.length) return;
            this.mediaBusy = true;
            this.mediaError = '';
            this.mediaMessage = '';
            try {
                await api.downloadMedia(kind, values);
                this.flashMedia('Archyvas atsisiųstas.');
            } catch (error) {
                this.mediaError = error.message;
            } finally {
                this.mediaBusy = false;
            }
        },
        async downloadSelectedFiles() {
            const items = Object.values(this.selectedFiles);
            if (!items.length) return;
            this.mediaBusy = true;
            this.mediaError = '';
            this.mediaMessage = '';
            try {
                await api.downloadMediaSelection(items);
                this.flashMedia(`Atsisiųsta ${items.length} failų.`);
            } catch (error) {
                this.mediaError = error.message;
            } finally {
                this.mediaBusy = false;
            }
        },
        async uploadFiles(kind, bucket, event) {
            const files = Array.from(event.target.files || []);
            event.target.value = '';
            if (!files.length) return;
            this.mediaBusy = true;
            this.mediaError = '';
            this.mediaMessage = '';
            let uploaded = 0;
            const failures = [];
            for (const file of files) {
                try {
                    if (kind === 'audio') {
                        const songId = parseAudioFilename(file.name);
                        if (!songId) {
                            throw new Error('Netinkamas failo vardas (turi būti <giesmės numeris>.mp3)');
                        }
                        await api.uploadAudio(bucket, songId, file);
                    } else {
                        const parsed = parseNotesFilename(file.name, bucket);
                        if (!parsed) {
                            throw new Error(`Netinkamas failo vardas (turi būti <giesmės numeris>.${bucket})`);
                        }
                        await api.uploadNotes(bucket, parsed.songId, parsed.page, file);
                    }
                    uploaded++;
                } catch (error) {
                    failures.push(`${file.name}: ${error.message}`);
                }
            }
            this.mediaMessage = `Įkelta ${uploaded} iš ${files.length} failų.`;
            this.mediaError = failures.join('; ');
            this.mediaBusy = false;
            await this.loadMediaOptions();
            if (this.isExpanded(kind, bucket)) await this.fetchBucket(kind, bucket);
        },
        async deleteFile(kind, bucket, file) {
            if (!window.confirm(`Pašalinti failą „${file}“?`)) return;
            this.mediaBusy = true;
            this.mediaError = '';
            try {
                if (kind === 'audio') {
                    const songId = parseAudioFilename(file);
                    await api.deleteAudio(bucket, songId);
                } else {
                    const parsed = parseNotesFilename(file, bucket);
                    await api.deleteNotes(bucket, parsed.songId, parsed.page);
                }
                this.toggleFile(kind, bucket, file, false);
                this.flashMedia('Failas pašalintas.');
                await this.loadMediaOptions();
                if (this.isExpanded(kind, bucket)) await this.fetchBucket(kind, bucket);
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
                this.flashMedia(`Įkelta ${result.imported} failų${skipped}.`);
                this.mediaFile = null;
                if (this.$refs.mediaFileInput) this.$refs.mediaFileInput.value = '';
                await this.loadMediaOptions();
                for (const bucket of values) {
                    if (this.isExpanded(this.restoreKind, bucket)) {
                        await this.fetchBucket(this.restoreKind, bucket);
                    }
                }
            } catch (error) {
                this.mediaError = error.message;
            } finally {
                this.mediaBusy = false;
            }
        },
    },
};
</script>

<style lang="scss">
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

    > .adm-button {
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

    &--all {
        padding-bottom: 8px;
        margin-bottom: 4px;
        border-bottom: 1px solid var(--adm-border);
    }
}

.adm-media-bucket {
    padding: 2px 0;
}

.adm-media-bucket__label {
    flex: 1;
    min-width: 0;
}

.adm-bucket-toggle {
    padding: 2px 8px;
    border: 1px solid var(--adm-border);
    border-radius: 6px;
    background: none;
    cursor: pointer;
}

.adm-icon-upload {
    padding: 2px 10px;
    font-size: 13px;
    cursor: pointer;

    input {
        display: none;
    }
}

.adm-bucket-files {
    max-height: 220px;
    margin: 4px 0 10px 26px;
    padding: 6px 10px;
    overflow: auto;
    list-style: none;
    border: 1px solid var(--adm-border);
    border-radius: 8px;
    background: var(--adm-surface-soft);
}

.adm-file-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 3px 0;

    .adm-checkbox-row {
        padding: 0;
    }
}

.adm-button--small {
    padding: 3px 10px;
    font-size: 12px;
}

@media (max-width: 640px) {
    .adm-media-grid {
        grid-template-columns: 1fr;
    }
}
</style>
