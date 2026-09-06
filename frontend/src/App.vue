<template>
    <main :class="{ 'app-main--admin': isAdmin }">
        <router-view v-slot="{ Component }">
            <keep-alive :include="['Home', 'Search', 'Favorites']">
                <component :is="Component" />
            </keep-alive>
        </router-view>
    </main>
    <navbar v-if="!isAdmin" />
</template>

<script>
import Navbar from './components/Navbar.vue';

export default {
    components: {
        Navbar,
    },
    computed: {
        isAdmin() {
            return this.$route.path.startsWith('/admin');
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

@media (max-width: 600px) {
    main {
        padding: 12px 10px 104px;
    }
}
</style>
