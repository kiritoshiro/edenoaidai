import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Single from '../views/Single.vue';
import Search from '../views/Search.vue';
import Install from '../views/Install.vue';
import NotFound from '../views/NotFound.vue';
import Favorites from '../views/Favorites.vue';

const LIST_VIEWS = ['list', 'search', 'favorites'];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    linkActiveClass: 'is-active',
    scrollBehavior(to, from, savedPosition) {
        // Returning from a song to a list: List.vue centres the song itself
        if (from.name === 'single' && LIST_VIEWS.includes(to.name)) return false;
        if (savedPosition) return savedPosition;
        return { top: 0 };
    },
    routes: [
        { path: '/', name: 'list', component: Home },
        { path: '/song/:songId', name: 'single', component: Single, props: true },
        { path: '/favorites', name: 'favorites', component: Favorites },
        { path: '/search/:query?', name: 'search', component: Search, props: true },
        { path: '/install', name: 'install', component: Install },
        {
            path: '/admin/login',
            name: 'admin-login',
            component: () => import('../views/admin/AdminLogin.vue'),
        },
        {
            path: '/admin',
            component: () => import('../views/admin/AdminLayout.vue'),
            children: [
                {
                    path: '',
                    name: 'admin-songs',
                    component: () => import('../views/admin/AdminSongs.vue'),
                },
                {
                    path: 'songs/new',
                    name: 'admin-song-new',
                    component: () => import('../views/admin/AdminSongEdit.vue'),
                },
                {
                    path: 'songs/:songId',
                    name: 'admin-song-edit',
                    component: () => import('../views/admin/AdminSongEdit.vue'),
                    props: true,
                },
                {
                    path: 'tracks',
                    name: 'admin-tracks',
                    component: () => import('../views/admin/AdminTracks.vue'),
                },
                {
                    path: 'database',
                    name: 'admin-database',
                    component: () => import('../views/admin/AdminDatabase.vue'),
                },
            ],
        },
        { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
    ],
});

// First visit: if the local database is empty, go to /install
let installChecked = false;
router.beforeEach(async to => {
    if (to.name === 'install' || to.path.startsWith('/admin')) return true;
    if (!installChecked) {
        installChecked = true;
        const { isInstalled } = await import('../db');
        if (!(await isInstalled())) return { name: 'install' };
    }
    return true;
});

// Admin pages require a valid session
router.beforeEach(async to => {
    if (!to.path.startsWith('/admin') || to.name === 'admin-login') return true;
    const { api } = await import('../lib/api');
    try {
        await api.me();
        return true;
    } catch {
        return { name: 'admin-login', query: { redirect: to.fullPath } };
    }
});

// Remember which song to scroll back to in list views
router.afterEach((to, from) => {
    window.__scrollToSong =
        from.name === 'single' && LIST_VIEWS.includes(to.name)
            ? from.params.songId
            : null;
});

export default router;
