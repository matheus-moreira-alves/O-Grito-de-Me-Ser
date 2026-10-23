import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://matheus-moreira-alves.github.io',
  base: '/O-Grito-de-Me-Ser',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: { smartypants: false },
});
