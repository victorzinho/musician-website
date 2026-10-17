// Prints every CV page (src/pages/cv/[id].astro) to `public/cv/<id>.pdf`; `npm run verify` says when to rerun. Builds
// the site and serves it with `astro preview`; prints with the devbox's headless Chromium, `$CHROMIUM_HEADLESS`.
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { record } from './generated.mjs';
import { strip } from './strip-metadata.mjs';

const port = 6007;
if (!process.env.CHROMIUM_HEADLESS) throw new Error('CHROMIUM_HEADLESS is not set: no headless Chromium on this machine');

execFileSync('npx', ['astro', 'build'], { stdio: 'ignore' });
const ids = readdirSync('dist/cv', { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
execFileSync('npx', ['astro', 'preview', '--background', '--port', String(port)], { stdio: 'ignore' });
try {
  await waitFor(`http://localhost:${port}/cv/${ids[0]}/`);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_HEADLESS });
  const page = await browser.newPage();
  for (const id of ids) {
    await page.goto(`http://localhost:${port}/cv/${id}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: `public/cv/${id}.pdf`, preferCSSPageSize: true, printBackground: true, tagged: true });
    strip(`public/cv/${id}.pdf`);
    console.log(`public/cv/${id}.pdf`);
  }
  await browser.close();
  record('scripts/cv-pdfs.mjs');
} finally {
  execFileSync('npx', ['astro', 'preview', 'stop'], { stdio: 'ignore' });
}

async function waitFor(url) {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`${url} never answered`);
}
