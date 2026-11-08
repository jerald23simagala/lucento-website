/**
 * Money for display, the way the app shows it: amounts are integer minor units (never floating point), grouped,
 * with the currency's own decimals, and signed in the text itself with U+2212 (−), never a hyphen.
 */

const MINUS = '−';
const cache = new Map<string, { whole: Intl.NumberFormat; digits: number; separator: string }>();

function formatterFor(currency: string, locale: string) {
  const key = `${locale}|${currency}`;
  let entry = cache.get(key);
  if (!entry) {
    const full = new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' });
    const digits = full.resolvedOptions().maximumFractionDigits ?? 2;
    const separator = full.formatToParts(1.5).find((p) => p.type === 'decimal')?.value ?? '.';
    const whole = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    entry = { whole, digits, separator };
    cache.set(key, entry);
  }
  return entry;
}

export interface FormatOptions {
  currency?: string;
  locale?: string;
  /** Show "+" before amounts above zero (money in). Amounts below zero always carry "−". */
  plus?: boolean;
}

/** Formats integer minor units, e.g. 17_652_010 → "₱176,520.10", −11_440_000 → "−₱114,400.00". */
export function formatMinor(minor: number, { currency = 'PHP', locale = 'en-PH', plus = false }: FormatOptions = {}): string {
  if (!Number.isSafeInteger(minor)) throw new RangeError(`Minor units must be a safe integer, got ${minor}`);
  const { whole, digits, separator } = formatterFor(currency, locale);
  const absolute = Math.abs(minor);
  const unit = 10 ** digits;
  const major = Math.trunc(absolute / unit);
  const fraction = absolute % unit;
  const text = whole.format(major) + (digits > 0 ? separator + String(fraction).padStart(digits, '0') : '');
  if (minor < 0) return MINUS + text;
  if (plus && minor > 0) return '+' + text;
  return text;
}

/** The whole-currency part, for proportions (the horizon chart's fr rows). Display and layout only. */
export function wholeUnits(minor: number, currency = 'PHP', locale = 'en-PH'): number {
  return Math.trunc(Math.abs(minor) / 10 ** formatterFor(currency, locale).digits);
}

/** Integer-only sum that refuses to lose precision. */
export function sumMinor(values: readonly number[]): number {
  let total = 0;
  for (const v of values) {
    total += v;
    if (!Number.isSafeInteger(total)) throw new RangeError('Sum overflowed the safe integer range');
  }
  return total;
}

/** A price as people write it: "₱1,190" when there are no centavos, "₱1,190.50" when there are. */
export function formatPrice(minor: number, options: FormatOptions = {}): string {
  const text = formatMinor(minor, options);
  const { digits, separator } = formatterFor(options.currency ?? 'PHP', options.locale ?? 'en-PH');
  return digits > 0 && Math.abs(minor) % 10 ** digits === 0 ? text.slice(0, -(digits + separator.length)) : text;
}

/**
 * What paying yearly saves against twelve monthly payments, in minor units, and as a whole percentage rounded down
 * (never overstated). Integer arithmetic only.
 */
export function yearlySaving(monthlyMinor: number, yearlyMinor: number): { savedMinor: number; percent: number } {
  const twelve = monthlyMinor * 12;
  if (!Number.isSafeInteger(twelve) || !Number.isSafeInteger(yearlyMinor)) throw new RangeError('Prices must be safe integers');
  const savedMinor = twelve - yearlyMinor;
  return { savedMinor, percent: Math.floor((savedMinor * 100) / twelve) };
}
