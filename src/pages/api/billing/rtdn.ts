/**
 * Lucento Pro: Google Play's Real-time Developer Notifications (lucento-android docs/monetization/SERVER_CONTRACT.md §4).
 *
 * A Pub/Sub push subscription on the topic set in Play Console › Monetization setup posts here, to
 * /api/billing/rtdn?token=<LUCENTO_RTDN_PUSH_TOKEN>. The token in the URL is the shared secret that tells Play's pushes
 * apart from anyone else's. Every notification is re-verified with the Play Developer API (its own fields are never
 * trusted for state) and written to the account the purchase is linked to; a refund ends the purchase on that account.
 *
 * Answers 200 once handled (or when there's nothing to do), so Pub/Sub stops retrying; 502 when Play or the database
 * didn't answer, so it retries later; 401 for a push without the secret. Idempotent: the same message twice writes the
 * same rows.
 *
 * Environment: as src/server/billing.ts, plus LUCENTO_RTDN_PUSH_TOKEN (secret, any long random string).
 *
 * Security audit F-10, Pub/Sub push authentication (OIDC): once LUCENTO_RTDN_OIDC_AUDIENCE and
 * LUCENTO_RTDN_OIDC_SERVICE_ACCOUNT are set, every push must also carry a valid Google-signed token for that audience and
 * service account (src/server/pubsub-auth.ts). The query-string token stays required while LUCENTO_RTDN_PUSH_TOKEN is set,
 * so it is removed only after the OIDC token has been seen working (docs/security/OWNER_ACTIONS_REQUIRED.md §12).
 */

import type { APIRoute } from 'astro';
import { methodGuard } from '../../../server/http';
import { billingConfig, json, revokePurchase, verifyAndStore } from '../../../server/billing';
import { isProductId, readNotification, sameSecret } from '../../../server/play-state';
import { verifyPushToken } from '../../../server/pubsub-auth';

declare const process: { env: Record<string, string | undefined> };

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  const secret = process.env.LUCENTO_RTDN_PUSH_TOKEN ?? '';
  const audience = process.env.LUCENTO_RTDN_OIDC_AUDIENCE ?? '';
  const serviceAccount = process.env.LUCENTO_RTDN_OIDC_SERVICE_ACCOUNT ?? '';
  const oidc = audience !== '' && serviceAccount !== '';
  // The shared token: required whenever it is set, and always while OIDC isn't configured (an unset secret matches nothing).
  if ((secret !== '' || !oidc) && !sameSecret(url.searchParams.get('token') ?? '', secret)) return json(401, { error: 'unauthorized' });
  if (oidc) {
    const checked = await verifyPushToken(request.headers.get('authorization') ?? '', { audience, serviceAccountEmail: serviceAccount });
    if (!checked.ok) {
      console.error(`rtdn: push authentication refused (${checked.reason})`);
      return json(401, { error: 'unauthorized' });
    }
  }
  const config = billingConfig();
  if (!config) return json(503, { error: 'not_configured' });

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const n = readNotification(body);
  // Not a notification Lucento understands, or for another app: acknowledge it so it isn't redelivered forever.
  if (!n || n.packageName !== config.packageName || n.kind === 'test') return json(200, { result: 'ignored' });

  if (n.kind === 'voided') {
    const changed = await revokePurchase(config, n.purchaseToken);
    return changed === null ? json(502, { error: 'store_unavailable' }) : json(200, { result: 'revoked', rows: changed });
  }

  const productId = n.kind === 'one_time' ? n.productId : 'lucento_pro';
  if (!isProductId(productId)) return json(200, { result: 'ignored' });
  // A subscription notification doesn't say which subscription; try Pro, then the Cloud add-on.
  let outcome = await verifyAndStore(config, null, n.purchaseToken, productId);
  if (n.kind === 'subscription' && outcome.kind === 'mismatch') {
    outcome = await verifyAndStore(config, null, n.purchaseToken, 'lucento_cloud');
  }
  switch (outcome.kind) {
    case 'ok':
    case 'unlinked':
      return json(200, { result: outcome.kind });
    case 'not_found':
    case 'mismatch':
    case 'linked_elsewhere':
    case 'review_required':
    case 'other_account':
    case 'test_purchase_refused':
      return json(200, { result: 'ignored' });
    case 'play_unavailable':
    case 'store_unavailable':
      return json(502, { error: outcome.kind });
  }
};

// Every other method, OPTIONS included: 405 (204 for OPTIONS) with Allow; never a crash (security audit F-08).
export const ALL = methodGuard(['POST']);
