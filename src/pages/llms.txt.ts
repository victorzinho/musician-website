import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { articles } from '../articles';
import { strings } from '../i18n';
import { hasScore, scorePath } from '../scores';
import { cvs, email, profiles, roles, unfinished, type Role } from '../site';
import { performance } from '../works';

/** The site for language models (llmstxt.org), in English: who Víctor is, then links to what's published. */
export const GET: APIRoute = async ({ site }) => {
  const t = strings.en;
  const url = (path: string) => new URL(path, site).href;
  const intro = (await getEntry('about', 'intro/en'))!.body!.trim();

  const pages = [
    ...(Object.entries(roles) as [Role, string][]).map(([role, path]) => ({ name: t.nav.roles[role], path })),
    { name: t.nav.articles, path: '/articles/' },
    { name: t.nav.about, path: '/about/' },
    { name: t.nav.contact, path: '/contact/' },
  ].filter((page) => !unfinished.includes(page.path));
  const description = (path: string) => {
    const text = (t.meta.description as Record<string, string>)[path.slice(1, -1)];
    if (!text) throw new Error(`llms.txt: no meta.description for ${path} in src/i18n.ts`);
    return text;
  };

  const works = (await getCollection('works')).sort(
    (a, b) => b.data.year - a.data.year || a.data.title.localeCompare(b.data.title),
  );
  const work = (w: (typeof works)[number]) => {
    const { title, year, forces } = w.data;
    const details = [`${year}, for ${forces.en.toLowerCase()}.`, performance(w, 'en') && `${performance(w, 'en')}.`];
    if (hasScore(w.id)) details.push(`Score: ${url(scorePath(w.id))}`);
    return `- [${title}](${url(`/en/works/${w.id}/`)}): ${details.filter(Boolean).join(' ')}`;
  };

  const sections = {
    Pages: pages.map((page) => `- [${page.name}](${url(`/en${page.path}`)}): ${description(page.path)}`),
    Works: works.map(work),
    Articles: (await articles()).map((a) => `- [${a.data.title.en}](${url(`/en/articles/${a.id}/`)}): ${a.data.description.en}`),
    CVs: cvs.map((cv) => `- [${cv.title.en} CV](${url(cv.pdf.en.replace(/\.pdf$/, '.md'))}): plain text; PDF: ${url(cv.pdf.en)}`),
    Contact: [`- Email: ${email}`, ...profiles.map((p) => `- [${p.name}](${p.url})`)],
  };

  const text = [
    '# Víctor González',
    `> ${t.meta.description.home}`,
    intro,
    `Every page is also in Spanish, under ${url('/es/')}.`,
    ...Object.entries(sections)
      .filter(([, lines]) => lines.length > 0)
      .map(([heading, lines]) => `## ${heading}\n\n${lines.join('\n')}`),
  ].join('\n\n');

  return new Response(`${text}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
