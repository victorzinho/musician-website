import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

/** Perusal scores: `src/content/works/<slug>/score.pdf`, published as `/works/<slug>-score.pdf`. */
const file = (slug: string) => `src/content/works/${slug}/score.pdf`;

export const hasScore = (slug: string) => existsSync(file(slug));
export const readScore = (slug: string) => readFile(file(slug));
export const scorePath = (slug: string) => `/works/${slug}-score.pdf`;
