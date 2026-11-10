// Content-Security-Policy for the built pages (security audit F-09). Pure functions, unit-tested in scripts/csp.test.mjs.
//
// Two policies apply to every page, and a browser enforces both (a resource must pass each):
//   1. The header in vercel.json: everything except scripts and styles is held to the site itself (default-src 'self',
//      object-src 'none', base-uri, form-action, frame-ancestors 'none'). It leaves script-src and style-src broad
//      ('self' 'unsafe-inline') because hashes change with every build and vercel.json is static.
//   2. A <meta http-equiv="Content-Security-Policy"> written into each page after the build by injectScriptPolicy():
//      script-src lists the sha256 of every inline script and inline event handler that page actually has, and nothing
//      else inline runs. Styles stay 'unsafe-inline': the pages set CSS custom properties in style attributes, which
//      hashes can't cover without listing each attribute; no style carries user content.
import { createHash } from 'node:crypto';

const sha256 = (/** @type {string} */ text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

/**
 * The inline scripts (bodies of <script> elements without src) and inline event-handler attribute values of [html].
 * @param {string} html
 * @returns {{ scripts: string[], handlers: string[] }}
 */
export function inlineCode(html) {
  const scripts = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/i.test(m[1])) continue;
    scripts.push(m[2]);
  }
  const handlers = [];
  for (const m of html.matchAll(/\son[a-z]+\s*=\s*"([^"]*)"/gi)) handlers.push(m[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  for (const m of html.matchAll(/\son[a-z]+\s*=\s*'([^']*)'/gi)) handlers.push(m[1]);
  return { scripts, handlers };
}

/**
 * The page's script-src policy: its own origin, and exactly its inline code by hash.
 * @param {string} html
 * @returns {string}
 */
export function scriptPolicy(html) {
  const { scripts, handlers } = inlineCode(html);
  const hashes = [...new Set(scripts.map(sha256))];
  const handlerHashes = [...new Set(handlers.map(sha256))];
  const parts = ["script-src 'self'", ...hashes];
  if (handlerHashes.length > 0) parts.push("'unsafe-hashes'", ...handlerHashes);
  return `${parts.join(' ')}; script-src-attr ${handlerHashes.length > 0 ? ["'unsafe-hashes'", ...handlerHashes].join(' ') : "'none'"}`;
}

/**
 * [html] with its script policy as the first element of <head>, so it governs every script after it. A page that
 * already has one is rewritten (idempotent: the build may process a file twice).
 * @param {string} html
 * @returns {string}
 */
export function injectScriptPolicy(html) {
  const without = html.replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*">/i, '');
  if (!/<head\b[^>]*>/i.test(without)) return without;
  const meta = `<meta http-equiv="Content-Security-Policy" content="${scriptPolicy(without).replace(/"/g, '&quot;')}">`;
  // Right after <meta charset> when the page starts with it (the charset must stay in the first 1024 bytes).
  const charsetFirst = /(<head\b[^>]*>\s*<meta charset="[^"]*"\s*\/?>)/i;
  if (charsetFirst.test(without)) return without.replace(charsetFirst, (start) => `${start}${meta}`);
  return without.replace(/<head\b[^>]*>/i, (head) => `${head}${meta}`);
}
