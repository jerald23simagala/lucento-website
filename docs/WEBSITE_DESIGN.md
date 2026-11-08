# Lucento website design

The website's design rules and system. The 2026-11-08 reimagination made the site one page for the whole product,
plus three separate destinations: the interactive demo (`/demo`), the privacy policy (`/privacy`) and the terms
(`/terms`). Pages that must exist for other reasons also stay: `/delete-account` (Google Play's web deletion
requirement; the app links to it) and `/auth/confirmed` (the sign-up email lands there).

## Permanent principles

1. **Typography first.** Headings carry the page: Inter at 800 with tight negative tracking, uppercase tracked
   eyebrows, generous line height for reading. The owner's ApplyFast site is the reference for this treatment.
2. **The product is the picture.** Real app screens and faithful crops of them come before any illustration. Every
   screen on the site is a capture from the app (see *Screens* below); never mock up UI the app doesn't have.
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
12. **Performance over animation.** Zero layout shift, no animation library, about 2 KB of JavaScript (the showcase),
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
  (real screen in a device frame), `Showcase` (hero), `ThemeStudio`, `Pricing`.
- **Content:** `src/data/content.ts` (screens, themes, foreign wallets, FAQ — each with its source in the app),
  `src/data/plans.ts` (approved plan copy; limits mirror the app's `PlanCatalog`).

## Homepage structure

1. Hero (night): headline, the interactive demo as the primary button, the Play status beside it (a quiet line until
   `site.playListed`), and the six-screen showcase (Dashboard, Budgets, Wallets, Wallet details, Ask Lucento,
   Insights) — swipe, tabs or arrow keys.
2. How it works: six chapters, each a detail crop of those screens, alternating.
3. Multicurrency (night band, special emphasis): real foreign wallets and their converted values.
4. Lucento Shared (special emphasis): two people, one ledger, and who can do what.
5. Features: recording (type, speak, scan, several at once) · wallets · intelligence (Insights / Ask Lucento / AI
   adviser, with what each sends) · upcoming bills · budgeting presets · offline or online. On phones each shows one
   readable screen.
6. Security and privacy: lock, hide amounts (a real switch between two captures from one run), recents, backups;
   what leaves the phone, in the policy's words.
7. Themes: the real Wallets gallery in all five themes and both modes (radio buttons + CSS `:has()`; Midnight
   forces dark).
8. Pricing: plans, what happens after buying and if Pro ends, and the full comparison (a disclosure, open from 48em).
9. FAQ: accordions grouped by Using Lucento, Your data, Plans and payment (FAQPage structured data).
10. Final call to action (night), then the footer (demo, privacy, terms, deletion, contact).

The header lists the sections in page order and keeps "Try the demo" in view on every width.

## Screens

All screens are 1080 × 2400 API 36 captures in peso mode, cropped by lucento-studio `qa/crop-screen.mjs` (full
screens: 400/560/720 px, AVIF + WebP) and `qa/crop-detail.mjs` (detail crops: 600/1080 px).

- The hide-amounts pair (`f-shown`, `f-hidden`): WebsiteShowcaseTest, one run, so only the amounts differ.
- The demo month and the six hero screens: lucento-android `ScreenshotTourTest` with
  `-e demoCurrency PHP -e hostCapture true` (artifacts/website-tour-api36-php).
- Theme and multicurrency screens: lucento-android `WebsiteShowcaseTest` with `-e websiteShowcase true`
  (artifacts/website-showcase-api36). Its foreign wallets use fixed rates; the site's figures are the app's own
  conversions of them.

When the app's UI changes, re-capture and re-crop; never edit a screenshot by hand.

## Checks before shipping

`npm run verify` (tokens, lint, `astro check`, unit tests, build) and `npx playwright test` (e2e/home.spec.ts covers
the showcase, theme switcher, hide-amounts switch, multicurrency figures, pricing cells, FAQ and its structured data,
overflow at 320–390 px with text at 200 %, keyboard, no-JS, reduced motion, CLS, redirects and the other pages).
Then the studio's audit (`qa/audit.mjs --lighthouse`) and a blind design-critic round.
