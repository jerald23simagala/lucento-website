// Unit tests for the Gemini model order and time limits: `npm run test:unit` (Node's own test runner; no dependency).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CALL_CAP_MS, callTimeout, preferAvailable, rankFlashModels } from './gemini.ts';

test('newest stable Flash first, the newest Flash-Lite third, then the rest', () => {
  const ranked = rankFlashModels([
    'models/gemini-3.6-flash',
    'models/gemini-3.8-flash',
    'models/gemini-3.7-flash',
    'models/gemini-3.5-flash',
    'models/gemini-3.8-flash-lite',
    'models/gemini-3.6-flash-lite',
    'models/gemini-flash-latest',
    'models/gemini-3.8-flash-preview-09',
    'models/gemini-3.8-flash-image',
  ]);
  assert.deepEqual(ranked, [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.8-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.6-flash-lite',
  ]);
});

test('with no Flash-Lite the order is the stable Flash models, newest first', () => {
  assert.deepEqual(rankFlashModels(['gemini-3.10-flash', 'gemini-3.9-flash']), ['gemini-3.10-flash', 'gemini-3.9-flash']);
});

test('models that just had no capacity are tried last', () => {
  const now = 1_000;
  const busy = new Map([['a', now + 60_000], ['c', now - 1]]);
  assert.deepEqual(preferAvailable(['a', 'b', 'c'], now, busy), ['b', 'c', 'a']);
});

test('a call that is not the last one leaves time for another model', () => {
  const now = 0;
  assert.equal(callTimeout(22_000, now, false), CALL_CAP_MS);
  assert.equal(callTimeout(22_000, now, true), 22_000);
  assert.equal(callTimeout(22_000, 15_000, false), 7_000);
  assert.equal(callTimeout(22_000, 21_500, true), 3_000);
});
