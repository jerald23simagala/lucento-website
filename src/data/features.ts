/** Real screens for the feature strip. Copy only names behaviour checked in lucento-android. */
export interface FeatureCard {
  id: string;
  file: string;
  title: string;
  body: string;
  alt: string;
}

export const featureCards: FeatureCard[] = [
  {
    id: '09-composer-rows',
    file: '09-composer-rows.png',
    title: 'Several in one message',
    body: 'One note becomes rows you check. Nothing is stored until you tap Save.',
    alt: 'Add transactions with several rows from one message, and a save button that waits while a row is incomplete.',
  },
  {
    id: '08-composer-empty',
    file: '08-composer-empty.png',
    title: 'Receipt or voice',
    body: 'Scan a receipt on the phone, or say what you spent. Speech only asks the recogniser to stay on the device, and that isn’t guaranteed.',
    alt: 'The empty composer, with a receipt scan button, a microphone, and a text field. The line under the suggestions says reading stays on the phone.',
  },
  {
    id: '06-home-within-budget',
    file: '06-home-within-budget.png',
    title: 'Pace, and the light',
    body: 'Home sets what you’ve spent against how much of the month has passed. On pace, the torch is bright.',
    alt: 'Home with the monthly budget, spending in step with the month, and the mascot holding a lit torch.',
  },
  {
    id: '15-budget',
    file: '15-budget.png',
    title: 'A limit for the month',
    body: 'What’s left, a line for today, and a limit on each category. Spending with no category still counts.',
    alt: 'Budget for October with money left, a daily amount, and a line marking how much of the month has gone.',
  },
  {
    id: '16-manage-categories',
    file: '16-manage-categories.png',
    title: 'Categories',
    body: 'The spending categories your budget is built from. Add one, or start from the presets.',
    alt: 'Categories: spending categories the budget is built from, with add and preset actions.',
  },
  {
    id: '13-insights-trends',
    file: '13-insights-trends.png',
    title: 'Insights',
    body: 'Income and spending, month by month, from the records on the phone.',
    alt: 'Insights trends for income and spending across recent months.',
  },
  {
    id: '14-insights-net-worth',
    file: '14-insights-net-worth.png',
    title: 'Net worth',
    body: 'What you have, minus what you owe. A card you owe is never counted as money you have.',
    alt: 'Insights net worth, assets minus liabilities.',
  },
  {
    id: '18-recurring',
    file: '18-recurring.png',
    title: 'Scheduled (recurring payments)',
    body: 'Bills and salary you confirm when they happen. A balance changes only when you mark one paid.',
    alt: 'The Scheduled screen of recurring payments waiting to be confirmed.',
  },
  {
    id: '20-home-dark',
    file: '20-home-dark.png',
    title: 'A dark theme',
    body: 'The same Home screen, when the phone is in dark.',
    alt: 'Lucento Home in the dark theme.',
  },
  {
    id: '04a-onboarding-sync',
    file: '04a-onboarding-sync.png',
    title: 'Sync, if you want it',
    body: 'Nothing leaves the phone unless you turn sync on. Signing out never deletes what’s on the device.',
    alt: 'Back up and sync, marked optional, with a choice to keep everything on the phone.',
  },
];

/** Balances visible on 12-wallets.png. Example data, not a connected account. */
export const sampleWallets = [
  { name: 'Cash', detail: 'Cash · USD', amount: '$563.00', owe: false },
  { name: 'Everyday bank', detail: 'Bank account · USD', amount: '$9,889.01', owe: false },
  { name: 'Savings', detail: 'Savings · USD', amount: '$8,400.00', owe: false },
  { name: 'Visa card', detail: 'Credit card · USD', amount: '−$640.00', owe: true },
] as const;
