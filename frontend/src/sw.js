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
import { createPartialResponse, RangeRequestsPlugin } from 'workbox-range-requests';
import { createProgressiveDownload, knownLength } from './lib/audioRange.js';

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

// <audio> always sends a Range header, and the server answers 206, which the
// Cache API cannot store. So on a cache miss, fetch the whole file without
// Range (a 200 that can be cached) and answer the player's ranges from that
// download as it arrives. Ranges asked for while it is still running (e.g.
// seeking during the first play) are answered from the same download, not
// the network: Chrome stops playback when one media resource mixes
// service-worker-built and network responses. Once the file is cached,
// RangeRequestsPlugin slices it.
const audioDownloads = new Map(); // url -> Promise<progressive download | null>
const fullAudioDownloadPlugin = {
    cachedResponseWillBeUsed: async ({ request, cachedResponse }) => {
        const range = request.headers.get('range');
        if (cachedResponse || !range || !audioDownloads.has(request.url)) {
            return cachedResponse;
        }
        const download = await audioDownloads.get(request.url);
        return download ? download.respond(range) : null;
    },
    requestWillFetch: async ({ request, state }) => {
        if (!request.headers.has('range')) return request;
        state.download = new Promise(resolve => (state.resolveDownload = resolve));
        audioDownloads.set(request.url, state.download);
        const headers = new Headers(request.headers);
        headers.delete('range');
        return new Request(request, { headers });
    },
    handlerWillRespond: async ({ request, response, state }) => {
        const range = request.headers.get('range');
        if (range && response?.status === 200) {
            if (state.resolveDownload && knownLength(response)) {
                const download = createProgressiveDownload(response);
                state.resolveDownload(download);
                return download.respond(range);
            }
            response = await createPartialResponse(request, response);
        }
        state.resolveDownload?.(null);
        return response;
    },
    handlerDidComplete: async ({ request, state }) => {
        if (!state.download) return;
        state.resolveDownload(null);
        if (audioDownloads.get(request.url) === state.download) {
            audioDownloads.delete(request.url);
        }
    },
};

// Audio (mp3) – cache-first so hymns work offline.
// The "Atnaujinti duomenis" flow deletes this cache to force fresh files.
registerRoute(
    ({ url, request }) =>
        request.destination === 'audio' || url.pathname.endsWith('.mp3'),
    new CacheFirst({
        cacheName: 'audio-v1',
        plugins: [
            fullAudioDownloadPlugin,
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
