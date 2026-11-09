/**
 * The welcome email (lucento-android docs/EMAILS.md). The app calls this once per account after it is signed in; the
 * email goes out only when the account's address is verified, the account is new (14 days), and no welcome was sent
 * before, whichever phone asks first.
 *
 * POST /api/account/welcome with the signed-in person's Supabase token, no body.
 * Answers: 200 { result: 'sent' | 'already_sent' | 'too_old' } · 401 sign_in_required · 409 unverified | no_email ·
 * 502 send_failed · 503 not_configured. The app stops asking on 200 and keeps asking on the next launch otherwise.
 */

import type { APIRoute } from 'astro';
import { json } from '../../../server/billing';
import { emailConfig, sendOnce, signedInAccount, welcomeDue } from '../../../server/email';
import { welcomeEmail } from '../../../server/email-templates';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const config = emailConfig();
  if (!config) return json(503, { error: 'not_configured' });

  const account = await signedInAccount(config.supabaseUrl, config.publishableKey, request.headers.get('authorization') ?? '');
  if (!account) return json(401, { error: 'sign_in_required' });

  const due = welcomeDue(account, Date.now());
  if (due === 'too_old') return json(200, { result: 'too_old' });
  if (due !== 'due') return json(409, { error: due });

  const outcome = await sendOnce(config, account, 'welcome', '', welcomeEmail(account.email!));
  return outcome === 'failed' ? json(502, { error: 'send_failed' }) : json(200, { result: outcome });
};

export const GET: APIRoute = () => json(405, { error: 'method_not_allowed' });
