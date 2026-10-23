import { getCollection, type CollectionEntry } from 'astro:content';
import { slugTag } from './util';

export type Post = CollectionEntry<'escritos'>;

/** Textos publicados (draft: false), do mais novo ao mais antigo. */
export async function getPosts(): Promise<Post[]> {
  const todos = await getCollection('escritos', ({ data }) => !data.draft);
  return todos.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function porTag(posts: Post[]) {
  const mapa = new Map<string, { nome: string; posts: Post[] }>();
  for (const p of posts) {
    for (const nome of p.data.tags) {
      const chave = slugTag(nome);
      if (!chave) continue;
      const atual = mapa.get(chave) ?? { nome, posts: [] };
      atual.posts.push(p);
      mapa.set(chave, atual);
    }
  }
  return mapa;
}
