import { getRelativeLocaleUrl } from 'astro:i18n';

export const languages = ['en', 'es'] as const;
export type Lang = (typeof languages)[number];

/** Each language's regional locale: British English, Spain's Spanish. */
export const locales = { en: 'en-GB', es: 'es-ES' } satisfies Record<Lang, string>;

/** Each language's name in itself, for the language switch. */
export const languageNames = { en: 'English', es: 'Español' } satisfies Record<Lang, string>;

/** Both languages as static paths, for pages under `src/pages/[lang]/`. */
export const langPaths = () => languages.map((lang) => ({ params: { lang } }));

/** A site path without language ("/works/", "/playing/#guitar") in `lang` ("/es/works/", "/es/playing/#guitar"). */
export const localize = (lang: Lang, path: string) => {
  const [pathname, fragment] = path.split('#');
  return `${getRelativeLocaleUrl(lang, pathname)}${fragment === undefined ? '' : `#${fragment}`}`;
};

const enRoles = { composer: 'Composer', producer: 'Producer', performer: 'Performer', engineer: 'Engineer' };
const esRoles = { composer: 'Compositor', producer: 'Productor', performer: 'Intérprete', engineer: 'Ingeniero' };
const enTags = { ...enRoles, mockup: 'Mockup' };
const esTags = { ...esRoles, mockup: 'Maqueta' };

export const strings = {
  en: {
    /** Search result: `<title>` and meta description (`src/layouts/Base.astro`). */
    meta: {
      /** After the name on the home page; other pages use their own title. */
      homeTitle: 'Musician and engineer',
      description: {
        home: 'Víctor González writes concert music, produces orchestral mockups and plays guitar, alongside more than fifteen years as a software engineer.',
        works: 'Concert works by composer Víctor González for choir, orchestra, ensemble and electronics, with programme notes, scores and recordings.',
        playing: 'Víctor González on classical and electric guitar and keys, in concerts of choirs and amateur ensembles: videos, recordings and photos.',
        studio: 'Music production by Víctor González: orchestral mockups, MIDI programming, editing and mixing, with examples to listen to.',
        tech: 'Víctor González, software engineer for more than fifteen years: geographic data at xarvio (BASF), forest monitoring for FAO, and most recently geomatico.',
        articles: 'Articles by Víctor González on composing, producing, playing and software engineering.',
        about: 'Víctor González: a guitar at fourteen, software at eighteen, and composition studied while working full time. Musician and engineer CVs.',
        // TODO sprint 4: LinkedIn back in the list (src/site.ts).
        contact: 'Contact Víctor González for a new piece or a guitarist for your concert: email, YouTube, SoundCloud and GitHub.',
      },
      /** A work page: "<title> (<year>), for <forces>, <by>: <what the page has>." */
      work: { by: 'a work by composer Víctor González', note: 'programme note', score: 'score', recordings: 'recordings' },
    },
    nav: {
      label: 'Main',
      roles: enRoles,
      articles: 'Articles',
      about: 'About',
      contact: 'Contact',
    },
    theme: { toDark: 'Switch to dark theme', toLight: 'Switch to light theme' },
    home: {
      identity: 'Musician, engineer.',
      intro:
        'I write concert music, produce orchestral mockups and play guitar. For more than fifteen years I’ve done that while working as a software engineer. Somewhere along the way, the musician started teaching the engineer: time counts, and the concert starts at eight.',
      listen: 'Listen',
    },
    contact: {
      /** Closing line on About and articles. */
      closing: { text: 'Want to work together?', link: 'Let’s talk' },
    },
    works: {
      title: 'Works',
      /** Opening line above the quote; empty shows none. */
      intro: '',
      premiered: 'Premiered by',
      premieredAt: 'Premiered at',
      contact: { text: 'Looking for a new piece?', link: 'Let’s talk' },
      labels: { score: 'Score', mockup: 'Mockup', studio: 'Studio recording', newTab: '(opens in a new tab)' },
      page: {
        for: 'for',
        year: 'Year',
        duration: 'Duration',
        text: 'Text',
        premiere: 'Premiere',
        score: 'First page of the score',
        video: 'Video',
        resources: 'Beyond the score',
        download: 'Download',
      },
    },
    playing: {
      /** Opening line above the quote; empty shows none. */
      intro: '',
      contact: { text: 'Need a guitarist for your concert?', link: 'Let’s talk' },
      /** The gallery of videos and photos. */
      stage: { open: 'Open full size', close: 'Close', previous: 'Previous', next: 'Next' },
    },
    articles: {
      intro: 'The longer version of what I do and how I think about it.',
      /** Shown while there are no articles. */
      empty: 'So far, the long version fits in this sentence.',
    },
    about: {
      /** Under the name at the top of the page. */
      subtitle: 'for musician and engineer',
      cvs: 'Or take a CV with you:',
    },
    /** CV section titles and labels (src/cv.ts). */
    cv: {
      title: { engineer: 'Engineer CV', musician: 'Musician CV' },
      experience: 'Experience',
      composition: 'Works',
      production: 'Production',
      performing: 'Performing',
      engineering: 'Software engineering',
      projects: 'Projects',
      education: 'Education',
      skills: 'Skills',
      languages: 'Languages',
      thesis: 'Thesis',
      /** A work with a live recording but no premiere. */
      recordedLive: 'Recorded performance',
      stack: 'Stack',
      present: 'present',
    },
    quote: { translatedFrom: { en: 'Translated from English', es: 'Translated from Spanish', ca: 'Translated from Catalan' } },
    tags: enTags,
    player: {
      excerpt: 'Excerpt',
      play: 'Play',
      playExcerpt: 'Play excerpt',
      pause: 'Pause',
      position: 'Position',
      restart: 'Play from the start',
    },
    construction: {
      title: 'Tacet',
      text: 'This page is counting bars of rest. The music is written; the engraving isn’t.',
      back: 'Back to the home page',
      figure: 'A staff with a 42-bar rest under a fermata.',
    },
  },
  es: {
    meta: {
      homeTitle: 'Músico e ingeniero',
      description: {
        home: 'Víctor González compone música de concierto, produce maquetas orquestales y toca la guitarra, junto a más de quince años como ingeniero de software.',
        works: 'Obras de concierto del compositor Víctor González para coro, orquesta, ensemble y electrónica, con notas al programa, partituras y grabaciones.',
        playing: 'Víctor González a la guitarra clásica y eléctrica y a los teclados, en conciertos de coros y agrupaciones no profesionales: vídeos, grabaciones y fotos.',
        studio: 'Producción musical de Víctor González: maquetas orquestales, programación MIDI, edición y mezcla, con ejemplos para escuchar.',
        tech: 'Víctor González, ingeniero de software desde hace más de quince años: datos geográficos en xarvio (BASF), monitorización forestal para la FAO y después geomatico.',
        articles: 'Artículos de Víctor González sobre composición, producción, interpretación e ingeniería de software.',
        about: 'Víctor González: una guitarra a los catorce, el software a los dieciocho y composición estudiada trabajando a jornada completa. CV de músico e ingeniero.',
        // TODO sprint 4: LinkedIn back in the list (src/site.ts).
        contact: 'Contacta con Víctor González para una obra nueva o un guitarrista para tu concierto: correo, YouTube, SoundCloud y GitHub.',
      },
      work: { by: 'obra del compositor Víctor González', note: 'notas al programa', score: 'partitura', recordings: 'grabaciones' },
    },
    nav: {
      label: 'Principal',
      roles: esRoles,
      articles: 'Artículos',
      about: 'Sobre mí',
      contact: 'Contacto',
    },
    theme: { toDark: 'Cambiar al tema oscuro', toLight: 'Cambiar al tema claro' },
    home: {
      identity: 'Músico, ingeniero.',
      intro:
        'Compongo música de concierto, produzco maquetas orquestales y toco la guitarra. Llevo más de quince años haciéndolo a la vez que trabajo como ingeniero de software. En algún momento de ese camino, el músico empezó a enseñar al ingeniero: el tiempo cuenta y el concierto empieza a las ocho.',
      listen: 'Escucha',
    },
    contact: {
      closing: { text: '¿Trabajamos juntos?', link: 'Hablemos' },
    },
    works: {
      title: 'Obras',
      intro: '',
      premiered: 'Estreno:',
      premieredAt: 'Estreno:',
      contact: { text: '¿Buscas una obra nueva?', link: 'Hablemos' },
      labels: { score: 'Partitura', mockup: 'Maqueta', studio: 'Grabación de estudio', newTab: '(se abre en una pestaña nueva)' },
      page: {
        for: 'para',
        year: 'Año',
        duration: 'Duración',
        text: 'Texto',
        premiere: 'Estreno',
        score: 'Primera página de la partitura',
        video: 'Vídeo',
        resources: 'Más allá de la partitura',
        download: 'Descargar',
      },
    },
    playing: {
      intro: '',
      contact: { text: '¿Necesitas un guitarrista para tu concierto?', link: 'Hablemos' },
      stage: { open: 'Ver a tamaño completo', close: 'Cerrar', previous: 'Anterior', next: 'Siguiente' },
    },
    articles: {
      intro: 'La versión larga de lo que hago y de cómo lo pienso.',
      empty: 'De momento, la versión larga cabe en esta frase.',
    },
    about: {
      subtitle: 'para músico e ingeniero',
      cvs: 'O llévate un CV:',
    },
    cv: {
      title: { engineer: 'CV de ingeniero', musician: 'CV de músico' },
      experience: 'Experiencia',
      composition: 'Obras',
      production: 'Producción',
      performing: 'Interpretación',
      engineering: 'Ingeniería de software',
      projects: 'Proyectos',
      education: 'Formación',
      skills: 'Competencias',
      languages: 'Idiomas',
      thesis: 'Trabajo final',
      recordedLive: 'Grabación en directo',
      stack: 'Tecnologías',
      present: 'actualidad',
    },
    quote: { translatedFrom: { en: 'Traducido del inglés', es: 'Traducido del español', ca: 'Traducido del catalán' } },
    tags: esTags,
    player: {
      excerpt: 'Fragmento',
      play: 'Reproducir',
      playExcerpt: 'Escuchar fragmento',
      pause: 'Pausa',
      position: 'Posición',
      restart: 'Volver a empezar',
    },
    construction: {
      title: 'Tacet',
      text: 'Esta página está contando compases de espera. La música está escrita; falta pasarla a limpio.',
      back: 'Volver a la página principal',
      figure: 'Un pentagrama con un silencio de 42 compases bajo un calderón.',
    },
  },
} as const;

/** Each page's closing sentence: an ambiguous reference, as at the end of a score. */
export const codas = {
  home: 'Let the great adventure now begin.',
  works: 'Convinced our voices can\'t be heard...',
  studio: 'By a candle stands a mirror.',
  playing: 'All our friends are watching us.',
  tech: 'Their design, shifting frame by frame.',
  articles: 'Thought I\'d something more to say.',
  about: '...watches and thoughtfully smiles.',
  contact: 'Let us cling together.',
};
