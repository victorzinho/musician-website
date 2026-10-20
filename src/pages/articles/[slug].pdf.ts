import type { APIRoute, GetStaticPaths } from 'astro';
import { articles, readPdf } from '../../articles';

export const getStaticPaths = (async () =>
  (await articles()).filter((article) => article.pdf).map((article) => ({ params: { slug: article.id } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) =>
  new Response(await readPdf(params.slug!), { headers: { 'Content-Type': 'application/pdf' } });
