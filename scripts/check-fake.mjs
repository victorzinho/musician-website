// Fails while src/ holds stand-in content, marked FAKE in a comment: it's there to work on a layout, never to deploy.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const text = /\.(astro|ts|mjs|css|md|mdx|yaml)$/;
const marked = readdirSync('src', { recursive: true })
  .map((file) => join('src', file))
  .filter((file) => text.test(file) && readFileSync(file, 'utf8').includes('FAKE'));
if (marked.length) {
  console.error(`Stand-in content (FAKE) in:\n${marked.join('\n')}`);
  process.exit(1);
}
console.log('Stand-in content: none');
