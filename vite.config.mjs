import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const appConfig = {
        cacheVersion:
            env.VITE_CACHE_VERSION ||
            env.VUE_APP_CACHE_VERSION ||
            env.CACHE_VERSION ||
            packageJson.version,
        songsUrl: env.VITE_DB_URL || env.VUE_APP_DB_URL || null,
        tracksUrl: env.VITE_DB2_URL || env.VUE_APP_DB2_URL || null,
    };

    return {
        define: {
            __APP_CONFIG__: JSON.stringify(appConfig),
        },
        plugins: [
            vue(),
            VitePWA({
                filename: 'service-worker.js',
                injectRegister: null,
                manifest: false,
                registerType: 'prompt',
                srcDir: 'src',
                strategies: 'injectManifest',
                injectManifest: {
                    globPatterns: ['**/*.{css,html,ico,js,json,png,svg}'],
                    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
                },
            }),
        ],
        server: {
            port: 8080,
        },
        build: {
            sourcemap: false,
        },
    };
});
