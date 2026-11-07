/**
 * Google Play purchases in Lucento's terms (lucento-android docs/monetization/SERVER_CONTRACT.md §3–§5). Pure: no network,
 * no environment, so every state is a unit test (src/server/play-state.test.ts, `npm run test:unit`).
 *
 * Play's answers are data from outside, checked field by field; anything unexpected reads as "unknown" (null), never as a
 * plan. Field names follow the Play Developer API v3 reference for purchases.subscriptionsv2 and purchases.productsv2.
 */

export const PRODUCT_IDS = ['lucento_pro', 'lucento_pro_lifetime', 'lucento_cloud'] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];
export const isProductId = (v: unknown): v is ProductId => typeof v === 'string' && (PRODUCT_IDS as readonly string[]).includes(v);
export const isSubscription = (p: ProductId): boolean => p === 'lucento_pro' || p === 'lucento_cloud';

/** The vocabulary of public.entitlements.status. */
export type LucentoStatus =
  | 'ACTIVE'
  | 'TRIAL'
  | 'GRACE'
  | 'CANCELLED_ACTIVE'
  | 'ON_HOLD'
  | 'PAUSED'
  | 'PENDING'
  | 'EXPIRED'
  | 'REVOKED';

/** One purchase as Play reports it, ready for public.apply_play_purchase. */
export interface PlayReading {
  productId: ProductId;
  status: LucentoStatus;
  basePlanId: string | null;
  /** RFC 3339. Subscriptions: startTime; one-time: purchaseCompletionTime (unset while a payment is pending). */
  purchasedAt: string | null;
  /** RFC 3339; subscriptions only (the latest line item's expiryTime). */
  expiresAt: string | null;
  orderId: string | null;
  /** sha256 of the Lucento user id the app passed at purchase, when it did. */
  obfuscatedAccountId: string | null;
  acknowledged: boolean;
  testPurchase: boolean;
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : null);
const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);
const time = (v: unknown): number | null => {
  const s = str(v);
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
};
const HEX64 = /^[0-9a-f]{64}$/;
const accountHash = (v: unknown): string | null => {
  const s = str(v)?.toLowerCase() ?? null;
  return s && HEX64.test(s) ? s : null;
};

/** purchases.subscriptionsv2.get → a reading, or null when it isn't one of Lucento's subscriptions in a known state. */
export function readSubscriptionV2(raw: unknown, now: number): PlayReading | null {
  const r = obj(raw);
  if (!r) return null;
  const lines = Array.isArray(r.lineItems) ? r.lineItems.map(obj).filter((l): l is Obj => l !== null) : [];
  // The line item that ends last is the current one (after an upgrade or a deferred change there can be two).
  const line = lines.reduce<Obj | null>((best, l) => ((time(l.expiryTime) ?? 0) > (time(best?.expiryTime) ?? -1) ? l : best), null);
  if (!line || !isProductId(line.productId) || !isSubscription(line.productId)) return null;
  const expiry = time(line.expiryTime);
  const renewing = obj(line.autoRenewingPlan)?.autoRenewEnabled !== false;
  const inTrial = obj(obj(line.offerPhase)?.freeTrial) !== null;
  let status: LucentoStatus | null;
  switch (r.subscriptionState) {
    case 'SUBSCRIPTION_STATE_PENDING':
      status = 'PENDING';
      break;
    case 'SUBSCRIPTION_STATE_ACTIVE':
      status = !renewing ? 'CANCELLED_ACTIVE' : inTrial ? 'TRIAL' : 'ACTIVE';
      break;
    case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD':
      status = 'GRACE';
      break;
    case 'SUBSCRIPTION_STATE_ON_HOLD':
      status = 'ON_HOLD';
      break;
    case 'SUBSCRIPTION_STATE_PAUSED':
      status = 'PAUSED';
      break;
    case 'SUBSCRIPTION_STATE_CANCELED':
      // Cancelled by the person: paid up to the period's end, then over.
      status = expiry !== null && expiry > now ? 'CANCELLED_ACTIVE' : 'EXPIRED';
      break;
    case 'SUBSCRIPTION_STATE_EXPIRED':
    case 'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED':
      status = 'EXPIRED';
      break;
    default:
      status = null;
  }
  if (status === null) return null;
  // A live subscription without a period end can't be stored honestly; treat the answer as unreadable.
  if (expiry === null && status !== 'PENDING' && status !== 'EXPIRED') return null;
  return {
    productId: line.productId,
    status,
    basePlanId: str(obj(line.offerDetails)?.basePlanId)?.slice(0, 60) ?? null,
    purchasedAt: str(r.startTime),
    expiresAt: expiry !== null ? new Date(expiry).toISOString() : null,
    orderId: str(line.latestSuccessfulOrderId) ?? str(r.latestOrderId),
    obfuscatedAccountId: accountHash(obj(r.externalAccountIdentifiers)?.obfuscatedExternalAccountId),
    acknowledged: r.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    testPurchase: obj(r.testPurchase) !== null,
  };
}

/** purchases.productsv2.getproductpurchasev2 → a reading, or null when it isn't Lucento's Lifetime in a known state. */
export function readProductV2(raw: unknown, expected: ProductId): PlayReading | null {
  const r = obj(raw);
  if (!r) return null;
  const lines = Array.isArray(r.productLineItem) ? r.productLineItem.map(obj).filter((l): l is Obj => l !== null) : [];
  const line = lines.find((l) => l.productId === expected);
  if (!line || isSubscription(expected)) return null;
  let status: LucentoStatus | null;
  switch (obj(r.purchaseStateContext)?.purchaseState) {
    case 'PURCHASED':
      status = 'ACTIVE';
      break;
    case 'PENDING':
      status = 'PENDING';
      break;
    case 'CANCELLED':
      // A pending payment that never completed, or an order Play cancelled. Refunds come through voided purchases.
      status = 'EXPIRED';
      break;
    default:
      status = null;
  }
  if (status === null) return null;
  return {
    productId: expected,
    status,
    basePlanId: null,
    purchasedAt: str(r.purchaseCompletionTime),
    expiresAt: null,
    orderId: str(r.orderId),
    obfuscatedAccountId: accountHash(r.obfuscatedExternalAccountId),
    acknowledged: r.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    testPurchase: obj(r.testPurchaseContext) !== null,
  };
}

/** What a Real-time Developer Notification asks for. Every kind is re-verified with Play; the message's own fields are not trusted for state. */
export type Notification =
  | { kind: 'subscription'; packageName: string; purchaseToken: string }
  | { kind: 'one_time'; packageName: string; purchaseToken: string; productId: string }
  | { kind: 'voided'; packageName: string; purchaseToken: string }
  | { kind: 'test'; packageName: string };

/** A Pub/Sub push body (`{ message: { data: base64(DeveloperNotification) } }`) → what to do, or null when it isn't one. */
export function readNotification(body: unknown): Notification | null {
  const data = str(obj(obj(body)?.message)?.data);
  if (!data) return null;
  let n: Obj | null;
  try {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    n = obj(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
  const packageName = str(n?.packageName);
  if (!n || !packageName) return null;
  const sub = obj(n.subscriptionNotification);
  const one = obj(n.oneTimeProductNotification);
  const voided = obj(n.voidedPurchaseNotification);
  if (sub && str(sub.purchaseToken)) return { kind: 'subscription', packageName, purchaseToken: str(sub.purchaseToken)! };
  if (one && str(one.purchaseToken) && str(one.sku)) {
    return { kind: 'one_time', packageName, purchaseToken: str(one.purchaseToken)!, productId: str(one.sku)! };
  }
  if (voided && str(voided.purchaseToken)) return { kind: 'voided', packageName, purchaseToken: str(voided.purchaseToken)! };
  if (obj(n.testNotification)) return { kind: 'test', packageName };
  return null;
}

/** Compares two secrets without stopping at the first difference. */
export function sameSecret(given: string, expected: string): boolean {
  if (expected.length === 0) return false;
  let diff = given.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) diff |= (given.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** sha256, lower-case hex: how purchase tokens are stored (public.purchase_links, public.entitlements). */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}
