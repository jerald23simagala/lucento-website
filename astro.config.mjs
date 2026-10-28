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
  build: {
    // The homepage LCP element is the hero lede. `auto` only inlines stylesheets
    // under Vite's 4kB limit, so the layout, homepage, and demo CSS stay
    // render-blocking requests. Inline them so that paragraph can paint with the HTML.
    inlineStylesheets: 'always',
  },
});
