// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The production domain is not decided yet. Set SITE_URL to enable canonical
// URLs and the sitemap; until then neither is emitted rather than pointing at a guess.
const site = process.env.SITE_URL || undefined;

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  integrations: site ? [sitemap()] : [],
});
