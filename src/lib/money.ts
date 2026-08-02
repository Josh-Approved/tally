// Money is stored as integer minor units (cents/pence) — never floats.

const ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW',
  'PYG', 'RWF', 'UGX', 'UYI', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

const THREE_DECIMAL = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND']);

export function decimalsForCurrency(code: string): number {
  const c = code.toUpperCase();
  if (ZERO_DECIMAL.has(c)) return 0;
  if (THREE_DECIMAL.has(c)) return 3;
  return 2;
}

export function minorPerUnit(code: string): number {
  return Math.pow(10, decimalsForCurrency(code));
}

export function parseAmount(input: string, code: string): number | null {
  const cleaned = input.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  if (!cleaned || cleaned === '.') return null;
  const parts = cleaned.split('.');
  if (parts.length > 2) return null;
  const decimals = decimalsForCurrency(code);
  const intPart = parts[0] === '' ? '0' : parts[0];
  const fracPart = (parts[1] ?? '').slice(0, decimals).padEnd(decimals, '0');
  const minor = parseInt(intPart, 10) * minorPerUnit(code) + (decimals > 0 ? parseInt(fracPart, 10) : 0);
  if (!Number.isFinite(minor) || minor < 0) return null;
  return minor;
}

/**
 * Currency symbols, pinned in a table rather than derived from Intl at runtime.
 *
 * `Intl.NumberFormat(…, { currencyDisplay: 'narrowSymbol' }).formatToParts()`
 * returns "$" under Node's full-ICU — which is why the unit suite looked green
 * — but NOT on-device: Hermes ships a trimmed ICU where that path yields no
 * narrow symbol, so `formatAmount` fell through to the raw ISO code and the
 * home screen rendered "USD1,730.44" instead of "$1,730.44" (defect
 * tally-20260801-1: the wide code overflowed the donut and wrapped every total
 * mid-number). A table is the only thing that renders the same on every engine.
 *
 * Covers every code in SUPPORTED_CURRENCIES (src/lib/currency.ts) that has a
 * well-known short symbol. The Gulf currencies (AED, SAR, QAR, KWD, BHD) are
 * deliberately absent — their conventional symbols are Arabic-script glyphs
 * with poor cross-platform font coverage, so they keep the ISO code and rely on
 * the shrink-to-fit layout instead of a glyph that may render as tofu.
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  // Dollar family — the app shows one currency at a time, so a bare "$" is
  // unambiguous in context (matches what narrowSymbol gives on full ICU).
  USD: '$', CAD: '$', AUD: '$', NZD: '$', HKD: '$', SGD: '$',
  TWD: 'NT$', MXN: '$', ARS: '$', CLP: '$', COP: '$', UYU: '$',
  BRL: 'R$', PEN: 'S/',
  // Majors
  EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', KRW: '₩', CHF: 'CHF',
  // Asia-Pacific
  MYR: 'RM', THB: '฿', IDR: 'Rp', PHP: '₱', INR: '₹', PKR: '₨',
  BDT: '৳', VND: '₫',
  // Middle East / Africa
  ILS: '₪', TRY: '₺', EGP: 'E£', ZAR: 'R', NGN: '₦', KES: 'KSh',
  // Europe (non-euro)
  SEK: 'kr', NOK: 'kr', DKK: 'kr', ISK: 'kr',
  PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RON: 'lei', BGN: 'лв',
};

/**
 * The display symbol for a currency code. Table first (deterministic on every
 * engine), Intl only as a courtesy for codes we do not ship, the bare code as
 * the last resort. Never throws.
 */
export function currencySymbol(code: string): string {
  const c = code.toUpperCase();
  const known = CURRENCY_SYMBOLS[c];
  if (known) return known;
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: c,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    const found = parts.find((p) => p.type === 'currency')?.value;
    if (found) return found;
  } catch {
    // Trimmed-ICU engine (Hermes) or an invalid code — fall through to the code.
  }
  return c;
}

/**
 * Largest font size (px) at which `text` fits `maxWidth` on ONE line in IBM Plex
 * Mono, clamped to [minSize, baseSize]. Pure arithmetic so it behaves
 * identically on iOS and Android — RN's `adjustsFontSizeToFit` is iOS-only, and
 * (per the FundingFooter note) misbehaves in an unbounded-width Text anyway.
 *
 * IBM Plex Mono is monospaced at 600/1000 em advance; MONO_ADVANCE carries a
 * small margin over that so a rounded-down size still clears its box.
 */
const MONO_ADVANCE = 0.62;

export function fitMonoFontSize(
  text: string,
  maxWidth: number,
  baseSize: number,
  minSize: number
): number {
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) return baseSize;
  const chars = text.length;
  if (chars === 0) return baseSize;
  const fits = Math.floor(maxWidth / (chars * MONO_ADVANCE));
  return Math.max(minSize, Math.min(baseSize, fits));
}

export function formatAmount(minor: number, code: string, opts: { sign?: boolean } = {}): string {
  const decimals = decimalsForCurrency(code);
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const unit = minorPerUnit(code);
  const major = Math.floor(abs / unit);
  const frac = abs % unit;
  const fracStr = decimals > 0 ? '.' + frac.toString().padStart(decimals, '0') : '';
  const majorStr = major.toLocaleString('en-US');
  const body = `${currencySymbol(code)}${majorStr}${fracStr}`;
  if (negative) return `−${body}`;
  if (opts.sign) return `+${body}`;
  return body;
}
