import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    // Kur nukreipti /api ir /files užklausas per "npm run dev":
    // vietinis PHP serveris (php -S localhost:8000 router.php) arba jūsų svetainė
    const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:8000';

    return {
        plugins: [
            vue(),
            VitePWA({
                strategies: 'injectManifest',
                srcDir: 'src',
                filename: 'sw.js',
                registerType: 'autoUpdate',
                injectRegister: false,
                // Existing hand-written public/manifest.json is kept as-is
                manifest: false,
                injectManifest: {
                    globPatterns: ['**/*.{js,css,html,ico}', 'manifest.json'],
                    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
                },
                devOptions: {
                    enabled: false,
                },
            }),
        ],
        server: {
            port: 5173,
            proxy: {
                '/api': { target: proxyTarget, changeOrigin: true },
                '/files': { target: proxyTarget, changeOrigin: true },
            },
        },
    };
});
