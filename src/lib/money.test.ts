import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMinor, sumMinor, wholeUnits } from './money.ts';
import { demo, haveTotal, netWorth, oweTotal } from '../data/demo.ts';

test('formats pesos with grouping, two decimals and the peso sign', () => {
  assert.equal(formatMinor(17_652_010), '₱176,520.10');
  assert.equal(formatMinor(0), '₱0.00');
  assert.equal(formatMinor(5), '₱0.05');
});

test('signs with U+2212, never a hyphen, and + only when asked', () => {
  assert.equal(formatMinor(-11_440_000), '−₱114,400.00');
  assert.ok(!formatMinor(-1).includes('-'));
  assert.equal(formatMinor(4_200_000, { plus: true }), '+₱42,000.00');
  assert.equal(formatMinor(0, { plus: true }), '₱0.00');
});

test('respects a currency without decimals', () => {
  assert.equal(formatMinor(1_500, { currency: 'JPY', locale: 'en-US' }), '¥1,500');
});

test('refuses unsafe or fractional minor units', () => {
  assert.throws(() => formatMinor(1.5));
  assert.throws(() => formatMinor(Number.MAX_SAFE_INTEGER + 2));
  assert.throws(() => sumMinor([Number.MAX_SAFE_INTEGER, 1]));
});

test('whole units feed the chart proportions', () => {
  assert.equal(wholeUnits(17_652_010), 176_520);
  assert.equal(wholeUnits(-11_440_000), 114_400);
});

test('the demo month reconciles with the app screenshots', () => {
  assert.equal(formatMinor(haveTotal), '₱176,520.10'); // Dashboard: Wallets
  assert.equal(formatMinor(-oweTotal), '−₱114,400.00'); // Dashboard: Debt & Loans
  assert.equal(formatMinor(netWorth), '₱62,120.10'); // Dashboard: net wallet balance
  assert.equal(sumMinor(demo.composer.rows.map((r) => r.minor)), demo.composer.expensesSoFar); // composer save bar
});
