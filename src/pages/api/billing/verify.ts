/**
 * Lucento Pro: the app reports a Google Play purchase (lucento-android docs/monetization/SERVER_CONTRACT.md §3).
 *
 * POST /api/billing/verify with the signed-in person's Supabase token and { purchaseToken, productId, packageName }.
 * The purchase is read from the Play Developer API (never trusted from the request), linked to this account under the
 * linking rule, and written to public.entitlements, which the app reads under its own token. Acknowledging the purchase
 * stays the app's job (Billing Library); the answer says whether Play already has it.
 *
 * Answers: 200 { result: 'ok', status, acknowledged } · 400 bad_request · 401 sign_in_required · 404 purchase_not_found ·
 * 409 linked_elsewhere | review_required · 502 play_unavailable | store_unavailable · 503 not_configured.
 * Nothing about the person's money is sent or stored; request bodies are never logged.
 */

import type { APIRoute } from 'astro';
import { billingConfig, json, signedInUser, verifyAndStore } from '../../../server/billing';
import { isProductId } from '../../../server/play-state';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const config = billingConfig();
  if (!config) return json(503, { error: 'not_configured' });

  const user = await signedInUser(config, request.headers.get('authorization') ?? '');
  if (!user) return json(401, { error: 'sign_in_required' });

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

  const outcome = await verifyAndStore(config, user, token, body.productId);
  switch (outcome.kind) {
    case 'ok':
      return json(200, { result: 'ok', status: outcome.reading.status, acknowledged: outcome.reading.acknowledged });
    case 'linked_elsewhere':
    case 'review_required':
      return json(409, { error: outcome.kind });
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

export const GET: APIRoute = () => json(405, { error: 'method_not_allowed' });
