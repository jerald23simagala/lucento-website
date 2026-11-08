// @ts-check
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// The production domain is not decided yet. Set SITE_URL to enable canonical
// URLs and the sitemap; until then neither is emitted rather than pointing at a guess.
// LUCENTO_SITE_URL is the name set on Vercel; SITE_URL still works.
const site = process.env.SITE_URL || process.env.LUCENTO_SITE_URL || undefined;

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
  // One-page site (2026-11-08): pricing lives on the homepage, the guides page is the interactive demo.
  redirects: {
    '/pricing': { status: 308, destination: '/#pricing' },
    '/how-to': { status: 308, destination: '/demo' },
    // Browsers still ask for /favicon.ico; the SVG icon is the only one.
    '/favicon.ico': { status: 308, destination: '/favicon.svg' },
  },
  integrations: [...(site ? [sitemap()] : []), deferBuiltStyles()],
  // Pages stay static; only on-demand routes (src/pages/api/interpret.ts, prerender = false) become Vercel Functions.
  adapter: vercel(),
  build: {
    // Keep the built stylesheets external (the demo's phone styles). SiteLayout inlines the site's own CSS itself.
    inlineStylesheets: 'never',
  },
});
