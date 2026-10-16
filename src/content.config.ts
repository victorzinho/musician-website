import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { roles, tags, type Role, type Tag } from './site';
import { youtubeId } from './youtube';

const translated = z.strictObject({ en: z.string().min(1), es: z.string().min(1) });

const position = z.number().int().positive();

/** A proper name, or one per language. */
const name = z.union([z.string().min(1), translated]);
/** "2023-10" (month) or 2023 (year). */
const date = z.union([z.string().regex(/^\d{4}-\d{2}$/), z.number().int()]).transform(String);

/** The only players there are: YouTube embeds and SoundCloud tracks. */
const isYoutube = (url: string) => youtubeId(url) !== undefined;
/** The track's page, which is also its link: the widget plays it, `api.soundcloud.com` URLs don't open in a browser. */
const isSoundcloud = (url: string) => new URL(url).hostname.replace(/^www\./, '') === 'soundcloud.com';
const youtube = z.url().refine(isYoutube, 'a youtube.com/watch?v= or youtu.be URL');
const soundcloud = z.url().refine(isSoundcloud, 'a soundcloud.com track page, not api.soundcloud.com');

const recording = z
  .strictObject({
    url: z
      .url()
      .refine((url) => isYoutube(url) || isSoundcloud(url), 'a YouTube video or a soundcloud.com track page')
      .optional(),
    file: z.string().min(1).optional(),
    /** `studio`: Víctor's own produced recording, neither live nor a mockup. */
    kind: z.enum(['performance', 'mockup', 'studio']),
    /** Without title and description, a mockup or studio recording shows its kind as title. */
    title: translated.optional(),
    description: translated.optional(),
    /** The short clip played inline in lists; must be a local file. */
    excerpt: z.boolean().optional(),
  })
  .refine((r) => (r.url === undefined) !== (r.file === undefined), 'exactly one of url or file')
  .refine((r) => !r.excerpt || r.file !== undefined, 'an excerpt must be a file');

const works = defineCollection({
  loader: glob({
    base: './src/content/works',
    pattern: '*/work.yaml',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.strictObject({
    title: z.string().min(1),
    year: z.number().int(),
    forces: translated,
    /** Minutes, rounded up. */
    duration: z.number().int().positive(),
    license: z.enum(['CC-BY-SA-4.0']),
    text: z.strictObject({ author: z.string().min(1), title: z.string().min(1) }).optional(),
    premiere: z
      .strictObject({
        /** A day (2022-01-01) or, when that's all that's known, a month ("2024-06"). */
        date: z.union([z.date(), z.string().regex(/^\d{4}-\d{2}$/)]),
        /** Omitted when they can't be named. */
        performers: z.string().min(1).optional(),
        venue: z.string().min(1).optional(),
      })
      .refine((p) => p.performers || p.venue, 'performers or venue')
      .optional(),
    recordings: z
      .array(recording)
      .refine((rs) => rs.filter((r) => r.excerpt).length <= 1, 'at most one excerpt')
      .optional(),
    /** Other files of the work: performance materials, sketches, notes. */
    resources: z
      .array(
        z.strictObject({
          file: z.string().min(1),
          name: translated,
          description: translated.optional(),
        }),
      )
      .optional(),
  }),
});

/** Work notes: `<slug>/en.md` and `<slug>/es.md`, with ids `<slug>/<lang>`. Every work needs both. */
const notes = defineCollection({
  loader: glob({ base: './src/content/works', pattern: '*/{en,es}.md', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.strictObject({}),
});

/** Home excerpts, in the file's order: a single entry, `homeListen`. `audio` is relative to `src/content/`. */
const homeListen = defineCollection({
  loader: file('./src/content/home-listen.yaml', { parser: (text) => ({ homeListen: parse(text) }) }),
  schema: z.array(
    z.strictObject({
      title: z.string().min(1),
      context: translated,
      audio: z.string().regex(/\.mp3$/),
      href: z.string().startsWith('/'),
      tags: z.array(z.enum(Object.keys(tags) as [Tag, ...Tag[]])).min(1),
    }),
  ),
});

/** An item's part of its link, `/playing/#<group>-<slug>`: its image's file name, else its SoundCloud track's name. */
const mediaSlug = (raw: Record<string, unknown>) => {
  const path = raw.photo ?? raw.thumbnail ?? (typeof raw.audio === 'string' ? new URL(raw.audio).pathname : '');
  return String(path).split('/').filter(Boolean).pop()?.replace(/\.[^.]+$/, '') ?? '';
};
const slug = z.string().regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and hyphens: rename the file, or set `slug`');

/** Groups on `/playing`: `src/content/playing/<group>/playing.yaml`, id `<group>`; images relative to it. */
const playing = defineCollection({
  loader: glob({
    base: './src/content/playing',
    pattern: '*/playing.yaml',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z.strictObject({
      position,
      name,
      about: translated.optional(),
      /** Required where the CV lists the group (`performing` in `cv.yaml`). */
      role: translated.optional(),
      start: date,
      /** None: ongoing. */
      end: date.optional(),
      /** Bullets on `/playing` and on the CV. */
      highlights: z.array(translated).optional(),
      /** Best first: the first is the one on stage. `slug`, unless given, comes from the files (`mediaSlug`). */
      media: z
        .array(
          z.preprocess(
            (raw) => (raw && typeof raw === 'object' ? { slug: mediaSlug(raw as Record<string, unknown>), ...raw } : raw),
            z.union([
              z.strictObject({ slug, video: youtube, thumbnail: image(), caption: translated }),
              z.strictObject({ slug, audio: soundcloud, thumbnail: image().optional(), caption: translated }),
              z.strictObject({ slug, photo: image(), caption: translated }),
            ]),
          ),
        )
        .min(1)
        .refine((media) => new Set(media.map((m) => m.slug)).size === media.length, 'two items with the same slug'),
    }),
});

/** Group text, optional: `<group>/en.md` and `<group>/es.md`, ids `<group>/<lang>`; both or neither. */
const playingTexts = defineCollection({
  loader: glob({ base: './src/content/playing', pattern: '*/{en,es}.md', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.strictObject({}),
});

/** Quotes from people Víctor worked with, at most one per section; shown in the original language or translated. */
const quotes = defineCollection({
  loader: file('./src/content/quotes.yaml'),
  schema: z.strictObject({
    id: z.string().min(1),
    lang: z.enum(['en', 'es', 'ca']),
    text: z.string().min(1),
    translations: z.strictObject({ en: z.string().min(1), es: z.string().min(1) }).partial(),
    name: z.string().min(1),
    role: translated,
  }),
});

/** About page text: `src/content/about/<part>-<lang>.md`, ids `<part>/<lang>`. Every part needs both languages. */
const about = defineCollection({
  loader: glob({
    base: './src/content/about',
    pattern: '*-{en,es}.md',
    generateId: ({ entry }) => entry.replace(/-(en|es)\.md$/, '/$1'),
  }),
  schema: z.strictObject({}),
});

/** Facts under each About movement title, keyed by role: a CV fact by its id, a work's premiere, or text. */
const aboutNotes = defineCollection({
  loader: file('./src/content/about/facts.yaml'),
  schema: z.array(
    z.union([z.strictObject({ cv: z.string().min(1) }), z.strictObject({ work: z.string().min(1) }), translated]),
  ),
});

/** Articles: `src/content/articles/<slug>/article.yaml`, id `<slug>`; text in `en.mdx` and `es.mdx`, both required. */
const articles = defineCollection({
  loader: glob({
    base: './src/content/articles',
    pattern: '*/article.yaml',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.strictObject({
    title: translated,
    /** One sentence, shown under the title in the index. */
    description: translated,
    date: z.coerce.date(),
    /** The sections it belongs to, as chips in the index and at the top and end of the article. */
    roles: z.array(z.enum(Object.keys(roles) as [Role, ...Role[]])).min(1),
  }),
});

/** Article text: MDX, so it can use the components in `src/components/` (Figure, Player, YouTube). */
const articleTexts = defineCollection({
  loader: glob({ base: './src/content/articles', pattern: '*/{en,es}.mdx', generateId: ({ entry }) => entry.replace(/\.mdx$/, '') }),
  schema: z.strictObject({}),
});

const cvKind = z.enum(['engineer', 'musician']);
const cvs = z.array(cvKind).min(1);
const highlight = translated.extend({ cvs: cvs.optional() });
/** Only where something cites the fact: About (`src/content/about/facts.yaml`). */
const id = z.string().min(1).optional();
const entry = z.strictObject({
  id,
  org: name,
  about: translated.optional(),
  role: translated,
  start: date,
  /** None: ongoing. */
  end: date.optional(),
  stack: z.array(z.string().min(1)).optional(),
  /** Without `cvs`, in every CV the entry is in. */
  highlights: z.array(highlight).optional(),
});
const perCv = <T extends z.ZodType>(value: T) => z.strictObject({ engineer: value, musician: value });

/** The CVs' facts: a single entry, `cv`. Entries and highlights go in the CVs listed in their `cvs`. */
const cv = defineCollection({
  loader: file('./src/content/cv.yaml', { parser: (text) => ({ cv: parse(text) }) }),
  schema: z.strictObject({
    person: z.strictObject({
      name: z.string().min(1),
      email: z.email(),
      location: translated,
      links: z.record(z.string(), z.url()),
    }),
    headline: perCv(translated),
    summary: perCv(translated),
    experience: z.array(
      entry.extend({
        id: z.string().min(1),
        cvs,
        /** Clients under a freelance entry; in every CV the entry is in. */
        clients: z.array(entry).optional(),
      }),
    ),
    education: z.array(
      z.strictObject({
        id,
        cvs,
        degree: translated,
        school: z.string().min(1),
        end: z.number().int(),
        /** Without `cvs`, in every CV the degree is in. */
        thesis: translated.extend({ cvs: cvs.optional() }).optional(),
      }),
    ),
    works: z.array(z.string().min(1)),
    production: z.array(entry),
    /** Musician CV only: groups on `/playing`, by folder in `src/content/playing/`, in order. */
    performing: z.array(z.string().min(1)),
    projects: z.array(translated.extend({ cvs, name: z.string().min(1), url: z.url().nullish() })),
    skills: perCv(z.array(translated.extend({ items: z.array(name).min(1) }))),
    languages: z.array(translated.extend({ level: translated })),
  }),
});

export const collections = {
  works,
  notes,
  about,
  aboutNotes,
  articles,
  articleTexts,
  homeListen,
  quotes,
  playing,
  playingTexts,
  cv,
};
