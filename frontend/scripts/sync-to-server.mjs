// Nukopijuoja frontend build'ą (dist/) į ../server/ – aplanką, kurio turinys
// keliamas į public_html. Netrina api/, files/, storage/ ir .htaccess.
import { cpSync, rmSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const server = fileURLToPath(new URL('../../server/', import.meta.url));

if (!existsSync(dist)) {
    console.error('Nerastas dist/ – pirma paleiskite: npm run build');
    process.exit(1);
}

// Seni sugeneruoti failai su maiša pavadinime – išvalomi prieš kopijuojant
rmSync(path.join(server, 'assets'), { recursive: true, force: true });

for (const entry of readdirSync(dist)) {
    if (entry === '_redirects' || entry === '_headers') continue; // tik Netlify
    cpSync(path.join(dist, entry), path.join(server, entry), { recursive: true });
}

console.log('Nukopijuota į server/ – įkelkite server/ turinį į public_html.');
