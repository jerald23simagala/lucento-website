/**
 * Google Play links that tell Play Console where an install came from (lucento-android docs/growth/CRO_PLAN.md,
 * CRO-3; owner decision 2026-11-25: tagged links, no analytics on the site).
 *
 * Play reads the tags from the link's `referrer` parameter. They are:
 *   - utm_source: the visitor's own tag from the address they arrived with (a TikTok bio, a Facebook post), else
 *     "website";
 *   - utm_medium: "website_<place>", the button that was clicked;
 *   - utm_campaign: the visitor's own campaign, else "site".
 * So "TikTok → site → hero button" reads tiktok / website_hero in Play Console.
 *
 * The visitor's tags stay in their own browser tab (sessionStorage, in PlayCta.astro) and only go into the link they
 * click. Nothing is sent to Lucento, and nothing is kept after the tab closes.
 */

export type PlayPlace = 'header' | 'hero' | 'finale';

export const PLAY_PLACES: readonly PlayPlace[] = ['header', 'hero', 'finale'];

export interface IncomingTags {
  source?: string | null;
  campaign?: string | null;
}

/** A tag Play can show as written: lower case letters, digits, "_" and "-", at most 40 characters. Otherwise null. */
export function tag(value: string | null | undefined): string | null {
  const v = (value ?? '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{0,39}$/.test(v) ? v : null;
}

/** The value of `referrer` before encoding, for [place] and the visitor's [incoming] tags. */
export function playReferrer(place: PlayPlace, incoming: IncomingTags = {}): string {
  const source = tag(incoming.source) ?? 'website';
  const campaign = tag(incoming.campaign) ?? 'site';
  return `utm_source=${source}&utm_medium=website_${place}&utm_campaign=${campaign}`;
}

/** [playUrl] (which already carries `?id=`) with the tags for [place]. */
export function playLink(playUrl: string, place: PlayPlace, incoming: IncomingTags = {}): string {
  return `${playUrl}&referrer=${encodeURIComponent(playReferrer(place, incoming))}`;
}

/** The tags a landing address brings, or null when it has no usable utm_source. Other parameters are ignored. */
export function incomingFrom(search: string): IncomingTags | null {
  const query = new URLSearchParams(search);
  const source = tag(query.get('utm_source'));
  if (!source) return null;
  return { source, campaign: tag(query.get('utm_campaign')) };
}

/** [value] as a place, when it is one. */
export function asPlace(value: string | undefined): PlayPlace | null {
  return PLAY_PLACES.includes(value as PlayPlace) ? (value as PlayPlace) : null;
}
