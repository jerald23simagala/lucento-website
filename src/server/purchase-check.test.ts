// Unit tests for the purchase check that needs no account (SERVER_CONTRACT.md §3b): `npm run test:unit`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isProductId } from './play-state.ts';
import {
  CHECK_CACHE_MS,
  parseCheckRequest,
  readSignedPurchase,
  readStoredCheck,
  storedAnswer,
  verifyPurchaseSignature,
} from './purchase-check.ts';

const toBase64 = (bytes: ArrayBuffer): string => btoa(String.fromCharCode(...new Uint8Array(bytes)));

/** A key pair shaped like Play's licence key: RSA 2048, signatures SHA-1 with PKCS #1 v1.5. */
async function playLikeKeys() {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-1' },
    true,
    ['sign', 'verify'],
  );
  const licenceKey = toBase64(await crypto.subtle.exportKey('spki', pair.publicKey));
  const sign = async (data: string) => toBase64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(data)));
  return { licenceKey, sign };
}

const purchaseData = JSON.stringify({
  orderId: 'GPA.3333-1111-2222-44444',
  packageName: 'com.lucento.app',
  productId: 'lucento_pro_lifetime',
  purchaseTime: 1762914253579,
  purchaseState: 0,
  purchaseToken: 'opaque-token-'.padEnd(120, 'x'),
  quantity: 1,
  acknowledged: true,
});

test('a signature Google made over this exact purchase data checks out', async () => {
  const { licenceKey, sign } = await playLikeKeys();
  assert.equal(await verifyPurchaseSignature(licenceKey, purchaseData, await sign(purchaseData)), true);
});

test('changed data, another key or an unreadable signature never check out, and never throw', async () => {
  const { licenceKey, sign } = await playLikeKeys();
  const other = await playLikeKeys();
  const signature = await sign(purchaseData);
  const edited = purchaseData.replace('lucento_pro_lifetime', 'lucento_pro');
  assert.equal(await verifyPurchaseSignature(licenceKey, edited, signature), false);
  assert.equal(await verifyPurchaseSignature(other.licenceKey, purchaseData, signature), false);
  assert.equal(await verifyPurchaseSignature(licenceKey, purchaseData, 'not base64 !!'), false);
  assert.equal(await verifyPurchaseSignature(licenceKey, purchaseData, ''), false);
  assert.equal(await verifyPurchaseSignature('37:CE:29:not-a-key', purchaseData, signature), false);
  assert.equal(await verifyPurchaseSignature('', purchaseData, signature), false);
});

test('the request is two bounded strings', () => {
  assert.deepEqual(parseCheckRequest({ purchaseData: 'd', signature: 's' }), { purchaseData: 'd', signature: 's' });
  assert.equal(parseCheckRequest(null), null);
  assert.equal(parseCheckRequest('text'), null);
  assert.equal(parseCheckRequest({ purchaseData: 'd' }), null);
  assert.equal(parseCheckRequest({ purchaseData: '', signature: 's' }), null);
  assert.equal(parseCheckRequest({ purchaseData: 'd'.repeat(4097), signature: 's' }), null);
  assert.equal(parseCheckRequest({ purchaseData: 'd', signature: 's'.repeat(1025) }), null);
  assert.equal(parseCheckRequest({ purchaseData: 1, signature: 's' }), null);
});

test('the signed data names the app, one of Lucento products and a token', () => {
  const read = readSignedPurchase(purchaseData, isProductId);
  assert.equal(read?.packageName, 'com.lucento.app');
  assert.equal(read?.productId, 'lucento_pro_lifetime');
  assert.equal(read?.purchaseToken.length, 120);
  // Newer purchases list their products.
  const listed = JSON.stringify({ packageName: 'com.lucento.app', productIds: ['lucento_cloud'], purchaseToken: 'x'.repeat(40) });
  assert.equal(readSignedPurchase(listed, isProductId)?.productId, 'lucento_cloud');
  assert.equal(readSignedPurchase(JSON.stringify({ packageName: 'com.lucento.app', productId: 'someone_elses', purchaseToken: 'x'.repeat(40) }), isProductId), null);
  assert.equal(readSignedPurchase(JSON.stringify({ packageName: 'com.lucento.app', productId: 'lucento_pro', purchaseToken: 'short' }), isProductId), null);
  assert.equal(readSignedPurchase(JSON.stringify({ productId: 'lucento_pro', purchaseToken: 'x'.repeat(40) }), isProductId), null);
  assert.equal(readSignedPurchase('not json', isProductId), null);
  assert.equal(readSignedPurchase('[]', isProductId), null);
});

test('a refund always answers REVOKED; a reading less than an hour old answers; otherwise Google is asked', () => {
  const now = Date.parse('2026-11-13T12:00:00Z');
  const at = (ms: number) => new Date(ms).toISOString();
  assert.equal(storedAnswer(readStoredCheck({ status: null, checked_at: null, revoked: true }), now), 'REVOKED');
  assert.equal(storedAnswer(readStoredCheck({ status: 'ACTIVE', checked_at: at(now - 60_000), revoked: true }), now), 'REVOKED');
  assert.equal(storedAnswer(readStoredCheck({ status: 'ACTIVE', checked_at: at(now - 60_000), revoked: false }), now), 'ACTIVE');
  assert.equal(storedAnswer(readStoredCheck({ status: 'EXPIRED', checked_at: at(now - CHECK_CACHE_MS + 1), revoked: false }), now), 'EXPIRED');
  assert.equal(storedAnswer(readStoredCheck({ status: 'ACTIVE', checked_at: at(now - CHECK_CACHE_MS), revoked: false }), now), null);
  assert.equal(storedAnswer(readStoredCheck({ status: null, checked_at: null, revoked: false }), now), null);
  assert.equal(storedAnswer(readStoredCheck({ status: 'ACTIVE', checked_at: at(now + 60 * 60_000), revoked: false }), now), null, 'a reading from the future is not trusted');
  assert.equal(storedAnswer(readStoredCheck(null), now), null);
});
