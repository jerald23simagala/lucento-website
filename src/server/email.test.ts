// Unit tests for the account emails: `npm run test:unit` (Node's own test runner; no dependency).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { purchaseEmailDue, readAccount, welcomeDue, WELCOME_WINDOW_MS } from './email.ts';
import { escapeHtml, longDate, proPurchaseEmail, welcomeEmail, type ProPurchase } from './email-templates.ts';

const NOW = Date.parse('2026-11-09T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const ID = '0b6f7c1e-1f2a-4c3d-9e8f-0123456789ab';
const iso = (t: number) => new Date(t).toISOString();

test('readAccount takes the id, a valid address and the verification time', () => {
  const a = readAccount({ id: ID.toUpperCase(), email: 'ana@example.com', email_confirmed_at: iso(NOW), created_at: iso(NOW - DAY) });
  assert.deepEqual(a, { id: ID, email: 'ana@example.com', emailConfirmedAt: iso(NOW), createdAt: iso(NOW - DAY) });
  assert.equal(readAccount({ id: ID, email: 'not an address' })?.email, null);
  assert.equal(readAccount({ id: ID, confirmed_at: iso(NOW) })?.emailConfirmedAt, iso(NOW));
  assert.equal(readAccount({ id: 'nope' }), null);
  assert.equal(readAccount(null), null);
});

test('a welcome is due only for a verified address on a new account', () => {
  const base = { id: ID, email: 'ana@example.com', emailConfirmedAt: iso(NOW), createdAt: iso(NOW - DAY) };
  assert.equal(welcomeDue(base, NOW), 'due');
  assert.equal(welcomeDue({ ...base, emailConfirmedAt: null }, NOW), 'unverified');
  assert.equal(welcomeDue({ ...base, email: null }, NOW), 'no_email');
  assert.equal(welcomeDue({ ...base, createdAt: iso(NOW - WELCOME_WINDOW_MS - 1) }, NOW), 'too_old');
  assert.equal(welcomeDue({ ...base, createdAt: null }, NOW), 'too_old');
});

test('a purchase confirmation is for new, paid or trial purchases only', () => {
  assert.equal(purchaseEmailDue('ACTIVE', iso(NOW - DAY), NOW), true);
  assert.equal(purchaseEmailDue('TRIAL', iso(NOW - 60_000), NOW), true);
  assert.equal(purchaseEmailDue('PENDING', iso(NOW), NOW), false, 'nothing is unlocked while a payment is pending');
  assert.equal(purchaseEmailDue('CANCELLED_ACTIVE', iso(NOW), NOW), false);
  assert.equal(purchaseEmailDue('ACTIVE', iso(NOW - 4 * DAY), NOW), false, 'a restore of an old purchase is not a new purchase');
  assert.equal(purchaseEmailDue('ACTIVE', null, NOW), false);
});

test('longDate is in UTC and refuses junk', () => {
  assert.equal(longDate('2026-11-09T23:30:00Z'), '9 November 2026');
  assert.equal(longDate('soon'), null);
  assert.equal(longDate(null), null);
});

test('the welcome email names the address, has a text part and no promise about ads', () => {
  const e = welcomeEmail('ana@example.com');
  assert.equal(e.subject, 'Welcome to Lucento');
  assert.match(e.html, /ana@example\.com/);
  assert.match(e.text, /Type it like a text/);
  assert.match(e.html, /https:\/\/www\.lucentoapp\.com\/email\/welcome-mascot\.png/);
  for (const body of [e.html, e.text]) {
    assert.doesNotMatch(body, /no ads/i);
    assert.doesNotMatch(body, /\bAI\b.*reads? (your|the) (message|text)/i);
  }
});

test('addresses and plan details are escaped in the HTML', () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  const e = welcomeEmail('a<b>@example.com');
  assert.doesNotMatch(e.html, /a<b>@/);
});

const purchase = (p: Partial<ProPurchase>): ProPurchase => ({
  productId: 'lucento_pro',
  status: 'ACTIVE',
  basePlanId: 'monthly',
  purchasedAt: '2026-11-09T02:00:00Z',
  expiresAt: '2026-12-09T02:00:00Z',
  orderId: 'GPA.3300-1234-5678-90123',
  ...p,
});

test('a monthly Pro purchase: plan, renewal date, order, how to cancel, and no price', () => {
  const e = proPurchaseEmail('ana@example.com', purchase({}));
  assert.equal(e.subject, 'Welcome to Lucento Pro');
  assert.match(e.text, /Plan: Lucento Pro \(monthly\)/);
  assert.match(e.text, /Renews: 9 December 2026/);
  assert.match(e.text, /Order: GPA\.3300-1234-5678-90123/);
  assert.match(e.text, /play\.google\.com\/store\/account\/subscriptions/);
  assert.match(e.html, /<a href="https:\/\/play\.google\.com\/store\/account\/subscriptions"/);
  assert.doesNotMatch(e.text, /₱|\$\d|PHP \d/, 'Google Play’s receipt carries the price');
});

test('a yearly trial says when Google Play charges', () => {
  const e = proPurchaseEmail('ana@example.com', purchase({ status: 'TRIAL', basePlanId: 'annual', expiresAt: '2026-11-16T02:00:00Z' }));
  assert.equal(e.subject, 'Your Lucento Pro trial has started');
  assert.match(e.text, /Plan: Lucento Pro \(yearly\)/);
  assert.match(e.text, /Free trial ends: 16 November 2026/);
  assert.match(e.text, /charges for the year on 16 November 2026 unless you cancel/);
});

test('Lifetime separates what is owned from the year of online services', () => {
  const e = proPurchaseEmail('ana@example.com', purchase({ productId: 'lucento_pro_lifetime', basePlanId: null, expiresAt: null }));
  assert.equal(e.subject, 'Pro Lifetime is yours');
  assert.match(e.text, /Online services until: 9 November 2027/);
  assert.match(e.text, /No renewal, no expiry/);
  assert.doesNotMatch(e.text, /Renews:|cancel any time/i);
});

test('Lucento Cloud confirms the services are back', () => {
  const e = proPurchaseEmail('ana@example.com', purchase({ productId: 'lucento_cloud', basePlanId: 'annual', expiresAt: '2027-11-09T02:00:00Z' }));
  assert.equal(e.subject, 'Lucento Cloud is on');
  assert.match(e.text, /Plan: Lucento Cloud \(yearly\)/);
  assert.match(e.text, /Renews: 9 November 2027/);
});
