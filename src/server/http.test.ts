import assert from 'node:assert/strict';
import { test } from 'node:test';
import { methodGuard } from './http.ts';

// The route handlers Astro calls for a method a route doesn't implement (security audit F-08).
const call = (method: string, allowed: string[]) =>
  (methodGuard(allowed) as (ctx: { request: Request }) => Response)({ request: new Request('https://x.example/api/ask', { method }) });

test('OPTIONS answers 204 with Allow and grants no other origin', async () => {
  const res = call('OPTIONS', ['POST']);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('allow'), 'POST, OPTIONS');
  assert.equal(res.headers.get('access-control-allow-origin'), null);
  assert.equal(await res.text(), '');
});

test('any other method answers 405 with Allow and a JSON error', async () => {
  for (const method of ['GET', 'PUT', 'DELETE', 'PATCH', 'HEAD']) {
    const res = call(method, ['POST']);
    assert.equal(res.status, 405, method);
    assert.equal(res.headers.get('allow'), 'POST, OPTIONS');
    assert.equal(res.headers.get('cache-control'), 'no-store');
  }
  assert.deepEqual(await call('PUT', ['GET']).json(), { error: 'method_not_allowed' });
  assert.equal(call('POST', ['GET']).headers.get('allow'), 'GET, OPTIONS');
});
