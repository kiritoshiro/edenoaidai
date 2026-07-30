import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import Single from './views/Single.vue';
import Search from './views/Search.vue';
import Install from './views/Install.vue';
import NotFound from './views/NotFound.vue';
import Favorites from './views/Favorites.vue';

export default createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    linkActiveClass: 'is-active',
    routes: [
        {
            path: '/',
            name: 'list',
            component: Home,
        },
        {
            path: '/song/:songId',
            name: 'single',
            component: Single,
            props: true,
        },
        {
            path: '/favorites',
            name: 'favorites',
            component: Favorites,
        },
        {
            path: '/search/:query?',
            name: 'search',
            component: Search,
            props: true,
        },
        {
            path: '/install',
            name: 'install',
            component: Install,
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'Not Found',
            component: NotFound,
        },
    ],
});
