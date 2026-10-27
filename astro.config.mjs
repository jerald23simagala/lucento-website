// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// The production domain is not decided yet. Set SITE_URL to enable canonical
// URLs and the sitemap; until then neither is emitted rather than pointing at a guess.
const site = process.env.SITE_URL || undefined;

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  integrations: site ? [sitemap()] : [],
  // Pages stay static; only on-demand routes (src/pages/api/interpret.ts, prerender = false) become Vercel Functions.
  adapter: vercel(),
});
