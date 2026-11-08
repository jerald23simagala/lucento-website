/**
 * Lucento's plans, for /pricing and the home page. Copy follows lucento-android docs/monetization/CUSTOMER_COPY.md
 * (approved 2026-11-06): only shipped features, every row says what the person can do, and Lifetime always separates
 * what is owned from what is a service. Limits mirror the app's PlanCatalog.
 *
 * Prices are the indicative Philippine prices from that document. Google Play sets the real price in each country, and
 * the app only ever shows Google Play's price — so every price on this site carries that note.
 */

export const priceNote = 'Indicative prices in the Philippines. Google Play shows the exact price in your currency before you pay.';

export interface PlanCard {
  id: 'free' | 'pro' | 'lifetime';
  name: string;
  tagline: string;
  price: string;
  priceDetail: string;
  highlights: string[];
  note: string;
}

export const planCards: PlanCard[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Everything you need to budget, on your phone.',
    price: '₱0',
    priceDetail: 'Forever. No ads, no account needed.',
    highlights: [
      'Record by typing, speaking or scanning, with unlimited history',
      'Up to 3 money wallets and 2 cards or loans',
      'Monthly budgets per category, your pace, and what’s safe to spend today',
      'Scheduled bills and salary, 2 active savings goals',
      'Insights over the last 3 months',
      '10 AI adviser questions a month when you sign in',
      'Backup files, CSV export, app lock, two themes',
    ],
    note: 'Limits only apply to adding new items. What you already have is always yours.',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'All of Lucento, on every phone you own, while you subscribe.',
    price: '₱149 a month',
    priceDetail: 'or ₱1,190 a year (about ₱99 a month). Yearly starts with a 7-day free trial.',
    highlights: [
      'Everything in Free, without the wallet, card and loan limits',
      'Wallets in other currencies, with today’s rates and your exchange gains and losses',
      'Receivables, and things you own at a value you set',
      'Up to 20 active goals; Insights over 6 and 12 months',
      'Statements as PDF; all five themes',
      'Cloud sync between phones, and restore from your account',
      'Lucento Shared: one Partner records in your ledger from their own phone',
      'AI adviser, 50 questions a day, and Smarter reading',
    ],
    note: 'Renews until you cancel in Google Play. Cancel during the trial and you pay nothing.',
  },
  {
    id: 'lifetime',
    name: 'Pro Lifetime',
    tagline: 'Pay once. Own every Pro feature that runs on your phone.',
    price: '₱3,490 once',
    priceDetail: 'No renewal, ever.',
    highlights: [
      'Every on-phone Pro feature, forever, fully offline',
      'Future Pro features that run on the phone',
      '12 months of the online services included: sync, restore, Shared, AI at the Pro allowance',
      'After that, keep the online services with Lucento Cloud (₱59 a month or ₱490 a year), or carry on without them',
    ],
    note: 'Restored automatically on a new phone with the same Google account.',
  },
];

export type Cell = boolean | string;

export interface CompareGroup {
  title: string;
  rows: { what: string; free: Cell; pro: Cell; lifetime: Cell }[];
}

const yes = true;
const no = false;
const firstYear = 'First 12 months, then with Lucento Cloud';

export const compareGroups: CompareGroup[] = [
  {
    title: 'Everyday money',
    rows: [
      { what: 'Record income and expenses by typing, speaking or scanning — several at once — and review before saving', free: 'Unlimited', pro: 'Unlimited', lifetime: 'Unlimited' },
      { what: 'Every transaction you’ve recorded: search, filter, edit, delete', free: yes, pro: yes, lifetime: yes },
      { what: 'Transfers between wallets that never double-count', free: yes, pro: yes, lifetime: yes },
      { what: 'Categories: 82 ready-made spending categories, plus your own', free: yes, pro: yes, lifetime: yes },
      { what: 'Monthly budget per category; your total is their sum; pace and safe-to-spend', free: yes, pro: yes, lifetime: yes },
      { what: 'Works offline, on your phone, with no account', free: yes, pro: yes, lifetime: yes },
    ],
  },
  {
    title: 'Wallets and net worth',
    rows: [
      { what: 'Money wallets — cash, banks, e-wallets, savings — with logos for 400+ institutions', free: 'Up to 3', pro: 'Unlimited', lifetime: 'Unlimited' },
      { what: 'Credit cards and loans with interest, installments, statement and due dates', free: 'Up to 2', pro: 'Unlimited', lifetime: 'Unlimited' },
      { what: 'What others owe you (receivables)', free: no, pro: yes, lifetime: yes },
      { what: 'Things you own at a value you set', free: no, pro: yes, lifetime: yes },
      { what: 'Net worth: everything you own minus everything you owe', free: yes, pro: yes, lifetime: yes },
      { what: 'Wallets in other currencies, shown in your main currency at the average rate', free: no, pro: yes, lifetime: yes },
    ],
  },
  {
    title: 'Saving and planning',
    rows: [
      { what: 'Savings goals with a target, a date and a projected finish', free: '2 active', pro: '20 active', lifetime: '20 active' },
      { what: 'Scheduled bills, salary and debt payments', free: 'Unlimited', pro: 'Unlimited', lifetime: 'Unlimited' },
    ],
  },
  {
    title: 'Understanding your money',
    rows: [
      { what: 'Insights: income against spending, month by month', free: 'Last 3 months', pro: '3, 6 or 12 months', lifetime: '3, 6 or 12 months' },
      { what: 'What your net worth is made of', free: no, pro: yes, lifetime: yes },
      { what: 'Ask Lucento: answers from your own figures, on the phone', free: yes, pro: yes, lifetime: yes },
      { what: 'Statements as PDF', free: no, pro: yes, lifetime: yes },
      { what: 'AI adviser (Gemini; sign-in, consent and internet needed)', free: '10 a month', pro: '50 a day', lifetime: '50 a day for 12 months, then 10 a month or Lucento Cloud' },
      { what: 'Smarter reading of messy messages (Gemini)', free: no, pro: yes, lifetime: firstYear },
    ],
  },
  {
    title: 'Keeping your data',
    rows: [
      { what: 'Backup file and restore; CSV export', free: yes, pro: yes, lifetime: yes },
      { what: 'Cloud sync between your phones', free: no, pro: yes, lifetime: firstYear },
      { what: 'Restore from your account on a new phone', free: no, pro: yes, lifetime: firstYear },
      { what: 'Lucento Shared: one Partner, wallets labelled Shared or Personal', free: no, pro: yes, lifetime: firstYear },
      { what: 'App lock, hidden amounts, hidden in recents', free: yes, pro: yes, lifetime: yes },
      { what: 'Themes', free: 'Sunrise and Midnight', pro: 'All five', lifetime: 'All five' },
    ],
  },
];

export interface Faq {
  q: string;
  a: string;
}

/** CUSTOMER_COPY.md §E, trimmed; answer 21 follows what the app actually does when an account is deleted. */
export const pricingFaq: Faq[] = [
  {
    q: 'Does Lucento work offline?',
    a: 'Yes. Recording, budgets, wallets, debts, goals, schedules, Insights and Ask Lucento’s on-phone answers all run with no internet and no account. Only sign-in, the AI adviser, cloud sync and Lucento Shared need a connection.',
  },
  {
    q: 'Can I try Pro for free?',
    a: 'Yes. Pro yearly has a 7-day free trial, once per Google account. Cancel in Google Play before it ends and you aren’t charged.',
  },
  {
    q: 'How do I cancel?',
    a: 'In Google Play › Payments & subscriptions › Subscriptions, or from Manage subscription on Lucento’s Pro page. You keep Pro until the end of the period you paid for. Lifetime has nothing to cancel.',
  },
  {
    q: 'What happens to my data if I stop paying?',
    a: 'Nothing is deleted or hidden. Wallets and goals beyond the free limits stay and stay editable; the limits only apply to adding new ones. Cloud sync pauses and resumes if you come back.',
  },
  {
    q: 'What is Pro Lifetime, exactly?',
    a: 'A one-time purchase of every Pro feature that runs on your phone, forever, plus 12 months of the online services. Servers cost money every month, so after that year the online services continue with Lucento Cloud — or you carry on without them. Nothing you own is affected.',
  },
  {
    q: 'I’m changing phones. Do I lose my purchase?',
    a: 'No. Use the same Google account in Google Play and it’s restored automatically, or sign in to your Lucento account. Bring your data with a backup file (free) or restore it from your account while sync is active.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Purchases go through Google Play, which handles refunds under its own policy; you can ask from your Google Play order history. If Google refunds a purchase, the matching plan ends. Your data is never affected.',
  },
  {
    q: 'I subscribe to Pro and want Lifetime. Do I pay twice?',
    a: 'Buy Lifetime, then cancel the subscription in Google Play. You keep Pro until the paid period ends. If several paid months are left, write to us and we’ll extend your included online services by the same amount.',
  },
  {
    q: 'Does my Lucento Shared Partner need to pay?',
    a: 'No. The Owner’s plan carries the Shared Space; the Partner needs no plan of their own.',
  },
  {
    q: 'Will prices change?',
    a: 'They may, and we’ll say so first. A Lifetime you bought stays yours at the price you paid. Subscription price changes follow Google Play’s rules, which notify you and ask for consent where required.',
  },
  {
    q: 'What if I delete my account?',
    a: 'Deleting your Lucento account removes it and its cloud data from our servers, and erases the records on that phone. It doesn’t cancel a subscription — cancel in Google Play first. A Lifetime purchase stays with your Google account and can be restored on a new Lucento account.',
  },
];
