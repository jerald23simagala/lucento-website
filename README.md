# Lucento website

Marketing website for **Lucento**, the native Android budget tracker
("Financial clarity without the complexity"). The Android app lives in a separate
repository (`lucento-android`); nothing here changes it.

## Stack

- [Astro](https://astro.build) 5 (static output, no client-side framework)
- TypeScript (strict) with `astro check`
- ESLint with `eslint-plugin-astro` and its strict accessibility rules
- Manrope (self-hosted via `@fontsource-variable/manrope`), the brand's marketing face
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
| `npm run verify`   | Token freshness check, lint, type-check and build in one go   |

## Design tokens

`design/tokens.json` is an export of the Lucento design system (Sunrise Energy:
colours for day and night, spacing, radii, shadows, sizes). `npm run tokens`
turns it into CSS custom properties. Night colours apply automatically through
`prefers-color-scheme`, and `data-theme="light" | "dark"` on `<html>` can force
either. Don't edit `tokens.css` by hand; `npm run verify` fails if it is stale.

### Horizon (the website's own system, Phase 4)

The redesigned pages use **Horizon**, built and reviewed in the private `lucento-studio` workspace (its `DESIGN.md`
is the spec; `system/CONTRAST.md` checks every colour pair). Here:

- `design/horizon.tokens.json` is copied from the studio's `system/horizon.tokens.json`; `npm run tokens` also writes
  `src/styles/horizon-tokens.css`, and `npm run verify` fails if it is stale.
- `src/styles/horizon.css` is the component stylesheet. `src/layouts/HorizonLayout.astro` inlines both files and the
  Plus Jakarta Sans variable font faces (`@fontsource-variable/plus-jakarta-sans`, OFL, hashed URLs), so a Horizon
  page needs no stylesheet request. Keep Horizon styles in `horizon.css`, not in component `<style>` blocks (those
  become deferred stylesheets here).
- `src/components/horizon/` holds the parts. Figures come from `src/data/demo.ts` (the app's demo month in pesos,
  read off the screenshot tour), formatted by `src/lib/money.ts` (integer minor units, signed with U+2212); unit
  tests in `src/lib/money.test.ts` check that the demo month reconciles with the app's screens.
- Screens in `public/screens/{home,composer}-{light,dark}-{400,720}.webp` come from the Android tour in peso mode
  (`-e demoCurrency PHP`), cropped with the studio's `qa/crop-screen.mjs`. The panoramas in `public/brand/scenery/`
  are copies of the app's own.

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
design/tokens.json        Design-system export (source of truth for tokens)
design/horizon.tokens.json  Horizon tokens (copied from lucento-studio)
scripts/build-tokens.mjs  tokens.json -> src/styles/tokens.css; horizon.tokens.json -> horizon-tokens.css
src/styles/               tokens.css, horizon-tokens.css (generated), global.css, horizon.css
src/layouts/              BaseLayout (pages not yet redesigned) and HorizonLayout (homepage)
src/components/           SiteHeader, SiteFooter, ContentPage + LegalBody (reading pages), MoreFeatures, phone demos
src/data/                 site.ts (contact, Play link, playListed), plans.ts (pricing), guides, home copy,
                          legal.ts (generated from the app: lucento-android tools/legal/export_legal.py — don't edit)
src/pages/                index, pricing, privacy, terms, delete-account (Play's account-deletion page), how-to,
                          auth/confirmed, api/* (AI proxy, billing), 404, robots.txt
brand/logo/               Rising Crest logo: symbol, wordmark, lockups, Android
brand/logo-concepts/      Earlier logo explorations
public/                   Static files (favicon)
```
