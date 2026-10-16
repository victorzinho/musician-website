// Committed files rendered by scripts, and the hash of what each was rendered from, in `generated.json`: a script
// records its files after rendering them; `scripts/check-generated.mjs` fails on any that no longer match.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const manifest = 'generated.json';
const builtPages = (dir) =>
  readdirSync(`dist/${dir}`, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);

/** Per script, its files and their sources. The built pages (`dist/`) carry the content and the layout. */
export const scripts = {
  'scripts/cv-pdfs.mjs': () =>
    builtPages('cv').map((id) => ({ file: `public/cv/${id}.pdf`, source: `dist/cv/${id}/index.html` })),
  'scripts/og-image.mjs': () =>
    builtPages('og').map((lang) => ({ file: `public/og-${lang}.jpg`, source: `dist/og/${lang}/index.html` })),
};

const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const read = () => (existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')) : {});

/** Records the current hashes of every file `script` renders, replacing what it recorded before. */
export const record = (script) => {
  const fresh = scripts[script]();
  const others = Object.entries(read()).filter(([, entry]) => entry.script !== script);
  const entries = [...others, ...fresh.map(({ file, source }) => [file, { script, source, hash: hash(source) }])];
  entries.sort(([a], [b]) => a.localeCompare(b));
  writeFileSync(manifest, `${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`);
};

/** Each generated file whose source changed, or that was never recorded, with the script that renders it. */
export const stale = () => {
  const recorded = read();
  return Object.entries(scripts).flatMap(([script, files]) =>
    files()
      .filter(({ file, source }) => recorded[file]?.source !== source || recorded[file].hash !== hash(source))
      .map(({ file }) => ({ file, script })),
  );
};
