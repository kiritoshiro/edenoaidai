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
    --app-background: #f7f4ee;
    --app-surface: #ffffff;
    --app-surface-soft: #f0ece4;
    --app-text: #27231e;
    --app-muted: #716a61;
    --app-border: rgba(57, 45, 30, 0.14);
    --app-accent: #d9b26f;
    --app-accent-strong: #9c671d;
    --app-accent-soft: #f4e7cf;
    --app-hover: #f8edd9;
    --app-nav: rgba(255, 252, 247, 0.94);
    --app-shadow: 0 12px 36px rgba(63, 48, 28, 0.14);
}

:root[data-theme='dark'] {
    color-scheme: dark;
    --app-background: #101419;
    --app-surface: #1a2028;
    --app-surface-soft: #232b35;
    --app-text: #f4efe7;
    --app-muted: #aeb6c0;
    --app-border: rgba(255, 255, 255, 0.12);
    --app-accent: #e0b66c;
    --app-accent-strong: #f1ca84;
    --app-accent-soft: #3d321f;
    --app-hover: #2b3440;
    --app-nav: rgba(24, 30, 38, 0.94);
    --app-shadow: 0 16px 42px rgba(0, 0, 0, 0.4);
}

html,
body,
#app {
    min-height: 100%;
    background: var(--app-background);
}

body {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin: 0;
    color: var(--app-text);
    transition: color 0.2s ease, background-color 0.2s ease;
}

button,
input {
    font: inherit;
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
