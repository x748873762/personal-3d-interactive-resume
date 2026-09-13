import { mkdir, copyFile, lstat, writeFile, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { releaseFiles } from './release-files.mjs';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const target = path.join(root, 'release-candidate');
await import('./check-privacy.mjs');
if (process.exitCode) throw new Error('Privacy check failed; candidate was not created.');
// Refuse an existing destination, so manual review edits are never overwritten.
await mkdir(target);
const manifest = [];
for (const name of releaseFiles) {
  const from = path.join(root, name), to = path.join(target, name);
  const stat = await lstat(from);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Refusing non-regular file: ${name}`);
  await mkdir(path.dirname(to), { recursive: true });
  await copyFile(from, to, constants.COPYFILE_EXCL);
  manifest.push(`${createHash('sha256').update(await readFile(to)).digest('hex')}  ${name}`);
}
await writeFile(path.join(target, 'MANIFEST.sha256'), manifest.join('\n') + '\n', { flag: 'wx' });
console.log(`Prepared ${releaseFiles.length} files in release-candidate/. No Git or network operations performed.`);
