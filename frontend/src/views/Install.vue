<template>
    <div class="public-page install-page">
        <section class="install-message" :class="`is-${status || 'working'}`">
            <div class="install-message__icon" aria-hidden="true">
                <span v-if="status === 'ready'">✓</span>
                <span v-else-if="status === 'error'">!</span>
                <span v-else class="install-spinner"></span>
            </div>

            <template v-if="status === 'ready'">
                <h1>Paruošta!</h1>
                <p>Giesmių duomenys atnaujinti.</p>
            </template>

            <template v-else-if="status === 'error'">
                <h1>Nepavyko atnaujinti</h1>
                <p>{{ error }}</p>
                <button class="install-retry" @click="start">
                    Bandyti dar kartą
                </button>
            </template>

            <template v-else>
                <h1>Atnaujinami duomenys</h1>
                <p>{{ message }}</p>
                <div
                    v-if="total"
                    class="install-progress"
                    role="progressbar"
                    :aria-valuenow="current"
                    aria-valuemin="0"
                    :aria-valuemax="total"
                >
                    <span :style="{ width: `${Math.round((current / total) * 100)}%` }"></span>
                </div>
                <small v-if="total">{{ current }} / {{ total }}</small>
            </template>
        </section>
    </div>
</template>

<script>
import { db } from '../db';
import {
    downloadData,
    fetchDataVersion,
    saveData,
    setDataVersion,
} from '../lib/dataSync';
import { setAppTheme } from '../lib/theme';

const USER_SETTING_KEYS = [
    'appTheme',
    'notesVisible',
    'fontSize',
    'slideshowTheme',
    'slideshowFontSize',
    'slideshowStrictSize',
    'slideshowWrapLines',
    'slideshowOffsetX',
    'slideshowOffsetY',
];

export default {
    name: 'Install',
    data() {
        return {
            status: '',
            message: 'Ruošiama…',
            error: '',
            total: 0,
            current: 0,
        };
    },
    created() {
        this.start();
    },
    methods: {
        async start() {
            this.status = '';
            this.error = '';
            this.message = 'Ruošiama…';
            this.total = 0;
            this.current = 0;

            try {
                const refresh =
                    this.$route.query.refresh === '1' ||
                    (await db.songs.count()) > 0;

                if (refresh) {
                    this.message = 'Atkuriami numatytieji nustatymai…';
                    this.resetUserSettings();

                    // Forget previously cached audio / sheet music / JSON so
                    // updated files on the server are actually re-downloaded
                    this.message = 'Valomi seni duomenys…';
                    await this.clearRuntimeCaches();
                }

                this.message = 'Siunčiama giesmių duomenų bazė…';
                // Requested first, so the stored version is never newer than
                // the data; background checks then pick up later changes
                const versionRequest = fetchDataVersion().catch(() => '');
                const { songs, tracks } = await downloadData({
                    requireTracks: false,
                });

                this.message = 'Įrašoma…';
                this.total = songs.length;
                this.current = 0;
                await saveData(songs, tracks, current => {
                    this.current = current;
                });
                setDataVersion(await versionRequest);

                if (refresh) {
                    this.message = 'Tikrinama nauja programėlės versija…';
                    await this.updateApplicationCode();
                }

                this.success(refresh);
            } catch (error) {
                console.error(error);
                this.status = 'error';
                this.error = error && error.message ? error.message : String(error);
            }
        },

        // Deletes every runtime cache (audio, notes, icons, leftovers of the
        // old app) while keeping the precached app shell intact.
        async clearRuntimeCaches() {
            if (!('caches' in window)) return;
            try {
                const keys = await caches.keys();
                await Promise.all(
                    keys
                        .filter(key => !key.includes('precache'))
                        .map(key => caches.delete(key)),
                );
            } catch (error) {
                console.error('Nepavyko išvalyti podėlio:', error);
            }
        },

        resetUserSettings() {
            USER_SETTING_KEYS.forEach(key => localStorage.removeItem(key));
            setAppTheme('light');
        },

        async updateApplicationCode() {
            if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

            try {
                const registration =
                    (await navigator.serviceWorker.getRegistration('/')) ||
                    (await navigator.serviceWorker.register('/sw.js', {
                        updateViaCache: 'none',
                    }));

                await registration.update();
                const worker = registration.installing || registration.waiting;
                if (!worker || worker.state === 'activated') return;

                await Promise.race([
                    new Promise(resolve => {
                        const onStateChange = () => {
                            if (['activated', 'redundant'].includes(worker.state)) {
                                worker.removeEventListener('statechange', onStateChange);
                                resolve();
                            }
                        };
                        worker.addEventListener('statechange', onStateChange);
                        onStateChange();
                    }),
                    new Promise(resolve => window.setTimeout(resolve, 4000)),
                ]);
            } catch (error) {
                // The database refresh should still finish when the browser is
                // offline or service workers are unavailable.
                console.warn('Nepavyko patikrinti programėlės kodo:', error);
            }
        },

        success(refresh = false) {
            this.status = 'ready';
            setTimeout(() => {
                if (refresh) {
                    window.location.replace(`/?updated=${Date.now()}`);
                } else {
                    this.$router.replace('/');
                }
            }, 800);
        },
    },
};
</script>

<style lang="scss">
.install-page {
    display: grid;
    min-height: calc(100vh - 160px);
    place-items: center;
}

.install-message {
    width: min(520px, 100%);
    padding: 42px 28px;
    border: 1px solid var(--app-border);
    border-radius: 22px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow);
    text-align: center;

    &__icon {
        display: grid;
        width: 58px;
        height: 58px;
        margin: 0 auto 18px;
        place-items: center;
        border-radius: 18px;
        color: var(--app-accent-strong);
        background: var(--app-accent-soft);
        font-size: 27px;
        font-weight: 800;
    }

    h1 {
        margin: 0;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 30px;
        font-weight: 600;
    }

    p {
        margin: 10px auto 0;
        color: var(--app-muted);
        line-height: 1.55;
    }

    small {
        display: block;
        margin-top: 9px;
        color: var(--app-muted);
        font-variant-numeric: tabular-nums;
    }

    &.is-error &__icon {
        color: #a43b32;
        background: rgba(178, 61, 49, 0.12);
    }
}

.install-spinner {
    width: 25px;
    height: 25px;
    border: 3px solid color-mix(in srgb, var(--app-accent) 28%, transparent);
    border-top-color: var(--app-accent-strong);
    border-radius: 50%;
    animation: install-spin 0.9s linear infinite;
}

.install-progress {
    height: 8px;
    margin-top: 22px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--app-surface-soft);

    span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--app-accent);
        transition: width 0.2s ease;
    }
}

.install-retry {
    min-height: 44px;
    margin-top: 20px;
    padding: 0 16px;
    border: 0;
    border-radius: 12px;
    color: #251a0a;
    background: var(--app-accent);
    font-weight: 750;
    cursor: pointer;
}

@keyframes install-spin {
    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .install-spinner {
        animation-duration: 2s;
    }
}
</style>
