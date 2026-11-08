# Lucento website — instructions for Claude

Lucento's marketing website (Astro on Vercel) for the Android app in `../lucento-android`. Read
`docs/WEBSITE_DESIGN.md` before any design change; its principles are permanent.

## Design rules (summary of docs/WEBSITE_DESIGN.md)

- Typography first: Inter at 800, tight tracking, uppercase eyebrows, generous whitespace, editorial hierarchy.
- The app is the picture: real screenshots and faithful crops before any illustration. Never invent UI.
- No generic SaaS templates, no icon-heading-paragraph card grids, no gratuitous gradients, glows or glass.
- Every section has one clear job; alternate compositions instead of repeating one.
- Motion only where it explains the product; always respect reduced motion; never trade performance for animation.
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
  styles. The interactive demo keeps the app palette (`tokens.css`, scoped by `SiteLayout appTokens`).
- Before pushing: `npm run verify` and `npx playwright test`. Never claim a check passed without seeing it.
- Never commit to `main` directly; commits, pushes, merges and deploys need the owner's explicit go-ahead.
