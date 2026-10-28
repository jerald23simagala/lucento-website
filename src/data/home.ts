/** Copy and fixtures for the baseline homepage. Amounts are the app’s demo data. */

export const icons = {
  back: 'M19 12H5M11 18l-6-6 6-6',
  coffee: 'M5 8h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2M8 3v2M11 3v2',
  basket: 'M4 9h16l-1.5 10h-13zM8 9l3-5M16 9l-3-5',
  food: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2-3 5s1 4 3 4v9',
  income: 'M12 4v10M8 10l4 4 4-4M4 16v3h16v-3',
  transfer: 'M4 8h14l-3-3M20 16H6l3 3',
  bus: 'M5 16V11l2-5h10l2 5v5M5 16h14M7 19v-3M17 19v-3M5 11h14',
  gift: 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0',
} as const;

export type IconName = keyof typeof icons;

export interface ComposerRow {
  icon: IconName;
  tile: string;
  glyph: string;
  name: string;
  meta: string;
  amount: string;
  amountColor: string;
}

export interface ComposerExample {
  id: string;
  message: string;
  found: string;
  ready: string;
  totals: string;
  save: string;
  saved: string;
  rows: ComposerRow[];
}

const ink = '#17233F';
const pos = '#137A53';
const mute = '#5E687D';

export const composerExamples: ComposerExample[] = [
  {
    id: 'lunch',
    message: 'Lunch 250, groceries 800, salary 35000',
    found: 'Found 3 transactions. Review anything that looks wrong.',
    ready: '3 transactions ready',
    totals: 'Expenses −$1,050.00 · Income +$35,000.00',
    save: 'Save 3 transactions',
    saved: 'Saved all 3.',
    rows: [
      { icon: 'food', tile: '#FFE9E4', glyph: '#D9452F', name: 'Lunch', meta: 'Restaurants · Today', amount: '−$250.00', amountColor: ink },
      { icon: 'basket', tile: '#FFE9E4', glyph: '#D9452F', name: 'Groceries', meta: 'Groceries · Today', amount: '−$800.00', amountColor: ink },
      { icon: 'income', tile: '#E3F5EC', glyph: '#16865C', name: 'Salary', meta: 'Income · Today', amount: '+$35,000.00', amountColor: pos },
    ],
  },
  {
    id: 'coffee',
    message: 'Yesterday coffee 180 and dinner 650',
    found: 'Found 2 transactions. Review anything that looks wrong.',
    ready: '2 transactions ready',
    totals: 'Expenses −$830.00',
    save: 'Save 2 transactions',
    saved: 'Saved all 2.',
    rows: [
      { icon: 'coffee', tile: '#FFF1D6', glyph: '#B86A08', name: 'Coffee', meta: 'Restaurants · Yesterday', amount: '−$180.00', amountColor: ink },
      { icon: 'food', tile: '#FFE9E4', glyph: '#D9452F', name: 'Dinner', meta: 'Restaurants · Yesterday', amount: '−$650.00', amountColor: ink },
    ],
  },
  {
    id: 'transfer',
    message: 'Transfer 5000 from bank to savings',
    found: 'Found 1 transaction. Review anything that looks wrong.',
    ready: '1 transaction ready',
    totals: '1 transfer',
    save: 'Save 1 transaction',
    saved: 'Saved.',
    rows: [
      { icon: 'transfer', tile: '#EAF1FF', glyph: '#3563F5', name: 'Everyday bank → Savings', meta: 'Transfer · Today', amount: '$5,000.00', amountColor: mute },
    ],
  },
];

export interface CheckRow {
  icon: IconName;
  tile: string;
  glyph: string;
  title: string;
  flag: string;
  flagTone: 'warn' | 'mute';
  amount: string;
  amountColor: string;
  dashed?: boolean;
  text: string;
}

export const checkRows: CheckRow[] = [
  {
    icon: 'coffee',
    tile: '#FFF1D6',
    glyph: '#B86A08',
    title: 'Coffee with Sam',
    flag: 'Add an amount to save this row',
    flagTone: 'warn',
    amount: '$ —',
    amountColor: '#9A5806',
    dashed: true,
    text: 'No amount, no save. A row without one waits until you add it.',
  },
  {
    icon: 'basket',
    tile: '#E3F5EC',
    glyph: '#16865C',
    title: 'Groceries',
    flag: 'Same as a purchase earlier today — keep both?',
    flagTone: 'warn',
    amount: '−$86.40',
    amountColor: ink,
    text: 'Typed it twice? Duplicate purchases on the same day are flagged.',
  },
  {
    icon: 'transfer',
    tile: '#EAF1FF',
    glyph: '#3563F5',
    title: 'Everyday bank → Savings',
    flag: 'Transfer · linked on both wallets',
    flagTone: 'mute',
    amount: '$500.00',
    amountColor: mute,
    text: 'Moving money between your own wallets is a linked transfer — not income, not spending.',
  },
  {
    icon: 'bus',
    tile: '#E0F2FE',
    glyph: '#0B7FC0',
    title: 'Taxi from the airport',
    flag: 'Transport · Travel wallet',
    flagTone: 'mute',
    amount: '−€38.00',
    amountColor: ink,
    text: 'Each currency keeps its own totals. Nothing is converted behind your back.',
  },
  {
    icon: 'gift',
    tile: '#FDE6EE',
    glyph: '#C93A68',
    title: 'Birthday gift',
    flag: 'No category · still counts toward Spent',
    flagTone: 'mute',
    amount: '−$24.00',
    amountColor: ink,
    text: 'Spending outside your categories still counts. The total never flatters you.',
  },
];

export interface LightTier {
  id: string;
  name: string;
  when: string;
  glow: number;
  line: string;
  /** Baseline mascot art, copied into public/mascot. */
  image: string;
}

export const lightTiers: LightTier[] = [
  { id: 'thriving', name: 'Thriving', when: 'Spending right at the month’s pace', glow: 100, line: 'In step with the month. About $58.40 a day keeps you within budget.', image: 'thriving' },
  { id: 'steady', name: 'Steady', when: 'Ahead of pace, or no budget yet', glow: 80, line: 'A little ahead of the month. Room to breathe.', image: 'steady' },
  { id: 'getting-tight', name: 'Getting tight', when: '80% or more of the budget used', glow: 60, line: 'Getting close — $40 a day keeps you on budget.', image: 'getting-tight' },
  { id: 'concerned', name: 'Concerned', when: '10% or less left', glow: 42, line: '$120 left for 9 days. Smaller days will carry you through.', image: 'concerned' },
  { id: 'over-plan', name: 'Over plan', when: 'More spent than budgeted', glow: 28, line: 'Over by $85 this month. Here’s where it went.', image: 'over-plan' },
];

export const answers = [
  { q: 'Does it connect to my bank?', a: 'No, and that’s by design. You record what you spend; Lucento never asks for a bank login.' },
  {
    q: 'Do I need an account?',
    a: 'Only for sync, and for the optional Read messages with Gemini setting. What you type is stored on the phone and works offline. Speech recognition asks to run on the device, but that isn’t guaranteed.',
  },
  { q: 'Can I move to a new phone?', a: 'Yes, if you use sync: sign in on the new phone during setup and restore your records. Signing out never deletes anything on the old one.' },
  { q: 'Why does Spent include uncategorised things?', a: 'Because the money is gone either way. Leaving it out would make the month look better than it is.' },
  { q: 'When is it out, and what will it cost?', a: 'It’s coming to Google Play. A date and pricing haven’t been announced.' },
];

export const limits = [
  'Android only, in English for now',
  'No currency conversion',
  'Calendar-month budgets only',
  'No phone notifications yet — the in-app bell only',
  'Interest is entered by hand',
  'Read messages with Gemini needs a sync account and has a daily limit',
];
