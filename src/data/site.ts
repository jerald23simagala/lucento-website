/**
 * Home-page content that describes the Android app: how it works, real-life cases it handles, FAQ and current
 * limitations. Keep it true to the app (lucento-android README "What works today" and docs/ROADMAP.md).
 */

export const howItWorks = [
  { title: 'Choose your categories', body: 'Pick what you spend on and give each one a monthly amount. Your budget is their sum.' },
  { title: 'Write what happened', body: '“Lunch 45, groceries 120” — or scan a receipt, or say it. Read on your phone.' },
  { title: 'Check the rows', body: 'Each transaction becomes a row. Anything doubtful is highlighted for you to fix.' },
  { title: 'Save', body: 'All rows are saved together, once. Nothing is written until you tap Save.' },
  { title: 'Follow your pace', body: 'Home compares budget used with the month passed, and says what you can spend a day.' },
];

export const realLife = [
  { title: 'A message with no amount', body: 'The row is marked and can’t be saved until you add one. Lucento never guesses a number.' },
  { title: 'The same purchase twice', body: 'If a matching transaction is already saved for that day, the row says so before you save it again.' },
  { title: 'Spending outside your plan', body: 'Expenses without a budgeted category still count in Spent, and the Budget tab tells you how much.' },
  { title: 'Moving money, not spending it', body: 'A transfer between your own accounts is two linked records, never income or spending.' },
  { title: 'More than one currency', body: 'Each currency keeps its own totals. Lucento never converts behind your back.' },
  { title: 'No signal', body: 'Everything works offline. Sync, if you use it, catches up when you’re back online.' },
];

export const faq = [
  {
    q: 'Does Lucento connect to my bank?',
    a: 'No. You record what you choose to record — by typing, scanning a receipt or speaking. There is no bank login and no access to your accounts.',
  },
  {
    q: 'Does it work without internet?',
    a: 'Yes. Every core feature works offline. Only the optional cloud sync and the optional Smarter reading use the internet.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. An account (Google or email) is only needed if you want to back up and sync between phones.',
  },
  {
    q: 'Where is my data stored?',
    a: 'On your phone. If you turn on sync, a copy is kept in Lucento’s cloud database, where each row can only be read by your own signed-in account.',
  },
  {
    q: 'What does Smarter reading send to Gemini?',
    a: 'Only when you turn it on: the message you type or speak, today’s date, your main currency and your category and account names. Never your balances or history. Receipts are always read on the phone.',
  },
  {
    q: 'Why does Spent include expenses outside my budget categories?',
    a: 'Because it is the money that actually went out. The Budget tab shows how much of it has no budgeted category, so you can plan for it.',
  },
  {
    q: 'What happens if I sign out?',
    a: 'Sync stops and the phone signs out. Nothing on the phone is deleted, and your cloud copy stays. Sign in with the same account to carry on.',
  },
  {
    q: 'How do I move to a new phone?',
    a: 'Sync the old phone, install Lucento on the new one, tap “I already have an account” and sign in. Your data comes across and you go straight to Home.',
  },
  {
    q: 'Is the demo on this site the real app?',
    a: 'No. It is a browser simulation of the Android app with fictional data. The steps and the maths follow the app, but nothing is saved or sent.',
  },
  {
    q: 'When can I get it, and what will it cost?',
    a: 'Lucento is in development and not on Google Play yet. Pricing hasn’t been announced; it will be before release.',
  },
];

export const limitations = [
  { title: 'Android only', body: 'Lucento is a native Android app. There is no iPhone or web version.' },
  { title: 'English for now', body: 'The app’s text and speech entry are in English. Amounts follow your phone’s number format.' },
  { title: 'No bank connections', body: 'By design: transactions are recorded by you, never imported from a bank.' },
  { title: 'No currency conversion', body: 'Totals stay per currency, and transfers must be between accounts in the same currency.' },
  { title: 'Calendar-month budgets', body: 'Budgets run from the first to the last day of the month; custom start days aren’t supported yet.' },
  { title: 'No phone notifications yet', body: 'Upcoming and overdue payments show on the bell inside the app; reminder notifications are planned.' },
  { title: 'Backup is sync or CSV', body: 'Restore comes from cloud sync. A CSV export keeps a copy of your transactions, but there’s no restore from a file yet.' },
  { title: 'Interest is entered by you', body: 'When you pay a card or loan, you type the interest from your statement; it isn’t calculated automatically.' },
  { title: 'Smarter reading has limits', body: 'It needs a sync account and has a daily allowance; after that, reading happens on the phone.' },
];
