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
        // Opening or closing the fullscreen sheet-music viewer only changes
        // route state; keep the song page exactly where it was underneath.
        if (
            to.name === 'single' &&
            from.name === 'single' &&
            to.params.songId === from.params.songId &&
            to.query.notes !== from.query.notes
        ) {
            return false;
        }
        // A hymn selected from any list should always open at its heading,
        // even when browser history has a saved position for that route.
        if (to.name === 'single' && from.name !== 'single') {
            return { left: 0, top: 0 };
        }
        // Previous/next hymn navigation should keep the controls under the
        // user's finger instead of jumping the document back to the top.
        if (
            to.name === 'single' &&
            from.name === 'single' &&
            to.params.songId !== from.params.songId
        ) {
            return false;
        }
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
                    redirect: { name: 'admin-database' },
                },
                {
                    path: 'database',
                    name: 'admin-database',
                    component: () => import('../views/admin/AdminDatabase.vue'),
                },
                {
                    path: 'updates',
                    name: 'admin-updates',
                    component: () => import('../views/admin/AdminUpdates.vue'),
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

// After a deploy, the new service worker takes over (skipWaiting +
// clientsClaim) while this page may still run the previous build. That
// build's lazy chunks (the admin pages) are gone from the server and from
// the precache, so opening one fails and the page is stuck. Load the target
// route again: the new service worker then serves the current build. The
// time check stops a reload loop if a chunk is really missing.
const STALE_CHUNK = /dynamically imported module|Importing a module script failed|Unable to preload CSS/i;
const RELOAD_KEY = 'edeno:stale-chunk-reload';
router.onError((error, to) => {
    if (!STALE_CHUNK.test(String(error?.message ?? error))) return;
    try {
        const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
        if (Date.now() - last < 10_000) return;
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
        // No sessionStorage: reload anyway; a loop needs the chunk to stay missing.
    }
    window.location.assign(to.fullPath);
});

export default router;
