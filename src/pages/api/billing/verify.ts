/**
 * Lucento Pro: the app reports a Google Play purchase (lucento-android docs/monetization/SERVER_CONTRACT.md §3).
 *
 * POST /api/billing/verify with the signed-in person's Supabase token and { purchaseToken, productId, packageName }.
 * The purchase is read from the Play Developer API (never trusted from the request), linked to this account under the
 * linking rule, and written to public.entitlements, which the app reads under its own token. Acknowledging the purchase
 * stays the app's job (Billing Library); the answer says whether Play already has it.
 *
 * Answers: 200 { result: 'ok', status, acknowledged } · 400 bad_request · 401 sign_in_required ·
 * 403 test_purchase_refused · 404 purchase_not_found · 409 linked_elsewhere | review_required | other_account ·
 * 429 rate_limited · 502 play_unavailable | store_unavailable · 503 not_configured.
 * other_account (security audit F-03): Google Play says the purchase was made for a different Lucento account; nothing is
 * linked. rate_limited (F-11): this account's daily verification allowance is used up; the app tries again later.
 * Nothing about the person's money is sent or stored; request bodies are never logged.
 *
 * The first time a new purchase (ACTIVE or TRIAL, made in the last 3 days) is stored for this account, the person also
 * gets the Pro confirmation email (src/server/email.ts; once per purchase, never on a renewal or a re-check). Sending it
 * never changes this answer.
 */

import type { APIRoute } from 'astro';
import { methodGuard } from '../../../server/http';
import { billingConfig, json, verifyAndStore } from '../../../server/billing';
import { verifyAllowed } from '../../../server/quota';
import { emailConfig, purchaseEmailDue, sendOnce, signedInAccount, type Account } from '../../../server/email';
import { proPurchaseEmail } from '../../../server/email-templates';
import { isProductId, sha256Hex, type PlayReading } from '../../../server/play-state';

/** The Pro confirmation, at most once per purchase. Best effort: a failure is logged and the next verification retries. */
async function confirmPurchase(account: Account, token: string, reading: PlayReading): Promise<void> {
  const config = emailConfig();
  if (!config || !account.email || !purchaseEmailDue(reading.status, reading.purchasedAt, Date.now())) return;
  try {
    await sendOnce(config, account, 'pro_purchase', await sha256Hex(token), proPurchaseEmail(account.email, reading));
  } catch {
    console.error('email: the Pro confirmation failed');
  }
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const config = billingConfig();
  if (!config) return json(503, { error: 'not_configured' });

  const authorization = request.headers.get('authorization') ?? '';
  const account = await signedInAccount(config.supabaseUrl, config.publishableKey, authorization);
  if (!account) return json(401, { error: 'sign_in_required' });
  const user = account.id;

  let body: Record<string, unknown> | null = null;
  try {
    const parsed: unknown = await request.json();
    body = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    body = null;
  }
  const token = typeof body?.purchaseToken === 'string' ? body.purchaseToken : '';
  if (!body || token.length < 10 || token.length > 4096 || !isProductId(body.productId)) return json(400, { error: 'bad_request' });
  if (body.packageName !== undefined && body.packageName !== config.packageName) return json(400, { error: 'bad_request' });

  if (!(await verifyAllowed(config, authorization))) return json(429, { error: 'rate_limited' });

  const outcome = await verifyAndStore(config, user, token, body.productId);
  switch (outcome.kind) {
    case 'ok':
      await confirmPurchase(account, token, outcome.reading);
      return json(200, { result: 'ok', status: outcome.reading.status, acknowledged: outcome.reading.acknowledged });
    case 'linked_elsewhere':
    case 'review_required':
    case 'other_account':
      return json(409, { error: outcome.kind });
    case 'test_purchase_refused':
      return json(403, { error: outcome.kind });
    case 'not_found':
      return json(404, { error: 'purchase_not_found' });
    case 'mismatch':
      return json(400, { error: 'bad_request' });
    case 'play_unavailable':
    case 'store_unavailable':
      return json(502, { error: outcome.kind });
    case 'unlinked':
      // Only a notification (no account) can get this answer.
      return json(502, { error: 'store_unavailable' });
  }
};

// Every other method, OPTIONS included: 405 (204 for OPTIONS) with Allow; never a crash (security audit F-08).
export const ALL = methodGuard(['POST']);
