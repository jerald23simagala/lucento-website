# Lucento website

Marketing website for **Lucento**, the native Android budget tracker
("Financial clarity without the complexity"). The Android app lives in a separate
repository (`lucento-android`); nothing here changes it.

## Stack

- [Astro](https://astro.build) 5 (static output, no client-side framework)
- TypeScript (strict) with `astro check`
- ESLint with `eslint-plugin-astro` and its strict accessibility rules
- Inter (self-hosted via `@fontsource-variable/inter`), the website's face
- All versions are pinned exactly (`.npmrc` sets `save-exact`)

## Getting started

Requires Node 22.22.3 or newer (see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:4321
```

| Command            | What it does                                                  |
| ------------------ | ------------------------------------------------------------- |
| `npm run dev`      | Local dev server with hot reload                              |
| `npm run build`    | Production build to `dist/`                                   |
| `npm run preview`  | Serves the built `dist/` locally                              |
| `npm run lint`     | ESLint, including accessibility rules for `.astro` files      |
| `npm run check`    | Astro and TypeScript type-check                               |
| `npm run tokens`   | Regenerates `src/styles/tokens.css` and `horizon-tokens.css`  |
| `npm run verify`   | Token freshness check, lint, type-check, unit tests and build |
| `npx playwright test` | End-to-end checks of the homepage and the other pages      |

## Design tokens

`design/tokens.json` is an export of the Lucento design system (Sunrise Energy:
colours for day and night, spacing, radii, shadows, sizes). `npm run tokens`
turns it into CSS custom properties. Night colours apply automatically through
`prefers-color-scheme`, and `data-theme="light" | "dark"` on `<html>` can force
either. Don't edit `tokens.css` by hand; `npm run verify` fails if it is stale.

### The website's design (2026-11-08)

The site is one page for the whole product plus `/demo`, `/privacy`, `/terms`, `/delete-account` and
`/auth/confirmed`; `/pricing` and `/how-to` redirect. **Read `docs/WEBSITE_DESIGN.md` first**: it holds the permanent
design principles (typography first, real app screens, no template card grids, purposeful motion, designed mobile
layouts) and the system. `CLAUDE.md` summarises them for Claude.

- `design/horizon.tokens.json` → `src/styles/horizon-tokens.css` (`npm run tokens`); `src/styles/site.css` is the
  stylesheet. `src/layouts/SiteLayout.astro` inlines both with Inter's font faces (`@fontsource-variable/inter`, OFL,
  plus an 8 KB currency subset in `src/assets/fonts/` for ₱), so no page needs a stylesheet request.
- `src/components/site/` holds the parts; `src/data/content.ts` the screens, themes and FAQ (each with its source in
  the app); `src/data/plans.ts` the plans. Amounts are formatted by `src/lib/money.ts` (U+2212 minus).
- `public/screens/` are API 36 captures from lucento-android's `ScreenshotTourTest` and `WebsiteShowcaseTest` in peso
  mode, cropped with lucento-studio `qa/crop-screen.mjs` and `qa/crop-detail.mjs`. `public/og-lucento.png` is the link
  preview, composed from the same screens.
- The interactive demo keeps the app's own palette (`tokens.css`), scoped to the page content.

## Site URL, canonical links and sitemap

The production domain isn't decided. Set `SITE_URL` (see `.env.example`) to
enable canonical URLs, `og:url`, the sitemap and the `Sitemap:` line in
`robots.txt`. Without it the site still builds and simply omits them instead of
pointing at a guessed domain.

## Brand status

The logo direction is Rising Crest. Final vector assets are in `brand/logo/`
(symbol, wordmark and lockups as separate files, plus Android launcher assets).
Earlier explorations stay in `brand/logo-concepts/` for reference.

## Structure

```
design/tokens.json          The app's design-system export (the demo's palette)
design/horizon.tokens.json  The website's tokens: Lucento palette, Inter type scale
scripts/build-tokens.mjs    tokens.json -> tokens.css; horizon.tokens.json -> horizon-tokens.css
docs/WEBSITE_DESIGN.md      Design principles and system (read first)
src/styles/                 site.css, tokens.css + horizon-tokens.css (generated), phone*.css (demo)
src/layouts/SiteLayout      Every page: inlined CSS and fonts, header, footer, structured data
src/components/site/        Header, Footer, PlayCta, Phone, Showcase, ThemeStudio, Pricing
src/components/             ContentPage + LegalBody (reading pages), PhoneDemo + PhoneFrame (interactive demo)
src/data/                   content.ts (screens, themes, FAQ), plans.ts, site.ts (contact, Play link, playListed),
                            guides.ts, demo.ts, legal.ts (generated from the app: tools/legal/export_legal.py — don't edit)
src/pages/                  index, demo, privacy, terms, delete-account (Play's account-deletion page),
                            auth/confirmed, api/* (AI proxy, billing), 404, robots.txt
e2e/home.spec.ts            Playwright checks
brand/logo/                 Rising Crest logo: symbol, wordmark, lockups, Android
public/                     screens/, brand/scenery/, demo/ (simulator art and fonts), og-lucento.png, favicon
```
