/**
 * Lucento Pro: the daily refund check (lucento-android docs/monetization/SERVER_CONTRACT.md §5).
 *
 * Vercel Cron calls GET /api/billing/voided once a day (vercel.json) with `Authorization: Bearer <CRON_SECRET>`. It lists
 * Play's voided purchases (refunds and chargebacks) for the last 30 days and ends each one's entitlement rows, so a
 * missed push never leaves a refunded purchase active for more than a day. Idempotent: an already revoked purchase is
 * left as it is.
 *
 * Environment: as src/server/billing.ts, plus CRON_SECRET (Vercel sets the header from it).
 */

import type { APIRoute } from 'astro';
import { methodGuard } from '../../../server/http';
import { billingConfig, json, revokePurchase } from '../../../server/billing';
import { listVoided, playAccessToken } from '../../../server/play-api';
import { sameSecret } from '../../../server/play-state';

declare const process: { env: Record<string, string | undefined> };

export const prerender = false;

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000; // Play keeps 30 days; an hour's margin
const MAX_PAGES = 10;

export const GET: APIRoute = async ({ request }) => {
  const auth = request.headers.get('authorization') ?? '';
  if (!sameSecret(auth, `Bearer ${process.env.CRON_SECRET ?? ''}`) || !process.env.CRON_SECRET) return json(401, { error: 'unauthorized' });
  const config = billingConfig();
  if (!config) return json(503, { error: 'not_configured' });
  const access = await playAccessToken(config.serviceAccountJson);
  if (!access) return json(502, { error: 'play_unavailable' });

  let seen = 0;
  let revoked = 0;
  let failed = 0;
  let page: string | undefined;
  for (let i = 0; i < MAX_PAGES; i++) {
    const answer = await listVoided(access, config.packageName, Date.now() - WINDOW_MS, page);
    if (!answer.ok) {
      console.error(`voided: Play answered HTTP ${answer.status}`);
      return json(502, { error: 'play_unavailable', seen, revoked });
    }
    const body = (answer.body ?? {}) as { voidedPurchases?: unknown; tokenPagination?: { nextPageToken?: unknown } };
    const purchases = Array.isArray(body.voidedPurchases) ? body.voidedPurchases : [];
    for (const p of purchases) {
      const token = (p as { purchaseToken?: unknown } | null)?.purchaseToken;
      if (typeof token !== 'string' || token.length === 0) continue;
      seen++;
      const changed = await revokePurchase(config, token);
      if (changed === null) failed++;
      else revoked += changed;
    }
    page = typeof body.tokenPagination?.nextPageToken === 'string' ? body.tokenPagination.nextPageToken : undefined;
    if (!page) break;
  }
  console.log(`voided: ${seen} voided purchases checked, ${revoked} rows revoked, ${failed} failed`);
  return json(failed > 0 ? 502 : 200, { seen, revoked, failed });
};

// Every other method, OPTIONS included: 405 (204 for OPTIONS) with Allow; never a crash (security audit F-08).
export const ALL = methodGuard(['GET']);
