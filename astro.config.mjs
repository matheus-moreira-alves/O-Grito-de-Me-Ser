import { defineConfig } from 'astro/config';

// O GitHub Actions informa SITE_URL e BASE_PATH automaticamente (ver .github/workflows/deploy.yml).
// Localmente, os valores abaixo servem apenas de padrão.
//   Site de projeto: https://USUARIO.github.io/REPOSITORIO/   → base = '/REPOSITORIO'
//   Site de usuário (repositório USUARIO.github.io) ou domínio próprio → base = ''
const base = process.env.BASE_PATH ?? '/o-grito-de-me-ser';

export default defineConfig({
  site: process.env.SITE_URL || 'https://USUARIO.github.io',
  base: base === '' ? '/' : base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Os textos não podem ser "embelezados": sem aspas/travessões automáticos.
  markdown: { smartypants: false },
});
