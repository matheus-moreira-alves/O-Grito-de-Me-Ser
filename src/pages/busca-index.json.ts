import type { APIRoute } from 'astro';
import { getPosts } from '../lib/posts';
import { textoPuro, formatDate, url } from '../lib/util';

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const indice = posts.map((p) => ({
    t: p.data.title,
    u: url(`escritos/${p.id}/`),
    d: formatDate(p.data.date),
    g: p.data.tags,
    x: textoPuro(p.body ?? ''),
  }));
  return new Response(JSON.stringify(indice), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
