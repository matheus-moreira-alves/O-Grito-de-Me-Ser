// Caminhos e formatação. Tudo que é link interno passa por url(), para funcionar
// com o endereço-base do GitHub Pages (/REPOSITORIO/) e também na raiz.
export const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
export const url = (caminho = '') => `${base}/${caminho.replace(/^\/+/, '')}`;

export const slugTag = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Datas com horário (importadas do Blogger) são exibidas no fuso do blog original.
// Datas sem horário (ex.: "date: 2026-10-23" num texto novo) são exibidas como estão.
const semHorario = (d: Date) => d.getUTCHours() + d.getUTCMinutes() + d.getUTCSeconds() + d.getUTCMilliseconds() === 0;
const fuso = (d: Date) => (semHorario(d) ? 'UTC' : 'America/Fortaleza');
export const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: fuso(d) }).format(d);
export const formatDay = (d: Date) =>
  new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: fuso(d) }).format(d);
export const isoDay = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: fuso(d) }).format(d);
export const year = (d: Date) => Number(new Intl.DateTimeFormat('en-CA', { year: 'numeric', timeZone: fuso(d) }).format(d));

export function textoPuro(corpo: string): string {
  const ehHtml = corpo.trimStart().startsWith('<');
  let t = corpo
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|blockquote|li|h\d)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  if (!ehHtml) t = t.replace(/[*_#>`]/g, '').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1');
  return t.replace(/\s+/g, ' ').trim();
}
export function trecho(corpo: string, max = 200): string {
  const t = textoPuro(corpo);
  return t.length <= max ? t : t.slice(0, max).replace(/\s+\S*$/, '') + '…';
}
