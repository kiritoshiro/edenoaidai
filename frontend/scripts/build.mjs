import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const frontendDir = fileURLToPath(new URL('../', import.meta.url));
const distDir = path.join(frontendDir, 'dist');
const serviceWorkerEntry = path.join(frontendDir, 'src', 'sw.js');
const maximumFileSize = 3 * 1024 * 1024;
const precacheExtensions = new Set(['.css', '.html', '.ico', '.js']);

async function walk(directory) {
    const paths = [];

    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            paths.push(...(await walk(entryPath)));
        } else if (entry.isFile()) {
            paths.push(entryPath);
        }
    }

    return paths;
}

function shouldPrecache(filePath) {
    return (
        path.basename(filePath) === 'manifest.json' ||
        precacheExtensions.has(path.extname(filePath).toLowerCase())
    );
}

async function createPrecacheManifest() {
    const manifest = [];

    for (const filePath of await walk(distDir)) {
        if (!shouldPrecache(filePath)) continue;

        const fileStats = await stat(filePath);
        if (fileStats.size > maximumFileSize) {
            throw new Error(
                `${path.relative(distDir, filePath)} exceeds the 3 MiB precache limit.`,
            );
        }

        const contents = await readFile(filePath);
        manifest.push({
            url: path.relative(distDir, filePath).split(path.sep).join('/'),
            revision: createHash('sha256').update(contents).digest('hex'),
        });
    }

    return manifest.sort((left, right) => left.url.localeCompare(right.url));
}

// First build the Vue application and copy public/ assets into dist/.
await build({
    root: frontendDir,
    configFile: path.join(frontendDir, 'vite.config.js'),
    configLoader: 'runner',
});

const precacheManifest = await createPrecacheManifest();

// Then bundle the service worker and inject the immutable precache manifest.
// This replaces vite-plugin-pwa's build-time wrapper while retaining Workbox's
// runtime caching modules used by src/sw.js.
await build({
    root: frontendDir,
    configFile: false,
    define: {
        'self.__WB_MANIFEST': JSON.stringify(precacheManifest),
    },
    build: {
        emptyOutDir: false,
        outDir: distDir,
        minify: 'esbuild',
        rollupOptions: {
            input: serviceWorkerEntry,
            output: {
                entryFileNames: 'sw.js',
                format: 'iife',
                inlineDynamicImports: true,
            },
        },
    },
});

console.log(`Generated sw.js with ${precacheManifest.length} precache entries.`);
