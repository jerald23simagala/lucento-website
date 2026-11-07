/**
 * The Google Play Developer API, as Lucento's billing endpoints use it (src/pages/api/billing/*). Authenticates as the
 * Play Console service account (LUCENTO_PLAY_SERVICE_ACCOUNT_JSON, Vercel env only; it needs "View financial data" and
 * "Manage orders and subscriptions") with a signed JWT — Web Crypto, no SDK. Access tokens are cached per function
 * instance until shortly before they expire. Nothing here logs tokens, purchase tokens or response bodies.
 */

const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
const SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
const CALL_TIMEOUT_MS = 8_000;

export interface PlayAnswer {
  ok: boolean;
  /** HTTP status; 0 when Play couldn't be reached. */
  status: number;
  body: unknown;
}

export interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri: string;
}

let cachedToken: { value: string; until: number; account: string } | null = null;

function readServiceAccount(json: string): ServiceAccount | null {
  try {
    const a = JSON.parse(json) as Record<string, unknown>;
    if (typeof a.client_email !== 'string' || typeof a.private_key !== 'string') return null;
    const tokenUri = typeof a.token_uri === 'string' && a.token_uri.startsWith('https://') ? a.token_uri : 'https://oauth2.googleapis.com/token';
    return { client_email: a.client_email, private_key: a.private_key, token_uri: tokenUri };
  } catch {
    return null;
  }
}

const b64url = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlText = (text: string): string => b64url(new TextEncoder().encode(text));

/** The service account's signed JWT for Google's token endpoint (RS256). Exported for its test. */
export async function signedAssertion(account: ServiceAccount, now: number): Promise<string> {
  const pem = account.private_key.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const iat = Math.floor(now / 1000);
  const unsigned = `${b64urlText(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64urlText(
    JSON.stringify({ iss: account.client_email, scope: SCOPE, aud: account.token_uri, iat, exp: iat + 3600 }),
  )}`;
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)));
  return `${unsigned}.${b64url(signature)}`;
}

/** An access token for the Play Developer API, or null when the service account is missing, malformed or refused. */
export async function playAccessToken(serviceAccountJson: string | undefined, now = Date.now()): Promise<string | null> {
  if (!serviceAccountJson) return null;
  const account = readServiceAccount(serviceAccountJson);
  if (!account) {
    console.error('billing: LUCENTO_PLAY_SERVICE_ACCOUNT_JSON is not a service account key');
    return null;
  }
  if (cachedToken && cachedToken.account === account.client_email && cachedToken.until > now) return cachedToken.value;
  try {
    const assertion = await signedAssertion(account, now);
    const res = await fetch(account.token_uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString(),
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`billing: Google token endpoint answered HTTP ${res.status}`);
      return null;
    }
    const body = (await res.json()) as { access_token?: unknown; expires_in?: unknown };
    if (typeof body.access_token !== 'string') return null;
    const seconds = typeof body.expires_in === 'number' ? body.expires_in : 3600;
    cachedToken = { value: body.access_token, until: now + Math.max(60, seconds - 120) * 1000, account: account.client_email };
    return body.access_token;
  } catch (e) {
    console.error(`billing: Google token request failed (${(e as Error).name})`);
    return null;
  }
}

async function get(accessToken: string, url: string): Promise<PlayAnswer> {
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(CALL_TIMEOUT_MS) });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { ok: res.ok, status: res.status, body };
  } catch {
    return { ok: false, status: 0, body: null };
  }
}

const seg = encodeURIComponent;

/** purchases.subscriptionsv2.get */
export const getSubscription = (accessToken: string, packageName: string, purchaseToken: string): Promise<PlayAnswer> =>
  get(accessToken, `${API}/${seg(packageName)}/purchases/subscriptionsv2/tokens/${seg(purchaseToken)}`);

/** purchases.productsv2.getproductpurchasev2 */
export const getProduct = (accessToken: string, packageName: string, purchaseToken: string): Promise<PlayAnswer> =>
  get(accessToken, `${API}/${seg(packageName)}/purchases/productsv2/tokens/${seg(purchaseToken)}`);

/** purchases.voidedpurchases.list: refunds and chargebacks since [startTimeMillis] (Play keeps 30 days), subscriptions included. */
export const listVoided = (accessToken: string, packageName: string, startTimeMillis: number, pageToken?: string): Promise<PlayAnswer> => {
  const q = new URLSearchParams({ startTime: String(Math.floor(startTimeMillis)), type: '1', maxResults: '1000' });
  if (pageToken) q.set('token', pageToken);
  return get(accessToken, `${API}/${seg(packageName)}/purchases/voidedpurchases?${q.toString()}`);
};
