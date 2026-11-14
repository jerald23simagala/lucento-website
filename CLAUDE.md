# Lucento website — instructions for Claude

Lucento's marketing website (Astro on Vercel) for the Android app in `../lucento-android`. Read
`docs/WEBSITE_DESIGN.md` before any design change; its principles are permanent.

## Design rules (summary of docs/WEBSITE_DESIGN.md)

- Typography first: Inter at 800, tight tracking, generous whitespace, editorial hierarchy. Sections start with their
  headline; only the hero keeps an eyebrow (round 2, owner 2026-11-13).
- The app is the picture: real screenshots (dark mode, except the theme switcher) in the one phone template
  (`Phone` + `StatusBar`). Never invent UI. After adding screens run `node scripts/screen-tops.mjs`.
- No generic SaaS templates, no gratuitous gradients, glows or glass. Features are identical one-line cards (icon,
  name, one line; owner review 3) that open a dialog with the real screens and the full copy; since round 2 Type your
  way leads at full width with a still of the replica.
- A replica of app UI (Type your way) uses the app's own strings, flow, palette and demo-month figures, and says it
  is a replica. Never promise "no ads" for Free.
- Show what Lucento does, not how (owner, 2026-11-08): three screens in the hero, each screen once where it tells its
  story, and no full flows of Ask Lucento, card mechanics, Shared's rules or sync internals. Delete unused screens.
  Dialog phones always carry a `Phone` treatment (window, focus, angle, lift); see docs/WEBSITE_DESIGN.md.
- Every section has one clear job; alternate compositions instead of repeating one.
- Motion only where it explains the product, plus round 2's gentle one-time reveals below the fold; always respect
  reduced motion; never trade performance for animation.
- Mobile layouts are designed (swipe, folded menu, labelled table rows), not compressed desktop.
- Keep Lucento's palette, logo and brand assets; tokens come from `design/horizon.tokens.json`.

## Truth

- Every claim, limit and price must match the app (`../lucento-android`: `domain/entitlement/PlanCatalog.kt`,
  `ProGates.kt`, `feature/legal/LegalDocuments.kt`, docs/). `src/data/content.ts` and `src/data/plans.ts` name their
  sources. Amounts are integer minor units formatted by `src/lib/money.ts` (U+2212 minus).
- The privacy summary follows the policy's own words and links to `/privacy`; it never claims to be complete.
- Until `site.playListed` is true the Google Play CTA is a status, not a link.

## Engineering

- Styles live in `src/styles/site.css` (inlined by `SiteLayout`); don't add component `<style>` blocks for site
  styles. The reading pages keep the app palette (`tokens.css`, scoped by `SiteLayout appTokens`). There is no
  interactive demo any more (retired 2026-11-08).
- Before pushing: `npm run verify` and `npx playwright test`. Never claim a check passed without seeing it.
- Never commit to `main` directly; commits, pushes, merges and deploys need the owner's explicit go-ahead.
