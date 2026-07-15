<template>
    <main>
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
body {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    margin: 0;
}
main {
    padding: 15px;

    // Give extra padding to offset navbar height
    padding-bottom: 70px;
}
.icon {
    display: inline-block;
    width: 1em;
    height: 1em;
    stroke-width: 0;
    stroke: currentColor;
    fill: currentColor;
}
</style>
