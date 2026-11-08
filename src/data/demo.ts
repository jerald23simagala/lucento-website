/**
 * The app's demo month, as the website shows it. These are the screenshot tour's seeded figures in pesos
 * (lucento-android ScreenshotTourTest with `-e demoCurrency PHP`: every amount ×10), read off the captured screens
 * (artifacts/website-tour-api36-php: 06, 14, 20). Amounts are integer minor units (centavos). Always label them as
 * example figures from the app's demo data.
 */
import { sumMinor } from '../lib/money.ts';

export interface DemoLine {
  name: string;
  /** Shown after the name, e.g. "3 of 24 installments paid". */
  detail?: string;
  minor: number;
}

export const demo = {
  currency: 'PHP',
  /** Money wallets: what you have. */
  have: [
    { name: 'Savings', minor: 8_400_000 },
    { name: 'Everyday bank', minor: 8_689_010 },
    { name: 'Cash', minor: 563_000 },
  ] satisfies DemoLine[],
  /** Debts and loans: what you owe (positive amounts here; shown with −). */
  owe: [
    { name: 'Car loan', detail: '3 of 24 installments paid', minor: 10_800_000 },
    { name: 'Visa card', detail: 'counted as owed, never as cash', minor: 640_000 },
  ] satisfies DemoLine[],
  /** The monthly budget card on the Dashboard screenshot. */
  budget: { limit: 2_590_000, spent: 2_297_990 },
  /** The composer screenshot's message and what it shows. */
  composer: {
    message: 'Lunch 150, groceries 1200, and paid the electricity bill',
    rows: [
      { name: 'Lunch', category: 'Restaurants', minor: -15_000 },
      { name: 'Groceries', category: 'Groceries', minor: -120_000 },
    ],
    expensesSoFar: -135_000,
  },
} as const;

export const haveTotal = sumMinor(demo.have.map((l) => l.minor));
export const oweTotal = sumMinor(demo.owe.map((l) => l.minor));
export const netWorth = haveTotal - oweTotal;
