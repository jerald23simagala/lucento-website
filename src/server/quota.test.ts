import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { BillingConfig } from './billing.ts';
import { verifyAllowed } from './quota.ts';

// Security audit F-11: the per-account daily allowance for /api/billing/verify (public.consume_request_quota).
const config: BillingConfig = {
  supabaseUrl: 'https://project.supabase.example',
  publishableKey: 'sb_publishable_test',
  serviceKey: 'unused-here',
  serviceAccountJson: '{}',
  packageName: 'com.lucento.app',
};

async function withFetch(answer: () => Promise<Response>, run: (calls: { url: string; init: RequestInit }[]) => Promise<void>) {
  const original = globalThis.fetch;
  const calls: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return answer();
  }) as typeof fetch;
  try {
    await run(calls);
  } finally {
    globalThis.fetch = original;
  }
}

test('asks the database with the person\'s own token, never the service key', async () => {
  await withFetch(async () => Response.json({ allowed: true, used: 1, limit: 60 }), async (calls) => {
    assert.equal(await verifyAllowed(config, 'Bearer user-jwt'), true);
    assert.equal(calls[0].url, 'https://project.supabase.example/rest/v1/rpc/consume_request_quota');
    const headers = calls[0].init.headers as Record<string, string>;
    assert.equal(headers.Authorization, 'Bearer user-jwt');
    assert.equal(headers.apikey, 'sb_publishable_test');
    assert.deepEqual(JSON.parse(calls[0].init.body as string), { p_kind: 'billing_verify' });
  });
});

test('a used-up allowance is refused', async () => {
  await withFetch(async () => Response.json({ allowed: false, used: 61, limit: 60 }), async () => {
    assert.equal(await verifyAllowed(config, 'Bearer user-jwt'), false);
  });
});

test('fails open: an unreachable counter or a missing migration never blocks a paying person', async () => {
  const quiet = console.error;
  console.error = () => {};
  try {
    await withFetch(async () => new Response('{"code":"PGRST202"}', { status: 404 }), async () => {
      assert.equal(await verifyAllowed(config, 'Bearer user-jwt'), true);
    });
    await withFetch(async () => { throw new Error('offline'); }, async () => {
      assert.equal(await verifyAllowed(config, 'Bearer user-jwt'), true);
    });
  } finally {
    console.error = quiet;
  }
});
