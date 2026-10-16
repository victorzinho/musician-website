import { getImage } from 'astro:assets';
import { getEntry } from 'astro:content';
import { getAbsoluteLocaleUrl } from 'astro:i18n';
import type { Person } from 'schema-dts';
import photo from './assets/victor.jpg';
import { strings, type Lang } from './i18n';
import { profiles } from './site';

/** Víctor as one entity across the site: works and articles refer to this id. */
export const person = { '@id': new URL('/#person', import.meta.env.SITE).href };

/** Víctor in full, for the home and About pages: facts from the CVs, roles from the nav. */
export const personNode = async (lang: Lang): Promise<Person> => {
  const cv = (await getEntry('cv', 'cv'))!.data;
  const portrait = await getImage({ src: photo, width: 600, format: 'jpg' });
  return {
    '@type': 'Person',
    ...person,
    name: 'Víctor González',
    alternateName: cv.person.name,
    url: getAbsoluteLocaleUrl(lang, '/'),
    image: new URL(portrait.src, import.meta.env.SITE).href,
    jobTitle: Object.values(strings[lang].nav.roles),
    sameAs: profiles.map((profile) => profile.url),
    alumniOf: cv.education.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.school })),
    worksFor: cv.experience
      .filter((e) => !e.end)
      .map((e) => ({ '@type': 'Organization', name: typeof e.org === 'string' ? e.org : e.org[lang] })),
  };
};
