import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { hasScore, readScore } from '../../scores';

export const getStaticPaths = (async () => {
  const works = await getCollection('works', (work) => hasScore(work.id));
  return works.map((work) => ({ params: { slug: work.id } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) =>
  new Response(await readScore(params.slug!), { headers: { 'Content-Type': 'application/pdf' } });
