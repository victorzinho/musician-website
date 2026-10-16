import { getCollection, getEntry } from 'astro:content';
import { languages } from './i18n';

/** Every article, newest first. Fails the build if an article lacks its text in either language. */
export const articles = async () => {
  const all = await getCollection('articles');
  for (const article of all) {
    for (const l of languages) {
      if (!(await getEntry('articleTexts', `${article.id}/${l}`))) throw new Error(`article ${article.id}: no ${l}.mdx`);
    }
  }
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
};
