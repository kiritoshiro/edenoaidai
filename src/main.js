import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { initializeDatabase } from './database';
import { reportError } from './helpers/reportError';
import { registerServiceWorker } from './registerServiceWorker';

async function bootstrap() {
    const app = createApp(App);

    app.use(router);
    await router.isReady();
    await initializeDatabase(app, router);

    app.mount('#app');
    registerServiceWorker();
}

bootstrap().catch(error => {
    reportError(error);

    const appElement = document.querySelector('#app');
    if (appElement) {
        appElement.textContent =
            'Programos nepavyko paleisti. Atnaujinkite puslapį ir bandykite dar kartą.';
    }
});
