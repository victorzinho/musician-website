// Screenshots the link preview page (src/pages/og/[lang].astro) to `public/og-<lang>.jpg`, 1200×630; `npm run verify`
// says when to rerun. Builds the site and serves it with `astro preview`; renders with the devbox's headless Chromium,
// `$CHROMIUM_HEADLESS`.
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { record } from './generated.mjs';

const port = 6008;
const languages = ['en', 'es'];
if (!process.env.CHROMIUM_HEADLESS) throw new Error('CHROMIUM_HEADLESS is not set: no headless Chromium on this machine');

execFileSync('npx', ['astro', 'build'], { stdio: 'ignore' });
execFileSync('npx', ['astro', 'preview', '--background', '--port', String(port)], { stdio: 'ignore' });
try {
  await waitFor(`http://localhost:${port}/og/en/`);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_HEADLESS });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const lang of languages) {
    await page.goto(`http://localhost:${port}/og/${lang}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `public/og-${lang}.jpg`, type: 'jpeg', quality: 85 });
    console.log(`public/og-${lang}.jpg`);
  }
  await browser.close();
  record('scripts/og-image.mjs');
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
