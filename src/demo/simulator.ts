/**
 * The Lucento phone simulation used on the home page and the how-to guides: a small, faithful mock of the Android
 * app with fictional data. Stories are guided tasks; each step completes when the visitor does it on the phone.
 * Money is whole cents and follows the app's rules: the budget is the sum of category amounts, Spent is every expense,
 * days left include today, transfers are never spending, and currencies are never converted.
 */

// ------------------------------------------------------------------ money
const SYMBOLS: Record<string, string> = { USD: '$', PHP: '₱', EUR: '€' };
let symbol = '$';
const fmt = (minor: number): string => {
  const abs = Math.abs(minor);
  return `${symbol}${Math.floor(abs / 100).toLocaleString('en-US')}.${String(abs % 100).padStart(2, '0')}`;
};
/** Signed like the app's MoneyFormatter.formatSigned: a real minus sign, an optional plus. */
const signed = (minor: number, plus = false): string =>
  minor < 0 ? `−${fmt(minor)}` : `${plus && minor > 0 ? '+' : ''}${fmt(minor)}`;
/** Whole percent, rounded half-up, like Insights.percentOf. */
const percentOf = (part: number, whole: number): number => Math.floor((part * 200 + whole) / (whole * 2));
/** "12.40" or "12" → 1240 cents; null when it isn't a positive amount. */
const parseMoney = (text: string): number | null => {
  const m = /^\s*(\d{1,7})(?:\.(\d{1,2}))?\s*$/.exec(text.replace(/,/g, ''));
  if (!m) return null;
  const minor = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  return minor > 0 ? minor : null;
};
const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);

// ------------------------------------------------------------------ icons (Material, filled)
const P = {
  cart: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z',
  dining: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
  car: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
  receipt: 'M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z',
  bag: 'M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z',
  bell: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  pie: 'M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z',
  wallet: 'M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
  add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  send: 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  warn: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  device: 'M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zm-2 20h-4v-1h4v1zm3.25-3H6.75V4h10.5v14z',
  cloud: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 17l-3.5-3.5 1.41-1.41L10 14.17 15.18 9l1.41 1.41L10 17z',
  gym: 'M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z',
  list: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
  trend: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z',
  savings: 'M15 10c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1zM8 9h5V7H8v2zm14-1.5v6.97l-2.82.94L17.5 21H12v-2h-2v2H4.5S2 12.54 2 9.5 4.46 4 7.5 4h5c.91-1.21 2.36-2 4-2 .83 0 1.5.67 1.5 1.5 0 .21-.04.4-.12.58-.14.34-.26.73-.32 1.15l2.27 2.27H22z',
  card: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z',
  google: 'M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z',
  swap: 'M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z',
  file: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  settings: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  fun: 'M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
};
const icon = (d: string, size = 22): string =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false"><path fill="currentColor" d="${d}"/></svg>`;
const SYMBOL_SVG = (size: number) =>
  `<svg viewBox="15 50 600 560" width="${size}" height="${size}" aria-hidden="true"><path d="M35 576V470C35 406.6 98.0 360.2 194 351Q210 346 210 362V570C210 582.1 200.1 592 188 592H51Q35 592 35 576Z" fill="#154DFD"/><path d="M240 586V345C240 282.6 299.4 237.0 389 228Q405 223 405 239V465C405 539.5 342.3 600 265 600H254Q240 600 240 586Z" fill="#61AEFD"/><path d="M430 571V262C430 194.9 489.4 145.9 579 136Q595 131 595 147V425C595 513.3 532.3 585 455 585H444Q430 585 430 571Z" fill="#FECA45"/><circle cx="548" cy="75" r="38" fill="#FDA81B"/></svg>`;
const ART = '/demo/art/';

// ------------------------------------------------------------------ fictional data
interface Cat { id: string; name: string; tone: string; icon: string; limit: number; keywords: RegExp }
const CATS: Cat[] = [
  { id: 'groceries', name: 'Groceries', tone: 'green', icon: P.cart, limit: 400_00, keywords: /grocer|market|supermarket|veg|fruit/i },
  { id: 'dining', name: 'Dining', tone: 'coral', icon: P.dining, limit: 200_00, keywords: /lunch|dinner|breakfast|coffee|cafe|snack|restaurant|pizza|burger/i },
  { id: 'transport', name: 'Transport', tone: 'sky', icon: P.car, limit: 150_00, keywords: /grab|taxi|uber|bus|train|fuel|gas|fare|jeep/i },
  { id: 'bills', name: 'Bills', tone: 'amber', icon: P.receipt, limit: 600_00, keywords: /bill|electric|water|phone|internet|rent/i },
  { id: 'shopping', name: 'Shopping', tone: 'violet', icon: P.bag, limit: 250_00, keywords: /shirt|shoes|clothes|gift|book|shop/i },
];
/** Not budgeted: created automatically for the interest part of a debt payment. */
const INTEREST: Cat = { id: 'interest', name: 'Debt interest', tone: 'slate', icon: P.card, limit: 0, keywords: /$^/ };
const catById = (id: string | null): Cat | undefined => [...CATS, INTEREST].find((c) => c.id === id);
const TOTAL = CATS.reduce((sum, c) => sum + c.limit, 0); // the budget is always the sum of the category amounts
const TODAY = { day: 20, monthDays: 31, label: 'October 2026', month: 'October' };

interface Tx { id: number; desc: string; amount: number; cat: string | null; date: string; income?: boolean; wallet: string; seed?: boolean }
interface Move { from: string; to: string; amount: number }
interface Row { desc: string; amount: number | null; cat: string | null }
interface Bill { id: string; name: string; amount: number; due: string; days: number; icon: string; cat: string | null; debt?: boolean }
interface Wallet { id: string; name: string; kind: string; base: number; tone: string; icon: string }

const WALLETS: Wallet[] = [
  { id: 'bank', name: 'Everyday bank', kind: 'Bank', base: 3_120_00, tone: 'bank', icon: P.wallet },
  { id: 'cash', name: 'Cash', kind: 'Cash', base: 180_00, tone: 'cash', icon: P.wallet },
  { id: 'savings', name: 'Savings', kind: 'Savings', base: 5_000_00, tone: 'savings', icon: P.savings },
  { id: 'visa', name: 'Visa card', kind: 'Credit card', base: -640_00, tone: 'credit', icon: P.card },
];
const PRESETS = ['Groceries', 'Dining', 'Transport', 'Bills', 'Shopping', 'Health', 'Fun', 'Home'];

type Screen =
  | 'welcome' | 'warn' | 'signin' | 'restoring' | 'onb-cats' | 'onb-currency' | 'onb-sync' | 'onb-done'
  | 'home' | 'composer' | 'budget' | 'transactions' | 'wallets' | 'wallet' | 'debts' | 'goals' | 'settings';
type Sheet =
  | null | 'profile' | 'transfer' | 'goal-add' | 'consent' | 'export' | 'chooser'
  | { bill: string };

export interface State {
  story: string;
  screen: Screen;
  newUser: boolean;
  txs: Tx[];
  moves: Move[];
  bills: Bill[];
  bellOpen: boolean;
  sheet: Sheet;
  draft: string;
  sent: string | null;
  rows: Row[];
  saved: number;
  paid: string[];
  interestText: string;
  openLine: string | null;
  budgetSeen: boolean;
  restored: boolean;
  picks: string[];
  currency: string;
  onboarded: boolean;
  transferTo: string | null;
  transferText: string;
  goalSaved: number;
  goalText: string;
  syncEmail: string | null;
  synced: number;
  disconnected: boolean;
  smart: boolean;
  exported: boolean;
  toast: string | null;
}

const seedTxs = (): Tx[] => [
  { id: 1, desc: 'Salary', amount: 2_400_00, cat: null, date: 'Oct 15', income: true, wallet: 'bank', seed: true },
  { id: 2, desc: 'Weekly groceries', amount: 260_00, cat: 'groceries', date: 'Oct 18', wallet: 'bank', seed: true },
  { id: 3, desc: 'Dinner out', amount: 150_00, cat: 'dining', date: 'Oct 17', wallet: 'visa', seed: true },
  { id: 4, desc: 'Fuel', amount: 90_00, cat: 'transport', date: 'Oct 14', wallet: 'bank', seed: true },
  { id: 5, desc: 'Electricity', amount: 380_00, cat: 'bills', date: 'Oct 10', wallet: 'bank', seed: true },
  { id: 6, desc: 'Birthday gift', amount: 80_00, cat: 'shopping', date: 'Oct 8', wallet: 'cash', seed: true },
  { id: 7, desc: 'Market stall', amount: 40_00, cat: null, date: 'Oct 6', wallet: 'cash', seed: true },
];
const seedBills = (): Bill[] => [
  { id: 'gym', name: 'Gym membership', amount: 29_99, due: 'Oct 18', days: -2, icon: P.gym, cat: 'shopping' },
  { id: 'phone', name: 'Phone plan', amount: 35_00, due: 'Oct 24', days: 4, icon: P.device, cat: 'bills' },
  { id: 'visa', name: 'Monthly payment · Visa card', amount: 200_00, due: 'Oct 25', days: 5, icon: P.card, cat: null, debt: true },
  { id: 'net', name: 'Internet', amount: 60_00, due: 'Nov 2', days: 13, icon: P.receipt, cat: 'bills' },
];

function fresh(story: string): State {
  const setup = story === 'get-started';
  const restore = story === 'new-phone';
  return {
    story,
    screen: setup || restore ? 'welcome' : ['smarter-reading', 'export', 'sync'].includes(story) ? 'home' : 'home',
    newUser: setup,
    txs: seedTxs(),
    moves: [],
    bills: seedBills(),
    bellOpen: false,
    sheet: null,
    draft: '',
    sent: null,
    rows: [],
    saved: 0,
    paid: [],
    interestText: '',
    openLine: null,
    budgetSeen: false,
    restored: false,
    picks: ['Groceries', 'Dining', 'Transport', 'Bills'],
    currency: 'USD',
    onboarded: false,
    transferTo: null,
    transferText: '',
    goalSaved: 1_650_00,
    goalText: '',
    syncEmail: story === 'smarter-reading' ? 'ada@example.com' : null,
    synced: 0,
    disconnected: false,
    smart: false,
    exported: false,
    toast: null,
  };
}

// ------------------------------------------------------------------ the app's calculations
const expenses = (s: State) => s.txs.filter((t) => !t.income);
const spentIn = (s: State, cat: string) => expenses(s).filter((t) => t.cat === cat).reduce((a, t) => a + t.amount, 0);
function plan(s: State) {
  const spent = expenses(s).reduce((a, t) => a + t.amount, 0); // every expense: the actual money out
  const budgeted = CATS.reduce((a, c) => a + spentIn(s, c.id), 0);
  const remaining = TOTAL - spent;
  const used = percentOf(spent, TOTAL);
  const elapsed = Math.floor((TODAY.day * 100) / TODAY.monthDays);
  const daysLeft = TODAY.monthDays - TODAY.day + 1; // today included
  const allowance = remaining > 0 ? Math.floor(remaining / daysLeft) : null;
  const pace = used > elapsed + 10 ? 'ahead' : used < elapsed - 10 ? 'behind' : 'aligned';
  const income = s.txs.filter((t) => t.income).reduce((a, t) => a + t.amount, 0);
  return { spent, budgeted, outside: spent - budgeted, remaining, used, elapsed, daysLeft, allowance, pace, net: income - spent };
}
/** Opening balances already include the seeded history; new transactions and transfers move them. */
function balance(s: State, id: string): number {
  const w = WALLETS.find((x) => x.id === id);
  if (!w) return 0;
  const spent = s.txs.filter((t) => !t.seed && !t.income && t.wallet === id).reduce((a, t) => a + t.amount, 0);
  const moved = s.moves.reduce((a, m) => a + (m.to === id ? m.amount : 0) - (m.from === id ? m.amount : 0), 0);
  return w.base - spent + moved;
}
const netWorth = (s: State) => WALLETS.reduce((a, w) => a + balance(s, w.id), 0);
const dueSoon = (s: State) => s.bills.filter((b) => b.days <= 7 && !s.paid.includes(b.id));

/** The composer's local reading: "Lunch 45, groceries 120" → rows. Doubtful parts stay for the user to fix. */
function interpret(text: string): Row[] {
  return text
    .split(/,|;|\n|\band\b/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((part) => {
      const m = /(\d{1,6}(?:\.\d{1,2})?)/.exec(part.replace(/,/g, ''));
      const amount = m ? parseMoney(m[1]) : null;
      const words = part.replace(m?.[0] ?? '', '').replace(/\b(for|on|at|paid|the|spent|my|php|usd)\b|\$/gi, '').replace(/\s+/g, ' ').trim();
      const cat = CATS.find((c) => c.keywords.test(part))?.id ?? null;
      const desc = words ? words.charAt(0).toUpperCase() + words.slice(1) : catById(cat)?.name ?? 'Transaction';
      return { desc: desc.slice(0, 40), amount, cat };
    });
}

// ------------------------------------------------------------------ stories
interface Step { title: string; body: string; target?: string; done: (s: State) => boolean }
export interface Story { kicker: string; title: string; text: string; steps: Step[]; finale: string }
const EXAMPLE = 'Lunch 45, groceries 120, parking 15';
const onSettings = (s: State) => s.screen === 'settings';

export const STORIES: Record<string, Story> = {
  'get-started': {
    kicker: 'Getting started',
    title: 'Set up Lucento in a minute',
    text: 'A first open: choose the categories you spend on, your currency, and whether to sync. Your budget is built from those categories.',
    steps: [
      { title: 'Tap Get started', body: 'In the app you’re also asked what you care about and which modules to show; both can be skipped.', target: 'setup-start', done: (s) => s.screen !== 'welcome' },
      { title: 'Choose your spending categories', body: 'Tap to add or remove. At least one is required: your budget is built from them. Add “Health”.', target: 'pick-Health', done: (s) => s.picks.includes('Health') || s.onboarded || !['welcome', 'onb-cats'].includes(s.screen) },
      { title: 'Continue', body: 'You can add, rename or archive categories later.', target: 'setup-cats-next', done: (s) => !['welcome', 'onb-cats'].includes(s.screen) },
      { title: 'Pick your main currency', body: 'Lucento never converts between currencies; each one has its own totals.', target: 'setup-currency-next', done: (s) => ['onb-sync', 'onb-done', 'home'].includes(s.screen) },
      { title: 'Decide on sync', body: 'Optional. “Not now” keeps everything on this phone; you can connect later in Settings.', target: 'setup-sync-skip', done: (s) => ['onb-done', 'home'].includes(s.screen) },
      { title: 'Finish', body: 'A short guided setup follows in the app: your accounts, any cards or loans, two budget amounts, a goal and first transactions.', target: 'setup-finish', done: (s) => s.onboarded },
    ],
    finale: 'You’re set up. Home starts empty with one clear next step: add your first wallet.',
  },
  'add-transactions': {
    kicker: 'The composer',
    title: 'Log a whole day in one message',
    text: 'You bought lunch, did the groceries and paid for parking. Instead of three forms, write it the way you would tell a friend.',
    steps: [
      { title: 'Tap + to open the composer', body: 'The blue + in the middle of the dock is the one place new transactions start.', target: 'open-composer', done: (s) => s.screen === 'composer' || s.saved > 0 },
      { title: 'Write what happened', body: `Type your own, or tap the example: “${EXAMPLE}”.`, target: 'example', done: (s) => s.draft.trim() !== '' || s.sent !== null || s.saved > 0 },
      { title: 'Send it', body: 'Lucento reads it on the phone and turns it into rows. Nothing is saved yet.', target: 'send', done: (s) => s.sent !== null || s.saved > 0 },
      { title: 'Check the rows', body: 'Every row is yours to correct. Give “Parking” a category: pick Transport.', target: 'row-cat', done: (s) => s.saved > 0 || (s.sent !== null && s.rows.every((r) => r.cat !== null)) },
      { title: 'Save them together', body: 'All rows are written in one go, so a retry can never save them twice.', target: 'save-rows', done: (s) => s.saved > 0 },
    ],
    finale: 'Home updated at once: Spent, the % used, Remaining and the daily allowance all include what you just added.',
  },
  budget: {
    kicker: 'The budget',
    title: 'Know where the month stands',
    text: 'It is the 20th. Are you spending faster than the month is passing? The budget card answers in one look.',
    steps: [
      { title: 'Read the two bars, then tap the card', body: '“% used” is your budget spent; “% of month” is the calendar. Close together means you are on pace.', target: 'budget-card', done: (s) => s.screen === 'budget' || s.openLine !== null },
      { title: 'Open a category', body: 'On the Budget tab, tap Groceries to see what is left in it.', target: 'line-groceries', done: (s) => s.openLine === 'groceries' },
      { title: 'Spot spending outside your categories', body: 'Tap the note: it says how much has no budget category. It still counts in Spent, so nothing hides.', target: 'outside-note', done: (s) => s.budgetSeen && s.openLine === 'groceries' },
    ],
    finale: 'Your budget is simply the sum of your category amounts, and Spent is every expense, so the numbers always agree.',
  },
  wallets: {
    kicker: 'Wallets',
    title: 'Move money between your accounts',
    text: 'You want to put $200 from your everyday bank account into savings. A transfer moves money; it is never spending.',
    steps: [
      { title: 'Open Wallets in the dock', body: 'Every account in one place, with net worth as assets minus debts.', target: 'tab-wallets', done: (s) => ['wallets', 'wallet'].includes(s.screen) || s.moves.length > 0 },
      { title: 'Open Everyday bank', body: 'Each wallet has its balance, recent activity and actions.', target: 'wallet-bank', done: (s) => s.screen === 'wallet' || s.moves.length > 0 },
      { title: 'Tap Transfer', body: 'Transfers use two linked records, so the money is never counted twice.', target: 'transfer', done: (s) => s.sheet === 'transfer' || s.moves.length > 0 },
      { title: 'Choose Savings and enter 200', body: 'Both accounts must use the same currency: Lucento never converts.', target: 'transfer-to-savings', done: (s) => (s.transferTo === 'savings' && parseMoney(s.transferText) !== null) || s.moves.length > 0 },
      { title: 'Save the transfer', body: 'One atomic save writes both sides.', target: 'transfer-save', done: (s) => s.moves.length > 0 },
    ],
    finale: 'Everyday bank went down by $200, Savings went up by $200 — and your net worth and your budget’s Spent didn’t change.',
  },
  scheduled: {
    kicker: 'The bell',
    title: 'Catch a bill before it’s late',
    text: 'Your phone plan is due in four days and the gym fee is already overdue. The bell on Home keeps them in sight.',
    steps: [
      { title: 'Tap the bell', body: 'The badge counts what is overdue or due this week. Red means something is overdue.', target: 'bell', done: (s) => s.bellOpen || s.sheet !== null || s.paid.length > 0 },
      { title: 'Open “Phone plan”', body: 'Each item opens its review sheet.', target: 'bill-phone', done: (s) => (typeof s.sheet === 'object' && s.sheet?.bill === 'phone') || s.paid.includes('phone') },
      { title: 'Mark it paid', body: 'Nothing is recorded until you confirm, so a plan never becomes spending by itself.', target: 'mark-paid', done: (s) => s.paid.includes('phone') },
    ],
    finale: 'The payment is recorded under Bills, the bell count dropped, and Spent on the budget card includes it.',
  },
  debts: {
    kicker: 'Debts and loans',
    title: 'Pay your card the right way',
    text: 'Your Visa card payment of $200 is due. Part of it is interest, which is a cost; the rest pays down what you owe.',
    steps: [
      { title: 'Open Debts from Quick links', body: 'Cards and loans, what you owe, and the next payment.', target: 'open-debts', done: (s) => s.screen === 'debts' || s.paid.includes('visa') },
      { title: 'Tap Mark paid on the Visa card', body: 'Planned debt payments work like any scheduled payment.', target: 'bill-visa', done: (s) => (typeof s.sheet === 'object' && s.sheet?.bill === 'visa') || s.paid.includes('visa') },
      { title: 'Enter the interest from your statement', body: 'Type 12.40 in “Of which interest”. Lucento works out the principal.', target: 'interest', done: (s) => parseMoney(s.interestText) !== null || s.paid.includes('visa') },
      { title: 'Mark it paid', body: 'The interest becomes spending; the principal moves to the card as a transfer.', target: 'mark-paid', done: (s) => s.paid.includes('visa') },
    ],
    finale: 'You owe $187.60 less on the card, and only the $12.40 of interest counts as spending — never the whole $200 twice.',
  },
  goals: {
    kicker: 'Goals',
    title: 'Put money toward a goal',
    text: 'You are saving for a trip to Japan. You just put another $100 aside.',
    steps: [
      { title: 'Open Goals from Quick links', body: 'Each goal has its picture, progress and target date.', target: 'open-goals', done: (s) => s.screen === 'goals' || s.goalSaved > 1_650_00 },
      { title: 'Tap Add money', body: 'Use Take out if you ever need some back.', target: 'goal-add', done: (s) => s.sheet === 'goal-add' || s.goalSaved > 1_650_00 },
      { title: 'Enter 100 and tap Add to goal', body: 'Goals track progress; the money itself stays in your wallets.', target: 'goal-save', done: (s) => s.goalSaved > 1_650_00 },
    ],
    finale: 'The goal moved forward. Net worth is unchanged: the money was already in your wallets, so it is never counted twice.',
  },
  'new-phone': {
    kicker: 'A new phone',
    title: 'Move to a new phone in a minute',
    text: 'You got a new phone. Your Lucento account already has your wallets, budget and history from the old one.',
    steps: [
      { title: 'Tap “I already have an account”', body: 'It skips the setup story for people who already use Lucento.', target: 'restore-start', done: (s) => s.screen !== 'welcome' },
      { title: 'Read the reminder, then continue', body: 'Sync the old phone first: anything not yet synced stays on that phone.', target: 'restore-continue', done: (s) => ['signin', 'restoring', 'home'].includes(s.screen) },
      { title: 'Sign in', body: 'Use the same Google or email account as on the old phone.', target: 'restore-signin', done: (s) => s.screen === 'restoring' || s.restored },
      { title: 'Wait for the download', body: 'Lucento brings everything across, then goes straight to Home.', done: (s) => s.restored },
    ],
    finale: 'Welcome back: no setup story, no guided tour — your budget, wallets and scheduled payments are already here.',
  },
  sync: {
    kicker: 'Cloud sync',
    title: 'Back up and sync your phones',
    text: 'Optional: keep your data the same on every phone. Nothing leaves this one until you connect an account.',
    steps: [
      { title: 'Open Settings from your profile', body: 'Tap the round profile button, then Settings.', target: 'profile', done: (s) => s.sheet === 'profile' || onSettings(s) || s.syncEmail !== null || s.disconnected },
      { title: 'Tap Settings', body: 'Cloud sync is near the top.', target: 'open-settings', done: (s) => onSettings(s) || s.syncEmail !== null || s.disconnected },
      { title: 'Connect with Google', body: 'Or create an email account. This turns sync on.', target: 'connect-google', done: (s) => s.syncEmail !== null || s.disconnected },
      { title: 'Tap Sync now', body: 'Sync also runs in the background about every half hour.', target: 'sync-now', done: (s) => s.synced > 0 || s.disconnected },
      { title: 'Disconnect', body: 'Sync stops and the phone signs out. Your data stays on the phone and in your account.', target: 'disconnect', done: (s) => s.disconnected },
    ],
    finale: 'Disconnected. Nothing on the phone was deleted; sign in with the same account to carry on syncing.',
  },
  'smarter-reading': {
    kicker: 'Smarter reading',
    title: 'Let Gemini read your messages',
    text: 'Optional: Gemini can read what you type in the composer. It needs a sync account (you are signed in) and asks for your consent first.',
    steps: [
      { title: 'Open Settings from your profile', body: 'Tap the round profile button, then Settings.', target: 'profile', done: (s) => s.sheet === 'profile' || onSettings(s) || s.smart },
      { title: 'Tap Settings', body: 'Smarter reading has its own section.', target: 'open-settings', done: (s) => onSettings(s) || s.smart },
      { title: 'Switch on “Read messages with Gemini”', body: 'Turning it on always asks first.', target: 'smart-toggle', done: (s) => s.sheet === 'consent' || s.smart },
      { title: 'Read what is sent, then Turn on', body: 'Your message, today’s date, your currency and your category and account names — never balances or history.', target: 'consent-on', done: (s) => s.smart },
    ],
    finale: 'On. Each composer reply now says who read it, and you still review every row. Receipts are always read on the phone.',
  },
  export: {
    kicker: 'Your data',
    title: 'Export every transaction',
    text: 'You want a copy of your transactions in a spreadsheet.',
    steps: [
      { title: 'Open Settings from your profile', body: 'Tap the round profile button, then Settings.', target: 'profile', done: (s) => s.sheet === 'profile' || onSettings(s) || s.exported },
      { title: 'Tap Settings', body: '“Your data” has the export.', target: 'open-settings', done: (s) => onSettings(s) || s.exported },
      { title: 'Tap Export transactions (CSV)', body: 'Android asks where to save the file.', target: 'export', done: (s) => s.sheet === 'export' || s.exported },
      { title: 'Save the file', body: 'Open it in any spreadsheet app.', target: 'export-save', done: (s) => s.exported },
    ],
    finale: 'Saved. Keep the CSV somewhere safe: full backup and restore isn’t in the app yet.',
  },
};

// ------------------------------------------------------------------ rendering helpers
const statusBar = `<div class="ls-status" aria-hidden="true"><span>9:41</span><span>▾ ▮</span></div>`;

function header(s: State): string {
  const due = s.newUser ? [] : dueSoon(s);
  const overdue = due.some((b) => b.days < 0);
  const badge = due.length ? `<span class="ls-badge ${overdue ? 'is-overdue' : ''}">${due.length}</span>` : '';
  return `<div class="ls-header">
    <span class="ls-brand">${SYMBOL_SVG(26)}<span class="ls-word">lucento</span></span>
    <span class="ls-chip">${icon(s.syncEmail ? P.cloud : P.device, 15)}${s.syncEmail ? 'Synced' : 'On device'}</span>
    <button type="button" class="ls-icon-btn" data-action="bell" aria-label="Upcoming payments: ${due.length} due${overdue ? ', some overdue' : ''}">${icon(P.bell)}${badge}</button>
    <button type="button" class="ls-avatar" data-action="profile" aria-label="Profile and settings">${icon(P.person, 20)}</button>
  </div>`;
}

const mascotFor = (pace: string): string =>
  pace === 'ahead' ? 'mascot_getting_tight_caution' : pace === 'behind' ? 'mascot_steady_hero_neutral' : 'mascot_thriving_greeting_happy';

function bar(fraction: number, label: string, cls: string): string {
  const pct = Math.max(0, Math.min(100, fraction));
  const inside = pct >= 34;
  return `<div class="ls-bar"><div class="ls-bar-fill ${cls}" style="width:${pct}%">${inside ? `<span>${label}</span>` : ''}</div>${inside ? '' : `<span class="ls-bar-out" style="left:calc(${pct}% + 6px)">${label}</span>`}</div>`;
}

const topbar = (title: string, back = true) =>
  `<div class="ls-topbar">${back ? `<button type="button" class="ls-back" data-action="home" aria-label="Back">${icon(P.back)}</button>` : ''}<b class="${back ? '' : 'ls-big'}">${title}</b></div>`;

// ------------------------------------------------------------------ screens
function home(s: State): string {
  if (s.newUser) {
    return `${header(s)}<div class="ls-scroll"><div class="ls-welcome">
      <b>Let’s set up your money</b><img src="${ART}mascot_thriving_thinking.webp" alt="" width="56" height="56" />
      <small>Add the accounts you use. Lucento keeps your budget, cash flow and goals in view — all calculated on this device.</small>
      <button type="button" class="ls-primary is-onhero" data-action="soon" data-label="The guided setup">Add your first wallet</button>
    </div></div>`;
  }
  const p = plan(s);
  const verdict = p.pace === 'ahead' ? 'Spending faster than the month' : p.pace === 'behind' ? 'Spending slower than the month' : 'Spending in step with the month';
  const upcoming = s.bills.filter((b) => !s.paid.includes(b.id));
  return `${header(s)}
  <div class="ls-scroll">
    <div class="ls-budget-wrap">
      <span class="ls-pill">${icon(P.list, 16)}${TODAY.label} ▾</span>
      <img class="ls-mascot" src="${ART}${mascotFor(p.pace)}.webp" alt="Lucento, ${p.pace === 'ahead' ? 'gently concerned' : 'cheering you on'}" width="96" height="96" />
      <button type="button" class="ls-budget ls-pace-${p.pace}" data-action="budget-card" aria-label="Monthly budget: ${p.used}% used of ${fmt(TOTAL)}. Open budget">
        <span class="ls-torch" aria-hidden="true"></span>
        <span class="ls-budget-title">Monthly budget ›</span>
        <span class="ls-budget-figure"><b>${p.used}%</b> of ${fmt(TOTAL)} used</span>
        ${bar(p.used, `${p.used}% used`, 'is-used')}
        ${bar(p.elapsed, `${p.elapsed}% of month`, 'is-month')}
        <span class="ls-stats">
          <span><b>${fmt(p.spent)}</b><small>Spent</small></span>
          <span><b>${fmt(Math.abs(p.remaining))}</b><small>${p.remaining < 0 ? 'Over budget' : 'Remaining'}</small></span>
          <span><b>${p.daysLeft}</b><small>days left</small></span>
        </span>
        <span class="ls-advice">${icon(P.check, 18)}<span><b>${verdict}</b>${p.allowance !== null ? `<small>About ${fmt(p.allowance)} a day keeps you within budget</small>` : ''}</span></span>
      </button>
    </div>
    <div class="ls-two">
      <div class="ls-card">
        <span class="ls-card-title">Net flow ›</span>
        <b class="ls-amount ${p.net >= 0 ? 'is-pos' : 'is-neg'}">${signed(p.net, true)}</b>
        <small>${TODAY.month} · money in minus money out</small>
        <hr />
        <button type="button" class="ls-card-link" data-action="tab-wallets"><span class="ls-card-title">Net worth ›</span>
        <b class="ls-amount is-primary">${fmt(netWorth(s))}</b>
        <small>Today · assets minus debts</small></button>
      </div>
      <div class="ls-card">
        <span class="ls-card-title">Quick links</span>
        <div class="ls-links">
          <button type="button" data-action="open-goals">${icon(P.savings)}Goals</button>
          <button type="button" data-action="bell">${icon(P.list)}Scheduled</button>
          <button type="button" data-action="open-debts">${icon(P.card)}Debts</button>
          <button type="button" data-action="soon" data-label="Insights">${icon(P.trend)}Insights</button>
        </div>
      </div>
    </div>
    <div class="ls-card ls-wide">
      <span class="ls-card-title">Scheduled transactions ›</span>
      ${upcoming.map((b) => `<div class="ls-sched"><span class="ls-tile">${icon(b.icon, 20)}</span><span class="ls-grow"><b>${b.name}</b><small>${b.debt ? 'Debt payment' : 'Recurring expense'}</small></span><span class="ls-due">${b.days < 0 ? '<em class="is-red">Overdue</em>' : b.days <= 6 ? `In ${b.days} days` : ''}<small>${b.due}, 2026</small></span><b>${signed(-b.amount)}</b></div>`).join('') || '<small>Nothing due in the next 30 days.</small>'}
    </div>
  </div>
  ${s.bellOpen ? bellMenu(s) : ''}`;
}

function bellMenu(s: State): string {
  const due = dueSoon(s);
  return `<div class="ls-menu" role="dialog" aria-label="Upcoming payments">
    <b class="ls-menu-title">Upcoming payments</b>
    ${due.map((b) => `<button type="button" class="ls-menu-item" data-action="bill-${b.id}"><span class="ls-grow"><b>${b.name}</b><small class="${b.days < 0 ? 'is-red' : ''}">${b.days < 0 ? `Overdue · ${b.due}, 2026` : `Due in ${b.days} days · ${b.due}, 2026`}</small></span><b>${signed(-b.amount)}</b></button>`).join('') || '<small class="ls-menu-empty">Nothing due in the next 7 days.</small>'}
    <button type="button" class="ls-menu-all" data-action="close-bell">See all scheduled</button>
  </div>`;
}

function composer(s: State): string {
  const rows = s.rows;
  const ready = rows.length > 0 && rows.every((r) => r.amount !== null);
  const total = rows.reduce((a, r) => a + (r.amount ?? 0), 0);
  const convo = s.sent
    ? `<div class="ls-bubble is-user">${esc(s.sent)}</div>
       <div class="ls-reply"><img src="${ART}mascot_thriving_pointing.webp" alt="" width="34" height="34" /><span>${rows.length ? `Found ${rows.length} ${rows.length === 1 ? 'transaction' : 'transactions'}. Check them, then save.` : 'I couldn’t find an amount in that. Try “Lunch 45”.'}</span></div>
       ${rows.map((r, i) => rowCard(r, i)).join('')}`
    : `<div class="ls-empty"><img src="${ART}mascot_thriving_thinking.webp" alt="" width="64" height="64" /><b>Describe what happened</b><small>Write several at once — each becomes a row to check before saving.</small>
       <button type="button" class="ls-example" data-action="example">${EXAMPLE}</button></div>`;
  return `${topbar('Add transactions')}
  <div class="ls-walletbar"><small>INTO</small><span class="ls-wpill is-on">${icon(P.check, 14)}Everyday bank</span><span class="ls-wpill">Cash</span></div>
  <div class="ls-scroll ls-convo">${convo}</div>
  ${s.sent && rows.length ? `<div class="ls-savebar"><small>${rows.length} expenses · ${signed(-total)}</small><button type="button" class="ls-primary" data-action="save-rows" ${ready ? '' : 'disabled'}>${ready ? `Save ${rows.length}` : 'Fix highlighted to save'}</button></div>` : ''}
  <form class="ls-input" data-form="composer">
    <label class="ls-sr" for="ls-text">Describe what happened</label>
    <input id="ls-text" data-input="draft" autocomplete="off" placeholder="e.g. Lunch 45, parking 15" value="${esc(s.draft)}" />
    <button type="submit" class="ls-send" data-action="send" aria-label="Send" ${s.draft.trim() ? '' : 'disabled'}>${icon(P.send, 20)}</button>
  </form>`;
}

function rowCard(r: Row, i: number): string {
  const cat = catById(r.cat);
  return `<div class="ls-row ${r.amount === null ? 'is-bad' : ''}">
    <span class="ls-tile ls-tone-${cat?.tone ?? 'slate'}">${icon(cat?.icon ?? P.receipt, 18)}</span>
    <span class="ls-grow"><b>${esc(r.desc)}</b>
      <label class="ls-sr" for="ls-cat-${i}">Category for ${esc(r.desc)}</label>
      <select id="ls-cat-${i}" data-row="${i}" data-select="row-cat" class="${r.cat ? '' : 'is-soft'}">
        <option value="" ${r.cat ? '' : 'selected'}>Choose category</option>
        ${CATS.map((c) => `<option value="${c.id}" ${c.id === r.cat ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
      ${r.amount === null ? '<small class="is-red">Add an amount to save this row</small>' : r.cat ? '' : '<small>No category — it would be saved as uncategorised</small>'}
    </span>
    <b>${r.amount === null ? '—' : signed(-r.amount)}</b>
  </div>`;
}

function budget(s: State): string {
  const p = plan(s);
  return `${topbar('Budget', false)}
  <div class="ls-scroll">
    <div class="ls-hero">
      <div><small class="ls-tag">Left · ${TODAY.month}</small><b class="ls-hero-big">${fmt(Math.max(0, p.remaining))}</b><small>left of ${fmt(TOTAL)}</small></div>
      <div class="ls-hero-side"><small class="ls-tag is-sun">Spent · ${p.used}%</small><b>${fmt(p.spent)}</b><small class="ls-tag is-sun">Per day</small><b>${p.allowance !== null ? fmt(p.allowance) : '—'}</b></div>
      <div class="ls-hero-bar"><span style="width:${Math.min(100, p.used)}%"></span><i style="left:${p.elapsed}%"></i></div>
      <small>The line marks today: ${p.elapsed}% of the month has gone.</small>
    </div>
    ${p.outside > 0 ? `<button type="button" class="ls-note" data-action="outside-note">${fmt(p.outside)} spent outside your budget categories this month. It still counts in Spent.</button>` : ''}
    <div class="ls-section"><b>Budgeted</b><small>${fmt(p.budgeted)} of ${fmt(TOTAL)}</small></div>
    <div class="ls-card ls-wide ls-lines">
      ${CATS.map((c) => {
        const spent = spentIn(s, c.id);
        const left = c.limit - spent;
        const pct = percentOf(spent, c.limit);
        const open = s.openLine === c.id;
        return `<button type="button" class="ls-line" data-action="line-${c.id}" aria-expanded="${open}">
          <span class="ls-tile ls-tone-${c.tone}">${icon(c.icon, 18)}</span>
          <span class="ls-grow"><b>${c.name}</b><small>${fmt(spent)} of ${fmt(c.limit)}</small>
            <span class="ls-minibar"><span class="${pct >= 100 ? 'is-full' : pct >= 80 ? 'is-near' : ''}" style="width:${Math.min(100, pct)}%"></span></span>
            ${open ? `<small class="ls-detail">${pct}% used · ${left >= 0 ? `${fmt(left)} left` : `${fmt(-left)} over`} for the rest of ${TODAY.month}</small>` : ''}
          </span>
          <b>${left >= 0 ? `${fmt(left)} left` : `${fmt(-left)} over`}</b>
        </button>`;
      }).join('')}
    </div>
  </div>`;
}

function transactions(s: State): string {
  const list = [...s.txs].sort((a, b) => b.id - a.id);
  const moves = s.moves.map((m) => `<div class="ls-sched"><span class="ls-tile">${icon(P.swap, 18)}</span><span class="ls-grow"><b>${WALLETS.find((w) => w.id === m.from)?.name} → ${WALLETS.find((w) => w.id === m.to)?.name}</b><small>Transfer · Oct 20</small></span><b>${fmt(m.amount)}</b></div>`).join('');
  return `${topbar('Transactions', false)}
  <div class="ls-scroll"><div class="ls-card ls-wide">${moves}
    ${list.map((t) => {
      const cat = catById(t.cat);
      return `<div class="ls-sched"><span class="ls-tile ls-tone-${t.income ? 'green' : cat?.tone ?? 'slate'}">${icon(t.income ? P.trend : cat?.icon ?? P.receipt, 18)}</span><span class="ls-grow"><b>${esc(t.desc)}</b><small>${t.income ? 'Income' : cat?.name ?? 'Uncategorised'} · ${t.date}</small></span><b class="${t.income ? 'is-pos' : ''}">${signed(t.income ? t.amount : -t.amount, true)}</b></div>`;
    }).join('')}
  </div></div>`;
}

function wallets(s: State): string {
  return `${topbar('Wallets', false)}
  <div class="ls-scroll">
    <div class="ls-hero"><div><small class="ls-tag">Net worth</small><b class="ls-hero-big">${fmt(netWorth(s))}</b><small>Assets minus debts · never converted between currencies</small></div></div>
    <div class="ls-card ls-wide">
      ${WALLETS.map((w) => `<button type="button" class="ls-sched ls-rowbtn" data-action="wallet-${w.id}"><span class="ls-tile ls-wallet-${w.tone}">${icon(w.icon, 18)}</span><span class="ls-grow"><b>${w.name}</b><small>${w.kind}</small></span><b>${signed(balance(s, w.id))}</b></button>`).join('')}
    </div>
  </div>`;
}

function walletDetail(s: State): string {
  const w = WALLETS[0];
  const recent = s.txs.filter((t) => t.wallet === w.id).sort((a, b) => b.id - a.id).slice(0, 4);
  const moves = s.moves.filter((m) => m.from === w.id || m.to === w.id);
  return `<div class="ls-topbar"><button type="button" class="ls-back" data-action="tab-wallets" aria-label="Back">${icon(P.back)}</button><b>${w.name}</b></div>
  <div class="ls-scroll">
    <div class="ls-hero"><div><small class="ls-tag">${w.kind}</small><b class="ls-hero-big">${fmt(balance(s, w.id))}</b><small>Balance today</small></div></div>
    <div class="ls-actions-row">
      <button type="button" class="ls-outline" data-action="soon" data-label="Adding from a wallet">${icon(P.add, 18)}Add</button>
      <button type="button" class="ls-outline" data-action="transfer">${icon(P.swap, 18)}Transfer</button>
      <button type="button" class="ls-outline" data-action="soon" data-label="Adjust balance">Adjust</button>
    </div>
    <div class="ls-card ls-wide">
      ${moves.map((m) => `<div class="ls-sched"><span class="ls-tile">${icon(P.swap, 18)}</span><span class="ls-grow"><b>Transfer to ${WALLETS.find((x) => x.id === m.to)?.name}</b><small>Not spending · Oct 20</small></span><b>${signed(-m.amount)}</b></div>`).join('')}
      ${recent.map((t) => `<div class="ls-sched"><span class="ls-tile ls-tone-${catById(t.cat)?.tone ?? 'slate'}">${icon(t.income ? P.trend : catById(t.cat)?.icon ?? P.receipt, 18)}</span><span class="ls-grow"><b>${esc(t.desc)}</b><small>${t.date}</small></span><b>${signed(t.income ? t.amount : -t.amount, true)}</b></div>`).join('')}
    </div>
  </div>`;
}

function debts(s: State): string {
  const visa = balance(s, 'visa');
  const paid = s.paid.includes('visa');
  return `${topbar('Debts')}
  <div class="ls-scroll">
    <div class="ls-hero"><div><small class="ls-tag">You owe</small><b class="ls-hero-big">${fmt(-visa)}</b><small>Across 1 card · 18% a year</small></div></div>
    <div class="ls-card ls-wide">
      <div class="ls-sched"><span class="ls-tile ls-wallet-credit">${icon(P.card, 18)}</span><span class="ls-grow"><b>Visa card</b><small>Owed ${fmt(-visa)} · 18% a year</small></span></div>
      ${paid ? '<small>Next payment: Nov 25, 2026</small>' : `<div class="ls-due-line"><span class="ls-grow"><b>Monthly payment · ${fmt(200_00)}</b><small>Due Oct 25, 2026 · from Everyday bank</small></span><button type="button" class="ls-primary ls-small" data-action="bill-visa">Mark paid</button></div>`}
    </div>
  </div>`;
}

function goals(s: State): string {
  const target = 3_000_00;
  const pct = percentOf(s.goalSaved, target);
  return `${topbar('Goals')}
  <div class="ls-scroll">
    <div class="ls-card ls-wide ls-goal">
      <img src="${ART}illustration_japan_fuji.webp" alt="" />
      <div class="ls-goal-body"><span class="ls-grow"><b>Japan trip</b><small>Target May 2027</small></span><b class="is-pos">${pct}%</b></div>
      <span class="ls-minibar ls-goalbar"><span style="width:${Math.min(100, pct)}%"></span></span>
      <small>${fmt(s.goalSaved)} of ${fmt(target)} · ${fmt(target - s.goalSaved)} to go</small>
      <button type="button" class="ls-primary" data-action="goal-add">Add money</button>
    </div>
  </div>`;
}

function settings(s: State): string {
  const sync = s.syncEmail
    ? `<div class="ls-sched"><span class="ls-tile">${icon(P.cloud, 18)}</span><span class="ls-grow"><b>${esc(s.syncEmail)}</b><small>${s.synced ? `Synced just now — ${s.synced} sent, 0 received` : 'Not synced yet'}</small></span></div>
       <div class="ls-actions-row"><button type="button" class="ls-outline" data-action="sync-now">Sync now</button><button type="button" class="ls-outline" data-action="disconnect">Disconnect</button></div>`
    : `<small>${s.disconnected ? 'Not connected. Your data stays on this phone; sign in again to keep syncing.' : 'Back up and keep your data the same on every phone. Nothing is sent until you connect an account.'}</small>
       <button type="button" class="ls-primary ls-google" data-action="connect-google">${icon(P.google, 18)}Continue with Google</button>`;
  return `${topbar('Settings')}
  <div class="ls-scroll">
    <b class="ls-sec">Cloud sync</b>
    <div class="ls-card ls-wide ls-pad">${sync}</div>
    <b class="ls-sec">Smarter reading</b>
    <div class="ls-card ls-wide ls-pad">
      <button type="button" class="ls-switchrow" data-action="smart-toggle" role="switch" aria-checked="${s.smart}"><span class="ls-grow"><b>Read messages with Gemini</b><small>${s.syncEmail ? 'Optional. Off: everything is read on this phone.' : 'Needs a sync account first.'}</small></span><span class="ls-switch ${s.smart ? 'is-on' : ''}" aria-hidden="true"><i></i></span></button>
    </div>
    <b class="ls-sec">Your data</b>
    <div class="ls-card ls-wide ls-pad">
      <button type="button" class="ls-sched ls-rowbtn" data-action="export"><span class="ls-tile">${icon(P.file, 18)}</span><span class="ls-grow"><b>Export transactions (CSV)</b><small>${s.exported ? 'Exported just now' : 'Every transaction, for any spreadsheet app'}</small></span></button>
    </div>
  </div>`;
}

function onboarding(s: State): string {
  switch (s.screen) {
    case 'welcome':
      return `<div class="ls-onb">
        <div class="ls-onb-mid">${SYMBOL_SVG(64)}<b class="ls-onb-word">lucento</b><small>Financial clarity without the complexity.</small>
        <img class="ls-onb-art" src="${ART}illustration_sunrise_landscape.webp" alt="" /></div>
        <button type="button" class="ls-primary" data-action="setup-start">Get started</button>
        <button type="button" class="ls-text" data-action="restore-start">I already have an account</button>
      </div>`;
    case 'onb-cats':
      return `<div class="ls-onb ls-left">
        <b class="ls-onb-title">What do you spend on?</b>
        <small>Choose your spending categories. Your budget is built from them.</small>
        <div class="ls-chips">${PRESETS.map((p) => `<button type="button" class="ls-chip-btn ${s.picks.includes(p) ? 'is-on' : ''}" data-action="pick-${p}" aria-pressed="${s.picks.includes(p)}">${s.picks.includes(p) ? icon(P.check, 14) : ''}${p}</button>`).join('')}</div>
        <span class="ls-grow"></span>
        <small>${s.picks.length} chosen</small>
        <button type="button" class="ls-primary" data-action="setup-cats-next" ${s.picks.length ? '' : 'disabled'}>Continue</button>
      </div>`;
    case 'onb-currency':
      return `<div class="ls-onb ls-left">
        <b class="ls-onb-title">Your main currency</b>
        <small>Totals are kept per currency and never converted.</small>
        <div class="ls-chips">${Object.keys(SYMBOLS).map((c) => `<button type="button" class="ls-chip-btn ${s.currency === c ? 'is-on' : ''}" data-action="currency-${c}" aria-pressed="${s.currency === c}">${SYMBOLS[c]} ${c}</button>`).join('')}</div>
        <span class="ls-grow"></span>
        <button type="button" class="ls-primary" data-action="setup-currency-next">Continue</button>
      </div>`;
    case 'onb-sync':
      return `<div class="ls-onb ls-left">
        <b class="ls-onb-title">Back up and sync?</b>
        <small>Optional. Nothing leaves this phone unless you connect an account and keep sync on.</small>
        <button type="button" class="ls-primary ls-google" data-action="soon" data-label="Connecting an account during setup">${icon(P.google, 18)}Continue with Google</button>
        <span class="ls-grow"></span>
        <button type="button" class="ls-text" data-action="setup-sync-skip">Not now — keep it on this phone</button>
      </div>`;
    case 'onb-done':
      return `<div class="ls-onb">
        <div class="ls-onb-mid"><img src="${ART}mascot_thriving_success.webp" alt="Lucento, celebrating" width="120" height="120" /><b class="ls-onb-title">You’re all set</b>
        <small>${s.picks.length} spending categories · ${s.currency} · everything on this phone</small></div>
        <button type="button" class="ls-primary" data-action="setup-finish">Start using Lucento</button>
      </div>`;
    case 'warn':
      return `<div class="ls-onb ls-left">
        <img src="${ART}mascot_thriving_thinking.webp" alt="" width="80" height="80" />
        <b class="ls-onb-title">Moving to a new phone?</b>
        <small>Sign in with your Lucento account and everything it has synced comes across: wallets, transactions, budgets, goals and scheduled payments.</small>
        <div class="ls-warnbox">${icon(P.warn, 18)}<span>Sync your old phone first (recommended). Anything added there since its last sync stays on that phone and won’t show up here.</span></div>
        <span class="ls-grow"></span>
        <button type="button" class="ls-primary" data-action="restore-continue">Continue</button>
        <button type="button" class="ls-text" data-action="restore-back">Back</button>
      </div>`;
    case 'signin':
      return `<div class="ls-onb ls-left">
        <b class="ls-onb-title">Sign in to your account</b>
        <small>Use the same Google or email account as on your old phone.</small>
        <button type="button" class="ls-primary ls-google" data-action="restore-signin">${icon(P.google, 18)}Continue with Google</button>
        <button type="button" class="ls-outline" data-action="restore-signin">Use email instead</button>
        <span class="ls-grow"></span>
        <button type="button" class="ls-text" data-action="restore-back">Back</button>
      </div>`;
    default:
      return `<div class="ls-onb ls-left">
        <b class="ls-onb-title">Bringing your money across</b>
        <small>Downloading ada@example.com. Keep Lucento open — this can take a moment on a slow connection.</small>
        <div class="ls-dots" role="status" aria-label="Restoring your account"><i></i><i></i><i></i></div>
      </div>`;
  }
}

function sheet(s: State): string {
  const sh = s.sheet;
  if (!sh) return '';
  const wrap = (label: string, body: string) =>
    `<div class="ls-scrim" data-action="close-sheet"></div><div class="ls-sheet" role="dialog" aria-label="${esc(label)}"><span class="ls-handle" aria-hidden="true"></span>${body}</div>`;
  if (typeof sh === 'object') {
    const b = s.bills.find((x) => x.id === sh.bill);
    if (!b) return '';
    const interest = parseMoney(s.interestText);
    const debtPart = b.debt
      ? `<label class="ls-field"><span>Of which interest</span><input data-input="interest" inputmode="decimal" value="${esc(s.interestText)}" placeholder="0.00" /></label>
         ${s.interestText ? '' : '<button type="button" class="ls-example ls-small" data-action="interest-example">Use 12.40 from the statement</button>'}
         <small>${interest !== null && interest < b.amount ? `Principal ${fmt(b.amount - interest)} moves to the card · interest ${fmt(interest)} is spending under “Debt interest”` : 'Interest is spending; the rest lowers what you owe.'}</small>`
      : `<small>Due ${b.due}, 2026 · from Everyday bank · ${catById(b.cat)?.name}</small>`;
    const ready = !b.debt || (interest !== null && interest < b.amount);
    return wrap(b.name, `<b class="ls-sheet-title">${b.name}</b><span class="ls-sheet-amount">${signed(-b.amount)}</span>${debtPart}
      <button type="button" class="ls-primary" data-action="mark-paid" ${ready ? '' : 'disabled'}>Mark paid</button>
      <button type="button" class="ls-text" data-action="close-sheet">Not now</button>`);
  }
  if (sh === 'profile') {
    return wrap('Account and app', `<b class="ls-sheet-title">Account and app</b>
      <button type="button" class="ls-sched ls-rowbtn" data-action="open-settings"><span class="ls-tile">${icon(P.settings, 18)}</span><span class="ls-grow"><b>Settings</b><small>Sync, Smarter reading, your data</small></span></button>
      <button type="button" class="ls-sched ls-rowbtn" data-action="soon" data-label="Enabled features"><span class="ls-tile">${icon(P.list, 18)}</span><span class="ls-grow"><b>Enabled features</b><small>Show or hide modules</small></span></button>`);
  }
  if (sh === 'transfer') {
    const amount = parseMoney(s.transferText);
    const ok = s.transferTo !== null && amount !== null && amount <= balance(s, 'bank');
    return wrap('Transfer', `<b class="ls-sheet-title">Transfer from Everyday bank</b>
      <small>To</small>
      <div class="ls-chips">${['cash', 'savings'].map((id) => `<button type="button" class="ls-chip-btn ${s.transferTo === id ? 'is-on' : ''}" data-action="transfer-to-${id}" aria-pressed="${s.transferTo === id}">${WALLETS.find((w) => w.id === id)?.name}</button>`).join('')}</div>
      <label class="ls-field"><span>Amount</span><input data-input="transfer" inputmode="decimal" value="${esc(s.transferText)}" placeholder="0.00" /></label>
      ${s.transferText ? '' : '<button type="button" class="ls-example ls-small" data-action="transfer-example">Use 200</button>'}
      <button type="button" class="ls-primary" data-action="transfer-save" ${ok ? '' : 'disabled'}>Save transfer</button>`);
  }
  if (sh === 'goal-add') {
    const ok = parseMoney(s.goalText) !== null;
    return wrap('Add money', `<b class="ls-sheet-title">Japan trip</b>
      <div class="ls-seg"><span class="is-on">Add money</span><span>Take out</span></div>
      <label class="ls-field"><span>Amount</span><input data-input="goal" inputmode="decimal" value="${esc(s.goalText)}" placeholder="0.00" /></label>
      ${s.goalText ? '' : '<button type="button" class="ls-example ls-small" data-action="goal-example">Use 100</button>'}
      <button type="button" class="ls-primary" data-action="goal-save" ${ok ? '' : 'disabled'}>Add to goal</button>`);
  }
  if (sh === 'consent') {
    return `<div class="ls-scrim" data-action="close-sheet"></div><div class="ls-dialog" role="alertdialog" aria-label="Send messages to Gemini?">
      <b class="ls-sheet-title">Send messages to Gemini?</b>
      <small>When you type or speak in the composer, Lucento sends that message, today’s date, your main currency and the names of your categories and accounts to Lucento’s server, which asks Google’s Gemini to read it. Balances and your history are not sent. Each account has a daily allowance; after it, reading happens on this phone. You review every row before anything is saved, and you can turn this off at any time.</small>
      <div class="ls-dialog-actions"><button type="button" class="ls-text" data-action="close-sheet">Cancel</button><button type="button" class="ls-text" data-action="consent-on">Turn on</button></div>
    </div>`;
  }
  if (sh === 'export') {
    return wrap('Save file', `<b class="ls-sheet-title">Save to Downloads</b>
      <div class="ls-sched"><span class="ls-tile">${icon(P.file, 18)}</span><span class="ls-grow"><b>lucento-transactions.csv</b><small>${s.txs.length} transactions</small></span></div>
      <button type="button" class="ls-primary" data-action="export-save">Save</button>
      <button type="button" class="ls-text" data-action="close-sheet">Cancel</button>`);
  }
  if (sh === 'chooser') {
    return wrap('Choose an account', `<b class="ls-sheet-title">Choose an account</b><small>to continue to Lucento</small>
      <button type="button" class="ls-sched ls-rowbtn" data-action="choose-account"><span class="ls-tile">${icon(P.person, 18)}</span><span class="ls-grow"><b>Ada Lovelace</b><small>ada@example.com</small></span></button>`);
  }
  return '';
}

function dock(s: State): string {
  if (['welcome', 'warn', 'signin', 'restoring', 'onb-cats', 'onb-currency', 'onb-sync', 'onb-done', 'composer'].includes(s.screen)) return '';
  const on = (key: string) => s.screen === key || (key === 'wallets' && s.screen === 'wallet');
  const tab = (key: Screen, label: string, d: string) =>
    `<button type="button" class="ls-tab ${on(key) ? 'is-on' : ''}" data-action="tab-${key}" aria-label="${label}" ${on(key) ? 'aria-current="page"' : ''}>${icon(d)}<small>${label}</small></button>`;
  return `<nav class="ls-dock" aria-label="App navigation">${tab('home', 'Home', P.home)}${tab('transactions', 'Transactions', P.list)}
    <button type="button" class="ls-plus" data-action="open-composer" aria-label="Add transaction">${icon(P.add, 30)}</button>
    ${tab('budget', 'Budget', P.pie)}${tab('wallets', 'Wallets', P.wallet)}</nav>`;
}

// ------------------------------------------------------------------ the simulator
interface Options { stories: string[]; initial: string; hashPrefix: string }

export function mountSimulator(root: HTMLElement, options: Options): void {
  const screenEl = root.querySelector<HTMLElement>('[data-sim="screen"]') as HTMLElement;
  const stepsEl = root.querySelector<HTMLOListElement>('[data-sim="steps"]') as HTMLOListElement;
  const live = root.querySelector<HTMLElement>('[data-sim="live"]') as HTMLElement;
  const kicker = root.querySelector<HTMLElement>('[data-sim="kicker"]') as HTMLElement;
  const title = root.querySelector<HTMLElement>('[data-sim="title"]') as HTMLElement;
  const text = root.querySelector<HTMLElement>('[data-sim="text"]') as HTMLElement;
  let state = fresh(options.initial);
  let lastStep = -1;
  let toastTimer = 0;

  const currentStep = (): number => {
    const steps = STORIES[state.story].steps;
    const i = steps.findIndex((st) => !st.done(state));
    return i === -1 ? steps.length : i;
  };

  function renderGuide(): void {
    const story = STORIES[state.story];
    kicker.textContent = story.kicker;
    title.textContent = story.title;
    text.textContent = story.text;
    root.querySelectorAll<HTMLButtonElement>('[data-story]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.story === state.story)));
    const current = currentStep();
    stepsEl.innerHTML =
      story.steps
        .map((st, i) => {
          const status = i < current ? 'done' : i === current ? 'now' : 'later';
          return `<li class="ld-step is-${status}" ${status === 'now' ? 'aria-current="step"' : ''}><span class="ld-num">${status === 'done' ? '✓' : i + 1}</span><span><b>${st.title}</b>${status === 'now' ? `<span class="ld-step-body">${st.body}</span>` : ''}</span></li>`;
        })
        .join('') +
      (current >= story.steps.length
        ? `<li class="ld-step is-finale"><span class="ld-num">★</span><span><b>Done</b><span class="ld-step-body">${story.finale}</span><button type="button" class="ld-next" data-next="1">Next guide</button></span></li>`
        : '');
    if (current !== lastStep) {
      live.textContent = current >= story.steps.length ? `Done. ${story.finale}` : `Step ${current + 1}: ${story.steps[current].title}`;
      lastStep = current;
    }
  }

  function render(keepFocus?: string): void {
    const s = state;
    symbol = SYMBOLS[s.currency] ?? '$';
    const body =
      s.screen === 'home' ? home(s)
      : s.screen === 'composer' ? composer(s)
      : s.screen === 'budget' ? budget(s)
      : s.screen === 'transactions' ? transactions(s)
      : s.screen === 'wallets' ? wallets(s)
      : s.screen === 'wallet' ? walletDetail(s)
      : s.screen === 'debts' ? debts(s)
      : s.screen === 'goals' ? goals(s)
      : s.screen === 'settings' ? settings(s)
      : onboarding(s);
    // Sheets and dialogs sit over the whole screen, dock included, as on the phone.
    screenEl.innerHTML = `${statusBar}<div class="ls-body">${body}</div>${dock(s)}${sheet(s)}${s.toast ? `<div class="ls-toast" role="status">${esc(s.toast)}</div>` : ''}`;
    // Point at what the current step needs (the guiding pulse).
    const step = STORIES[s.story].steps[currentStep()];
    if (step?.target) {
      const hit =
        step.target === 'row-cat' ? screenEl.querySelector('select.is-soft')
        : step.target === 'interest' ? screenEl.querySelector('[data-action="interest-example"]') ?? screenEl.querySelector('[data-input="interest"]')
        : step.target === 'transfer-to-savings' && s.transferTo === 'savings' ? screenEl.querySelector('[data-action="transfer-example"]') ?? screenEl.querySelector('[data-input="transfer"]')
        : step.target === 'goal-save' && !s.goalText ? screenEl.querySelector('[data-action="goal-example"]')
        : step.target === 'connect-google' && s.sheet === 'chooser' ? screenEl.querySelector('[data-action="choose-account"]')
        : screenEl.querySelector(`[data-action="${step.target}"]`);
      hit?.classList.add('ls-hint');
    }
    renderGuide();
    if (keepFocus) {
      const el = screenEl.querySelector<HTMLElement>(keepFocus);
      if (el) {
        el.focus();
        if (el instanceof HTMLInputElement) el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  }

  function toast(message: string): void {
    state.toast = message;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      state.toast = null;
      render();
    }, 2600);
  }

  function act(action: string, el: HTMLElement): void {
    const s = state;
    const go = (screen: Screen) => {
      s.screen = screen;
      s.bellOpen = false;
      s.sheet = null;
    };
    if (action === 'bell') {
      if (s.newUser) return toast('Scheduled payments appear here once you add some');
      if (s.screen !== 'home') go('home');
      s.bellOpen = !s.bellOpen;
    } else if (action === 'close-bell') s.bellOpen = false;
    else if (action.startsWith('bill-')) {
      s.bellOpen = false;
      s.interestText = '';
      s.sheet = { bill: action.slice(5) };
    } else if (action === 'close-sheet') s.sheet = null;
    else if (action === 'interest-example') s.interestText = '12.40';
    else if (action === 'mark-paid') {
      const id = typeof s.sheet === 'object' ? s.sheet?.bill : undefined;
      const b = s.bills.find((x) => x.id === id);
      if (b && !s.paid.includes(b.id)) {
        if (b.debt) {
          const interest = parseMoney(s.interestText);
          if (interest === null || interest >= b.amount) return;
          s.txs.push({ id: 300, desc: 'Visa card interest', amount: interest, cat: 'interest', date: 'Oct 20', wallet: 'bank' });
          s.moves.push({ from: 'bank', to: 'visa', amount: b.amount - interest });
          toast(`Recorded: ${fmt(b.amount - interest)} principal, ${fmt(interest)} interest`);
        } else {
          s.txs.push({ id: 200 + s.paid.length, desc: b.name, amount: b.amount, cat: b.cat, date: 'Oct 20', wallet: 'bank' });
          toast(`${b.name} recorded · ${signed(-b.amount)}`);
        }
        s.paid.push(b.id);
      }
      s.sheet = null;
    } else if (action === 'open-composer') {
      if (s.newUser) return toast('Add a wallet first — every transaction belongs to one');
      go('composer');
    } else if (action === 'home') go('home');
    else if (action === 'example') s.draft = EXAMPLE;
    else if (action === 'save-rows') {
      if (s.rows.length && s.rows.every((r) => r.amount !== null)) {
        s.rows.forEach((r, i) => s.txs.push({ id: 101 + s.saved * 10 + i, desc: r.desc, amount: r.amount as number, cat: r.cat, date: 'Oct 20', wallet: 'bank' }));
        s.saved += s.rows.length;
        toast(`${s.rows.length} ${s.rows.length === 1 ? 'transaction' : 'transactions'} saved`);
        s.rows = [];
        s.sent = null;
        go('home');
      }
    } else if (action === 'budget-card') go('budget');
    else if (action.startsWith('line-')) {
      const id = action.slice(5);
      s.openLine = s.openLine === id ? null : id;
    } else if (action === 'outside-note') s.budgetSeen = true;
    else if (action.startsWith('tab-')) {
      if (s.newUser && action !== 'tab-home') return toast('Add your first wallet to fill this in');
      go(action.slice(4) as Screen);
    } else if (action.startsWith('wallet-')) {
      if (action === 'wallet-bank') go('wallet');
      else toast('In this demo, open Everyday bank');
    } else if (action === 'transfer') {
      s.transferTo = null;
      s.transferText = '';
      s.sheet = 'transfer';
    } else if (action.startsWith('transfer-to-')) s.transferTo = action.slice(12);
    else if (action === 'transfer-example') s.transferText = '200';
    else if (action === 'transfer-save') {
      const amount = parseMoney(s.transferText);
      if (s.transferTo && amount !== null && amount <= balance(s, 'bank')) {
        s.moves.push({ from: 'bank', to: s.transferTo, amount });
        toast(`Moved ${fmt(amount)} to ${WALLETS.find((w) => w.id === s.transferTo)?.name}`);
        s.sheet = null;
      }
    } else if (action === 'open-debts') go('debts');
    else if (action === 'open-goals') go('goals');
    else if (action === 'goal-add') {
      s.goalText = '';
      s.sheet = 'goal-add';
    } else if (action === 'goal-example') s.goalText = '100';
    else if (action === 'goal-save') {
      const amount = parseMoney(s.goalText);
      if (amount !== null) {
        s.goalSaved += amount;
        toast(`Added ${fmt(amount)} to Japan trip`);
        s.sheet = null;
      }
    } else if (action === 'profile') s.sheet = 'profile';
    else if (action === 'open-settings') go('settings');
    else if (action === 'connect-google') s.sheet = 'chooser';
    else if (action === 'choose-account') {
      s.syncEmail = 'ada@example.com';
      s.disconnected = false;
      s.sheet = null;
      toast('Connected as ada@example.com');
    } else if (action === 'sync-now') {
      s.synced = 9;
      toast('Synced — 9 sent, 0 received');
    } else if (action === 'disconnect') {
      s.syncEmail = null;
      s.smart = false;
      s.disconnected = true;
      toast('Disconnected · nothing on this phone was deleted');
    } else if (action === 'smart-toggle') {
      if (s.smart) {
        s.smart = false;
      } else if (!s.syncEmail) {
        toast('Connect a sync account first (Cloud sync, above)');
      } else s.sheet = 'consent';
    } else if (action === 'consent-on') {
      s.smart = true;
      s.sheet = null;
    } else if (action === 'export') s.sheet = 'export';
    else if (action === 'export-save') {
      s.exported = true;
      s.sheet = null;
      toast(`Exported ${s.txs.length} transactions`);
    } else if (action === 'setup-start') go('onb-cats');
    else if (action.startsWith('pick-')) {
      const p = action.slice(5);
      s.picks = s.picks.includes(p) ? s.picks.filter((x) => x !== p) : [...s.picks, p];
    } else if (action === 'setup-cats-next') {
      if (s.picks.length) go('onb-currency');
    } else if (action.startsWith('currency-')) s.currency = action.slice(9);
    else if (action === 'setup-currency-next') go('onb-sync');
    else if (action === 'setup-sync-skip') go('onb-done');
    else if (action === 'setup-finish') {
      s.onboarded = true;
      go('home');
    } else if (action === 'restore-start') {
      if (s.story !== 'new-phone') return toast('Pick “Move to a new phone” to try this');
      go('warn');
    } else if (action === 'restore-continue') go('signin');
    else if (action === 'restore-back') go(s.screen === 'signin' ? 'warn' : 'welcome');
    else if (action === 'restore-signin') {
      go('restoring');
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.setTimeout(() => {
        if (state !== s || s.screen !== 'restoring') return;
        s.restored = true;
        s.newUser = false;
        s.screen = 'home';
        toast('Welcome back — your account is on this phone');
        render();
      }, reduce ? 600 : 1800);
    } else if (action === 'soon') toast(`${el.dataset.label ?? 'That'} isn’t part of this demo — it’s in the app`);
    render();
  }

  screenEl.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!el || el.tagName === 'SELECT' || el.getAttribute('type') === 'submit') return;
    e.preventDefault();
    act(el.dataset.action as string, el);
  });
  screenEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = state.draft.trim();
    if (!t) return;
    state.sent = t;
    state.rows = interpret(t);
    state.draft = '';
    render();
  });
  screenEl.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    const key = el.dataset.input;
    if (!key) return;
    const before = currentStep();
    if (key === 'draft') {
      const had = state.draft.trim() !== '';
      state.draft = el.value;
      if (had !== (state.draft.trim() !== '')) render('#ls-text');
      return;
    }
    if (key === 'interest') state.interestText = el.value;
    if (key === 'transfer') state.transferText = el.value;
    if (key === 'goal') state.goalText = el.value;
    // Inputs inside sheets: re-render (keeping the caret) so totals, buttons and the guide follow the typing.
    void before;
    render(`[data-input="${key}"]`);
  });
  screenEl.addEventListener('change', (e) => {
    const el = e.target as HTMLSelectElement;
    if (el.dataset.select === 'row-cat') {
      const row = state.rows[Number(el.dataset.row)];
      if (row) row.cat = el.value || null;
      render(`#${el.id}`);
    }
  });

  function choose(story: string, scroll = false): void {
    if (!STORIES[story] || !options.stories.includes(story)) return;
    state = fresh(story);
    lastStep = -1;
    render();
    if (scroll) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  root.querySelectorAll<HTMLButtonElement>('[data-story]').forEach((b) =>
    b.addEventListener('click', () => {
      choose(b.dataset.story as string);
      history.replaceState(null, '', `#${options.hashPrefix}${b.dataset.story}`);
    }),
  );
  root.querySelector('[data-sim="reset"]')?.addEventListener('click', () => choose(state.story));
  stepsEl.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-next]')) {
      const next = options.stories[(options.stories.indexOf(state.story) + 1) % options.stories.length];
      choose(next);
      history.replaceState(null, '', `#${options.hashPrefix}${next}`);
    }
  });

  const fromHash = (): string | undefined => {
    const h = window.location.hash.slice(1);
    return h.startsWith(options.hashPrefix) ? h.slice(options.hashPrefix.length) : undefined;
  };
  const initial = fromHash();
  choose(initial && options.stories.includes(initial) ? initial : options.initial, Boolean(initial));
  window.addEventListener('hashchange', () => {
    const story = fromHash();
    if (story) choose(story, true);
  });
}
