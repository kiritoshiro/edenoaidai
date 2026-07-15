import { createApp } from 'vue';
import { registerSW } from 'virtual:pwa-register';
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

// New service worker (sw.js). `immediate` + autoUpdate keeps clients fresh.
registerSW({ immediate: true });
