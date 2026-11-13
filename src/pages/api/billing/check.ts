/**
 * Lucento Pro: the purchase check that needs no account (lucento-android docs/monetization/SERVER_CONTRACT.md §3b;
 * docs/MONETIZATION.md §5.3 L-6; owner decision 2026-11-13).
 *
 * POST /api/billing/check with { purchaseData, signature }: Google Play's signed purchase data and its signature,
 * exactly as Play gave them to the app. No account and no token: a phone that is signed out, cleared or reinstalled
 * learns whether a purchase Google Play lists on it is still live, so a refunded purchase can't come back while Play's
 * copy on the phone lags behind the refund.
 *
 * - The signature is checked first, with Play's public licence key (LUCENTO_PLAY_LICENSE_KEY). Only data Google signed
 *   for Lucento reaches the Play Developer API, so a made-up token costs nothing and reveals nothing.
 * - A refund recorded by the notifications or the daily voided check always answers REVOKED. Otherwise Google's reading
 *   of the last hour answers; failing that, Google is asked and its reading kept (public.record_purchase_check).
 * - Nothing about the person is read or stored: a scrambled purchase token, the product, Google's state and the time.
 *   No account is linked (that's /api/billing/verify's job, signed in). Request bodies are never logged.
 *
 * Answers: 200 { status } · 400 bad_request | bad_signature · 404 purchase_not_found · 502 play_unavailable |
 * store_unavailable · 503 not_configured. The app treats anything but 200 as "no answer" and changes nothing.
 *
 * Environment: as src/server/billing.ts, plus LUCENTO_PLAY_LICENSE_KEY (Play Console › Monetize with Play ›
 * Monetization setup › Licensing; public by design, the same value the app is built with).
 */

import type { APIRoute } from 'astro';
import { methodGuard } from '../../../server/http';
import { billingConfig, json, purchaseCheckStatus, readPlayPurchase, recordPurchaseCheck } from '../../../server/billing';
import { isProductId, sha256Hex, type LucentoStatus } from '../../../server/play-state';
import { parseCheckRequest, readSignedPurchase, readStoredCheck, storedAnswer, verifyPurchaseSignature } from '../../../server/purchase-check';

declare const process: { env: Record<string, string | undefined> };

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const config = billingConfig();
  const licenceKey = process.env.LUCENTO_PLAY_LICENSE_KEY?.trim() ?? '';
  if (!config || !licenceKey) return json(503, { error: 'not_configured' });

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const req = parseCheckRequest(body);
  if (!req) return json(400, { error: 'bad_request' });
  if (!(await verifyPurchaseSignature(licenceKey, req.purchaseData, req.signature))) return json(400, { error: 'bad_signature' });
  const purchase = readSignedPurchase(req.purchaseData, isProductId);
  if (!purchase || purchase.packageName !== config.packageName) return json(400, { error: 'bad_request' });

  const tokenHash = await sha256Hex(purchase.purchaseToken);
  const stored = await purchaseCheckStatus(config, tokenHash);
  if (stored === null) return json(502, { error: 'store_unavailable' });
  const known = storedAnswer(readStoredCheck(stored), Date.now());
  if (known) return json(200, { status: known });

  const read = await readPlayPurchase(config, purchase.purchaseToken, purchase.productId);
  let status: LucentoStatus;
  switch (read.kind) {
    case 'ok':
      status = read.reading.status;
      break;
    case 'not_found':
      // 410: Google dropped a purchase that ended long ago. Anything else it doesn't know is no answer at all.
      if (!read.gone) return json(404, { error: 'purchase_not_found' });
      status = 'EXPIRED';
      break;
    case 'mismatch':
      return json(400, { error: 'bad_request' });
    case 'play_unavailable':
      return json(502, { error: 'play_unavailable' });
  }
  const answer = await recordPurchaseCheck(config, tokenHash, purchase.productId, status);
  if (answer === null) return json(502, { error: 'store_unavailable' });
  return json(200, { status: answer });
};

// Every other method, OPTIONS included: 405 (204 for OPTIONS) with Allow; never a crash (security audit F-08).
export const ALL = methodGuard(['POST']);
