// Serves the BUILT site (.vercel/output/static) with the response headers vercel.json declares, so the Playwright
// "built" project tests what Vercel will serve: the header CSP and the per-page script policy together
// (e2e/security.spec.ts). Static files only: API routes run on `astro dev` in the other project. Test tool, not shipped.
//   node scripts/serve-static.mjs [port]      (run `npm run build` first)
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../.vercel/output/static/', import.meta.url));
const port = Number(process.argv[2] ?? 4478);
if (!existsSync(join(root, 'index.html'))) {
  console.error('No build in .vercel/output/static: run `npm run build` first.');
  process.exit(1);
}
const config = JSON.parse(readFileSync(fileURLToPath(new URL('../vercel.json', import.meta.url)), 'utf8'));
// vercel.json sources used here are "/(.*)" and "/api/(.*)": path-to-regexp groups map onto plain regular expressions.
const rules = (config.headers ?? []).map((r) => ({ re: new RegExp(`^${r.source}$`), headers: r.headers }));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain', '.json': 'application/json', '.webp': 'image/webp' };

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  for (const rule of rules) if (rule.re.test(path)) for (const h of rule.headers) res.setHeader(h.key, h.value);
  const safe = normalize(path).replace(/^([/\\])+/, '');
  const candidates = [join(root, safe), join(root, safe, 'index.html'), join(root, `${safe}.html`)];
  const file = candidates.find((f) => f.startsWith(root) && existsSync(f) && statSync(f).isFile());
  if (!file) {
    res.statusCode = 404;
    res.setHeader('Content-Type', types['.html']);
    res.end(readFileSync(join(root, '404.html')));
    return;
  }
  res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
  res.end(readFileSync(file));
}).listen(port, '127.0.0.1', () => console.log(`serving the build on http://127.0.0.1:${port}`));
