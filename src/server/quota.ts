/**
 * Per-account request allowance for the billing endpoints (security audit F-11). Kept apart from billing.ts so its tests
 * load it directly. Only the person's own token is sent: the database counts the account it names.
 */

import type { BillingConfig } from './billing';

/**
 * Security audit F-11: counts one verification for the signed-in person (public.consume_request_quota, called with their
 * own token, so the database knows who it is) and says whether today's allowance has room. Each verification spends Google
 * Play Developer API quota shared by every Lucento user. Fails open: if the counter can't be reached (or the migration
 * isn't applied yet), the purchase is still verified, so a paying person is never blocked by the counter itself.
 */
export async function verifyAllowed(c: Pick<BillingConfig, 'supabaseUrl' | 'publishableKey'>, authorization: string): Promise<boolean> {
  try {
    const res = await fetch(`${c.supabaseUrl}/rest/v1/rpc/consume_request_quota`, {
      method: 'POST',
      headers: { apikey: c.publishableKey, Authorization: authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_kind: 'billing_verify' }),
    });
    if (!res.ok) {
      console.error(`billing: consume_request_quota answered HTTP ${res.status}`);
      return true;
    }
    const body = (await res.json()) as { allowed?: unknown } | null;
    return body?.allowed !== false;
  } catch {
    console.error("billing: consume_request_quota couldn't be reached");
    return true;
  }
}

