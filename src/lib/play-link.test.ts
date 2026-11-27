import { test } from 'node:test';
import assert from 'node:assert/strict';
import { asPlace, incomingFrom, playLink, playReferrer, tag } from './play-link.ts';

const PLAY = 'https://play.google.com/store/apps/details?id=com.lucento.app';

test('a plain visit is credited to the website and the button', () => {
  assert.equal(playReferrer('hero'), 'utm_source=website&utm_medium=website_hero&utm_campaign=site');
  assert.equal(
    playLink(PLAY, 'header'),
    `${PLAY}&referrer=utm_source%3Dwebsite%26utm_medium%3Dwebsite_header%26utm_campaign%3Dsite`,
  );
});

test("the visitor's own source and campaign carry through to Play", () => {
  const incoming = incomingFrom('?utm_source=tiktok&utm_medium=bio&utm_campaign=launch');
  assert.deepEqual(incoming, { source: 'tiktok', campaign: 'launch' });
  assert.equal(playReferrer('finale', incoming ?? {}), 'utm_source=tiktok&utm_medium=website_finale&utm_campaign=launch');
});

test('a source without a campaign keeps the default campaign', () => {
  assert.equal(playReferrer('hero', incomingFrom('?utm_source=Facebook') ?? {}), 'utm_source=facebook&utm_medium=website_hero&utm_campaign=site');
});

test('no usable utm_source means no incoming tags', () => {
  assert.equal(incomingFrom(''), null);
  assert.equal(incomingFrom('?ref=abc'), null);
  assert.equal(incomingFrom('?utm_source='), null);
  assert.equal(incomingFrom('?utm_source=%3Cscript%3E'), null);
});

test('tags accept only short plain words', () => {
  assert.equal(tag(' TikTok '), 'tiktok');
  assert.equal(tag('klaro_ph-email'), 'klaro_ph-email');
  assert.equal(tag('a&utm_source=evil'), null, 'never lets a value add its own parameter');
  assert.equal(tag('has space'), null);
  assert.equal(tag('x'.repeat(41)), null);
  assert.equal(tag(null), null);
  // A bad stored value can't break the link either: it falls back to the defaults.
  assert.equal(playReferrer('hero', { source: 'a=b', campaign: '%26' }), 'utm_source=website&utm_medium=website_hero&utm_campaign=site');
});

test('only the three buttons are places', () => {
  assert.equal(asPlace('hero'), 'hero');
  assert.equal(asPlace('footer'), null);
  assert.equal(asPlace(undefined), null);
});
