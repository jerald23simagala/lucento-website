/**
 * Five real Android screens. `file` is the source capture in the marketing
 * screenshot set; the site serves the AVIF/WebP derivatives under /screens.
 */
export interface ShowcaseScreen {
  id: string;
  file: string;
  kicker: string;
  title: string;
  body: string;
  alt: string;
}

export const showcaseScreens: ShowcaseScreen[] = [
  {
    id: '09-composer-rows',
    file: '09-composer-rows.png',
    kicker: 'Write it',
    title: 'Check the rows, then save',
    body: 'A message becomes rows you review. If one is incomplete, Save waits — it reads “Fix 1 highlighted to save.” Nothing is stored until you tap it.',
    alt: 'Add transactions in Lucento. One transaction is incomplete, expenses are −$165.00, and the button reads Fix 1 highlighted to save. The keyboard is open.',
  },
  {
    id: '11-transactions',
    file: '11-transactions.png',
    kicker: 'Check it',
    title: 'Every record, by day',
    body: 'Saved transactions sit in a ledger grouped by day, with in, out and net for the month. Swipe a row to edit or delete. Transfers stay transfers.',
    alt: 'Transactions: in +$12,600.00, out −$6,597.99, net +$6,002.01, and a list grouped by day including Market, an uncategorised expense, Shoes and Streaming.',
  },
  {
    id: '06-home-within-budget',
    file: '06-home-within-budget.png',
    kicker: 'Keep pace',
    title: 'The month, and its light',
    body: 'Home compares budget used with how much of the month has passed. On pace, the torch is bright. The light describes the month — it doesn’t scold you.',
    alt: 'Home for October 2026. Monthly budget 89% used of $2,590.00, spending in step with the month, about $58.40 a day, net flow +$1,902.01, and the mascot holding a lit torch.',
  },
  {
    id: '15-budget',
    file: '15-budget.png',
    kicker: 'The budget',
    title: 'What you can still spend',
    body: '$292.01 left of $2,590.00. The line marks today — 87% of the month has gone — and about $58.40 a day keeps the rest on pace. Spending with no category still counts.',
    alt: 'Budget for October 2026. $292.01 left of $2,590.00, 89% spent, $58.40 per day, and a line marking that 87% of the month has gone.',
  },
  {
    id: '12-wallets',
    file: '12-wallets.png',
    kicker: 'Wallets',
    title: 'Assets minus debts',
    body: 'Cash, everyday bank and savings on one side, the Visa card on the other. Net worth is what you have minus what you owe. Moving money between them is never spending.',
    alt: 'Wallets. Net worth $18,212.01, assets $18,852.01 across cash, everyday bank and savings, and a Visa card owing $640.00.',
  },
];
