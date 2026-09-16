// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
// User site served from the repository root, so there is no `base` path.
export default defineConfig({
  site: 'https://jvpts11.github.io',
  integrations: [sitemap()],
});
