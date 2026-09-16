// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
// User site served from the repository root, so there is no `base` path.
export default defineConfig({
  site: 'https://jvpts11.github.io',
  integrations: [sitemap()],
  markdown: {
    // The project pages are paper, not a terminal: highlight on a light
    // background so a listing sits in the page instead of punching a hole.
    shikiConfig: { theme: 'github-light' },
  },
});
