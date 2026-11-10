import { expect, test } from '@playwright/test';

// API method handling and authentication, on `astro dev` (security audit F-08). Without the server's secrets in the
// environment a route answers 503 not_configured; with them, 401 for a missing token. Either way: never 2xx, never 500.
const ROUTES = [
  { path: '/api/ask', method: 'POST' },
  { path: '/api/interpret', method: 'POST' },
  { path: '/api/account/welcome', method: 'POST' },
  { path: '/api/billing/verify', method: 'POST' },
  { path: '/api/billing/rtdn', method: 'POST' },
  { path: '/api/billing/voided', method: 'GET' },
];

for (const { path, method } of ROUTES) {
  test.describe(path, () => {
    // On `astro dev`, Vite's own CORS middleware answers every OPTIONS request before the route does, so the route's
    // OPTIONS answer (204 with Allow) is unit-tested in src/server/http.test.ts and checked live after a deploy. Either
    // way another site is never granted access.
    test('a cross-origin preflight is never granted', async ({ request }) => {
      const res = await request.fetch(path, { method: 'OPTIONS', headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' } });
      expect(res.status()).toBeLessThan(500);
      expect(res.headers()['access-control-allow-origin']).toBeUndefined();
    });

    test('any other method answers 405 with Allow', async ({ request }) => {
      for (const other of ['PUT', 'DELETE', 'PATCH', method === 'POST' ? 'GET' : 'POST']) {
        const res = await request.fetch(path, { method: other });
        expect(res.status(), other).toBe(405);
        expect(res.headers()['allow']).toBe(`${method}, OPTIONS`);
      }
    });

    test('without credentials it refuses, and never crashes', async ({ request }) => {
      const res = await request.fetch(path, { method, data: method === 'POST' ? {} : undefined });
      expect([401, 503]).toContain(res.status());
    });
  });
}

test('a bogus bearer token is not accepted by the verify endpoint', async ({ request }) => {
  const res = await request.post('/api/billing/verify', {
    headers: { Authorization: 'Bearer not-a-real-token' },
    data: { purchaseToken: 'x'.repeat(40), productId: 'lucento_pro' },
  });
  expect([401, 503]).toContain(res.status());
});
