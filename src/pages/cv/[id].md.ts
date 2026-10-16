import type { APIRoute, GetStaticPaths } from 'astro';
import { cvMarkdown, cvPaths, loadCv, type CvKind } from '../../cv';
import type { Lang } from '../../i18n';

export const getStaticPaths = (() => cvPaths()) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { kind, lang } = props as { kind: CvKind; lang: Lang };
  return new Response(cvMarkdown(await loadCv(kind, lang)), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
