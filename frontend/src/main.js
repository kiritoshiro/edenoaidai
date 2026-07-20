import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { db } from './db';
import { cleanupLegacy } from './lib/legacy';

// Remove leftovers of the old (v1) caching implementation:
// old service worker registration and stale localStorage flags.
cleanupLegacy();

const app = createApp(App);
app.config.globalProperties.$songs = db.songs;
app.use(router);
app.mount('#app');

// Register the production service worker. It calls skipWaiting() and
// clientsClaim(), so an updated build takes control as soon as it is installed.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js', { updateViaCache: 'none' })
            .then(registration => registration.update())
            .catch(error => {
                console.error('Service worker registration failed:', error);
            });
    });
}
