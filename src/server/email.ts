/**
 * Sends Lucento's account emails through Resend (lucento-android docs/EMAILS.md): the welcome note
 * (/api/account/welcome) and the Pro purchase confirmation (/api/billing/verify). Supabase Auth sends the verification
 * email itself, through the same Resend domain over SMTP.
 *
 * Each email is claimed first in public.account_emails (service role), so retries, a second phone or a renewal never
 * send it twice; a failed send gives the claim back. Nothing about the person's money is sent: the address comes from
 * Supabase Auth, and the purchase details from Google Play.
 *
 * Environment (Vercel → Settings → Environment Variables, Production; .env.example):
 *   SUPABASE_URL / LUCENTO_SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY / LUCENTO_SUPABASE_PUBLISHABLE_KEY
 *   LUCENTO_SUPABASE_SERVICE_ROLE_KEY   secret, shared with billing: the only key allowed to call claim_account_email
 *   LUCENTO_RESEND_API_KEY              secret: a Resend key with sending access to send.lucentoapp.com
 *   LUCENTO_EMAIL_FROM                  optional, default "Lucento <hello@send.lucentoapp.com>"
 *   LUCENTO_EMAIL_REPLY_TO              optional, default lucentoapp@gmail.com
 */

import type { Email } from './email-templates';

declare const process: { env: Record<string, string | undefined> };

export interface EmailConfig {
  supabaseUrl: string;
  publishableKey: string;
  serviceKey: string;
  resendKey: string;
  from: string;
  replyTo: string;
}

export function emailConfig(): EmailConfig | null {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.LUCENTO_SUPABASE_URL)?.replace(/\/$/, '');
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.LUCENTO_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.LUCENTO_SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.LUCENTO_RESEND_API_KEY;
  if (!supabaseUrl || !publishableKey || !serviceKey || !resendKey) return null;
  return {
    supabaseUrl,
    publishableKey,
    serviceKey,
    resendKey,
    from: process.env.LUCENTO_EMAIL_FROM || 'Lucento <hello@send.lucentoapp.com>',
    replyTo: process.env.LUCENTO_EMAIL_REPLY_TO || 'lucentoapp@gmail.com',
  };
}

/** The signed-in account behind a Supabase token, as Supabase Auth reports it. */
export interface Account {
  id: string;
  email: string | null;
  /** RFC 3339; null while an email sign-up is unverified. Google sign-ins are verified from the start. */
  emailConfirmedAt: string | null;
  createdAt: string | null;
}

export function readAccount(raw: unknown): Account | null {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  if (typeof u.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(u.id)) return null;
  const s = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);
  const email = s(u.email);
  return {
    id: u.id.toLowerCase(),
    email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
    emailConfirmedAt: s(u.email_confirmed_at) ?? s(u.confirmed_at),
    createdAt: s(u.created_at),
  };
}

export async function signedInAccount(supabaseUrl: string, publishableKey: string, authorization: string): Promise<Account | null> {
  if (!/^Bearer\s+\S+$/.test(authorization)) return null;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: publishableKey, Authorization: authorization } });
    if (!res.ok) return null;
    return readAccount(await res.json());
  } catch {
    return null;
  }
}

const serviceHeaders = (c: EmailConfig): Record<string, string> => ({
  apikey: c.serviceKey,
  ...(c.serviceKey.startsWith('eyJ') ? { Authorization: `Bearer ${c.serviceKey}` } : {}),
  'Content-Type': 'application/json',
});

export type EmailKind = 'welcome' | 'pro_purchase';

async function claimCall(c: EmailConfig, fn: 'claim_account_email' | 'release_account_email', user: string, kind: EmailKind, ref: string) {
  try {
    const res = await fetch(`${c.supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: serviceHeaders(c),
      body: JSON.stringify({ p_user: user, p_kind: kind, p_ref: ref }),
    });
    if (!res.ok) {
      console.error(`email: ${fn} answered HTTP ${res.status}`);
      return null;
    }
    return (await res.json().catch(() => null)) as unknown;
  } catch {
    console.error(`email: ${fn} couldn't be reached`);
    return null;
  }
}

/** Resend's POST /emails. True when Resend accepted it. */
async function deliver(c: EmailConfig, to: string, email: Email, idempotencyKey: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${c.resendKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ from: c.from, to: [to], reply_to: c.replyTo, subject: email.subject, html: email.html, text: email.text }),
    });
    if (!res.ok) console.error(`email: Resend answered HTTP ${res.status}`);
    return res.ok;
  } catch {
    console.error("email: Resend couldn't be reached");
    return false;
  }
}

export type SendOutcome = 'sent' | 'already_sent' | 'failed';

/** Claims [kind]/[ref] for [account], sends it, and gives the claim back if the send fails. */
export async function sendOnce(c: EmailConfig, account: Account, kind: EmailKind, ref: string, email: Email): Promise<SendOutcome> {
  if (!account.email) return 'failed';
  const claimed = await claimCall(c, 'claim_account_email', account.id, kind, ref);
  if (claimed === false) return 'already_sent';
  if (claimed !== true) return 'failed';
  const ok = await deliver(c, account.email, email, `${kind}-${account.id}-${ref}`.slice(0, 256));
  if (!ok) await claimCall(c, 'release_account_email', account.id, kind, ref);
  return ok ? 'sent' : 'failed';
}

/** A welcome only makes sense near the start: accounts older than this get none (and old test accounts stay quiet). */
export const WELCOME_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function welcomeDue(a: Account, now: number): 'due' | 'unverified' | 'too_old' | 'no_email' {
  if (!a.email) return 'no_email';
  if (!a.emailConfirmedAt) return 'unverified';
  const created = a.createdAt ? Date.parse(a.createdAt) : NaN;
  if (!Number.isFinite(created) || now - created > WELCOME_WINDOW_MS) return 'too_old';
  return 'due';
}

/** A purchase confirmation is for a new purchase, not a restore on another account or a long-running subscription. */
export const PURCHASE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export function purchaseEmailDue(status: string, purchasedAt: string | null, now: number): boolean {
  if (status !== 'ACTIVE' && status !== 'TRIAL') return false;
  const t = purchasedAt ? Date.parse(purchasedAt) : NaN;
  return Number.isFinite(t) && now - t <= PURCHASE_WINDOW_MS;
}
