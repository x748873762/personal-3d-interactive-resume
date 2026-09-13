import { readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { releaseFiles } from './release-files.mjs';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const rules = [
  ['personal metadata field', /(?:真实姓名|身份证号|工作单位)\s*[:=：]/],
  ['email or contact link', /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:mailto|tel):/i],
  ['mobile number', /(?<!\d)1[3-9]\d{9}(?!\d)/],
  ['local absolute path', /(?:\/Users\/|\/home\/)[^\s"']+/],
  ['private asset', /(?:private\/|个人简历|\.glb\b|\.gltf\b|\.pdf\b|\.docx\b)/i],
  ['secret signature', /-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:sk|ghp|github_pat)-[a-z0-9]{20,}/i],
];
// Source files are allowlisted. This scanner never opens credential files.
const failures = [];
for (const file of releaseFiles) {
  const target = path.join(root, file);
  const stat = await lstat(target);
  if (!stat.isFile() || stat.isSymbolicLink()) { failures.push(`${file}: not a regular file`); continue; }
  // The detector contains its own forbidden-pattern examples; inspect it manually.
  if (file === 'scripts/check-privacy.mjs') continue;
  if (file === 'pnpm-lock.yaml') {
    const lock = await readFile(target, 'utf8');
    if (/(?:\bfile:|\blink:|git\+|\/Users\/|_authToken)/i.test(lock)) failures.push('lockfile: nonportable dependency or credential configuration');
    continue;
  }
  const value = await readFile(target, 'utf8');
  for (const [name, rule] of rules) if (rule.test(value)) failures.push(`${file}: ${name}`);
}
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) { failures.push('dist: symbolic link'); continue; }
    if (entry.isDirectory()) await walk(target);
    else {
      if (!/\.(?:html|js|css)$/.test(entry.name)) failures.push(`dist: unexpected asset ${entry.name}`);
      const value = await readFile(target, 'utf8');
      // Dependency code may contain generic example domains; inspect identity,
      // contact links, local paths and secret signatures in the complete bundle.
      for (const [name, rule] of rules.filter(([name]) => name !== 'mobile number' && name !== 'email or contact link')) {
        if (rule.test(value)) failures.push(`dist/${entry.name}: ${name}`);
      }
      if (/["'](?:mailto|tel):/i.test(value)) failures.push(`dist/${entry.name}: contact link`);
    }
  }
}
await walk(path.join(root, 'dist'));
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`PASS: ${releaseFiles.length} allowlisted source files and production assets checked.`);
