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
   theme switcher, inside the **one phone template**: a light device frame (owner review 3: the screens are dark, so the
   frame stands apart from them on day and night grounds; `--color-device`, `--color-device-edge`) with a mock status
   bar (9:41, signal, Wi-Fi, battery, camera hole) in the colour of the screen's top edge. Never mock up UI the app doesn't have.
3. **Real screens wherever possible.** If a feature can be shown with a capture, show the capture. When a web element
   restates app behaviour (the Type your way replica, the Shared table), it must match the app exactly: the app's own
   strings, flow, palette and figures (the demo month), and a replica says it is one.
4. **No generic SaaS template.** No hero split into copy-left/phone-right, no paragraph-heavy card grids, no logo
   walls, no testimonials we don't have. (The feature cards are identical one-liners on purpose: principle 6.)
5. **No decoration for its own sake.** No gratuitous gradients, glowing borders or glassmorphism. The app's own
   panorama grounds the hero and the closing band. Drawn art is allowed when it explains a feature (the Shared hands)
   and never shows amounts or UI the app doesn't have.
6. **Quiet feature cards (owner review 3, 2026-11-08).** The Features section stays low in intensity: identical
   cards, each an icon (`FeatureIcon`), the feature's name and one line, in a 3 × 4 grid (1 column on phones, 2 from
   48em, 3 from 80em: columns step up only where each line fits on one row). The whole card is the link (one focus stop, a card-sized touch target). Everything else, the real
   screens and the full copy (a currency ledger, the AI tiers, two lanes for offline and online, the privacy ledger),
   opens only on click, in a dialog. Type your way is the first card; its dialog holds the working replica.
7. **Whitespace is a tool.** Sections breathe (`--section`), and a section holds one idea.
8. **Editorial hierarchy.** Eyebrow → headline → lede → proof. Alternate compositions; let one element lead.
9. **Motion tells the story or stays still.** Allowed: the hero's one-time rise, single light sweep, slow float
   and drift of the supporting phones and gentle scroll parallax (transform only; paused off screen), the theme
   crossfade, the replica's rows arriving and its screen change after Save, a dialog rising into place, the newest
   Shared row lighting on both phones. Not allowed: decorative scroll reveals, parallax for its own sake. Everything
   respects `prefers-reduced-motion`.
10. **Every section has a job.** If you can't say what a section proves, cut it.
11. **Mobile is designed, not shrunk.** The hero becomes a swipeable phone with a scrolling tab row; the replica
    sits between its heading and its steps, so the phone is in view as you tap; cards stack; dialogs become bottom
    sheets; the comparison table becomes labelled rows; the menu folds. Check 320, 360 and 390 px wide, and text at
    200 %. Nothing may spill out of its section, card or dialog (an e2e check).
12. **Performance over animation.** Zero layout shift, no animation library, a few KB of JavaScript (menu,
    dialogs, the replica; the app font for the replica loads only as it comes near),
    CSS inlined, fonts self-hosted and preloaded. Budget: Lighthouse mobile ≥ 95 on every category.
13. **Show what Lucento does, not every detail of how (owner, 2026-11-08).** The site sells desirability, not a
    blueprint: the hero shows three screens, not all of them; each screen appears once where it tells its story; Ask
    Lucento, the credit-card mechanics, the full Shared rules and the inner workings of entry and sync are told by
    benefit, not by full screens or complete flows. Screens the site doesn't use are deleted from `public/screens`, so
    they aren't published at all.
    No dialog shows a screen flat and whole (`Phone` `treatment`): `window` (the story at the top, the rest fades),
    `focus` (one region sharp, the rest soft), `angle` (turned in space) and `lift` (key pieces raised out of a soft,
    dim screen; Multicurrency and Budget). Pairs are window + angle; single phones are focus or lift; the theme
    switcher is angled. Dialog screens stop at 560 px files. The footer says "App screens © Lucento".
14. **Premium, modern, confident, honest.** Every claim is checked against the app; signed amounts use U+2212; Pro
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
  by `node scripts/screen-tops.mjs` after screens change), `HeroStage` (the hero's five-phone composition), `ThemeStudio`,
  `TypeDemo` (the Add transactions replica), `FeatureIcon` (card icons), `SharedArt` (the two hands),
  `Dialog` + `DialogScript` (feature details and the plan comparison), `Pricing`.
- **Content:** `src/data/content.ts` (screens, themes, foreign wallets, FAQ — each with its source in the app),
  `src/data/plans.ts` (approved plan copy; limits mirror the app's `PlanCatalog`).

## Homepage structure

1. Hero (light): headline, the Google Play status (until `site.playListed`) and a link to the features, then the
   product stage: the **Dashboard** sharp in the centre; **Budget** and **Wallets** beside it, smaller and cropped to
   about two thirds; from 64em two peripheral phones (Transactions, Goals) far out, small, dimmed and out of focus.
   The phones rise out of the app's landscape. On phones: the Dashboard, with Budget and Wallets peeking from the
   edges. No carousel, tabs or captions that enumerate the app (owner, 2026-11-08).
2. Themes ("Make Lucento yours", straight after the hero): the real Wallets gallery in all five themes and both modes
   (radio buttons + CSS `:has()`; Midnight forces dark).
3. Features: twelve identical cards, each opening a dialog with its screens and full copy: **Type your way** (the
   working replica of Add transactions: send a three-line message, give the shampoo a category, save, and
   Transactions shows the rows with the month's totals moved) · Wallets and net worth · **Wallet customization** (kinds,
   logos, default wallet, and Adjust balance, which trues a wallet up with one recorded adjustment) · Budgets · Bills
   and schedules · **Debts and loans** (suggested amortization from rate and term, interest estimate, reminder date
   that schedules the payments, installments paid; cards' limit and billing days) · Savings goals · Insights ·
   **Multicurrency wallets** (Pro) · **Lucento Shared** (Pro, the two hands) · Works offline (points to every send path
   and the policy) · **Security and privacy** (owner review 3): lock, hide amounts (a real switch between two captures
   from one run), recents, backups, and what leaves the phone in the policy's words (every send path, linked to
   /privacy). Links to a dialog (`/#about-debts`) open it as a modal.
4. Pricing: Free, Pro and Pro Lifetime. Pro opens on yearly with its saving (Save 33%, ₱598 less than monthly for a
   year, computed from the prices); Lifetime has Pro's premium treatment in gold. What happens after buying and if
   Pro ends; the full comparison opens in a dialog. Nothing on the site promises "no ads" (ads may come to Free;
   the app's policy dropped the line too, e2e enforces it).
5. FAQ: accordions grouped by Using Lucento, Your data, Plans and payment (FAQPage structured data).
6. Final call to action (night): the Google Play status and the plans; then the footer (privacy, terms, deletion,
   contact).

The header lists the sections in page order (Themes, Features, Pricing, FAQ; currencies and Shared are features,
owner review 3) with the Play
status on wide screens; phones get an icon menu.

## Screens

All screens are 1080 × 2400 API 36 captures in peso mode, cropped by lucento-studio `qa/crop-screen.mjs` (the real
status and navigation bars removed; 400/560/720 px, AVIF + WebP). Then run `node scripts/screen-tops.mjs`.

- The hide-amounts pair (`f-shown`, `f-hidden`): WebsiteShowcaseTest, one run, so only the amounts differ.
- The demo month, the hero stage and the feature screens: lucento-android `ScreenshotTourTest` with
  `-e demoCurrency PHP -e demoDark true -e hostCapture true` (artifacts/website-tour-api36-php-dark).
- Theme, multicurrency and hide-amounts screens: lucento-android `WebsiteShowcaseTest` with
  `-e websiteShowcase true` (artifacts/website-showcase-api36-dark; the theme loop covers both modes). Its foreign wallets use fixed rates; the site's figures are the app's own
  conversions of them.

When the app's UI changes, re-capture and re-crop; never edit a screenshot by hand.

## Checks before shipping

`npm run verify` (tokens, lint, `astro check`, unit tests, build) and `npx playwright test` (e2e/home.spec.ts covers
the hero stage (Dashboard sharp and centred, Budget and Wallets cropped, no enumerating controls, short on phones), screens kept back are not published, the replica's whole flow and its figures,
every card's dialog (opens, closes, returns focus), the pricing switch and comparison dialog, nothing spilling out of
its section, card or dialog, the phone template, theme switcher, hide-amounts switch, multicurrency figures, pricing cells, FAQ and its structured data,
overflow at 320–390 px with text at 200 %, keyboard, no-JS, reduced motion, CLS, redirects and the other pages).
Then the studio's audit (`qa/audit.mjs --lighthouse`) and a blind design-critic round.
