// @ts-check
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// The production domain is not decided yet. Set SITE_URL to enable canonical
// URLs and the sitemap; until then neither is emitted rather than pointing at a guess.
const site = process.env.SITE_URL || undefined;

/** Astro writes page HTML itself, so defer the stylesheets after the build. */
/**
 * @param {string} html
 * @returns {string}
 */
function deferStylesheetLinks(html) {
  return html.replace(/<noscript>[\s\S]*?<\/noscript>|<link rel="stylesheet" href="([^"]+)"(?![^>]*\bmedia=)[^>]*>/g, (/** @type {string} */ match, /** @type {string | undefined} */ href) => {
    if (typeof href !== 'string' || href.length === 0) return match;
    return `<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${href}"></noscript>`;
  });
}

/**
 * @param {string} dir
 */
function rewriteHtmlTree(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      rewriteHtmlTree(path);
      continue;
    }
    if (!name.endsWith('.html')) continue;
    const html = readFileSync(path, 'utf8');
    const next = deferStylesheetLinks(html);
    if (next !== html) writeFileSync(path, next);
  }
}

function deferBuiltStyles() {
  return {
    name: 'defer-built-styles',
    hooks: {
      /**
       * @param {{ dir: URL }} params
       */
      'astro:build:done': ({ dir }) => {
        const built = fileURLToPath(dir);
        rewriteHtmlTree(built);
        for (const extra of ['dist/client', '.vercel/output/static']) {
          try {
            rewriteHtmlTree(extra);
          } catch {
            /* that output is absent in this build */
          }
        }
      },
    },
  };
}

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  integrations: [...(site ? [sitemap()] : []), deferBuiltStyles()],
  // Pages stay static; only on-demand routes (src/pages/api/interpret.ts, prerender = false) become Vercel Functions.
  adapter: vercel(),
  build: {
    // Keep the built stylesheets external. critical.css is the only CSS inlined into the document.
    inlineStylesheets: 'never',
  },
});
