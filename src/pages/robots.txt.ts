import type { APIRoute } from 'astro';

/** Every crawler welcome, AI ones included; pages not to index carry `noindex` instead. */
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
