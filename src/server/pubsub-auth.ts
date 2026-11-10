/**
 * Security audit F-10: authenticates Google Cloud Pub/Sub push requests (Play's Real-time Developer Notifications) by the
 * OIDC token Pub/Sub signs and sends as `Authorization: Bearer <JWT>` when the push subscription has authentication on.
 *
 * Checked, all of them: the RS256 signature against Google's published keys (by `kid`), the issuer (accounts.google.com),
 * the audience (the value set on the subscription), the expiry and issue time (60 s of clock skew), and that the token was
 * minted for the expected service account (`email`, with `email_verified`). Anything else — another algorithm, a missing
 * claim, an unknown key — is refused. Pure apart from fetching Google's keys, which is injected in tests.
 *
 * Environment (rtdn.ts): LUCENTO_RTDN_OIDC_AUDIENCE and LUCENTO_RTDN_OIDC_SERVICE_ACCOUNT. While they are unset the
 * endpoint keeps its query-string token alone (the mechanism in use today); once they are set, a push needs a valid
 * token, plus the query-string token too while LUCENTO_RTDN_PUSH_TOKEN is still set (two factors during the switch).
 */

import { createPublicKey, verify as verifySignature, type JsonWebKey } from 'node:crypto';

export const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);
const SKEW_S = 60;

export interface OidcExpectation {
  audience: string;
  serviceAccountEmail: string;
}

export type JwkSet = { keys: (JsonWebKey & { kid?: string })[] };
export type KeyFetcher = () => Promise<JwkSet | null>;

export type OidcResult = { ok: true } | { ok: false; reason: string };

const b64url = (s: string): Buffer => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

function parseJson(part: string): Record<string, unknown> | null {
  try {
    const v: unknown = JSON.parse(b64url(part).toString('utf8'));
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// Google rotates its keys every few days and publishes them ahead of use; an hour's cache keeps pushes off the network.
let cached: { at: number; keys: JwkSet } | null = null;
const CACHE_MS = 60 * 60 * 1000;

export const fetchGoogleKeys: KeyFetcher = async () => {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.keys;
  try {
    const res = await fetch(GOOGLE_CERTS_URL);
    if (!res.ok) return null;
    const body = (await res.json()) as JwkSet;
    if (!body || !Array.isArray(body.keys)) return null;
    cached = { at: Date.now(), keys: body };
    return body;
  } catch {
    return null;
  }
};

/** Verifies the push's `Authorization` header. [nowMs] and [keys] are injectable for tests. */
export async function verifyPushToken(
  authorization: string,
  expect: OidcExpectation,
  nowMs: number = Date.now(),
  keys: KeyFetcher = fetchGoogleKeys,
): Promise<OidcResult> {
  const m = /^Bearer ([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(authorization.trim());
  if (!m) return { ok: false, reason: 'no_bearer_jwt' };
  const [, h, p, sig] = m;
  const header = parseJson(h);
  const claims = parseJson(p);
  if (!header || !claims) return { ok: false, reason: 'malformed' };
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') return { ok: false, reason: 'algorithm' };

  const set = await keys();
  const jwk = set?.keys.find((k) => k.kid === header.kid && (k.kty === 'RSA'));
  if (!jwk) return { ok: false, reason: 'unknown_key' };
  let valid = false;
  try {
    const key = createPublicKey({ key: jwk, format: 'jwk' });
    valid = verifySignature('RSA-SHA256', Buffer.from(`${h}.${p}`), key, b64url(sig));
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, reason: 'signature' };

  const now = Math.floor(nowMs / 1000);
  if (typeof claims.iss !== 'string' || !ISSUERS.has(claims.iss)) return { ok: false, reason: 'issuer' };
  const aud = claims.aud;
  if (!(aud === expect.audience || (Array.isArray(aud) && aud.includes(expect.audience)))) return { ok: false, reason: 'audience' };
  if (typeof claims.exp !== 'number' || claims.exp + SKEW_S < now) return { ok: false, reason: 'expired' };
  if (typeof claims.iat !== 'number' || claims.iat - SKEW_S > now) return { ok: false, reason: 'not_yet_valid' };
  if (claims.email !== expect.serviceAccountEmail || claims.email_verified !== true) return { ok: false, reason: 'service_account' };
  return { ok: true };
}
