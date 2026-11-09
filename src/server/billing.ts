/**
 * The one way a Google Play purchase becomes a Lucento entitlement (lucento-android docs/monetization/SERVER_CONTRACT.md
 * §3–§5): ask Play for the purchase's current state, then hand it to public.apply_play_purchase, which applies the
 * account-linking rule and writes the rows in one transaction. Used by /api/billing/verify (for the signed-in account)
 * and /api/billing/rtdn (for the account the purchase is linked to).
 *
 * Environment (Vercel → Settings → Environment Variables; .env.example):
 *   SUPABASE_URL / LUCENTO_SUPABASE_URL                       the project the app syncs with
 *   SUPABASE_PUBLISHABLE_KEY / LUCENTO_SUPABASE_PUBLISHABLE_KEY  to check the person's token, as /api/ask does
 *   LUCENTO_SUPABASE_SERVICE_ROLE_KEY   secret: the only key allowed to call apply_play_purchase / revoke_play_purchase
 *   LUCENTO_PLAY_SERVICE_ACCOUNT_JSON   secret: the Play Console service account's JSON key
 *   LUCENTO_PLAY_PACKAGE_NAME           optional, default com.lucento.app
 */

import { getProduct, getSubscription, playAccessToken } from './play-api';
import { isSubscription, readProductV2, readSubscriptionV2, sha256Hex, type PlayReading, type ProductId } from './play-state';

declare const process: { env: Record<string, string | undefined> };

export const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export interface BillingConfig {
  supabaseUrl: string;
  publishableKey: string;
  serviceKey: string;
  serviceAccountJson: string;
  packageName: string;
}

export function billingConfig(): BillingConfig | null {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.LUCENTO_SUPABASE_URL)?.replace(/\/$/, '');
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.LUCENTO_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.LUCENTO_SUPABASE_SERVICE_ROLE_KEY;
  const serviceAccountJson = process.env.LUCENTO_PLAY_SERVICE_ACCOUNT_JSON;
  if (!supabaseUrl || !publishableKey || !serviceKey || !serviceAccountJson) return null;
  return { supabaseUrl, publishableKey, serviceKey, serviceAccountJson, packageName: process.env.LUCENTO_PLAY_PACKAGE_NAME || 'com.lucento.app' };
}

/** Supabase's headers for the service role. A legacy JWT key goes in Authorization too; a new secret key only in apikey. */
const serviceHeaders = (c: BillingConfig): Record<string, string> => ({
  apikey: c.serviceKey,
  ...(c.serviceKey.startsWith('eyJ') ? { Authorization: `Bearer ${c.serviceKey}` } : {}),
  'Content-Type': 'application/json',
});

// The signed-in account is read by src/server/email.ts signedInAccount (id and address, one Supabase Auth call).

async function rpc(c: BillingConfig, name: string, args: Record<string, unknown>): Promise<{ ok: boolean; status: number; body: unknown }> {
  try {
    const res = await fetch(`${c.supabaseUrl}/rest/v1/rpc/${name}`, { method: 'POST', headers: serviceHeaders(c), body: JSON.stringify(args) });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (!res.ok) console.error(`billing: ${name} answered HTTP ${res.status}`);
    return { ok: res.ok, status: res.status, body };
  } catch {
    console.error(`billing: ${name} couldn't be reached`);
    return { ok: false, status: 0, body: null };
  }
}

export type ApplyOutcome =
  | { kind: 'ok'; reading: PlayReading }
  | { kind: 'unlinked' }
  | { kind: 'linked_elsewhere' }
  | { kind: 'review_required' }
  | { kind: 'not_found' }
  | { kind: 'mismatch' }
  | { kind: 'play_unavailable' }
  | { kind: 'store_unavailable' };

/** Reads [purchaseToken] from Play and stores it for [user] (null: the account it is already linked to). */
export async function verifyAndStore(
  c: BillingConfig,
  user: string | null,
  purchaseToken: string,
  productId: ProductId,
  now = Date.now(),
): Promise<ApplyOutcome> {
  const access = await playAccessToken(c.serviceAccountJson, now);
  if (!access) return { kind: 'play_unavailable' };
  const answer = isSubscription(productId)
    ? await getSubscription(access, c.packageName, purchaseToken)
    : await getProduct(access, c.packageName, purchaseToken);
  // 400 / 404 / 410: Play doesn't know this token for this app (made up, another app's, or long gone).
  if (answer.status === 400 || answer.status === 404 || answer.status === 410) return { kind: 'not_found' };
  if (!answer.ok) {
    console.error(`billing: Play answered HTTP ${answer.status}`);
    return { kind: 'play_unavailable' };
  }
  const reading = isSubscription(productId) ? readSubscriptionV2(answer.body, now) : readProductV2(answer.body, productId);
  if (!reading) return { kind: 'play_unavailable' };
  // The app said which product; Play's answer must agree (a token from one product can't buy another).
  if (reading.productId !== productId) return { kind: 'mismatch' };

  const stored = await rpc(c, 'apply_play_purchase', {
    p_user: user,
    p_token_hash: await sha256Hex(purchaseToken),
    p_order_id: reading.orderId,
    p_product_id: reading.productId,
    p_obfuscated_account_id: reading.obfuscatedAccountId,
    p_status: reading.status,
    p_base_plan_id: reading.basePlanId,
    p_purchased_at: reading.purchasedAt,
    p_expires_at: reading.expiresAt,
  });
  if (!stored.ok) return { kind: 'store_unavailable' };
  const result = (stored.body as { result?: unknown } | null)?.result;
  switch (result) {
    case 'ok':
      return { kind: 'ok', reading };
    case 'unlinked':
      return { kind: 'unlinked' };
    case 'linked_elsewhere':
      return { kind: 'linked_elsewhere' };
    case 'review_required':
      return { kind: 'review_required' };
    default:
      return { kind: 'store_unavailable' };
  }
}

/** Ends every row of a refunded purchase (public.revoke_play_purchase). Returns how many rows changed, or null on failure. */
export async function revokePurchase(c: BillingConfig, purchaseToken: string): Promise<number | null> {
  const res = await rpc(c, 'revoke_play_purchase', { p_token_hash: await sha256Hex(purchaseToken) });
  return res.ok && typeof res.body === 'number' ? res.body : null;
}
