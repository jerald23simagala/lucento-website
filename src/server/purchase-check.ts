/**
 * The purchase check that needs no account (lucento-android docs/monetization/SERVER_CONTRACT.md §3b; owner decision
 * 2026-11-13). The app sends Google Play's signed purchase data exactly as Play gave it, so this endpoint can prove,
 * with Play's public licence key, that Google wrote it. Only then does it ask the Play Developer API. A made-up token
 * never costs Lucento's shared Play quota, and nobody learns anything about a purchase they don't already hold. The
 * pure parts live here so they are unit tests (purchase-check.test.ts).
 */

// Type-only, so Node's own test runner can load this file as it is (npm run test:unit).
import type { LucentoStatus, ProductId } from './play-state';

/** How long Google's last reading of a purchase answers for it before Google is asked again. */
export const CHECK_CACHE_MS = 60 * 60 * 1000;

const MAX_PURCHASE_DATA = 4096;
const MAX_SIGNATURE = 1024;

export interface CheckRequest {
  purchaseData: string;
  signature: string;
}

/** The request body, or null when it isn't one. Sizes are bounded before anything is decoded. */
export function parseCheckRequest(body: unknown): CheckRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.purchaseData !== 'string' || typeof b.signature !== 'string') return null;
  if (b.purchaseData.length === 0 || b.purchaseData.length > MAX_PURCHASE_DATA) return null;
  if (b.signature.length === 0 || b.signature.length > MAX_SIGNATURE) return null;
  return { purchaseData: b.purchaseData, signature: b.signature };
}

export interface SignedPurchase {
  packageName: string;
  productId: ProductId;
  purchaseToken: string;
}

/**
 * What a verified purchase data says: the app, the product and the token. Null when it isn't Lucento's purchase. Play
 * writes `productId` for older purchases and `productIds` for newer ones. Read only after the signature checks out.
 * [isProduct] is play-state's isProductId (passed in, so the list of products stays in one place).
 */
export function readSignedPurchase(purchaseData: string, isProduct: (v: unknown) => v is ProductId): SignedPurchase | null {
  let p: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(purchaseData);
    if (!parsed || typeof parsed !== 'object') return null;
    p = parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  const packageName = typeof p.packageName === 'string' ? p.packageName : '';
  const token = typeof p.purchaseToken === 'string' ? p.purchaseToken : '';
  const ids = Array.isArray(p.productIds) ? p.productIds : [p.productId];
  const productId = ids.find(isProduct);
  if (!packageName || !productId || token.length < 10 || token.length > 4096) return null;
  return { packageName, productId, purchaseToken: token };
}

function base64Bytes(text: string): Uint8Array<ArrayBuffer> | null {
  try {
    return Uint8Array.from(atob(text.trim()), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

/**
 * Google Play's purchase signature: RSA over the exact purchase data with SHA-1 (PKCS #1 v1.5), checked with the app's
 * licence key (Play Console › Monetization setup › Licensing, base64 X.509). The same key, decoded the same way, as the
 * app's PurchaseSignature. False for anything unreadable, never an exception.
 */
export async function verifyPurchaseSignature(licenceKey: string, purchaseData: string, signature: string): Promise<boolean> {
  const der = base64Bytes(licenceKey);
  const sig = base64Bytes(signature);
  if (!der || !sig || der.length === 0 || sig.length === 0) return false;
  try {
    const key = await crypto.subtle.importKey('spki', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-1' }, false, ['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, new TextEncoder().encode(purchaseData));
  } catch {
    return false;
  }
}

/** What Lucento last heard about a purchase (public.purchase_check_status). */
export interface StoredCheck {
  status: LucentoStatus | null;
  checkedAt: number | null;
  /** Refunded or charged back (lucento_private.revoked_purchases): final whatever Google's last reading said. */
  revoked: boolean;
}

export function readStoredCheck(raw: unknown): StoredCheck | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const checkedAt = typeof r.checked_at === 'string' ? Date.parse(r.checked_at) : NaN;
  return {
    status: typeof r.status === 'string' ? (r.status as LucentoStatus) : null,
    checkedAt: Number.isFinite(checkedAt) ? checkedAt : null,
    revoked: r.revoked === true,
  };
}

/**
 * Whether the stored answer stands without asking Google: a refund always does. A reading less than [CHECK_CACHE_MS]
 * old does too, so a phone retrying, or many phones of one buyer, cost one Play call an hour.
 */
export function storedAnswer(stored: StoredCheck | null, now: number): LucentoStatus | null {
  if (!stored) return null;
  if (stored.revoked) return 'REVOKED';
  if (stored.status && stored.checkedAt !== null && now - stored.checkedAt < CHECK_CACHE_MS && stored.checkedAt <= now) return stored.status;
  return null;
}
