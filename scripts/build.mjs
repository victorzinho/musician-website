// `npm run build`: builds dist/, then renders again the committed files that are out of date (`scripts/generated.mjs`)
// and builds with them. Without `$CHROMIUM_HEADLESS` (CI) it renders nothing, and `scripts/check-generated.mjs` fails on
// them.
import { execFileSync } from 'node:child_process';
import { stale } from './generated.mjs';

const build = () => execFileSync('npx', ['astro', 'build'], { stdio: 'inherit' });

build();
const scripts = [...new Set(stale().map((f) => f.script))];
if (scripts.length && process.env.CHROMIUM_HEADLESS) {
  for (const script of scripts) {
    console.log(`\n▶ Rendering with ${script}`);
    execFileSync('node', [script], { stdio: 'inherit' });
  }
  build();
} else if (scripts.length) {
  console.log(`\nOut of date, not rendered without $CHROMIUM_HEADLESS: ${scripts.join(', ')}`);
}
