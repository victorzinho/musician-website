import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { strings, type Lang } from './i18n';
import type { Role } from './site';
import { yearSpan } from './cv';
import { performance } from './works';

type Cv = CollectionEntry<'cv'>['data'];
type Job = Cv['production'][number];
type Degree = Cv['education'][number];

const text = (name: string | Record<Lang, string>, lang: Lang) => (typeof name === 'string' ? name : name[lang]);
const years = (job: Job) => yearSpan(job.start, job.end);

/** Every CV fact About can cite, by id: jobs and their clients, productions (undated), degrees; each as its lines. */
const cvFacts = async () => {
  const cv = (await getEntry('cv', 'cv'))!.data;
  const job = (j: Job) => (lang: Lang) => [[text(j.org, lang), j.about?.[lang], years(j)].filter(Boolean).join(', ')];
  const production = (p: Job) => (lang: Lang) => [`${p.about?.[lang] ?? ''} *${text(p.org, lang)}*`.trim()];
  const degree = (d: Degree) => (lang: Lang) => [
    `${d.degree[lang]}, ${d.school}, ${d.end}`,
    ...(d.thesis ? [`${strings[lang].cv.thesis}: *${d.thesis[lang]}*`] : []),
  ];
  const facts = new Map<string, (lang: Lang) => string[]>();
  const add = (id: string | undefined, lines: (lang: Lang) => string[]) => {
    if (!id) return;
    if (facts.has(id)) throw new Error(`src/content/cv.yaml: id ${id} used twice`);
    facts.set(id, lines);
  };
  for (const e of cv.experience) {
    add(e.id, job(e));
    for (const c of e.clients ?? []) add(c.id, job(c));
  }
  for (const p of cv.production) add(p.id, production(p));
  for (const d of cv.education) add(d.id, degree(d));
  return facts;
};

/** The facts under an About movement (`src/content/about/facts.yaml`), each a line where `*text*` is italic. */
export const aboutFacts = async (role: Role, lang: Lang) => {
  const items = (await getEntry('aboutNotes', role))?.data ?? [];
  const facts = await cvFacts();
  const works = await getCollection('works');
  return items.flatMap((item) => {
    if ('cv' in item) {
      const fact = facts.get(item.cv);
      if (!fact) throw new Error(`src/content/about/facts.yaml: no id ${item.cv} in src/content/cv.yaml`);
      return fact(lang);
    }
    if ('work' in item) {
      const work = works.find((w) => w.id === item.work);
      if (!work) throw new Error(`src/content/about/facts.yaml: no work ${item.work}`);
      const premiere = performance(work, lang);
      if (!premiere) throw new Error(`src/content/about/facts.yaml: work ${item.work} has no premiere`);
      return [premiere];
    }
    return [item[lang]];
  });
};
