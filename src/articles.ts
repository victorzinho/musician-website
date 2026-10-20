import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { LinkChip } from './components/LinkChips.astro';
import { languages, localize, strings, type Lang } from './i18n';

/** An article's PDF: `src/content/articles/<slug>/article.pdf`, published as `/articles/<slug>.pdf`. */
const pdfFile = (slug: string) => `src/content/articles/${slug}/article.pdf`;
export const readPdf = (slug: string) => readFile(pdfFile(slug));
export const pdfPath = (slug: string) => `/articles/${slug}.pdf`;

/** `text`: its page, from `en.mdx` and `es.mdx`; `pdf`: its `article.pdf`. */
export type Article = CollectionEntry<'articles'> & { text: boolean; pdf: boolean };

/** Every article, newest first. Fails the build unless each has its text in both languages, a PDF, or both. */
export const articles = async (): Promise<Article[]> => {
  const texts = new Set((await getCollection('articleTexts')).map((text) => text.id));
  const all = (await getCollection('articles')).map((article) => {
    const pdf = existsSync(pdfFile(article.id));
    const has = languages.map((l) => texts.has(`${article.id}/${l}`));
    const text = has.some(Boolean);
    languages.forEach((l, i) => {
      if ((text || !pdf) && !has[i]) throw new Error(`article ${article.id}: no ${l}.mdx`);
    });
    return { ...article, text, pdf };
  });
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
};

/** Where an article opens: its page in `lang`, else its PDF. */
export const articleHref = (article: Article, lang: Lang) =>
  article.text ? localize(lang, `/articles/${article.id}/`) : pdfPath(article.id);

/** Opens an article's PDF in a new tab, counted as an `article` event. */
export const pdfChip = (article: Article, lang: Lang): LinkChip => ({
  label: strings[lang].articles.pdf,
  href: pdfPath(article.id),
  title: article.data.title[lang],
  external: true,
  event: { 'data-umami-event': 'article', 'data-umami-event-file': pdfPath(article.id).split('/').pop()! },
});
