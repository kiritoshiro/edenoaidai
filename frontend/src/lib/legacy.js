/**
 * One-time cleanup of the previous (Vue 2 / workbox 4) version:
 * - unregisters the old `/service-worker.js` worker
 * - removes localStorage flags the old cache logic left behind
 */
export async function cleanupLegacy() {
    try {
        ['dbVersion', 'databaseUpdated', 'sw'].forEach(key =>
            localStorage.removeItem(key),
        );

        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                const worker =
                    registration.active ||
                    registration.waiting ||
                    registration.installing;
                if (worker && worker.scriptURL.includes('service-worker.js')) {
                    await registration.unregister();
                    console.info('Senas service worker pašalintas.');
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
}
