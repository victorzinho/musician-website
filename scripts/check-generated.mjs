// Checks that the committed CV PDFs and link preview images match what they're rendered from
// (`scripts/generated.mjs`). Run after `astro build`.
import { stale } from './generated.mjs';

const files = stale();
if (files.length) {
  const byScript = Object.groupBy(files, (f) => f.script);
  for (const [script, list] of Object.entries(byScript)) {
    console.error(`Out of date: ${list.map((f) => f.file).join(', ')}\n  rerun: node ${script}`);
  }
  process.exit(1);
}
console.log('Generated files up to date');
