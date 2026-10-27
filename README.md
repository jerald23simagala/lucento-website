# Lucento website

Marketing website for **Lucento**, the native Android budget tracker
("Financial clarity without the complexity"). The Android app lives in a separate
repository (`lucento-android`); nothing here changes it.

## Stack

- [Astro](https://astro.build) 5 (static output, no client-side framework)
- TypeScript (strict) with `astro check`
- ESLint with `eslint-plugin-astro` and its strict accessibility rules
- Plus Jakarta Sans (the app face, self-hosted) and IBM Plex Mono for the marketing site
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
| `npm run tokens`   | Regenerates `src/styles/tokens.css` from `design/tokens.json` |
| `npm run verify`   | Token freshness check, lint, type-check and build in one go   |

## Design tokens

`design/tokens.json` is an export of the Lucento design system (Sunrise Energy:
colours for day and night, spacing, radii, shadows, sizes). `npm run tokens`
turns it into CSS custom properties. Night colours apply automatically through
`prefers-color-scheme`, and `data-theme="light" | "dark"` on `<html>` can force
either. Don't edit `tokens.css` by hand; `npm run verify` fails if it is stale.

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
design/tokens.json        Design-system export (source of truth for UI tokens)
scripts/build-tokens.mjs  tokens.json -> src/styles/tokens.css
src/styles/               tokens.css (generated) and global.css
src/layouts/              BaseLayout: metadata, skip link, header, footer
src/components/           Header, footer, Rising Crest mark, mascot, demo, pace calculator
src/pages/                index, demo, how-to (redirect), privacy, 404, auth confirm, robots.txt
brand/logo/               Rising Crest logo: symbol, wordmark, lockups, Android
brand/logo-concepts/      Earlier logo explorations
public/                   Static files (favicon, demo art, explainer video)
public/lottie/            Mascot loops authored here from the existing WebP art. The repo had no Lottie source.
```

The phone simulation uses the Sunrise Energy tokens. The marketing pages use
their own paper-and-ink colours in `global.css`, so the site does not follow
the day/night token swap. The Rising Crest artwork colours live there as
`--mark-*` and are only used for the crest mark, not for text or status.
