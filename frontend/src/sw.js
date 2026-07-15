/* Service worker (Workbox 7, bundled by scripts/build.mjs). */
import { clientsClaim } from 'workbox-core';
import {
    cleanupOutdatedCaches,
    createHandlerBoundToURL,
    precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { RangeRequestsPlugin } from 'workbox-range-requests';

self.skipWaiting();
clientsClaim();

// App shell – hashed assets, always up to date with each deploy
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigations fall back to index.html
registerRoute(
    new NavigationRoute(createHandlerBoundToURL('index.html'), {
        denylist: [/^\/api\//, /^\/files\//, /^\/public\//],
    }),
);

// Database JSON is stored in IndexedDB by the app itself –
// never serve it from the HTTP cache.
registerRoute(
    ({ url, request }) =>
        request.destination !== 'document' && url.pathname.endsWith('.json'),
    new NetworkOnly(),
);

// Audio (mp3) – cache-first so hymns work offline.
// The "Atnaujinti duomenis" flow deletes this cache to force fresh files.
registerRoute(
    ({ url, request }) =>
        request.destination === 'audio' || url.pathname.endsWith('.mp3'),
    new CacheFirst({
        cacheName: 'audio-v1',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new RangeRequestsPlugin(),
            new ExpirationPlugin({
                maxEntries: 80,
                maxAgeSeconds: 90 * 24 * 60 * 60,
                purgeOnQuotaError: true,
            }),
        ],
    }),
);

// Sheet music images – cache-first, also cleared by "Atnaujinti duomenis".
registerRoute(
    ({ url, request }) =>
        request.destination === 'image' && url.pathname.includes('/notes/'),
    new CacheFirst({
        cacheName: 'notes-v1',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({
                maxEntries: 300,
                maxAgeSeconds: 90 * 24 * 60 * 60,
                purgeOnQuotaError: true,
            }),
        ],
    }),
);

// Custom instrument icons – small, keep fresh in the background
registerRoute(
    ({ url, request }) =>
        request.destination === 'image' &&
        (url.pathname.includes('/files/icons/') ||
            url.pathname.includes('/files/audio/')),
    new StaleWhileRevalidate({
        cacheName: 'icons-v1',
        plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
    }),
);
