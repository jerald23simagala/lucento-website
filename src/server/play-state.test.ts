// Unit tests for the Play purchase mapping: `npm run test:unit` (Node's own test runner; no dependency).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readNotification, readProductV2, readSubscriptionV2, sameSecret, sha256Hex } from './play-state.ts';

const NOW = Date.parse('2026-11-08T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const ACCOUNT = 'a'.repeat(64);

const subscription = (state: string, extra: Record<string, unknown> = {}, line: Record<string, unknown> = {}) => ({
  subscriptionState: state,
  startTime: '2026-11-01T00:00:00Z',
  acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
  externalAccountIdentifiers: { obfuscatedExternalAccountId: ACCOUNT },
  lineItems: [
    {
      productId: 'lucento_pro',
      expiryTime: new Date(NOW + 20 * DAY).toISOString(),
      autoRenewingPlan: { autoRenewEnabled: true },
      offerDetails: { basePlanId: 'annual' },
      latestSuccessfulOrderId: 'GPA.1',
      ...line,
    },
  ],
  ...extra,
});

test('an active subscription is ACTIVE with its period end, base plan, order and account hash', () => {
  const r = readSubscriptionV2(subscription('SUBSCRIPTION_STATE_ACTIVE'), NOW);
  assert.ok(r);
  assert.equal(r.status, 'ACTIVE');
  assert.equal(r.productId, 'lucento_pro');
  assert.equal(r.basePlanId, 'annual');
  assert.equal(r.orderId, 'GPA.1');
  assert.equal(r.obfuscatedAccountId, ACCOUNT);
  assert.equal(r.expiresAt, new Date(NOW + 20 * DAY).toISOString());
  assert.equal(r.acknowledged, true);
  assert.equal(r.testPurchase, false);
});

test('subscription states map to Lucento statuses', () => {
  const s = (state: string, line: Record<string, unknown> = {}) => readSubscriptionV2(subscription(state, {}, line), NOW)?.status;
  assert.equal(s('SUBSCRIPTION_STATE_ACTIVE', { offerPhase: { freeTrial: {} } }), 'TRIAL');
  assert.equal(s('SUBSCRIPTION_STATE_ACTIVE', { autoRenewingPlan: { autoRenewEnabled: false } }), 'CANCELLED_ACTIVE');
  assert.equal(s('SUBSCRIPTION_STATE_IN_GRACE_PERIOD'), 'GRACE');
  assert.equal(s('SUBSCRIPTION_STATE_ON_HOLD'), 'ON_HOLD');
  assert.equal(s('SUBSCRIPTION_STATE_PAUSED'), 'PAUSED');
  assert.equal(s('SUBSCRIPTION_STATE_CANCELED'), 'CANCELLED_ACTIVE');
  assert.equal(s('SUBSCRIPTION_STATE_CANCELED', { expiryTime: new Date(NOW - DAY).toISOString() }), 'EXPIRED');
  assert.equal(s('SUBSCRIPTION_STATE_EXPIRED'), 'EXPIRED');
  assert.equal(s('SUBSCRIPTION_STATE_PENDING'), 'PENDING');
  assert.equal(s('SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED'), 'EXPIRED');
  assert.equal(s('SUBSCRIPTION_STATE_UNSPECIFIED'), undefined);
});

test('a subscription reading trusts nothing unexpected', () => {
  assert.equal(readSubscriptionV2(null, NOW), null);
  assert.equal(readSubscriptionV2(subscription('SUBSCRIPTION_STATE_ACTIVE', {}, { productId: 'someone_elses' }), NOW), null);
  assert.equal(readSubscriptionV2(subscription('SUBSCRIPTION_STATE_ACTIVE', {}, { productId: 'lucento_pro_lifetime' }), NOW), null);
  assert.equal(readSubscriptionV2(subscription('SUBSCRIPTION_STATE_ACTIVE', {}, { expiryTime: undefined }), NOW), null, 'live without an end');
  const bad = readSubscriptionV2(subscription('SUBSCRIPTION_STATE_ACTIVE', { externalAccountIdentifiers: { obfuscatedExternalAccountId: 'x' } }), NOW);
  assert.equal(bad?.obfuscatedAccountId, null, 'a malformed account hash is dropped, not passed on');
  assert.equal(readSubscriptionV2(subscription('SUBSCRIPTION_STATE_ACTIVE', { testPurchase: {} }), NOW)?.testPurchase, true);
});

test('after a plan change the line item that ends last is the current one', () => {
  const raw = subscription('SUBSCRIPTION_STATE_ACTIVE');
  raw.lineItems.unshift({ ...raw.lineItems[0], productId: 'lucento_cloud', expiryTime: new Date(NOW - DAY).toISOString() });
  assert.equal(readSubscriptionV2(raw, NOW)?.productId, 'lucento_pro');
});

const lifetime = (state: string, extra: Record<string, unknown> = {}) => ({
  productLineItem: [{ productId: 'lucento_pro_lifetime', productOfferDetails: { quantity: 1 } }],
  purchaseStateContext: { purchaseState: state },
  orderId: 'GPA.life',
  obfuscatedExternalAccountId: ACCOUNT.toUpperCase(),
  purchaseCompletionTime: '2026-11-07T10:00:00Z',
  acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
  ...extra,
});

test('a Lifetime purchase reads its state, completion time and account hash', () => {
  const r = readProductV2(lifetime('PURCHASED'), 'lucento_pro_lifetime');
  assert.ok(r);
  assert.equal(r.status, 'ACTIVE');
  assert.equal(r.purchasedAt, '2026-11-07T10:00:00Z');
  assert.equal(r.expiresAt, null);
  assert.equal(r.obfuscatedAccountId, ACCOUNT, 'normalised to lower case');
  assert.equal(r.acknowledged, false);
  assert.equal(readProductV2(lifetime('PENDING', { purchaseCompletionTime: undefined }), 'lucento_pro_lifetime')?.status, 'PENDING');
  assert.equal(readProductV2(lifetime('CANCELLED'), 'lucento_pro_lifetime')?.status, 'EXPIRED');
  assert.equal(readProductV2(lifetime('PURCHASE_STATE_UNSPECIFIED'), 'lucento_pro_lifetime'), null);
  assert.equal(readProductV2(lifetime('PURCHASED'), 'lucento_pro'), null, 'not read as a subscription');
  assert.equal(readProductV2(lifetime('PURCHASED', { productLineItem: [{ productId: 'other' }] }), 'lucento_pro_lifetime'), null);
  assert.equal(readProductV2(lifetime('PURCHASED', { testPurchaseContext: { fopType: 'TEST' } }), 'lucento_pro_lifetime')?.testPurchase, true);
});

const push = (notification: Record<string, unknown>) => ({
  message: { data: btoa(JSON.stringify({ version: '1.0', packageName: 'com.lucento.app', eventTimeMillis: '1', ...notification })) },
  subscription: 'projects/x/subscriptions/y',
});

test('real-time notifications are read into one action each', () => {
  assert.deepEqual(readNotification(push({ subscriptionNotification: { notificationType: 2, purchaseToken: 'tok-s' } })), {
    kind: 'subscription',
    packageName: 'com.lucento.app',
    purchaseToken: 'tok-s',
  });
  assert.deepEqual(readNotification(push({ oneTimeProductNotification: { notificationType: 1, purchaseToken: 'tok-o', sku: 'lucento_pro_lifetime' } })), {
    kind: 'one_time',
    packageName: 'com.lucento.app',
    purchaseToken: 'tok-o',
    productId: 'lucento_pro_lifetime',
  });
  assert.deepEqual(readNotification(push({ voidedPurchaseNotification: { purchaseToken: 'tok-v', orderId: 'GPA.v', productType: 2 } })), {
    kind: 'voided',
    packageName: 'com.lucento.app',
    purchaseToken: 'tok-v',
  });
  assert.equal(readNotification(push({ testNotification: { version: '1.0' } }))?.kind, 'test');
  assert.equal(readNotification({ message: { data: '!!!not base64' } }), null);
  assert.equal(readNotification({}), null);
  assert.equal(readNotification(push({})), null);
});

test('secrets compare whole, and an unset secret matches nothing', () => {
  assert.equal(sameSecret('s3cret-value', 's3cret-value'), true);
  assert.equal(sameSecret('s3cret-valuX', 's3cret-value'), false);
  assert.equal(sameSecret('s3cret', 's3cret-value'), false);
  assert.equal(sameSecret('', ''), false);
  assert.equal(sameSecret('anything', ''), false);
});

test('token hashes are sha256 lower-case hex, as the database checks', async () => {
  assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
