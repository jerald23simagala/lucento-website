# Product

<!-- impeccable:product-schema 1 -->

The product record for www.lucentoapp.com. Carried over from `lucento-studio/PRODUCT.md`, which the owner confirmed in
the kickoff questionnaire (submitted 2026-11-07) and extended in the 2026-11-08 site reviews. Capabilities and privacy
facts refreshed on 2026-11-13 against lucento-android `main` 0.5.8 (versionCode 13) and the Privacy Policy dated
14 November 2026. The app's code and published legal text are the source of truth; when this file disagrees with them,
fix this file.

## Platform

web

## Stack

Existing codebase: Astro 7 static pages with Vercel Functions for `/api/*`, on Vercel at www.lucentoapp.com. The
owner delegated the stack on 2026-11-07; static-first pages suit the mid-range Android phones the audience uses.

## Users

People who want everything about their money in one organized place: wallets, income, expenses, budgets, savings,
debts, bills and assets. They want to see what they have, what they owe, where their money goes and how they're
progressing toward their goals. They record their own money; Lucento never connects to a bank.

Market: the Philippines first, written so it works for anyone in any currency. Language: English at launch.

## Product Purpose

Lucento is a native Android personal finance app (`com.lucento.app`; no iOS app). The app's philosophy is "Financial
clarity without the complexity." For the website, success means installs from Google Play. Until the listing is public
(`site.playListed`), the main action is the "Coming soon to Google Play" status with the Play mark; there is no
pre-registration (owner, 2026-11-08). The site is not marketed yet.

## Positioning

Lead promise, in the owner's words (2026-11-07):

> **Everything about your money. One place.**
> Track your wallets, income, expenses, budgets, savings, debts, bills, and assets in one beautifully organized space.
> See what you have, what you owe, where your money goes, and how you're progressing toward your goals.

The live headline is the variant "Everything about your money, in one clear view."

Supporting proof, all true of the app today:

- Say what you spent: one message ("Lunch 250, groceries 1,200, shampoo 180") becomes rows you check before saving,
  worked out on the phone, even offline. Speaking and receipt scanning work too.
- No bank login, ever. People record their own wallets; logos for 400+ institutions (409 in 48 countries, 36
  Philippine) ship inside the app for display only.
- Honest money math: exact arithmetic, transfers never count as income or spending, a card you owe is never shown as
  money you have, and the monthly budget is always the sum of its categories.
- Local-first and offline, with optional cloud sync.

Never claim: that the mascot's torch or light follows the budget (no screen does this; owner, 2026-11-07); "no ads"
for Free (ads may come to Free; owner, 2026-11-08).

## Operating Context

- Visitors arrive on Android phones, often mid-range, on mobile data. The owner tests on an Android phone.
- Prices on the site are indicative Philippine prices; Google Play shows each country's price before purchase.
- Plans (lucento-android `PlanCatalog`, `docs/monetization/CUSTOMER_COPY.md`):
  - Free: no account needed; 3 money wallets and 2 cards or loans, 2 active goals, Insights over 3 months, Ask
    Lucento, backups, CSV, app lock, two themes (Sunrise, Midnight), 10 AI adviser questions a month when signed in.
    Limits apply only to adding new items.
  - Pro: ₱149 a month, or ₱1,190 a year with a 7-day free trial (once per Google account).
  - Pro Lifetime: ₱3,490 once; every on-phone Pro feature forever plus 12 months of the online services, then Lucento
    Cloud (₱59 a month or ₱490 a year) or carry on without them.
  - Purchases happen in the app through Google Play. After a confirmed purchase the app plays "Welcome to Pro", a deck
    of perk cards (replayable from the Pro page).

## Capabilities and Constraints

Shipped on `main` (0.5.8):

- Recording: the composer (type, speak, scan; several rows at once; nothing saved until reviewed). Lucento listens
  itself with the microphone permission; online voice is an opt-in for phones that can't recognise speech offline.
- Home-screen widgets (free): Quick add (one tap into Type, Speak or Scan) and Safe to spend (Home's budget card in
  brief); they follow Hide amounts, App lock and the theme; no permission, no network.
- Budgets (always the sum of category allocations), month pace and safe-to-spend; scheduled bills and salary (never
  posted automatically); savings goals with pace; debts and loans (suggested amortization, reminders, installments);
  credit cards (limit, statement and due days, optional "amount due now" at setup).
- Wallets: cash, bank, e-wallet, savings, card, loan; receivables and valued assets (Pro); wallet actions Transfer,
  Withdrawal, Adjust balance, Record payment / External payment; net worth and what it is made of on Wallets.
- Insights: filters, Money in / Money out, where your money went (expenses by category), net worth over time; 3 months
  free, 6 and 12 with Pro; wallet statement reports (also on each wallet's page); PDF statements (Pro).
- Ask Lucento: answers from the person's own records on the phone; optional AI adviser and Smarter reading (Gemini).
- Multicurrency wallets (Pro): exact decimal rates, average-rate valuation, FX gains and losses.
- Lucento Shared (Pro): one Owner and one Partner on their own phones.
- Five themes (Sunrise, Midnight free; Grove, Mono, Aurora Pro); awards: milestones presented as medals by the mascot.
- Backup file and restore, CSV export, app lock, Hide amounts, Hide in recent apps, optional cloud sync and restore
  (Pro), account deletion in the app and at `/delete-account`.
- Signing out: synced records leave the phone (the account keeps them) after the app offers to sync or back up
  unsynced changes; records that only ever lived on this phone can be kept.

Privacy (Privacy Policy 2026-11-14, `feature/legal/LegalDocuments.kt`; re-read it before writing any privacy line):

- Opt-ins, off until chosen: cloud sync after sign-in; Smarter reading (sends the typed message); AI adviser answers
  (a summary of the person's finances including recent transactions); anonymous usage counts; crash reports; online
  voice (the phone's speech service may send the recording to Google). Signed-in accounts get account emails (verify,
  welcome, Pro confirmation). Gemini's free tier: Google may keep and read what Gemini receives.
- On by default: exchange rates when something is recorded in another currency (two currency codes and a date, never
  an amount; off in Settings › Money); Google Play billing's own diagnostics; while online, the app asks Lucento's
  server every few hours whether a Pro purchase is still valid (signed in or not; never the records).
- Never write an unscoped "nothing leaves your phone". Either list every path or scope the claim ("your entries") and
  link to `/privacy`.

Pages that must survive any redesign: `/privacy` and `/terms` (generated from lucento-android by
`tools/legal/export_legal.py`; never hand-edit `legal.ts`), `/delete-account` (a Google Play requirement), `/auth/*`,
`/api/*`, `robots.txt`, the sitemap, and the redirects (`/pricing` → `/#pricing`, `/demo` and `/how-to` → `/`).

Owner content decisions (2026-11-08) that stand until the owner changes them: real app screens only, never invented
UI; a replica of app UI uses the app's strings and figures and says it is one; show what Lucento does, not every
detail of how (no full flows of Ask Lucento, card mechanics, Shared's rules or sync internals); don't disclose the AI
adviser's monthly ceiling beyond the plan copy; keep the Google Play mark.

## Brand Commitments

- Name: Lucento. Logo: the Rising Crest (three rising bars and a sun). The app uses the Sunrise Energy palette and Plus
  Jakarta Sans; the website's palette keeps Lucento's Crest Blue (logo #154DFD), ivory and midnight.
- Brand evolution: **evolve** (owner, 2026-11-07). The crest and the mascot stay. Original logo and mascot files are
  never overwritten; any new direction is a separate, recoverable file.
- Mascot: a **supporting role only** on the website. The owner is open to a newly generated mascot as a proposal,
  never a silent replacement. It must never take space from important figures; its glow reads poorly on light grounds.
- Voice: plain, specific, calm and adult. Never hype, never shame.
- Website look (owner, 2026-11-13): keep the original site's minimalism and enhance the visual experience without
  adding cognitive or visual load. The four directions explored that day (Month Sheet, Index Tabs, Payday Envelopes,
  Familiar Page) were not taken. The Google Play status keeps its badge look until the listing is live (owner
  reconfirmed 2026-11-13 after the critique flagged it; don't raise it again).

## Evidence on Hand

- Real app UI: crops in `public/screens/` (captured 2026-11-08 from the API 36 tour in peso mode, dark Sunrise, plus
  the five themes in both modes). The app has changed since (Insights, wallet card finish, Pro page): re-capture from
  0.5.8 before reuse (lucento-android `ScreenshotTourTest`, `WebsiteShowcaseTest`; crops by lucento-studio
  `qa/crop-screen.mjs`).
- The demo month's figures (`src/data/demo.ts`), the app's panoramas (`public/brand/scenery`), 35 mascot sprites, the
  app's Lottie files, the Rising Crest SVGs.
- Absent, and never to be fabricated: reviews, ratings, download counts, testimonials, press, awards, partner logos and
  security certifications (owner, 2026-11-07).

## Product Principles

1. Truth before persuasion: every claim traces to the app's behaviour or docs.
2. Everything in one place, made calm: breadth is the promise, so the site must feel organized, never crowded.
3. Show, don't assert: real screens and real interactions over adjectives.
4. Private by default, stated precisely, exceptions included.
5. Fast on a mid-range Android phone on mobile data.

## Accessibility & Inclusion

WCAG 2.2 AA throughout, touch targets of at least 44 px, reduced motion honoured everywhere, amounts always signed
(never colour alone), text usable to 200 % and polished to 130 %, English at launch.
