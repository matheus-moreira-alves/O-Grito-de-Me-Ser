#!/usr/bin/env node
/**
 * Importador do Blogger → arquivos Markdown (O Grito de Me Ser)
 *
 * Uso:
 *   node scripts/import-blogger.mjs [caminho/do/feed.atom] [opções]
 *
 * Opções:
 *   --baixar-imagens   baixa as imagens do Blogger para public/images/<slug>/ e
 *                      reescreve os links (precisa de internet; rode no seu computador)
 *   --blog-url URL     endereço do blog antigo (padrão: https://ogritodemeser.blogspot.com)
 *   --limpar           apaga os .md gerados antes de importar (nunca apaga outros arquivos)
 *
 * Regras:
 *  - O TEXTO nunca é editado: só o HTML é normalizado (tags de estilo e atributos de
 *    colagem saem; parágrafos, <br>, itálico, negrito, links e imagens ficam).
 *  - Publicações LIVE vão para src/content/escritos/.
 *  - Rascunhos (DRAFT) e páginas vão para conteudo-nao-publicado/ — fora do site.
 *  - Nada é inventado: campo ausente no Blogger = campo ausente no arquivo.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FUSO = 'America/Fortaleza'; // blog_time_zone do settings.csv

/* ---------- XML ---------- */
const ENT = { nbsp: '\u00a0', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", hellip: '…', mdash: '—', ndash: '–', laquo: '«', raquo: '»' };
export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (m, e) => {
    if (e[0] === '#') {
      const cp = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
    }
    return e in ENT ? ENT[e] : m;
  });
}
function campo(xml, nome) {
  const m = xml.match(new RegExp(`<${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</${nome}>`));
  return m ? decodeEntities(m[1]) : '';
}
export function lerFeed(xml) {
  const entradas = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    let e = m[1];
    const loc = e.match(/<blogger:location>([\s\S]*?)<\/blogger:location>/);
    const local = loc ? campo(loc[1], 'blogger:name') : '';
    e = e.replace(/<author>[\s\S]*?<\/author>/, '').replace(/<blogger:location>[\s\S]*?<\/blogger:location>/, '');
    const cat = [...e.matchAll(/<category\s[^>]*term='([^']*)'[^>]*\/>/g)].map((c) => decodeEntities(c[1])).filter(Boolean);
    const idCompleto = campo(e, 'id');
    entradas.push({
      id: (idCompleto.match(/(?:post|page)-(\d+)$/) || [, idCompleto])[1],
      tipo: campo(e, 'blogger:type'),
      status: campo(e, 'blogger:status'),
      titulo: campo(e, 'title'),
      publicado: campo(e, 'published'),
      atualizado: campo(e, 'updated'),
      arquivo: campo(e, 'blogger:filename'), // ex.: /2026/10/acude.html
      descricao: campo(e, 'blogger:metaDescription'),
      lixeira: campo(e, 'blogger:trashed'),
      local,
      tags: cat,
      html: campo(e, 'content'),
    });
  }
  return entradas;
}

/* ---------- HTML ---------- */
const VAZIOS = new Set(['br', 'img', 'hr', 'meta', 'link', 'input']);
function attrs(s) {
  const o = {};
  for (const m of s.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    o[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return o;
}
export function parseHtml(html) {
  const raiz = { tag: '#raiz', attrs: {}, filhos: [] };
  const pilha = [raiz];
  const re = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9:-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>|[^<]+|</g;
  for (const m of html.matchAll(re)) {
    const t = m[0];
    if (t.startsWith('<!--')) continue;
    if (m[1] === undefined) { pilha.at(-1).filhos.push({ texto: decodeEntities(t) }); continue; }
    const tag = m[1].toLowerCase();
    if (t[1] === '/') {
      for (let i = pilha.length - 1; i > 0; i--) if (pilha[i].tag === tag) { pilha.length = i; break; }
      continue;
    }
    const no = { tag, attrs: attrs(m[2]), filhos: [] };
    pilha.at(-1).filhos.push(no);
    if (!VAZIOS.has(tag) && !m[2].trimEnd().endsWith('/')) pilha.push(no);
  }
  return raiz;
}
const BLOCOS = new Set(['p', 'div', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'pre', 'table', 'tr']);

/** Texto visível, usado para PROVAR que o texto não mudou (testes). */
export function textoVisivel(html) {
  let s = '';
  (function anda(nos) {
    for (const n of nos) {
      if (n.texto !== undefined) { s += n.texto; continue; }
      if (n.tag === 'style' || n.tag === 'script') continue;
      const quebra = BLOCOS.has(n.tag) || n.tag === 'br';
      if (quebra) s += '\n';
      anda(n.filhos);
      if (quebra) s += '\n';
    }
  })(parseHtml(html).filhos);
  return s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u00a0/g, '&nbsp;');
const escAttr = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const ehBlogger = (u) => /^https?:\/\/(?:blogger\.googleusercontent\.com|[0-9]\.bp\.blogspot\.com|lh[0-9]\.googleusercontent\.com)\//.test(u || '');

/** Converte o HTML sujo do Blogger num HTML mínimo. `reescreveImg(src, hrefDoLink)` devolve o src final. */
export function normalizarHtml(html, reescreveImg = (src) => src) {
  const saida = [];
  let buf = [];
  const aparar = (h) =>
    h
      .replace(/<(strong|em)>\s*<\/\1>/g, '')
      .replace(/ +<br>/g, '<br>').replace(/<br> +/g, '<br>')
      .replace(/^ +/, '').replace(/(?: |<br>)+$/, '');
  const descarrega = () => {
    const h = aparar(buf.join(''));
    buf = [];
    if (!h) return false;
    saida.push(`<p>${h}</p>`);
    return true;
  };
  const inlineDe = (filhos) => { const g = buf; buf = []; anda(filhos, null); const h = aparar(buf.join('')); buf = g; return h; };
  function anda(nos, linkHref) {
    for (const n of nos) {
      if (n.texto !== undefined) { buf.push(esc(n.texto.replace(/[ \t\r\n\f]+/g, ' '))); continue; }
      const t = n.tag;
      if (t === 'style' || t === 'script') continue;
      if (t === 'br') { buf.push('<br>'); continue; }
      if (t === 'img') {
        const src = reescreveImg(n.attrs.src || '', linkHref);
        const wh = ['width', 'height'].filter((k) => n.attrs[k]).map((k) => ` ${k}="${escAttr(n.attrs[k])}"`).join('');
        buf.push(`<img src="${escAttr(src)}" alt="${escAttr(n.attrs.alt || '')}"${wh} loading="lazy">`);
        continue;
      }
      if (t === 'i' || t === 'em') { buf.push('<em>'); anda(n.filhos, linkHref); buf.push('</em>'); continue; }
      if (t === 'b' || t === 'strong') { buf.push('<strong>'); anda(n.filhos, linkHref); buf.push('</strong>'); continue; }
      if (t === 'a') {
        const href = n.attrs.href || '';
        const soImagem = n.filhos.every((f) => (f.texto === undefined ? f.tag === 'img' : !f.texto.trim()));
        if (soImagem && ehBlogger(href)) { anda(n.filhos, href); continue; } // link de imagem do Blogger: só a imagem fica
        buf.push(href ? `<a href="${escAttr(href)}">` : '<a>'); anda(n.filhos, linkHref); buf.push('</a>');
        continue;
      }
      if (t === 'p' || t === 'div' || t === 'li' || t === 'pre') {
        descarrega();
        const antes = saida.length;
        anda(n.filhos, linkHref);
        if (!descarrega() && saida.length === antes) saida.push('<p class="espaco"></p>');
        continue;
      }
      if (t === 'blockquote') {
        descarrega();
        const guarda = saida.splice(0);
        anda(n.filhos, linkHref); descarrega();
        const interno = saida.splice(0); saida.push(...guarda);
        saida.push(`<blockquote>${interno.join('')}</blockquote>`);
        continue;
      }
      if (/^h[1-6]$/.test(t)) { descarrega(); const h = inlineDe(n.filhos); if (h) saida.push(`<${t}>${h}</${t}>`); continue; }
      if (t === 'ul' || t === 'ol') {
        descarrega();
        const itens = n.filhos.filter((f) => f.tag === 'li').map((li) => `<li>${inlineDe(li.filhos)}</li>`).join('');
        saida.push(`<${t}>${itens}</${t}>`);
        continue;
      }
      anda(n.filhos, linkHref); // span, font, o:p, u, etc.: some a tag, fica o conteúdo
    }
  }
  anda(parseHtml(html).filhos, null);
  descarrega();
  return saida.join('\n\n') + '\n';
}

/* ---------- utilidades ---------- */
export function slugify(t, max = 70) {
  let s = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (s.length > max) s = s.slice(0, max).replace(/-[^-]*$/, '');
  return s;
}
export function dataLocal(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(d).map((x) => [x.type, x.value]),
  );
  const local = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const min = Math.round((local - Math.floor(d.getTime() / 1000) * 1000) / 60000);
  const sinal = min < 0 ? '-' : '+';
  const a = Math.abs(min);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${sinal}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}
const yaml = (v) => JSON.stringify(v);

/* ---------- principal ---------- */
async function principal() {
  const args = process.argv.slice(2);
  const flag = (n) => args.includes(n);
  const valor = (n, pad) => (args.includes(n) ? args[args.indexOf(n) + 1] : pad);
  const feedPath = resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--blog-url') || join(RAIZ, 'backup/blogger/feed.atom'));
  const blogUrl = valor('--blog-url', 'https://ogritodemeser.blogspot.com').replace(/\/$/, '');
  const baixar = flag('--baixar-imagens');
  const dirPub = join(RAIZ, 'src/content/escritos');
  const dirNao = join(RAIZ, 'conteudo-nao-publicado');
  for (const d of [dirPub, dirNao, join(RAIZ, 'migracao')]) mkdirSync(d, { recursive: true });
  if (flag('--limpar')) for (const d of [dirPub, dirNao]) for (const f of readdirSync(d)) if (f.endsWith('.md')) unlinkSync(join(d, f));

  const entradas = lerFeed(readFileSync(feedPath, 'utf8'));
  const usados = new Set();
  const inventario = [];
  const mapa = [];
  const imagens = []; // {slug, url, arquivo}
  let n = 0;

  for (const e of entradas) {
    n++;
    const publicado = e.tipo === 'POST' && e.status === 'LIVE' && !e.lixeira;
    const base = slugify(e.titulo) || `sem-titulo-${(e.publicado || '').slice(0, 10)}-${e.id.slice(-6)}`;
    let slug = base;
    for (let i = 2; usados.has(slug); i++) slug = `${base}-${i}`;
    usados.add(slug);

    let k = 0;
    const html = normalizarHtml(e.html, (src, linkHref) => {
      const original = ehBlogger(linkHref) ? linkHref : src; // o link do Blogger aponta para o arquivo em tamanho original
      if (!baixar || !ehBlogger(original)) return src;
      const nome = decodeURIComponent(basename(new URL(original).pathname)) || `imagem-${++k}.jpg`;
      const seguro = nome.replace(/[^\w.-]+/g, '-');
      imagens.push({ slug, url: original, arquivo: join(RAIZ, 'public/images', slug, seguro) });
      return `../../images/${slug}/${seguro}`; // relativo à página /escritos/<slug>/ — funciona em qualquer endereço-base
    });

    const urlAntiga = e.arquivo ? blogUrl + e.arquivo : '';
    const fm = [
      '---',
      `title: ${yaml(e.titulo)}`,
      `date: ${dataLocal(e.publicado)}`,
      ...(e.atualizado ? [`updated: ${dataLocal(e.atualizado)}`] : []),
      `slug: ${yaml(slug)}`,
      `tags: ${JSON.stringify(e.tags)}`,
      `draft: ${publicado ? 'false' : 'true'}`,
      ...(e.descricao ? [`description: ${yaml(e.descricao)}`] : []),
      ...(e.local ? [`location: ${yaml(e.local)}`] : []),
      ...(urlAntiga ? [`originalUrl: ${yaml(urlAntiga)}`] : []),
      `bloggerId: ${yaml(e.id)}`,
      `bloggerType: ${yaml(e.tipo)}`,
      `bloggerStatus: ${yaml(e.status)}`,
      `lang: "pt-BR"`,
      '---',
      '',
    ].join('\n');

    const destino = publicado ? join(dirPub, `${slug}.md`) : join(dirNao, `${e.tipo === 'PAGE' ? 'pagina' : 'rascunho'}-${slug}.md`);
    writeFileSync(destino, fm + html);
    inventario.push({ n, id: e.id, tipo: e.tipo, status: e.status, titulo: e.titulo, publicado: e.publicado, urlAntiga, slug, publicadoNoSite: publicado, arquivo: destino.replace(RAIZ + '/', '') });
    if (publicado && e.arquivo) mapa.push({ antiga: e.arquivo, nova: `/escritos/${slug}/` });
  }

  writeFileSync(join(RAIZ, 'migracao/inventario.json'), JSON.stringify(inventario, null, 2) + '\n');
  writeFileSync(join(RAIZ, 'migracao/mapa-urls.json'), JSON.stringify(mapa, null, 2) + '\n');

  if (baixar) {
    for (const im of imagens) {
      mkdirSync(dirname(im.arquivo), { recursive: true });
      if (existsSync(im.arquivo)) continue;
      const r = await fetch(im.url);
      if (!r.ok) { console.error(`FALHOU (${r.status}): ${im.url}`); process.exitCode = 1; continue; }
      writeFileSync(im.arquivo, Buffer.from(await r.arrayBuffer()));
      console.log('imagem baixada:', im.arquivo.replace(RAIZ + '/', ''));
    }
  }

  const pub = inventario.filter((i) => i.publicadoNoSite).length;
  console.log(`Entradas no feed: ${entradas.length}`);
  console.log(`  publicadas no site: ${pub}`);
  console.log(`  rascunhos/páginas guardados fora do site: ${entradas.length - pub}`);
  if (!baixar && /<img/.test(entradas.map((x) => x.html).join(''))) console.log('Aviso: há imagens ainda apontando para o Blogger. Rode com --baixar-imagens no seu computador.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
