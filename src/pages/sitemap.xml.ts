import type { APIRoute } from 'astro';
import { getPosts, porTag } from '../lib/posts';
import { url } from '../lib/util';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  const abs = (c: string) => new URL(url(c), site).href;
  const fixas = ['', 'arquivo/', 'busca/', 'sobre/', 'tags/'].map((c) => ({ loc: abs(c) }));
  const tags = [...porTag(posts).keys()].map((t) => ({ loc: abs(`tags/${t}/`) }));
  const textos = posts.map((p) => ({ loc: abs(`escritos/${p.id}/`), lastmod: (p.data.updated ?? p.data.date).toISOString().slice(0, 10) }));
  const itens = [...fixas, ...tags, ...textos]
    .map((i) => `  <url><loc>${i.loc}</loc>${'lastmod' in i ? `<lastmod>${i.lastmod}</lastmod>` : ''}</url>`)
    .join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${itens}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
