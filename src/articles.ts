import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { getCollection, type CollectionEntry } from 'astro:content';
import { languages, localize, type Lang } from './i18n';

/** An article that is a PDF: `src/content/articles/<slug>/article.pdf`, published as `/articles/<slug>.pdf`. */
const pdfFile = (slug: string) => `src/content/articles/${slug}/article.pdf`;
export const readPdf = (slug: string) => readFile(pdfFile(slug));
export const pdfPath = (slug: string) => `/articles/${slug}.pdf`;

export type Article = CollectionEntry<'articles'> & { pdf: boolean };

/** Every article, newest first. Fails the build unless each has its text in both languages, or is a PDF. */
export const articles = async (): Promise<Article[]> => {
  const texts = new Set((await getCollection('articleTexts')).map((text) => text.id));
  const all = (await getCollection('articles')).map((article) => {
    const pdf = existsSync(pdfFile(article.id));
    const has = languages.map((l) => texts.has(`${article.id}/${l}`));
    if (pdf && has.some(Boolean)) throw new Error(`article ${article.id}: article.pdf or en.mdx and es.mdx, not both`);
    languages.forEach((l, i) => {
      if (!pdf && !has[i]) throw new Error(`article ${article.id}: no ${l}.mdx`);
    });
    return { ...article, pdf };
  });
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
};

/** Where an article opens: its page in `lang`, or its PDF. */
export const articleHref = (article: Article, lang: Lang) =>
  article.pdf ? pdfPath(article.id) : localize(lang, `/articles/${article.id}/`);
