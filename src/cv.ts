import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { languages, strings, type Lang } from './i18n';
import { roles, type Role } from './site';
import { performance } from './works';

export const cvKinds = ['engineer', 'musician'] as const;
export type CvKind = (typeof cvKinds)[number];

type Data = CollectionEntry<'cv'>['data'];
type Source = Data['production'][number] & { cvs?: CvKind[]; clients?: Data['production'] };
type Name = string | { en: string; es: string };

/** One job, work or degree, ready to render. */
export type CvEntry = {
  title: string;
  /** Where the title links to: the work's page. */
  url?: string;
  about?: string;
  role?: string;
  dates: string;
  bullets: string[];
  stack?: string[];
  children?: CvEntry[];
};

/** A section is a list of entries, or lines with an optional label ("Backend: Python, Django"). */
export type CvSection = { title: string; /** The site section the title links to. */ url?: string } & (
  | { entries: CvEntry[] }
  | { lines: { label?: string; text: string; url?: string }[] }
);

export type Cv = {
  kind: CvKind;
  lang: Lang;
  name: string;
  /** The site's home page, in the CV's language; the name links to it. */
  home: string;
  headline: string;
  summary: string;
  /** Lines of contact details: where and how to reach, then the profiles. */
  contact: { text: string; url?: string }[][];
  sections: CvSection[];
};

/** Years only: "2011–2022", "2023–" while ongoing, "2026" for a single year; none without `start`. */
export const yearSpan = (start?: string, end?: string) => {
  if (!start) return undefined;
  const [from, to] = [start, end].map((date) => date?.slice(0, 4));
  return from === to ? from : `${from}–${to ?? ''}`;
};

/** Every CV as a static path: `engineer-en`, `engineer-es`, `musician-en`, `musician-es`. */
export const cvPaths = () =>
  cvKinds.flatMap((kind) => languages.map((lang) => ({ params: { id: `${kind}-${lang}` }, props: { kind, lang } })));

/** The links each CV shows, in order. */
// TODO sprint 4: 'linkedin' back in both (engineer after 'site', musician last); rerun scripts/cv-pdfs.mjs.
const links: Record<CvKind, string[]> = { engineer: ['site', 'github'], musician: ['site', 'youtube'] };

export const loadCv = async (kind: CvKind, lang: Lang): Promise<Cv> => {
  const data = (await getEntry('cv', 'cv'))!.data;
  const { person } = data;
  const t = strings[lang].cv;
  const text = (name: Name) => (typeof name === 'string' ? name : name[lang]);
  const inCv = (item: { cvs?: CvKind[] }) => !item.cvs || item.cvs.includes(kind);

  const date = (value: string) => {
    if (!value.includes('-')) return value;
    const [year, month] = value.split('-').map(Number);
    return new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric', timeZone: 'UTC' })
      .format(Date.UTC(year, month - 1))
      .replace('.', '');
  };
  const dates = (start: string, end?: string) =>
    start === end ? date(start) : `${date(start)} – ${end ? date(end) : t.present}`;

  const entry = (source: Source): CvEntry => ({
    title: text(source.org),
    about: source.about?.[lang],
    role: source.role[lang],
    dates: dates(source.start, source.end),
    bullets: (source.highlights ?? []).filter(inCv).map((h) => h[lang]),
    stack: kind === 'engineer' ? source.stack : undefined,
    children: source.clients?.map(entry),
  });

  const experience = data.experience.filter(inCv).map(entry);
  const projects = {
    title: t.projects,
    lines: data.projects.filter(inCv).map((p) => ({ label: p.name, text: p[lang], url: p.url ?? undefined })),
  };
  const education = {
    title: t.education,
    entries: data.education.filter(inCv).map((e) => ({
      title: e.degree[lang],
      role: e.school,
      dates: String(e.end),
      bullets: e.thesis && inCv(e.thesis) ? [`${t.thesis}: ${e.thesis[lang]}`] : [],
    })),
  };
  const skills = {
    title: t.skills,
    lines: [
      ...data.skills[kind].map((s) => ({ label: s[lang], text: s.items.map(text).join(', ') })),
      { label: t.languages, text: data.languages.map((l) => `${l[lang]} (${l.level[lang]})`).join(', ') },
    ],
  };

  /** A section of the site, in this CV's language. */
  const section = (role: Role) => `${person.links.site}/${lang}${roles[role]}`;
  /** Without a premiere, what kind of recording there is. */
  const recording = (work: CollectionEntry<'works'>) => {
    const kind = work.data.recordings?.[0]?.kind;
    return kind && (kind === 'performance' ? t.recordedLive : strings[lang].works.labels[kind]);
  };
  const groups = await getCollection('playing');
  const performing = data.performing.map((id): Source => {
    const group = groups.find((g) => g.id === id)?.data;
    if (!group) throw new Error(`src/content/cv.yaml: no group ${id} in src/content/playing/`);
    if (!group.role || !group.start) throw new Error(`src/content/playing/${id}/playing.yaml: no role or start, which the CV needs`);
    return { org: group.name, about: group.about, role: group.role, start: group.start, end: group.end, highlights: group.highlights };
  });
  const catalogue = await getCollection('works');
  for (const id of data.works) {
    if (!catalogue.some((work) => work.id === id)) throw new Error(`src/content/cv.yaml: no work ${id}`);
  }
  const works = catalogue
    .filter((work) => data.works.includes(work.id))
    .sort((a, b) => b.data.year - a.data.year || a.data.title.localeCompare(b.data.title));
  const sections: CvSection[] =
    kind === 'engineer'
      ? [{ title: t.experience, entries: experience }, projects, education, skills]
      : [
          {
            title: t.composition,
            url: section('composer'),
            entries: works.map((work) => ({
              title: work.data.title,
              url: `${person.links.site}/${lang}/works/${work.id}/`,
              about: `${work.data.forces[lang]} (${work.data.duration}')`,
              dates: String(work.data.year),
              bullets: [performance(work, lang) ?? recording(work)].filter((p): p is string => !!p),
            })),
          },
          { title: t.production, url: section('producer'), entries: data.production.map(entry) },
          { title: t.performing, url: section('performer'), entries: performing.map(entry) },
          { title: t.engineering, url: section('engineer'), entries: experience },
          education,
          projects,
          skills,
        ];

  const url = (key: string) => (key === 'site' ? `${person.links.site}/${lang}/` : person.links[key]);
  return {
    kind,
    lang,
    name: person.name,
    home: url('site'),
    headline: data.headline[kind][lang],
    summary: data.summary[kind][lang],
    contact: [
      [{ text: person.location[lang] }, { text: person.email, url: `mailto:${person.email}` }],
      links[kind].map((key) => ({ text: url(key).replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''), url: url(key) })),
    ],
    sections,
  };
};

/** The CV as Markdown: the plain-text version, for agents and application forms. */
export const cvMarkdown = (cv: Cv) => {
  const line = (l: { label?: string; text: string; url?: string }) =>
    `- ${l.label ? `**${l.label}**: ` : ''}${l.text}${l.url ? ` (${l.url})` : ''}`;
  const entry = (e: CvEntry, depth: number): string[] => [
    `${'#'.repeat(depth)} ${e.title}${e.about ? ` · ${e.about}` : ''}`,
    ...(e.url ? ['', e.url] : []),
    '',
    [e.role, e.dates].filter(Boolean).join(' · '),
    '',
    ...e.bullets.map((b) => `- ${b}`),
    ...(e.stack ? [`- ${strings[cv.lang].cv.stack}: ${e.stack.join(', ')}`] : []),
    ...(e.bullets.length || e.stack ? [''] : []),
    ...(e.children ?? []).flatMap((c) => entry(c, depth + 1)),
  ];
  return [
    `# ${cv.name}`,
    '',
    cv.headline,
    '',
    ...cv.contact.map((line) => `${line.map((c) => c.text).join(' · ')}  `),
    '',
    cv.summary,
    '',
    ...cv.sections.flatMap((s) => [
      `## ${s.title}`,
      '',
      ...(s.url ? [s.url, ''] : []),
      ...('entries' in s ? s.entries.flatMap((e) => entry(e, 3)) : [...s.lines.map(line), '']),
    ]),
  ].join('\n');
};
