import { statSync } from 'node:fs';
import type { CollectionEntry } from 'astro:content';
import { strings, type Lang } from './i18n';

type Work = CollectionEntry<'works'>;

/** Each `license` in `work.yaml`, as shown and linked. */
export const licenses = {
  'CC-BY-SA-4.0': { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
} satisfies Record<Work['data']['license'], { name: string; url: string }>;

const files = import.meta.glob<string>(
  ['/src/content/works/*/*', '!**/*.yaml', '!**/*.md', '!**/score.pdf', '!**/score-preview.png'],
  { query: '?url', import: 'default', eager: true },
);

/** The published URL of a file in the work's folder. */
export const fileUrl = (work: Work, file: string) => {
  const url = files[`/src/content/works/${work.id}/${file}`];
  if (!url) throw new Error(`${work.id}: file ${file} not found`);
  return url;
};

/** A file of the work as a download: URL, type ("MP3") and size ("7.2 MB"). */
export const download = (work: Work, file: string) => ({
  url: fileUrl(work, file),
  type: file.split('.').pop()!.toUpperCase(),
  size: `${(statSync(`src/content/works/${work.id}/${file}`).size / 1e6).toFixed(1)} MB`,
});

/** The work's excerpt file, if any, labelled "Mockup" when it comes from one. */
export const excerpt = (work: Work, lang: Lang) => {
  const recording = work.data.recordings?.find((r) => r.excerpt);
  if (!recording?.file) return undefined;
  const t = strings[lang];
  return {
    src: fileUrl(work, recording.file),
    label: recording.kind === 'mockup' ? t.works.labels.mockup : t.player.excerpt,
  };
};

/** Who premiered it, and where; only where, when the performers can't be named. */
export const performance = (work: Work, lang: Lang) => {
  const { premiere } = work.data;
  if (!premiere) return undefined;
  const t = strings[lang].works;
  return `${premiere.performers ? t.premiered : t.premieredAt} ${[premiere.performers, premiere.venue].filter(Boolean).join(', ')}`;
};
