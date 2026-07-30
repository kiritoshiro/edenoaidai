import { registerSW } from 'virtual:pwa-register';
import { isBot } from './helpers/isBot';
import { reportError } from './helpers/reportError';

async function unregisterServiceWorkers() {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
}

export async function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || isBot) {
        return;
    }

    if (localStorage.getItem('sw')) {
        try {
            await unregisterServiceWorkers();
        } catch (error) {
            reportError(error);
        }
        return;
    }

    const updateServiceWorker = registerSW({
        immediate: true,
        onNeedRefresh() {
            updateServiceWorker(true);
        },
        onRegisterError(error) {
            reportError(error);
        },
    });
}
