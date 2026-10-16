# AGENTS.md — website

Víctor's music portfolio, `music.victorzinho.es`. Plan: `REVAMP.md`; tasks: `ROADMAP.md`.

## Stack

- Astro, static output only, deployed to GitHub Pages. Packages are pinned exactly in `package.json` and the lockfile,
  Node in `.nvmrc`; upgrades are deliberate, never incidental.
- Astro docs: `.docs/astro/src/content/docs/en/` (`npm run docs`). Only these; training-data examples for older
  majors are wrong.
- **Upgrading Astro also bumps `config.astroDocsCommit` in `package.json`** to the withastro/docs commit for that
  version.
- Official integrations only.
- Fonts (Astro Fonts API, `astro.config.mjs`): Playfair from `@fontsource-variable/playfair`; Academico (Dorico's text
  font, OFL) as `woff2` in `src/assets/fonts/academico/`. Hint zones (`BlueValues`) are patched so letters align on
  screen: cap height starts at 720, not 724 (all styles); x-height at 462, not 468 (Regular, Italic).
- Layout and shared parts: `src/layouts/Base.astro`; interface strings (both languages): `src/i18n.ts`; contact
  details, profile icons (Simple Icons, CC0) and the four sections: `src/site.ts`. Pages not built yet render
  `src/components/UnderConstruction.astro`.
- Favicon: `public/favicon.svg` (a boxed V, the same in both themes); `node scripts/favicons.mjs`
  renders `favicon.ico` and `apple-touch-icon.png` from it.
- Search and agents: titles, descriptions, canonical, Open Graph and JSON-LD (`src/structured-data.ts`, typed with
  `schema-dts`) in `src/layouts/Base.astro`; `robots.txt` and `llms.txt` are endpoints in `src/pages/`. Pages under
  construction are listed in `unfinished` (`src/site.ts`): `noindex`, out of the sitemap. `npm run verify` checks the
  built result (`scripts/check-seo.mjs`).
- Analytics: Umami Cloud script in `src/layouts/Base.astro`, counting on the live domain only. Link clicks as events:
  `data-umami-event` (`cv` with `file`, `score` with `work`).
- Link preview image (Open Graph): `src/pages/og/[lang].astro`, screenshotted to `public/og-<lang>.jpg` by
  `node scripts/og-image.mjs`.
- Audio: `src/components/Player.astro` plays a local file or a SoundCloud track (Widget API, loaded on first play)
  behind the same controls (`src/player.ts`); one plays at a time, excerpt chips included. YouTube recordings are
  embedded from `youtube-nocookie.com`. Some (copyright-claimed) don't play when the dev server is opened by IP;
  open it as `localhost` (SSH tunnel).

## Content

- English and Spanish under `/en/` and `/es/`, same paths in both, with Astro's i18n routing (`astro.config.mjs`); `/`
  redirects to `/en/`; English is each page's `x-default`. Pages live in `src/pages/[lang]/`; internal links take a
  path without language through `localize` (`src/i18n.ts`). Scores and CVs have no language prefix.
- Works: `src/content/works/<slug>/` with `work.yaml` (schema: `src/content.config.ts`), one Markdown note per language
  (`en.md`, `es.md`), `score.pdf` (published as `/works/<slug>-score.pdf`, `src/scores.ts`) and any other files of the
  work. `score-preview.png` is exported from Sibelius at 600 dpi.
- Metadata in YAML, text in Markdown; no frontmatter.
- About: `src/content/about/<part>-{en,es}.md` (`intro` and the four roles, all required); facts per movement in
  `src/content/about/facts.yaml`, citing `cv.yaml` ids and works' premieres (`src/about.ts`). `cv.yaml` states facts only, never
  where the site shows them.
- CVs (engineer, musician): facts in `src/content/cv.yaml`, assembled per CV and language by `src/cv.ts`. The
  musician CV lists the works in `works` (`cv.yaml`), with their facts from each `work.yaml`; a new work stays off it
  until listed. `/cv/<cv>-<lang>/` is the A4 page, `/cv/<cv>-<lang>.md` the plain-text version; `node scripts/cv-pdfs.mjs` prints
  the pages to `public/cv/` with the headless Chromium at `$CHROMIUM_HEADLESS`. About links them through `cvs` in
  `src/site.ts`.
- Generated and committed (CV PDFs, link preview images): `generated.json` holds the hash of each one's
  source; `npm run verify` fails when one is out of date and names the script to rerun (`scripts/generated.mjs`).
- Articles: `src/content/articles/<slug>/` with `article.yaml` and `en.mdx`, `es.mdx` (both required). MDX imports
  `Figure`, `Player` and `YouTube` from `src/components/`; `parked/articles/mixing-like-a-rehearsal` uses them all.
- Home excerpts: `src/content/home-listen.yaml`, in the file's order (schema: `src/content.config.ts`); tags lead to
  sections via `tags` in `src/site.ts`.
- `parked/`: content not on the site and not schema-checked. Works keep the same layout, any file may be missing;
  publishing one moves it to `src/content/works/`.
  `parked/engineering/micsc-thesis.pdf`: Víctor's engineering thesis (MICSc, CFD on PETSc, ITACA, 2011).
- Performer `/playing`: one group per folder, `src/content/playing/<group>/`, with `playing.yaml` (its facts, media
  best first), optional prose in `en.md` and `es.md` (both or neither), and its images. The musician CV lists the
  groups in `performing` (`cv.yaml`), with their facts from each `playing.yaml`. `/playing/#<group>` links to a
  group, `/playing/#<group>-<slug>` to one of its items; the slug is the image's file name, or the SoundCloud track's.
- `interviews/` (gitignored): Víctor's answers to content questions, one file per session; source for the site's text.
- Recordings live on YouTube/SoundCloud; only small files (scores, images, short excerpts) go in the repo.
