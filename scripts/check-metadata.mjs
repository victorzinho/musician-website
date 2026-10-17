// Checks every image and PDF in the built site (dist/) for metadata that `scripts/strip-metadata.mjs` strips.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { leftovers } from './strip-metadata.mjs';

const files = readdirSync('dist', { recursive: true }).map((file) => join('dist', file));
const dirty = files.map((file) => [file, leftovers(file)]).filter(([, found]) => found.length);
if (dirty.length) {
  console.error(dirty.map(([file, found]) => `${file}: ${found.join(', ')}`).join('\n'));
  console.error('Run `node scripts/strip-metadata.mjs` and rebuild.');
  process.exit(1);
}
console.log(`Metadata: ${files.length} files checked`);
