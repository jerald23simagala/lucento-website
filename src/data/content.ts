/**
 * Homepage content (2026-11-08 reimagination). Every claim here was checked against the app (lucento-android main
 * dbbb901): screens come from the API 36 screenshot tour and WebsiteShowcaseTest in peso mode, theme names and
 * descriptions from core/designsystem/theme/Themes.kt, gates and limits from domain/entitlement (PlanCatalog, ProGates),
 * Shared from docs/shared/PERMISSION_MATRIX.md, multicurrency from docs/MULTICURRENCY.md, backup from docs/BACKUP.md.
 */

/** Pixel size of the cropped phone screens (1080 × 2206 at the source; served at 400/560/720 px wide). */
export const SCREEN_W = 720;
export const SCREEN_H = 1471;

export interface AppScreen {
  id: string;
  /** Selector label. */
  label: string;
  /** File stem in /public/screens (…-400|560|720.avif|webp). Sunrise in dark mode (owner, 2026-11-08). */
  file: string;
  title: string;
  /** One line under the phone in the hero. */
  caption: string;
  alt: string;
}

/** Screen captions and alt texts; the hero stage (HeroStage.astro) shows the Dashboard, Budget and Wallets. */
export const screens: AppScreen[] = [
  {
    id: 'transactions',
    label: 'Transactions',
    file: 's-transactions',
    title: 'Every transaction, in order',
    caption: 'Income, expenses and transfers, searchable, with the month’s totals on top.',
    alt: 'The Transactions screen for this month: income +₱42,000.00, expenses −₱22,979.90 and net inflow +₱19,020.10; today an uncategorised −₱240.00, shoes −₱890.00, streaming −₱159.90 and market −₱1,076.00.',
  },
  {
    id: 'insights',
    label: 'Insights',
    file: 's-insights',
    title: 'Where the money went, month by month',
    caption: 'Income against spending over 3, 6 or 12 months.',
    alt: 'Insights over the last 6 months: net +₱60,020.10 from income ₱126,000.00 and expenses −₱65,979.90, with monthly income and expense bars from June to November.',
  },
  {
    id: 'budgets',
    label: 'Budgets',
    file: 's-budget',
    title: 'A budget that knows what’s coming',
    caption: 'What’s left, what’s safe to spend after bills, and how the month is pacing.',
    alt: 'The Budget screen for November 2026: ₱2,920.10 remaining of a ₱25,900.00 budget, 26% of the month elapsed and 89% of the budget spent, marked “Ahead of pace” because spending is running ahead of the month; ₱22,979.90 spent and ₱0.00 safe to spend because the bills due take what’s left.',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    file: 's-dashboard',
    title: 'The whole month on one screen',
    caption: 'Net wallet balance, wallets against debts, and how the budget is pacing.',
    alt: 'The Lucento Dashboard: net wallet balance ₱62,120.10, wallets ₱176,520.10, debts and loans −₱114,400.00, shortcuts to goals, insights, milestones, debts and scheduled bills, and the monthly budget 89% spent: ₱22,979.90 of ₱25,900.00.',
  },
  {
    id: 'wallets',
    label: 'Wallets',
    file: 's-wallets',
    title: 'Every account as a card you recognise',
    caption: 'Cash, banks, savings, cards and loans as a gallery, with net worth on top.',
    alt: 'The Wallets gallery: net worth ₱62,120.10, assets ₱176,520.10 and liabilities −₱114,400.00, with cards for Cash ₱5,630.00, Everyday bank ₱86,890.10 and Savings ₱84,000.00.',
  },
  {
    id: 'goals',
    label: 'Goals',
    file: 's-goals',
    title: 'Goals with a pace to keep',
    caption: 'Savings goals with a target, a date and the pace you need.',
    alt: 'Goals: ₱37,500.00 saved of ₱80,000.00 across 2 goals (47%), ₱42,500.00 still to save; Emergency fund ₱21,000.00 of ₱50,000.00 (42%) and Japan trip ₱16,500.00 of ₱30,000.00 (55%), each with its pace.',
  },
];

/** The carousel's starting screen. */

/** The five preset themes (Themes.kt). Colours are the app's own background and primary for each mode. */
export interface Look {
  id: string;
  name: string;
  character: string;
  pro: boolean;
  modes: { mode: 'light' | 'dark'; file: string; bg: string; primary: string }[];
}

export const looks: Look[] = [
  {
    id: 'sunrise', name: 'Sunrise', character: 'The signature. Warm ivory, electric blue and sunlight.', pro: false,
    modes: [
      { mode: 'light', file: 't-sunrise-light', bg: '#FFFDF5', primary: '#3563F5' },
      { mode: 'dark', file: 't-sunrise-dark', bg: '#10182B', primary: '#7C9AFF' },
    ],
  },
  {
    id: 'midnight', name: 'Midnight', character: 'Quiet luxury. Indigo black with champagne gold. Always dark.', pro: false,
    modes: [{ mode: 'dark', file: 't-midnight-dark', bg: '#0A0E1A', primary: '#E3C87E' }],
  },
  {
    id: 'grove', name: 'Grove', character: 'Sage paper, forest green and harvest gold.', pro: true,
    modes: [
      { mode: 'light', file: 't-grove-light', bg: '#F5F6EF', primary: '#2E7D5B' },
      { mode: 'dark', file: 't-grove-dark', bg: '#0F1511', primary: '#83CCA5' },
    ],
  },
  {
    id: 'mono', name: 'Mono', character: 'Understated graphite. The money is the colour.', pro: true,
    modes: [
      { mode: 'light', file: 't-mono-light', bg: '#F8F8F7', primary: '#46557A' },
      { mode: 'dark', file: 't-mono-dark', bg: '#121316', primary: '#A8B6D8' },
    ],
  },
  {
    id: 'aurora', name: 'Aurora', character: 'Violet with teal and magenta light.', pro: true,
    modes: [
      { mode: 'light', file: 't-aurora-light', bg: '#F8F6FD', primary: '#6C4DE0' },
      { mode: 'dark', file: 't-aurora-dark', bg: '#0D0A1C', primary: '#A98FFF' },
    ],
  },
];

/**
 * Foreign wallets in WebsiteShowcaseTest: the rates are fixed there, and the peso values are the app's own
 * conversions shown in the captured screens (mc-rows, mc-usd).
 */
export const foreignWallets = [
  { name: 'Dollar savings', kind: 'Savings', currency: 'USD', minor: 185_000, rate: '57.80', pesoMinor: 10_693_000 },
  { name: 'Dubai account', kind: 'Bank account', currency: 'AED', minor: 420_000, rate: '15.74', pesoMinor: 6_610_800 },
  { name: 'Japan trip yen', kind: 'Cash', currency: 'JPY', minor: 60_000, rate: '0.3825', pesoMinor: 2_295_000 },
] as const;
/** Net worth in pesos once those wallets join the demo month (mc-home). */
export const netWorthWithForeign = 25_810_810;

export interface FaqGroup {
  title: string;
  items: { q: string; a: string }[];
}

export const faq: FaqGroup[] = [
  {
    title: 'Using Lucento',
    items: [
      {
        q: 'Does Lucento work offline?',
        a: 'Yes. Recording, budgets, wallets, debts, goals, schedules, Insights and Ask Lucento’s answers all run on your phone with no internet and no account. Only sign-in, cloud sync, Lucento Shared and the Gemini features need a connection, and exchange rates are fetched online when something is recorded in another currency (offline, you type the rate).',
      },
      {
        q: 'Do I need an account?',
        a: 'No. Lucento works fully without one. Without an account, the only default lookup is an exchange rate when you record something in another currency: two currency codes and a date, never an amount (you can turn it off in Settings › Money). An account (Google or email) is only for cloud sync, restoring from your account, Lucento Shared and the AI adviser.',
      },
      {
        q: 'How do I record transactions?',
        a: 'Tap +, then type, speak or scan. “Lunch 150, groceries 1200, and paid the electricity bill” becomes three rows with the amount, category and wallet filled in where Lucento can tell; anything missing is flagged, and nothing is saved until you’ve checked it. Speaking uses your phone’s own speech service, and receipts are read on the phone.',
      },
      {
        q: 'Can I use my own budget categories?',
        a: 'Yes. When you start, you pick from ready-made categories grouped by how people spend, and you can add, rename or archive them later (archived ones keep labelling your history). Your monthly budget is the sum of the amounts you give each category, so the total always adds up.',
      },
      {
        q: 'Can I track wallets in other currencies?',
        a: 'Yes, with Pro. Each wallet keeps its own currency and balance, and Lucento shows what it’s worth in your main currency, so Home, Budget, Insights and net worth add up in one currency. Your main currency is chosen when you start and stays fixed.',
      },
      {
        q: 'How does currency conversion work?',
        a: 'Each movement in another currency is valued at its own day’s rate, and the wallet carries the average. When money leaves, the difference from its own rate is recorded as an FX gain or loss, which shows in Insights. Rates come from public exchange-rate services: only two currency codes and a date are sent, never an amount. Offline, you type the rate. You can switch online rates off in Settings › Money.',
      },
      {
        q: 'What is Lucento Shared?',
        a: 'A Shared Space for two people: you (the Owner) and one Partner, each with their own account and phone. Both see the same wallets, budgets, goals, debts and schedules, and both can add, edit and delete any transaction, with who added or changed it shown. The Owner manages the structure: wallets, budgets, goals, categories, schedules and who’s in the Space. Wallets can be labelled Shared or Personal to keep things organised; the label never hides anything. It needs Pro on the Owner’s side; the Partner needs no plan.',
      },
      {
        q: 'What does the AI do, and what does it send?',
        a: 'Ask Lucento answers from your own records on your phone, sends nothing, and is free. Two optional features use Google’s Gemini and stay off until you sign in and turn them on: the AI adviser, which sends your question with a summary of your finances including recent transactions (10 questions a month on Free, 50 a day with Pro), and Smarter reading with Pro, which sends a message you type with today’s date, your main currency and your category and wallet names. Lucento uses Gemini’s free service for now, so Google may keep what it receives to improve its products, and people at Google may read it.',
      },
    ],
  },
  {
    title: 'Your data',
    items: [
      {
        q: 'Who owns my data?',
        a: 'You do. Your records live on your phone. Export a backup file or a CSV whenever you like, on every plan, and delete your Lucento account and its cloud data from the app or from this website.',
      },
      {
        q: 'How do backups and restoring work?',
        a: 'Export a backup file from Settings › Export, backup and restore and keep it wherever you like; it’s free on every plan. Restoring shows a preview first, then lets you merge the file with what’s on the phone or replace it. With Pro and an account, a new phone can also restore from your account.',
      },
      {
        q: 'How does cloud sync work?',
        a: 'Sync is part of Pro. Sign in and keep sync on, and your phone stays the source of your records while a copy in Lucento’s cloud keeps your phones in step; changes made offline go up when you’re back online. Access rules let only your account, and your Partner in a Shared Space, open it. Signing out removes the records from that phone, and asks first if anything hasn’t synced.',
      },
      {
        q: 'How is Lucento protected on my phone?',
        a: 'Lock Lucento asks for your fingerprint, face or screen lock when you open the app or come back after a minute away; it uses your phone’s own lock and stores nothing. Hide amounts blanks every figure until you unlock again, and Hide in recent apps shows a blank preview when you switch apps and blocks screenshots of Lucento.',
      },
      {
        q: 'I’m changing phones. What do I do?',
        a: 'Bring your records with a backup file (free), or restore from your account while sync is active (Pro). Your purchase comes with your Google account in Google Play: a subscription or Lifetime is restored automatically on the new phone.',
      },
    ],
  },
  {
    title: 'Plans and payment',
    items: [
      {
        q: 'What’s free, and what needs Pro?',
        a: 'Free covers everyday money: unlimited recording and history, budgets, scheduled bills, 3 money wallets and 2 cards or loans, 2 savings goals, 3 months of Insights, Ask Lucento, backups, app lock and two themes. Pro removes the wallet limits and adds wallets in other currencies, receivables and valued assets, 20 goals, 6- and 12-month Insights, PDF statements, all five themes, cloud sync and restore, Lucento Shared, and the AI adviser at 50 questions a day.',
      },
      {
        q: 'Can I try Pro for free?',
        a: 'Yes. Pro yearly starts with a 7-day free trial, once per Google account. Cancel in Google Play before it ends and you aren’t charged.',
      },
      {
        q: 'What is Pro Lifetime, exactly?',
        a: 'A one-time purchase of every Pro feature that runs on your phone, forever, including future ones, plus 12 months of the online services (sync, restore, Shared and the AI adviser at the Pro allowance). After that year, keep the online services with Lucento Cloud, or carry on without them; nothing you own is affected.',
      },
      {
        q: 'What happens to my data if Pro ends?',
        a: 'Nothing is deleted or hidden. Wallets and goals beyond the free limits stay and stay editable; the limits only apply to adding new ones. Cloud sync pauses and picks up again if you come back.',
      },
      {
        q: 'How do I cancel?',
        a: 'In Google Play › Payments & subscriptions › Subscriptions, or from Manage subscription on Lucento’s Pro page. You keep Pro until the end of the period you paid for. Lifetime has nothing to cancel.',
      },
      {
        q: 'Will Lucento keep getting updates?',
        a: 'Yes. Updates come through Google Play on every plan. Pro subscribers get new Pro features while they subscribe, and Pro Lifetime includes future Pro features that run on the phone. Prices may change, and we’ll say so first; a Lifetime you bought stays yours at the price you paid.',
      },
      {
        q: 'Can I get a refund?',
        a: 'Purchases go through Google Play, which handles refunds under its own policy; you can ask from your Google Play order history. If Google refunds a purchase, the matching plan ends. Your data is never affected.',
      },
    ],
  },
];
