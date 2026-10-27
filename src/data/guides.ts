/**
 * The how-to guides, shown on /how-to and listed on the home page. They describe the Android app as it is today.
 * Each `id` is also the key of its interactive story in src/demo/simulator.ts.
 */
export interface Guide {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  tip?: string;
}

export const guides: Guide[] = [
  {
    id: 'get-started',
    title: 'Set up Lucento',
    summary: 'Pick your spending categories, currency and look, then add your accounts.',
    steps: [
      'Open Lucento and tap Get started.',
      'Say what you care about (everyday spending, saving, paying off debt…) and which modules to show. You can skip both and change them later.',
      'Choose the categories you spend on. This one is required: your budget is built from them.',
      'Pick your main currency and light, dark or system appearance.',
      'Optionally connect a Google or email account to back up and sync. “Not now” keeps everything on the phone.',
      'A short guided setup follows: add your accounts, any cards or loans, two budget amounts, a goal and your first transactions.',
    ],
    tip: 'Already use Lucento on another phone? Tap “I already have an account” instead — see Move to a new phone.',
  },
  {
    id: 'add-transactions',
    title: 'Add transactions',
    summary: 'Write several at once, scan a receipt or speak — then check and save.',
    steps: [
      'Tap the blue + in the middle of the dock.',
      'Write what happened, as many as you like: “Lunch 45, groceries 120, parking 15”.',
      'Send it. Each transaction becomes a row; anything doubtful is highlighted.',
      'Fix what needs it: tap the amount, the category, the date or the account on a row.',
      'Tap Save. All rows are saved together.',
    ],
    tip: 'Use the camera button to read a receipt, or the microphone to speak (English for now). Both are read on your phone. To change a saved transaction, swipe it left in Transactions and tap Edit.',
  },
  {
    id: 'budget',
    title: 'Plan and follow your budget',
    summary: 'Give each category an amount and watch your pace against the month.',
    steps: [
      'Open the Budget tab in the dock.',
      'Give each category you spend on a monthly amount. The month’s budget is always their sum.',
      'On Home, the budget card shows two bars: how much of the budget you’ve used, and how much of the month has passed.',
      'Read the banner: spending faster than, in step with, or slower than the month — and about how much a day keeps you within budget.',
      'Tap a category on the Budget tab to see what is left in it.',
    ],
    tip: 'Spent is every expense in the month, including ones in categories without an amount. The Budget tab tells you how much is outside your categories so nothing hides.',
  },
  {
    id: 'wallets',
    title: 'Track wallets and move money',
    summary: 'Cash, bank, e-wallets, savings, cards and loans — and transfers between them.',
    steps: [
      'Open Wallets in the dock and tap Add.',
      'Choose the type (cash, bank, e-wallet, savings, credit card or loan), name it and enter today’s balance.',
      'To move money between two of your accounts, open one and tap Transfer. A transfer is never counted as income or spending.',
      'If a balance drifts from your bank’s, open the wallet and use Adjust balance.',
    ],
    tip: 'Net worth is your assets minus your debts. Accounts in different currencies are shown separately and never converted.',
  },
  {
    id: 'scheduled',
    title: 'Schedule bills and income',
    summary: 'Rent, subscriptions and salary, with a bell that tells you what’s due.',
    steps: [
      'On Home, open Scheduled from Quick links and tap Add.',
      'Choose Bill, Income or Debt payment, then the name, amount, account and how often it repeats.',
      'The bell at the top of Home shows a count of what’s overdue or due within 7 days; red means something is overdue.',
      'Tap the bell, then an item, and Mark paid when it’s done.',
    ],
    tip: 'Nothing is recorded until you mark it paid or received, so a plan never turns into spending by itself.',
  },
  {
    id: 'debts',
    title: 'Pay down a card or loan',
    summary: 'Add its terms, schedule payments and split each one into principal and interest.',
    steps: [
      'Add the card or loan in Wallets, with what you owe and, if you know them, the interest rate and repayment plan.',
      'From the debt, plan a payment: Lucento suggests the monthly amortization from its terms.',
      'When you mark a payment paid, enter the interest from your statement.',
      'The interest is recorded as spending under “Debt interest”; the rest moves to the debt as a transfer and lowers what you owe.',
    ],
  },
  {
    id: 'goals',
    title: 'Save toward a goal',
    summary: 'Set a target, give it a picture and add to it as you save.',
    steps: [
      'Open Goals from Quick links on Home and tap Add.',
      'Enter the goal, the amount and, optionally, a target date and a picture.',
      'Add to it whenever you put money aside. Lucento shows how close you are and, with a date, the pace you need.',
    ],
    tip: 'Goals show progress only: the money itself stays in your wallets, so it is never counted twice in net worth.',
  },
  {
    id: 'new-phone',
    title: 'Move to a new phone',
    summary: 'Sign in on the new phone and your account comes across — no setup story.',
    steps: [
      'On your old phone, open Settings › Cloud sync and tap Sync now. Anything not synced stays on that phone.',
      'Install Lucento on the new phone and tap “I already have an account”.',
      'Read the reminder and continue, then sign in with the same Google or email account.',
      'Lucento downloads your wallets, transactions, budgets, goals and scheduled payments, then opens Home.',
    ],
    tip: 'If the account has nothing saved yet, Lucento continues with the normal setup — you stay signed in.',
  },
  {
    id: 'sync',
    title: 'Back up and sync',
    summary: 'Optional: keep your data the same on every phone you use.',
    steps: [
      'Open Settings from the profile button and go to Cloud sync.',
      'Connect a Google account, or create an email account.',
      'Lucento syncs in the background; Sync now runs it straight away.',
      'Disconnect any time. Your data stays on the phone, and anyone using the phone can still open it.',
    ],
    tip: 'A phone keeps syncing with the account it first synced with, so two people’s records never mix on one device.',
  },
  {
    id: 'smarter-reading',
    title: 'Turn on Smarter reading',
    summary: 'Optional: let Gemini read what you type in the composer.',
    steps: [
      'Connect a sync account first (Settings › Cloud sync).',
      'Open Settings › Smarter reading and read what is sent before turning it on.',
      'Type in the composer as usual. The reply says who read it; you still review every row before saving.',
    ],
    tip: 'Sent: the message, today’s date, your main currency and your category and account names. Never your balances or history. There is a daily allowance; after it, reading happens on the phone.',
  },
  {
    id: 'export',
    title: 'Export your transactions',
    summary: 'Save every transaction as a spreadsheet file.',
    steps: [
      'Open Settings from the profile button.',
      'Tap Export to CSV and choose where to save the file.',
      'Open it in any spreadsheet app.',
    ],
  },
];
