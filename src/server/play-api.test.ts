// Unit test for the service-account JWT: `npm run test:unit`. Signs with a generated key and checks Google's format.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { signedAssertion } from './play-api.ts';

const fromB64url = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));

test('the assertion is an RS256 JWT for the androidpublisher scope, signed by the service account key', async () => {
  const keys = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keys.privateKey));
  const b64 = btoa(String.fromCharCode(...pkcs8));
  // Google's JSON keys carry the PEM with literal newlines every 64 characters.
  const lines = b64.match(/.{1,64}/g) ?? [];
  const pem = ['-----BEGIN PRIVATE KEY-----', ...lines, '-----END PRIVATE KEY-----', ''].join('\n');
  const now = Date.parse('2026-11-08T00:00:00Z');
  const jwt = await signedAssertion({ client_email: 'billing@lucento.iam.gserviceaccount.com', private_key: pem, token_uri: 'https://oauth2.googleapis.com/token' }, now);

  const [h, p, sig] = jwt.split('.');
  assert.deepEqual(JSON.parse(new TextDecoder().decode(fromB64url(h))), { alg: 'RS256', typ: 'JWT' });
  const claims = JSON.parse(new TextDecoder().decode(fromB64url(p)));
  assert.equal(claims.iss, 'billing@lucento.iam.gserviceaccount.com');
  assert.equal(claims.scope, 'https://www.googleapis.com/auth/androidpublisher');
  assert.equal(claims.aud, 'https://oauth2.googleapis.com/token');
  assert.equal(claims.exp - claims.iat, 3600);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', keys.publicKey, fromB64url(sig), new TextEncoder().encode(`${h}.${p}`));
  assert.equal(valid, true);
});
