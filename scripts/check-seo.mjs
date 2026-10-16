// Checks the built site (dist/) for what search engines and link previews read: per indexable page, one title,
// description and canonical (its own URL), og:url and og:image, valid JSON-LD whose @id references resolve, hreflang
// links to built pages; no title or description shared between pages of one language; the sitemap lists exactly the indexable pages;
// llms.txt links resolve. Run after `astro build`.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

const sitemap = readFileSync(join(dist, 'sitemap-0.xml'), 'utf8');
const site = new URL(readFileSync(join(dist, 'sitemap-index.xml'), 'utf8').match(/<loc>([^<]+)<\/loc>/)[1]).origin;
const inSitemap = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));

/** The file a site URL is served from, or undefined for other hosts. */
const fileOf = (url) => {
  const { origin, pathname } = new URL(url, site);
  if (origin !== site) return undefined;
  return join(dist, decodeURIComponent(pathname), pathname.endsWith('/') ? 'index.html' : '');
};

const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((m) => attributes(m[0]));

const pages = readdirSync(dist, { recursive: true })
  .filter((file) => file.endsWith('index.html'))
  .map((file) => ({ url: `${site}/${file.replace(/index\.html$/, '')}`, html: readFileSync(join(dist, file), 'utf8') }));

const seen = { title: new Map(), description: new Map() };
const defined = new Set();
const referenced = [];

for (const { url, html } of pages) {
  const metas = tags(html, 'meta');
  const meta = (key) => metas.filter((m) => m.name === key || m.property === key).map((m) => m.content);
  const indexable = !meta('robots').some((r) => r.includes('noindex'));
  if (inSitemap.has(url) !== indexable) fail(url, indexable ? 'indexable but not in the sitemap' : 'noindex but in the sitemap');
  if (!indexable) continue;

  const titles = [...html.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]);
  const descriptions = meta('description');
  const canonicals = tags(html, 'link').filter((l) => l.rel === 'canonical').map((l) => l.href);
  for (const [what, values] of Object.entries({ title: titles, description: descriptions, canonical: canonicals })) {
    if (values.length !== 1) fail(url, `${values.length} ${what}s`);
  }
  // Per language: a work's title is the same in both, and hreflang pairs them.
  const lang = new URL(url).pathname.split('/')[1];
  for (const [what, text] of Object.entries({ title: titles[0], description: descriptions[0] })) {
    const value = `${lang} ${text}`;
    if (seen[what].has(value)) fail(url, `same ${what} as ${seen[what].get(value)}`);
    seen[what].set(value, url);
  }
  if (canonicals[0] !== url) fail(url, `canonical is ${canonicals[0]}`);
  if (meta('og:url')[0] !== url) fail(url, `og:url is ${meta('og:url')[0]}`);
  const image = meta('og:image')[0];
  if (!image || !existsSync(fileOf(image) ?? '')) fail(url, `og:image ${image} not built`);

  for (const link of tags(html, 'link').filter((l) => l.rel === 'alternate' && l.hreflang)) {
    if (!existsSync(fileOf(link.href) ?? '')) fail(url, `hreflang ${link.hreflang} → ${link.href} not built`);
  }

  const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  if (scripts.length !== 1) fail(url, `${scripts.length} JSON-LD scripts`);
  for (const [, json] of scripts) {
    let data;
    try {
      data = JSON.parse(json);
    } catch (error) {
      fail(url, `JSON-LD doesn't parse: ${error.message}`);
      continue;
    }
    if (data['@context'] !== 'https://schema.org') fail(url, 'JSON-LD without the schema.org @context');
    // A node with only an @id refers to one defined elsewhere.
    (function walk(node) {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      if (node['@id']) (Object.keys(node).length === 1 ? referenced.push({ id: node['@id'], url }) : defined.add(node['@id']));
      Object.values(node).forEach(walk);
    })(data);
  }
}

for (const { id, url } of referenced) if (!defined.has(id)) fail(url, `JSON-LD refers to ${id}, defined on no page`);

for (const [, href] of readFileSync(join(dist, 'llms.txt'), 'utf8').matchAll(/(?:\]\(|: )(https?:\/\/[^\s)]+)/g)) {
  const file = fileOf(href);
  if (file && !existsSync(file)) fail('llms.txt', `${href} not built`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`SEO: ${pages.length} pages checked`);
