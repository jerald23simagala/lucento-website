import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { injectScriptPolicy, inlineCode, scriptPolicy } from './csp.mjs';

const hash = (s) => `'sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}'`;
const page = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>t</title>
<link rel="stylesheet" href="/a.css" media="print" onload="this.media='all'">
<script>document.documentElement.dataset.theme = 'dark';</script>
<script type="module" src="/_astro/x.js"></script>
<script type="module">import('/b.js');</script>
<script type="application/ld+json">{"@type":"FAQPage"}</script>
</head><body><p style="--x:1">hi</p></body></html>`;

test('every inline script and handler is found; scripts with src are not', () => {
  const { scripts, handlers } = inlineCode(page);
  assert.deepEqual(scripts, ["document.documentElement.dataset.theme = 'dark';", "import('/b.js');", '{"@type":"FAQPage"}']);
  assert.deepEqual(handlers, ["this.media='all'"]);
});

test('the policy allows exactly the page\'s inline code, by hash', () => {
  const policy = scriptPolicy(page);
  assert.ok(policy.startsWith("script-src 'self' "));
  assert.ok(policy.includes(hash("document.documentElement.dataset.theme = 'dark';")));
  assert.ok(policy.includes(hash("import('/b.js');")));
  assert.ok(policy.includes(`'unsafe-hashes' ${hash("this.media='all'")}`));
  assert.ok(!policy.includes("'unsafe-inline'"), 'never unsafe-inline for scripts');
  assert.ok(!policy.includes("'unsafe-eval'"));
});

test('the meta goes right after the charset and is idempotent', () => {
  const once = injectScriptPolicy(page);
  assert.match(once, /<head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="script-src 'self' /);
  assert.equal(injectScriptPolicy(once), once);
  assert.equal((once.match(/http-equiv="Content-Security-Policy"/g) ?? []).length, 1);
});

test('a page with no inline handlers forbids them', () => {
  const plain = '<html><head><script>1</script></head></html>';
  assert.ok(scriptPolicy(plain).endsWith("script-src-attr 'none'"));
});
