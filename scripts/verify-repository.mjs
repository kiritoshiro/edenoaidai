import { access, readFile, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

const sourceExtensions = /\.(?:css|html|js|php|vue)$/i;
const trackedFiles = (await run('git', ['ls-files', '-z'])).stdout
  .split('\0')
  .filter(Boolean);

const truncatedFiles = [];
for (const file of trackedFiles) {
  if (!sourceExtensions.test(file)) continue;

  let size;
  try {
    ({ size } = await stat(file));
  } catch {
    // A locally deleted tracked file is reported by git diff --exit-code later.
    // Ignore it here so this check can also run before a local release build.
    continue;
  }
  if (size === 16000) truncatedFiles.push(file);
}

if (truncatedFiles.length > 0) {
  console.error('Integrity check failed: tracked source/generated files are exactly 16,000 bytes (likely truncated):');
  for (const file of truncatedFiles) console.error(`- ${file}`);
  process.exit(1);
}

const requiredVueSections = [
  ['frontend/src/views/admin/AdminUpdates.vue', ['</template>', '</script>', '</style>']],
];

const missingSections = [];
for (const [file, sections] of requiredVueSections) {
  const content = await readFile(file, 'utf8');
  for (const section of sections) {
    if (!content.includes(section)) missingSections.push(`${file}: missing ${section}`);
  }
}

const assetReferenceFailures = [];
const serverIndex = await readFile('server/index.html', 'utf8');
const assetReferences = [...serverIndex.matchAll(/(?:src|href)="\/(assets\/[^"?#]+)(?:[?#][^" ]*)?"/g)]
  .map((match) => match[1]);

for (const asset of assetReferences) {
  try {
    await access(`server/${asset}`);
  } catch {
    assetReferenceFailures.push(`server/index.html references missing ${asset}`);
  }
}

if (missingSections.length > 0 || assetReferenceFailures.length > 0) {
  console.error('Integrity check failed:');
  for (const failure of [...missingSections, ...assetReferenceFailures]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Integrity checks passed for ${trackedFiles.length} tracked files.`);

