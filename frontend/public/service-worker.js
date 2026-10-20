/*
 * Kill switch for the pre-July-2026 (Vue 2 / Workbox 4) service worker.
 *
 * The old app registered `/service-worker.js?<version>` at scope `/` and
 * served its precached shell offline-first. Once that file disappeared from
 * the server, the browser's update check got index.html back (text/html),
 * failed, and kept the old worker – and the old app – forever.
 *
 * Serving this file as the "update" replaces the old worker. On activation it
 * deletes the old caches, unregisters itself and reloads the open windows, so
 * the next load fetches index.html from the network and the current app
 * registers `/sw.js`.
 *
 * Safari before iOS 16 has WindowClient.navigate() but always rejects it, and
 * the old app listens for no message or controllerchange event we could use
 * to reload it instead. There the open old app keeps running until the next
 * launch or reload, which then gets the current app from the network: the
 * caches are gone, the registration is gone, and this worker has no fetch
 * handler, so nothing can serve the old shell again.
 *
 * Only registrations whose script URL is `/service-worker.js…` ever fetch this
 * file. The current app registers `/sw.js`, so its clients are never touched.
 * Do not register this file from the app, and do not delete it from the
 * server while old installs may still exist.
 */

// Caches the current /sw.js keeps its offline audio, sheet music and icons in.
// The kill switch never runs where /sw.js is active (one registration per
// scope), but these hold user downloads, so keep them if they exist anyway.
const KEEP_CACHES = new Set(['audio-v1', 'notes-v1', 'icons-v1']);

self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
});

async function retire() {
    const names = await caches.keys();
    await Promise.all(
        names
            .filter(name => !KEEP_CACHES.has(name))
            .map(name => caches.delete(name)),
    );

    await self.registration.unregister();

    // Only windows the old worker controlled are reloaded (not on iOS 15 and
    // older, where navigate() rejects; see the top comment). This worker has no
    // fetch handler and the registration is gone, so the reload goes straight
    // to the network and gets the current index.html. There is no reload
    // loop: if a stale old page ever loads again and re-registers this file,
    // that new registration controls no window, so nothing is reloaded.
    const windows = await self.clients.matchAll({ type: 'window' });
    await Promise.all(
        windows.map(client => client.navigate(client.url).catch(() => {})),
    );
}

self.addEventListener('activate', event => {
    event.waitUntil(retire());
});
