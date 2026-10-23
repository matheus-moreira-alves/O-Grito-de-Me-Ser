// Testes do acervo migrado. Rode com: npm test   (ou: node --test tests/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerFeed, textoVisivel, parseHtml } from '../scripts/import-blogger.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const feed = lerFeed(readFileSync(join(RAIZ, 'backup/blogger/feed.atom'), 'utf8'));
const dirs = { pub: join(RAIZ, 'src/content/escritos'), nao: join(RAIZ, 'conteudo-nao-publicado') };

function ler(dir) {
  return readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => {
    const txt = readFileSync(join(dir, f), 'utf8');
    const m = txt.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    assert.ok(m, `front matter inválido em ${f}`);
    const fm = {};
    for (const l of m[1].split('\n')) { const i = l.indexOf(': '); if (i > 0) fm[l.slice(0, i)] = l.slice(i + 2); }
    const j = (k) => (fm[k] === undefined ? undefined : JSON.parse(fm[k]));
    return { f, corpo: m[2], fm, titulo: j('title'), slug: j('slug'), id: j('bloggerId'), status: j('bloggerStatus'), tipo: j('bloggerType'), draft: fm.draft === 'true', tags: j('tags') };
  });
}
const pub = ler(dirs.pub).filter((a) => a.id);   // só os importados (têm bloggerId)
const nao = ler(dirs.nao);
const porId = (lista) => new Map(lista.map((a) => [a.id, a]));

test('inventário: número de arquivos bate com o feed', () => {
  const live = feed.filter((e) => e.tipo === 'POST' && e.status === 'LIVE');
  const outros = feed.length - live.length;
  assert.equal(feed.length, 33);
  assert.equal(pub.length, live.length, 'publicados');
  assert.equal(nao.length, outros, 'rascunhos + páginas');
  assert.equal(pub.length + nao.length, feed.length);
});

test('rascunhos e páginas NÃO estão no conteúdo publicado', () => {
  for (const a of pub) { assert.equal(a.status, 'LIVE', a.f); assert.equal(a.tipo, 'POST', a.f); assert.equal(a.draft, false, a.f); }
  const idsPub = new Set(pub.map((a) => a.id));
  for (const e of feed.filter((e) => e.status !== 'LIVE' || e.tipo !== 'POST')) assert.ok(!idsPub.has(e.id), `rascunho publicado: ${e.titulo || e.id}`);
  for (const a of nao) assert.equal(a.draft, true, a.f);
});

test('título, data e marcadores preservados', () => {
  const mapa = porId([...pub, ...nao]);
  for (const e of feed) {
    const a = mapa.get(e.id);
    assert.ok(a, `faltando: ${e.titulo || e.id}`);
    assert.equal(a.titulo, e.titulo, a.f);
    const d = a.fm.date.match(/^(\S+)/)[1];
    assert.ok(Math.abs(new Date(d) - new Date(e.publicado)) < 1000, `data de ${a.f}`);
    assert.deepEqual(a.tags, e.tags, `tags de ${a.f}`);
  }
});

test('TEXTO preservado: texto visível idêntico ao do Blogger, em todas as entradas', () => {
  const mapa = porId([...pub, ...nao]);
  for (const e of feed) {
    const a = mapa.get(e.id);
    assert.equal(textoVisivel(a.corpo), textoVisivel(e.html), `texto alterado em: ${e.titulo || e.id}`);
  }
});

test('slugs únicos e iguais ao nome do arquivo; sem lixo de formatação', () => {
  const slugs = pub.map((a) => a.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const a of pub) {
    assert.equal(a.f, `${a.slug}.md`);
    assert.ok(!/\sstyle=|\sdata-|<span|<div|<font/.test(a.corpo), `HTML sujo em ${a.f}`);
    const abre = (a.corpo.match(/<(p|em|strong|blockquote|ul|li|a|h\d)[\s>]/g) || []).length;
    const fecha = (a.corpo.match(/<\/(p|em|strong|blockquote|ul|li|a|h\d)>/g) || []).length;
    assert.equal(abre, fecha, `tags desbalanceadas em ${a.f}`);
    assert.ok(parseHtml(a.corpo).filhos.length > 0);
  }
});

test('URL antiga guardada e mapa de redirecionamento completo', () => {
  const mapa = JSON.parse(readFileSync(join(RAIZ, 'migracao/mapa-urls.json'), 'utf8'));
  for (const e of feed.filter((e) => e.tipo === 'POST' && e.status === 'LIVE')) {
    const a = pub.find((x) => x.id === e.id);
    const txt = readFileSync(join(dirs.pub, a.f), 'utf8');
    if (e.arquivo) {
      assert.ok(txt.includes(`originalUrl: "https://ogritodemeser.blogspot.com${e.arquivo}"`), `originalUrl em ${a.f}`);
      assert.ok(mapa.some((m) => m.antiga === e.arquivo && m.nova === `/escritos/${a.slug}/`), `mapa de ${e.arquivo}`);
    }
  }
});

test('imagens: aviso se ainda dependem do Blogger', { todo: false }, () => {
  const remotas = pub.filter((a) => /<img[^>]+src="https?:\/\/(blogger\.googleusercontent|\d\.bp\.blogspot)/.test(a.corpo));
  const baixadas = pub.filter((a) => a.corpo.includes('../../images/'));
  for (const a of baixadas) for (const m of a.corpo.matchAll(/src="\.\.\/\.\.\/images\/([^"]+)"/g)) assert.ok(existsSync(join(RAIZ, 'public/images', m[1])), `imagem ausente: ${m[1]}`);
  if (remotas.length) console.warn(`  ⚠ ${remotas.length} texto(s) publicado(s) ainda usam imagem hospedada no Blogger: ${remotas.map((a) => a.slug).join(', ')}`);
});
