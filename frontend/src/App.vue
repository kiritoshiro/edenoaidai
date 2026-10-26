<template>
    <main :class="{ 'app-main--admin': isAdmin }">
        <router-view v-slot="{ Component }">
            <keep-alive :include="['Home', 'Search', 'Favorites']">
                <component :is="Component" />
            </keep-alive>
        </router-view>
    </main>
    <navbar v-if="!isAdmin" />
    <div class="data-notice" role="status" aria-live="polite">
        <span v-if="dataNoticeVisible" class="data-notice__text">
            Giesmių duomenys atnaujinti
        </span>
    </div>
</template>

<script>
import Navbar from './components/Navbar.vue';
import { checkForDataUpdate, DATA_UPDATED_EVENT } from './lib/dataSync';

const DATA_CHECK_INTERVAL = 10 * 60 * 1000;
const DATA_NOTICE_DURATION = 3000;

export default {
    components: {
        Navbar,
    },
    data() {
        return {
            dataNoticeVisible: false,
        };
    },
    computed: {
        isAdmin() {
            return this.$route.path.startsWith('/admin');
        },
    },
    mounted() {
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        window.addEventListener('online', this.checkData);
        window.addEventListener(DATA_UPDATED_EVENT, this.showDataNotice);
        this.dataCheckTimer = window.setInterval(() => {
            if (document.visibilityState === 'visible') this.checkData();
        }, DATA_CHECK_INTERVAL);
        // The first route decides whether a check makes sense at all
        this.$router.isReady().then(this.checkData);
    },
    beforeUnmount() {
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        window.removeEventListener('online', this.checkData);
        window.removeEventListener(DATA_UPDATED_EVENT, this.showDataNotice);
        window.clearInterval(this.dataCheckTimer);
        window.clearTimeout(this.dataNoticeTimer);
    },
    methods: {
        // Not while installing (that flow imports everything itself) nor in
        // the admin, which reads the API directly
        checkData() {
            if (this.isAdmin || this.$route.name === 'install') return;
            checkForDataUpdate();
        },
        onVisibilityChange() {
            if (document.visibilityState === 'visible') this.checkData();
        },
        showDataNotice() {
            this.dataNoticeVisible = true;
            window.clearTimeout(this.dataNoticeTimer);
            this.dataNoticeTimer = window.setTimeout(() => {
                this.dataNoticeVisible = false;
            }, DATA_NOTICE_DURATION);
        },
    },
};
</script>

<style lang="scss">
:root {
    color-scheme: light;
    --app-background: #f5f1e9;
    --app-surface: #fffdf9;
    --app-surface-soft: #eee8dd;
    --app-text: #29251f;
    --app-muted: #746d62;
    --app-border: rgba(68, 53, 33, 0.14);
    --app-accent: #c18b3a;
    --app-accent-strong: #75480b;
    --app-accent-soft: #f3e2c3;
    --app-hover: #eadfce;
    --app-nav: rgba(255, 253, 249, 0.94);
    --app-shadow: 0 18px 50px rgba(65, 49, 27, 0.1);
    --app-shadow-small: 0 7px 20px rgba(65, 49, 27, 0.08);
    --app-focus: #1769aa;
}

:root[data-theme='dark'] {
    color-scheme: dark;
    --app-background: #11161c;
    --app-surface: #1a2027;
    --app-surface-soft: #232b34;
    --app-text: #f4efe6;
    --app-muted: #b7b0a5;
    --app-border: rgba(255, 255, 255, 0.12);
    --app-accent: #e0b66c;
    --app-accent-strong: #f1ca84;
    --app-accent-soft: #40331e;
    --app-hover: #2b3540;
    --app-nav: rgba(24, 30, 38, 0.94);
    --app-shadow: 0 16px 42px rgba(0, 0, 0, 0.4);
    --app-shadow-small: 0 8px 22px rgba(0, 0, 0, 0.25);
    --app-focus: #7ec5ff;
}

html,
body,
#app {
    min-height: 100%;
}

body {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
        'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin: 0;
    color: var(--app-text);
    background:
        radial-gradient(
            circle at 50% -180px,
            color-mix(in srgb, var(--app-accent) 15%, transparent),
            transparent 420px
        ),
        var(--app-background);
    transition: color 0.2s ease, background-color 0.2s ease;
}

button,
input,
select {
    font: inherit;
}

button:focus-visible,
input:focus-visible,
select:focus-visible,
a:focus-visible {
    outline: 3px solid var(--app-focus);
    outline-offset: 3px;
}

main {
    width: min(1120px, 100%);
    min-height: 100vh;
    box-sizing: border-box;
    margin: 0 auto;
    padding: 18px 18px 112px;

    &.app-main--admin {
        width: 100%;
        padding-bottom: 18px;
    }
}

.public-page {
    width: min(880px, 100%);
    margin: 0 auto;
}

.page-header {
    margin: 10px 4px 22px;

    h1 {
        margin: 0;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(30px, 5vw, 42px);
        font-weight: 600;
        line-height: 1.12;
    }

    p {
        max-width: 620px;
        margin: 8px 0 0;
        color: var(--app-muted);
        line-height: 1.55;
    }
}

.empty-state {
    display: grid;
    min-height: 240px;
    place-items: center;
    padding: 32px 20px;
    border: 1px solid var(--app-border);
    border-radius: 20px;
    color: var(--app-muted);
    background: var(--app-surface);
    box-shadow: var(--app-shadow-small);
    text-align: center;

    h2 {
        margin: 0 0 8px;
        color: var(--app-text);
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 24px;
        font-weight: 600;
    }

    p {
        max-width: 480px;
        margin: 0;
        line-height: 1.55;
    }
}

// Read by screen readers, not shown
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
}

.icon {
    display: inline-block;
    width: 1em;
    height: 1em;
    stroke-width: 0;
    stroke: currentColor;
    fill: currentColor;
}

#icon-synthesizer path {
    fill: currentColor !important;
}

:root[data-theme='dark'] .icon-audio--img {
    filter: invert(1) brightness(1.15);
}

// Floats above the bottom navigation, so showing it never moves the page.
// Below the navbar and every overlay (slideshow, sheet-music viewer).
.data-notice {
    position: fixed;
    left: 50%;
    bottom: calc(max(10px, env(safe-area-inset-bottom)) + 78px);
    z-index: 90;
    transform: translateX(-50%);
    pointer-events: none;

    &__text {
        display: block;
        padding: 9px 16px;
        border: 1px solid var(--app-border);
        border-radius: 999px;
        color: var(--app-text);
        background: var(--app-surface);
        box-shadow: var(--app-shadow-small);
        font-size: 14px;
        white-space: nowrap;
        animation: data-notice-in 0.2s ease;
    }
}

@keyframes data-notice-in {
    from {
        opacity: 0;
        transform: translateY(6px);
    }
}

@media (prefers-reduced-motion: reduce) {
    .data-notice__text {
        animation: none;
    }
}

@media (max-width: 600px) {
    main {
        padding: 12px 10px 104px;
    }
}
</style>
