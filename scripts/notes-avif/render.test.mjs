import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'render-notes-avif.mjs');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function isRunning(pid) {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

// A "browser" that never opens its DevTools port, so the renderer is still
// waiting in startup when it gets the signal.
for (const [signal, exitCode] of [['SIGINT', 130], ['SIGTERM', 143]]) {
    test(
        `${signal} while the browser starts stops it, removes its profile and exits ${exitCode}`,
        { skip: process.platform === 'win32' && 'POSIX signals cannot be sent to another process on Windows' },
        async () => {
            const dir = mkdtempSync(path.join(tmpdir(), 'render-signal-test-'));
            try {
                const temp = path.join(dir, 'tmp');
                const svgDir = path.join(dir, 'svg');
                mkdirSync(temp);
                mkdirSync(svgDir);
                writeFileSync(path.join(svgDir, '1.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');
                const pidFile = path.join(dir, 'browser.pid');
                const browser = path.join(dir, 'fake-browser.sh');
                writeFileSync(browser, `#!/bin/sh\necho $$ > '${pidFile}'\nexec sleep 60\n`);
                chmodSync(browser, 0o755);

                const renderer = spawn(
                    process.execPath,
                    [SCRIPT, `--svg-dir=${svgDir}`, `--out=${path.join(dir, 'out')}`, `--browser=${browser}`],
                    { env: { ...process.env, TMPDIR: temp }, stdio: 'ignore' },
                );
                const exited = new Promise(resolve => renderer.on('exit', code => resolve(code)));
                for (let i = 0; i < 100 && !existsSync(pidFile); i++) await sleep(50);
                assert.ok(existsSync(pidFile), 'the fake browser started');
                const browserPid = Number(readFileSync(pidFile, 'utf8').trim());
                assert.equal(
                    readdirSync(temp).filter(name => name.startsWith('notes-avif-browser-')).length,
                    1,
                    'a browser profile exists during startup',
                );

                renderer.kill(signal);
                assert.equal(await exited, exitCode);
                for (let i = 0; i < 40 && isRunning(browserPid); i++) await sleep(50);
                assert.equal(isRunning(browserPid), false, 'the browser was stopped');
                assert.deepEqual(
                    readdirSync(temp).filter(name => name.startsWith('notes-avif-browser-')),
                    [],
                    'the browser profile was removed',
                );
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        },
    );
}
