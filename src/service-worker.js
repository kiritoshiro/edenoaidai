import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import {
    cleanupOutdatedCaches,
    matchPrecache,
    precacheAndRoute,
} from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { appConfig } from './config';

const cacheVersion = String(appConfig.cacheVersion)
    .replace(/[^a-z0-9._-]/giu, '-')
    .slice(0, 50);
const mediaOrigin = 'https://adventistai.lt';
const runtimeCaches = Object.freeze({
    data: `data-${cacheVersion}`,
    images: `images-${cacheVersion}`,
    media: `media-${cacheVersion}`,
    pages: `pages-${cacheVersion}`,
});
const currentRuntimeCaches = new Set(Object.values(runtimeCaches));
const runtimeCachePrefixes = ['data-', 'images-', 'media-', 'pages-'];

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();

self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

registerRoute(
    ({ request, url }) => request.mode === 'navigate' && url.origin === self.location.origin,
    new NetworkFirst({
        cacheName: runtimeCaches.pages,
        networkTimeoutSeconds: 4,
        plugins: [
            new CacheableResponsePlugin({ statuses: [200] }),
            new ExpirationPlugin({
                maxAgeSeconds: 24 * 60 * 60,
                maxEntries: 20,
                purgeOnQuotaError: true,
            }),
        ],
    }),
);

registerRoute(
    ({ request, url }) =>
        request.destination === '' &&
        url.origin === mediaOrigin &&
        url.pathname.endsWith('.json'),
    new NetworkFirst({
        cacheName: runtimeCaches.data,
        networkTimeoutSeconds: 8,
        plugins: [
            new CacheableResponsePlugin({ statuses: [200] }),
            new ExpirationPlugin({
                maxAgeSeconds: 7 * 24 * 60 * 60,
                maxEntries: 10,
                purgeOnQuotaError: true,
            }),
        ],
    }),
);

registerRoute(
    ({ request, url }) => request.destination === 'image' && url.origin === mediaOrigin,
    new CacheFirst({
        cacheName: runtimeCaches.images,
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({
                maxAgeSeconds: 30 * 24 * 60 * 60,
                maxEntries: 100,
                purgeOnQuotaError: true,
            }),
        ],
    }),
);

registerRoute(
    ({ request, url }) =>
        (request.destination === 'audio' || request.destination === 'video') &&
        url.origin === mediaOrigin,
    new CacheFirst({
        cacheName: runtimeCaches.media,
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({
                maxAgeSeconds: 14 * 24 * 60 * 60,
                maxEntries: 30,
                purgeOnQuotaError: true,
            }),
        ],
    }),
);

setCatchHandler(async ({ event }) => {
    if (event.request.mode === 'navigate') {
        return (await matchPrecache('/index.html')) || Response.error();
    }
    return Response.error();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames
                    .filter(
                        cacheName =>
                            cacheName === 'default' ||
                            cacheName.startsWith('json-') ||
                            (runtimeCachePrefixes.some(prefix =>
                                cacheName.startsWith(prefix),
                            ) &&
                                !currentRuntimeCaches.has(cacheName)),
                    )
                    .map(cacheName => caches.delete(cacheName)),
            ),
        ),
    );
});
