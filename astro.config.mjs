import { readFileSync } from 'node:fs';
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unfinished } from './src/site.ts';

const latin =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

// The opsz files keep Playfair's optical-size axis; the package's default files drop it. Latin only: Spanish and
// English need nothing else, and Academico covers Catalan's ŀ in body text.
const playfair = (style, subset, unicodeRange) => ({
  weight: '300 900',
  style,
  unicodeRange: [unicodeRange],
  src: [`./node_modules/@fontsource-variable/playfair/files/playfair-${subset}-opsz-${style}.woff2`],
});

const academico = (file, weight, style) => ({
  weight,
  style,
  src: [`./src/assets/fonts/academico/Academico-${file}.woff2`],
});

export default defineConfig({
  site: 'https://music.victorzinho.es',
  output: 'static',
  // Every page under /en/ and /es/ (src/pages/[lang]/); `/` picks one: src/pages/index.astro.
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  server: { host: true, port: 6006 },
  integrations: [
    sitemap({
      // Out: `/`, unfinished pages, and the CV and link preview pages (sources of PDFs and images).
      filter: (page) => {
        const path = new URL(page).pathname;
        return path !== '/' && !/^\/(cv|og)\//.test(path) && !unfinished.includes(path.slice('/en'.length));
      },
      // Each page's other language, as in its `hreflang` links.
      i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es' } },
    }),
    mdx(),
  ],
  // Code colours as CSS variables only (`--shiki-light`, `--shiki-dark`), applied per theme in src/styles/base.css;
  // `wrap: null` leaves overflow to the stylesheet too. Light: Light+ with the site's blue and ink for its blue and black.
  markdown: {
    shikiConfig: {
      themes: { light: JSON.parse(readFileSync('./src/styles/code-light.json', 'utf8')), dark: 'catppuccin-mocha' },
      defaultColor: false,
      wrap: null,
    },
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Playfair',
      cssVariable: '--font-heading',
      fallbacks: ['serif'],
      options: {
        variants: [
          playfair('normal', 'latin', latin),
          playfair('italic', 'latin', latin),
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Academico',
      cssVariable: '--font-body',
      fallbacks: ['serif'],
      options: {
        variants: [
          academico('Regular', '400', 'normal'),
          academico('Italic', '400', 'italic'),
          academico('Bold', '700', 'normal'),
          academico('BoldItalic', '700', 'italic'),
        ],
      },
    },
    // Playfair lacks ♭ ♯ ♮; they come from Academico via @font-face in src/styles/theme.css.
  ],
});
