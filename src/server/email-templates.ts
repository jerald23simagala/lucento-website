/**
 * Lucento's account emails, as HTML and plain text (lucento-android docs/EMAILS.md). Pure: no network, no environment,
 * so every email is a unit test (src/server/email-templates.test.ts, `npm run test:unit`).
 *
 * Email-safe on purpose, like supabase/templates/confirm-signup.html in lucento-android: tables, inline styles, system
 * fonts, light only, and hosted PNGs (WebP doesn't show in every mail client). Copy rules (docs/monetization/CUSTOMER_COPY.md):
 * no prices (Google Play's receipt has them), no "no ads" promise, never call the on-phone reader AI, and Lifetime always
 * separates what is owned from the online services.
 */

import type { LucentoStatus, ProductId } from './play-state';

export interface Email {
  subject: string;
  html: string;
  text: string;
}

export const SITE = 'https://www.lucentoapp.com';
const PLAY_SUBSCRIPTIONS = 'https://play.google.com/store/account/subscriptions';

const INK = '#17233F';
const BODY = '#3A4560';
const MUTED = '#5B6680';
const LINK = '#2447C7';
const PAGE = '#FFFDF5';
const LINE = '#E3E8F4';
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** "9 November 2026", in UTC, so the same purchase reads the same date wherever the server runs. */
export function longDate(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(t);
}

interface Section {
  title: string;
  body: string;
}

interface Layout {
  preheader: string;
  mascot: { src: string; alt: string };
  heading: string;
  lead: string;
  /** Label/value rows in a quiet panel (plan details). */
  facts?: [string, string][];
  sectionsTitle?: string;
  sections: Section[];
  closing: string;
  /** A link after the closing line: shown as a link in HTML, with its address in the text part. */
  closingLink?: { label: string; href: string; after: string };
  /** Who it was sent to and why (footer). */
  reason: string;
}

function html(l: Layout): string {
  const facts = l.facts?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background:${PAGE};border:1px solid ${LINE};border-radius:14px;">
${l.facts
  .map(
    ([k, v], i) => `                  <tr>
                    <td style="padding:${i === 0 ? '14px' : '6px'} 16px ${i === l.facts!.length - 1 ? '14px' : '6px'};font-size:14px;line-height:1.4;color:${MUTED};">${escapeHtml(k)}</td>
                    <td align="right" style="padding:${i === 0 ? '14px' : '6px'} 16px ${i === l.facts!.length - 1 ? '14px' : '6px'};font-size:14px;line-height:1.4;font-weight:700;color:${INK};">${escapeHtml(v)}</td>
                  </tr>`,
  )
  .join('\n')}
                </table>`
    : '';
  const sections = l.sections
    .map(
      (s) => `                  <tr>
                    <td width="22" valign="top" style="padding:2px 0 14px;font-size:16px;line-height:1.4;color:#3563F5;font-weight:700;">&#10003;</td>
                    <td valign="top" style="padding:0 0 14px 8px;font-size:15px;line-height:1.5;color:${BODY};">
                      <strong style="color:${INK};">${escapeHtml(s.title)}</strong><br />${escapeHtml(s.body)}
                    </td>
                  </tr>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(l.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:${PAGE};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(l.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
            <tr>
              <td align="center" style="padding-bottom:8px;">
                <img src="${SITE}${l.mascot.src}" width="120" height="120" alt="${escapeHtml(l.mascot.alt)}" style="display:block;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="background:#FFFFFF;border:1px solid ${LINE};border-radius:20px;padding:32px 28px;font-family:${FONT};color:${INK};">
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;font-weight:700;color:${INK};">${escapeHtml(l.heading)}</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:${BODY};">${escapeHtml(l.lead)}</p>
                ${facts}
                ${l.sectionsTitle ? `<p style="margin:0 0 12px;font-size:13px;line-height:1.4;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${MUTED};">${escapeHtml(l.sectionsTitle)}</p>` : ''}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
${sections}
                </table>
                <p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:${BODY};">${escapeHtml(l.closing)}${
                  l.closingLink
                    ? ` <a href="${l.closingLink.href}" style="color:${LINK};">${escapeHtml(l.closingLink.label)}</a>${escapeHtml(l.closingLink.after)}`
                    : ''
                }</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 8px 0;font-family:${FONT};font-size:12px;line-height:1.5;color:${MUTED};">
                ${escapeHtml(l.reason)}<br /><br />
                Lucento · <a href="${SITE}" style="color:${LINK};">lucentoapp.com</a> ·
                <a href="${SITE}/privacy" style="color:${LINK};">Privacy</a> ·
                <a href="${SITE}/terms" style="color:${LINK};">Terms</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

function text(l: Layout): string {
  const facts = l.facts?.length ? l.facts.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\n' : '';
  const title = l.sectionsTitle ? `${l.sectionsTitle}\n\n` : '';
  const sections = l.sections.map((s) => `- ${s.title}: ${s.body}`).join('\n');
  const link = l.closingLink ? ` ${l.closingLink.label} (${l.closingLink.href})${l.closingLink.after}` : '';
  return `${l.heading}\n\n${l.lead}\n\n${facts}${title}${sections}\n\n${l.closing}${link}\n\n--\n${l.reason}\nLucento · ${SITE} · Privacy: ${SITE}/privacy · Terms: ${SITE}/terms\n`;
}

const build = (subject: string, l: Layout): Email => ({ subject, html: html(l), text: text(l) });

// ------------------------------------------------------------------------------------------------------- welcome

/** After the account's email is verified (email sign-up) or on its first sign-in (Google). */
export function welcomeEmail(address: string): Email {
  return build('Welcome to Lucento', {
    preheader: 'Your account is ready. Three things that make the first week easy.',
    mascot: { src: '/email/welcome-mascot.png', alt: 'Lucento’s mascot holding a torch' },
    heading: 'You’re all set',
    lead:
      'Your Lucento account is ready. Lucento still works fully on your phone, and with sync on, your records are ' +
      'backed up to your account and the same on every phone you sign in to.',
    sectionsTitle: 'Your first week',
    sections: [
      {
        title: 'Type it like a text',
        body: 'Tap + and write it the way you’d text a friend: “coffee 4.50, groceries 85”. Check the rows, then save.',
      },
      {
        title: 'Give each category a budget',
        body: 'Lucento compares what you’ve spent with how far the month has gone and shows what’s safe to spend.',
      },
      {
        title: 'Add every account',
        body: 'Cash, bank accounts, e-wallets, cards and loans add up to one net worth.',
      },
    ],
    closing: 'Questions or ideas? Reply to this email. A person reads every one.',
    reason: `You’re receiving this because a Lucento account was created with ${address}. Lucento only emails you about your account.`,
  });
}

// --------------------------------------------------------------------------------------------- Pro confirmation

export interface ProPurchase {
  productId: ProductId;
  status: LucentoStatus;
  basePlanId: string | null;
  purchasedAt: string | null;
  expiresAt: string | null;
  orderId: string | null;
}

const PRO_FEATURES: Section[] = [
  { title: 'Every wallet, every currency', body: 'Unlimited wallets, cards and loans, wallets in other currencies, and what others owe you.' },
  { title: 'Bigger plans', body: 'Up to 20 savings goals, Insights over 12 months, and statements as PDF.' },
  { title: 'Online services', body: 'Cloud sync, restore from your account, Lucento Shared with a partner, and the AI adviser’s larger allowance.' },
  { title: 'All five themes', body: 'Grove, Mono and Aurora join Sunrise and Midnight.' },
];

const LIFETIME_FEATURES: Section[] = [
  { title: 'Yours for good', body: 'Every Pro feature that runs on your phone: unlimited wallets, other currencies, 20 goals, 12-month Insights, PDF statements and all five themes. No renewal, no expiry.' },
  {
    title: 'Online services for 12 months',
    body: 'Cloud sync, restore from your account, Lucento Shared and the AI adviser’s larger allowance are included for a year. After that you can keep them with Lucento Cloud, or carry on without them.',
  },
];

const CLOUD_FEATURES: Section[] = [
  { title: 'Your online services are back', body: 'Cloud sync, restore from your account, Lucento Shared and the AI adviser’s larger allowance.' },
  { title: 'Lifetime is unchanged', body: 'Everything you own keeps working on your phone, with or without Lucento Cloud.' },
];

const planName = (p: ProPurchase): string => {
  const cadence = p.basePlanId === 'annual' ? 'yearly' : p.basePlanId === 'monthly' ? 'monthly' : null;
  switch (p.productId) {
    case 'lucento_pro_lifetime':
      return 'Pro Lifetime';
    case 'lucento_cloud':
      return cadence ? `Lucento Cloud (${cadence})` : 'Lucento Cloud';
    case 'lucento_pro':
      return cadence ? `Lucento Pro (${cadence})` : 'Lucento Pro';
  }
};

const LIFETIME_SERVICES_DAYS = 365;

/** When the purchase first becomes this account's plan (verify.ts, once per purchase). */
export function proPurchaseEmail(address: string, p: ProPurchase): Email {
  const started = longDate(p.purchasedAt);
  const ends = longDate(p.expiresAt);
  const facts: [string, string][] = [['Plan', planName(p)]];
  if (started) facts.push(['Started', started]);
  const reason = `You’re receiving this because ${address} bought ${planName(p)} in the Lucento app. Google Play sends the receipt with the price.`;

  if (p.productId === 'lucento_pro_lifetime') {
    const purchased = p.purchasedAt ? Date.parse(p.purchasedAt) : NaN;
    const servicesUntil = Number.isFinite(purchased)
      ? longDate(new Date(purchased + LIFETIME_SERVICES_DAYS * 24 * 60 * 60 * 1000).toISOString())
      : null;
    if (servicesUntil) facts.push(['Online services until', servicesUntil]);
    if (p.orderId) facts.push(['Order', p.orderId]);
    return build('Pro Lifetime is yours', {
      preheader: 'Pay once, keep it. Here’s what’s yours and what’s included for the first year.',
      mascot: { src: '/email/pro-mascot.png', alt: 'Lucento’s mascot' },
      heading: 'Pro Lifetime is yours',
      lead:
        'Thank you for backing Lucento. Every Pro feature is unlocked on your phone now, and it keeps working offline. ' +
        'If you change phones, sign in to Google Play with the same account and it comes back by itself.',
      facts,
      sectionsTitle: 'What you have',
      sections: LIFETIME_FEATURES,
      closing: 'Questions about your purchase? Reply to this email.',
      reason,
    });
  }

  const trial = p.status === 'TRIAL';
  if (ends) facts.push([trial ? 'Free trial ends' : 'Renews', ends]);
  if (p.orderId) facts.push(['Order', p.orderId]);
  const manage = { label: 'Google Play › Payments & subscriptions', href: PLAY_SUBSCRIPTIONS, after: '. Questions? Reply to this email.' };

  if (p.productId === 'lucento_cloud') {
    return build('Lucento Cloud is on', {
      preheader: 'Cloud sync, Shared and the AI adviser are back on your Lifetime plan.',
      mascot: { src: '/email/pro-mascot.png', alt: 'Lucento’s mascot' },
      heading: 'Lucento Cloud is on',
      lead: 'Thank you. Your Lifetime plan has its online services again.',
      facts,
      sectionsTitle: 'What’s on',
      sections: CLOUD_FEATURES,
      closing: 'Manage or cancel any time in',
      closingLink: manage,
      reason,
    });
  }

  return build(trial ? 'Your Lucento Pro trial has started' : 'Welcome to Lucento Pro', {
    preheader: trial
      ? 'Every Pro feature is unlocked for your free trial. Cancel before it ends and you won’t be charged.'
      : 'Every Pro feature is unlocked. Here’s what you can do now.',
    mascot: { src: '/email/pro-mascot.png', alt: 'Lucento’s mascot' },
    heading: trial ? 'Your Pro trial has started' : 'Welcome to Lucento Pro',
    lead: trial
      ? `Every Pro feature is unlocked for your free trial.${ends ? ` Google Play charges for the year on ${ends} unless you cancel before then.` : ' Cancel before it ends and you won’t be charged.'}`
      : 'Thank you for supporting Lucento. Every Pro feature is unlocked on this account now.',
    facts,
    sectionsTitle: 'What’s unlocked',
    sections: PRO_FEATURES,
    closing: 'Manage or cancel any time in',
    closingLink: manage,
    reason,
  });
}
