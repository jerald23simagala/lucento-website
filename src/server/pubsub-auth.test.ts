import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { test } from 'node:test';
import { verifyPushToken, type JwkSet } from './pubsub-auth.ts';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwks: JwkSet = { keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' }] };
const keys = async () => jwks;
const expect = { audience: 'https://www.lucentoapp.com/api/billing/rtdn', serviceAccountEmail: 'rtdn-push@lucento.iam.gserviceaccount.com' };
const now = 1_800_000_000_000;
const s = Math.floor(now / 1000);

const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
function token(claims: Record<string, unknown>, header: Record<string, unknown> = { alg: 'RS256', kid: 'k1', typ: 'JWT' }, key = privateKey) {
  const h = enc(header);
  const p = enc(claims);
  return `Bearer ${h}.${p}.${sign('RSA-SHA256', Buffer.from(`${h}.${p}`), key).toString('base64url')}`;
}
const good = {
  iss: 'https://accounts.google.com', aud: expect.audience, exp: s + 3000, iat: s - 10,
  email: expect.serviceAccountEmail, email_verified: true, sub: '1234',
};

test('a token Google signed for the push subscription is accepted', async () => {
  assert.deepEqual(await verifyPushToken(token(good), expect, now, keys), { ok: true });
  assert.deepEqual(await verifyPushToken(token({ ...good, iss: 'accounts.google.com' }), expect, now, keys), { ok: true });
});

test('every claim is checked', async () => {
  const reason = async (claims: Record<string, unknown>) => {
    const r = await verifyPushToken(token(claims), expect, now, keys);
    return r.ok ? 'ok' : r.reason;
  };
  assert.equal(await reason({ ...good, iss: 'https://evil.example' }), 'issuer');
  assert.equal(await reason({ ...good, aud: 'https://someone-else.example' }), 'audience');
  assert.equal(await reason({ ...good, exp: s - 120 }), 'expired');
  assert.equal(await reason({ ...good, iat: s + 600 }), 'not_yet_valid');
  assert.equal(await reason({ ...good, email: 'attacker@evil.iam.gserviceaccount.com' }), 'service_account');
  assert.equal(await reason({ ...good, email_verified: false }), 'service_account');
  assert.equal(await reason({ ...good, exp: undefined }), 'expired');
});

test('the signature must be by one of Google\'s published keys', async () => {
  const forged = await verifyPushToken(token(good, undefined, other.privateKey), expect, now, keys);
  assert.deepEqual(forged, { ok: false, reason: 'signature' });
  const unknown = await verifyPushToken(token(good, { alg: 'RS256', kid: 'not-published' }), expect, now, keys);
  assert.deepEqual(unknown, { ok: false, reason: 'unknown_key' });
  const keysDown = await verifyPushToken(token(good), expect, now, async () => null);
  assert.deepEqual(keysDown, { ok: false, reason: 'unknown_key' });
});

test('no other algorithm, no missing or malformed token', async () => {
  const none = `Bearer ${enc({ alg: 'none', kid: 'k1' })}.${enc(good)}.`;
  assert.equal((await verifyPushToken(none, expect, now, keys)).ok, false);
  const hs = await verifyPushToken(token(good, { alg: 'HS256', kid: 'k1' }), expect, now, keys);
  assert.deepEqual(hs, { ok: false, reason: 'algorithm' });
  assert.deepEqual(await verifyPushToken('', expect, now, keys), { ok: false, reason: 'no_bearer_jwt' });
  assert.deepEqual(await verifyPushToken('Bearer not.a.jwt!', expect, now, keys), { ok: false, reason: 'no_bearer_jwt' });
});
