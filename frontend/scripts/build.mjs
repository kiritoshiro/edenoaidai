import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
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

// Record which commit this build came from, so the admin "Atnaujinimas" page
// can show what is actually deployed without asking GitHub. This only works
// from a git checkout (the self-updater ships this file along with the rest
// of server/ instead of regenerating it, since it never runs npm at all).
function readGitVersion() {
    const git = (...args) => execFileSync('git', args, { cwd: frontendDir }).toString().trim();
    try {
        return {
            sha: git('rev-parse', 'HEAD'),
            shortSha: git('rev-parse', '--short', 'HEAD'),
            branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
            message: git('log', '-1', '--format=%s'),
            date: git('log', '-1', '--format=%aI'),
            dirty: git('status', '--porcelain').length > 0,
            builtAt: new Date().toISOString(),
        };
    } catch {
        return null;
    }
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

const version = readGitVersion();
if (version) {
    await writeFile(path.join(distDir, 'version.json'), JSON.stringify(version, null, 2));
    console.log(`Recorded version ${version.shortSha} (${version.branch}).`);
} else {
    console.warn('Not a git checkout – version.json was not written.');
}
