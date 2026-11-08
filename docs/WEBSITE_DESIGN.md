# Lucento website design

The website's design rules and system. The 2026-11-08 reimagination made the site one page for the whole product,
plus the privacy policy (`/privacy`) and the terms (`/terms`). The interactive demo was retired the same day
(owner); `/demo` and `/how-to` redirect home. Pages that must exist for other reasons also stay: `/delete-account` (Google Play's web deletion
requirement; the app links to it) and `/auth/confirmed` (the sign-up email lands there).

## Permanent principles

1. **Typography first.** Headings carry the page: Inter at 800 with tight negative tracking, uppercase tracked
   eyebrows, generous line height for reading. The owner's ApplyFast site is the reference for this treatment.
2. **The product is the picture.** Real app screens come before any illustration. Every screen on the site is a
   capture from the app (see *Screens* below), shown in **dark mode** (Sunrise, dark; owner, 2026-11-08) except in the
   theme switcher, inside the **one phone template**: a dark device frame with a mock status bar (9:41, signal, Wi-Fi,
   battery, camera hole) in the colour of the screen's top edge. Never mock up UI the app doesn't have.
3. **Real screens wherever possible.** If a feature can be shown with a capture, show the capture. When a web element
   restates app behaviour (the message-to-rows card, the Shared table), it must match the app exactly.
4. **No generic SaaS template.** No hero split into copy-left/phone-right, no rows of icon + heading + paragraph cards,
   no logo walls, no testimonials we don't have.
5. **No decoration for its own sake.** No gratuitous gradients, glowing borders or glassmorphism. The one landscape
   (the app's own panorama) grounds the night bands; that's all.
6. **No repeated feature-card grids.** Each feature gets the composition that explains it best: a message becoming
   rows, two lanes for offline and online, a currency ledger, a permission table, a real switch for hidden amounts.
7. **Whitespace is a tool.** Sections breathe (`--section`), and a section holds one idea.
8. **Editorial hierarchy.** Eyebrow → headline → lede → proof. Alternate compositions; let one element lead.
9. **Motion tells the story or stays still.** Allowed: the showcase's centre emphasis, the theme crossfade, rows
   arriving under the message. Not allowed: decorative scroll reveals, parallax for its own sake, idle loops.
   Everything respects `prefers-reduced-motion`.
10. **Every section has a job.** If you can't say what a section proves, cut it.
11. **Mobile is designed, not shrunk.** The hero becomes a swipeable phone with a scrolling tab row; paired phones
    shrink together; the comparison table becomes labelled rows; the menu folds. Check 320, 360 and 390 px wide, and
    text at 200 %.
12. **Performance over animation.** Zero layout shift, no animation library, a few KB of JavaScript (carousel, menu),
    CSS inlined, fonts self-hosted and preloaded. Budget: Lighthouse mobile ≥ 95 on every category.
13. **Premium, modern, confident, honest.** Every claim is checked against the app; signed amounts use U+2212; Pro
    features are tagged Pro; limits are the app's exact numbers.

## System

- **Tokens:** `design/horizon.tokens.json` → `src/styles/horizon-tokens.css` (`npm run tokens`; `npm run verify` fails
  if stale). Lucento's palette is kept: Crest Blue ramp (600 = the logo's #154DFD), ivory paper #FFFDF5, midnight
  #0B1229 for night bands (`.theme-night`), sunlight #FFC928 for eyebrows on night. Never hard-code a colour in a
  component; the only literal colours are the five app themes' own values in `src/data/content.ts`.
- **Type:** `--font-sans` is Inter (self-hosted `@fontsource-variable/inter` latin, plus an 8 KB currency subset for ₱;
  metric-matched Arial/Roboto fallbacks). Scale: `display` (h1), `headline` (h2), `title-lg` (feature heads),
  `title`, `eyebrow`, `lede`, `body`, `caption`, `figure` (prices, amounts; tabular figures).
- **Stylesheet:** `src/styles/site.css`, inlined by `src/layouts/SiteLayout.astro` with the tokens and font faces.
  Keep styles there, not in component `<style>` blocks (the build defers external stylesheets).
- **Components:** `src/components/site/` — `Header`, `Footer`, `PlayCta` (status until `site.playListed`), `Phone`
  (the phone template: frame + `StatusBar` + screen), `StatusBar` (colours from `src/data/screen-tops.json`, written
  by `node scripts/screen-tops.mjs` after screens change), `Showcase` (hero carousel), `ThemeStudio`, `Pricing`.
- **Content:** `src/data/content.ts` (screens, themes, foreign wallets, FAQ — each with its source in the app),
  `src/data/plans.ts` (approved plan copy; limits mirror the app's `PlanCatalog`).

## Homepage structure

1. Hero (night): headline, the Google Play status (until `site.playListed`) and a link to the features, then the
   carousel of eight screens in the owner's order: Transactions, Insights, Budgets, **Dashboard** (where it opens,
   centred), Wallets, Scheduled, Goals, Ask Lucento. Arrows, tabs, a click on a neighbour, swipe or the arrow keys
   move it.
2. Features: recording (type, speak, scan, several at once) · wallets · **Multicurrency wallets** (a night panel,
   special emphasis) · intelligence (Insights / Ask Lucento / AI adviser, with what each sends) · upcoming bills ·
   budgeting presets · **Lucento Shared** (a panel, special emphasis) · offline or online. On phones each shows one
   readable screen.
3. Security and privacy: lock, hide amounts (a real switch between two captures from one run), recents, backups;
   what leaves the phone, in the policy's words.
4. Themes: the real Wallets gallery in all five themes and both modes (radio buttons + CSS `:has()`; Midnight
   forces dark).
5. Pricing: plans, what happens after buying and if Pro ends, and the full comparison (a disclosure, open from 48em).
6. FAQ: accordions grouped by Using Lucento, Your data, Plans and payment (FAQPage structured data).
7. Final call to action (night): the Google Play status and the plans; then the footer (privacy, terms, deletion,
   contact).

The header lists the sections in page order (Features, Currencies, Shared, Themes, Pricing, FAQ) with the Play
status on wide screens; phones get an icon menu.

## Screens

All screens are 1080 × 2400 API 36 captures in peso mode, cropped by lucento-studio `qa/crop-screen.mjs` (the real
status and navigation bars removed; 400/560/720 px, AVIF + WebP). Then run `node scripts/screen-tops.mjs`.

- The hide-amounts pair (`f-shown`, `f-hidden`): WebsiteShowcaseTest, one run, so only the amounts differ.
- The demo month, the hero carousel and the feature screens: lucento-android `ScreenshotTourTest` with
  `-e demoCurrency PHP -e demoDark true -e hostCapture true` (artifacts/website-tour-api36-php-dark).
- Theme, multicurrency and hide-amounts screens: lucento-android `WebsiteShowcaseTest` with
  `-e websiteShowcase true` (artifacts/website-showcase-api36-dark; the theme loop covers both modes). Its foreign wallets use fixed rates; the site's figures are the app's own
  conversions of them.

When the app's UI changes, re-capture and re-crop; never edit a screenshot by hand.

## Checks before shipping

`npm run verify` (tokens, lint, `astro check`, unit tests, build) and `npx playwright test` (e2e/home.spec.ts covers
the carousel (opens on the Dashboard; arrows, tabs, keys), the phone template, theme switcher, hide-amounts switch, multicurrency figures, pricing cells, FAQ and its structured data,
overflow at 320–390 px with text at 200 %, keyboard, no-JS, reduced motion, CLS, redirects and the other pages).
Then the studio's audit (`qa/audit.mjs --lighthouse`) and a blind design-critic round.
