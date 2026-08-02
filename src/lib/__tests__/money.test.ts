/**
 * Money is the trust core: every balance, every transaction, every recurring
 * charge is stored as integer minor units (cents/pence) and never as a float.
 * These tests pin the parse → store → format round-trip and the cross-currency
 * precision rules (0-/2-/3-decimal) the app promises.
 *
 * Kept deliberately import-light: src/lib/money.ts has zero imports, so this
 * file does not drag in the (currently broken) UI / design-system chain.
 */

import {
  decimalsForCurrency,
  minorPerUnit,
  parseAmount,
  formatAmount,
  currencySymbol,
  fitMonoFontSize,
  CURRENCY_SYMBOLS,
} from '../money';

describe('decimalsForCurrency / minorPerUnit', () => {
  it('defaults to 2 decimals for an ordinary currency', () => {
    expect(decimalsForCurrency('USD')).toBe(2);
    expect(minorPerUnit('USD')).toBe(100);
  });

  it('treats zero-decimal currencies (JPY, KRW) as whole units', () => {
    expect(decimalsForCurrency('JPY')).toBe(0);
    expect(minorPerUnit('JPY')).toBe(1);
    expect(decimalsForCurrency('KRW')).toBe(0);
  });

  it('treats three-decimal currencies (KWD, BHD) as thousandths', () => {
    expect(decimalsForCurrency('KWD')).toBe(3);
    expect(minorPerUnit('KWD')).toBe(1000);
  });

  it('is case-insensitive on the currency code', () => {
    expect(decimalsForCurrency('jpy')).toBe(0);
    expect(decimalsForCurrency('usd')).toBe(2);
  });

  it('falls back to 2 decimals for an unknown code', () => {
    expect(decimalsForCurrency('ZZZ')).toBe(2);
  });
});

describe('parseAmount — text to integer minor units', () => {
  it('parses a plain two-decimal amount exactly (no float drift)', () => {
    expect(parseAmount('12.34', 'USD')).toBe(1234);
    // The classic float trap: 0.1 + 0.2 territory. Must be exact.
    expect(parseAmount('0.30', 'USD')).toBe(30);
    expect(parseAmount('19.99', 'USD')).toBe(1999);
  });

  it('treats a whole number as major units', () => {
    expect(parseAmount('5', 'USD')).toBe(500);
    expect(parseAmount('100', 'USD')).toBe(10000);
  });

  it('pads a short fractional part to the currency scale', () => {
    expect(parseAmount('1.5', 'USD')).toBe(150); // 1.50
    expect(parseAmount('1.5', 'KWD')).toBe(1500); // 1.500
  });

  it('truncates extra fractional digits to the currency scale', () => {
    expect(parseAmount('1.999', 'USD')).toBe(199); // not 200 — truncation, not rounding
    expect(parseAmount('1.2345', 'KWD')).toBe(1234);
  });

  it('ignores the fractional part entirely for a zero-decimal currency', () => {
    expect(parseAmount('1000', 'JPY')).toBe(1000);
    expect(parseAmount('1000.99', 'JPY')).toBe(1000);
  });

  it('accepts a comma as the decimal separator (European entry)', () => {
    expect(parseAmount('12,34', 'USD')).toBe(1234);
  });

  it('rejects a comma used as a thousands grouping separator', () => {
    // Commas normalize to dots, so "1,234.56" becomes "1.234.56" → two
    // separators → null. Grouped input is not supported on entry.
    expect(parseAmount('1,234.56', 'USD')).toBeNull();
  });

  it('strips currency symbols and stray characters', () => {
    expect(parseAmount('$12.34', 'USD')).toBe(1234);
    expect(parseAmount('  9.99  ', 'USD')).toBe(999);
  });

  it('treats a leading-dot amount as zero-major', () => {
    expect(parseAmount('.50', 'USD')).toBe(50);
  });

  it('returns null for empty / non-numeric / malformed input', () => {
    expect(parseAmount('', 'USD')).toBeNull();
    expect(parseAmount('.', 'USD')).toBeNull();
    expect(parseAmount('abc', 'USD')).toBeNull();
    expect(parseAmount('1.2.3', 'USD')).toBeNull(); // two separators → reject
  });

  it('never returns a negative amount (sign is modeled elsewhere)', () => {
    // The minus is stripped as a non-numeric char, so "-5" parses as 5, not -5.
    expect(parseAmount('-5', 'USD')).toBe(500);
  });
});

describe('formatAmount — integer minor units to display', () => {
  it('renders a two-decimal amount with thousands grouping', () => {
    // 1,234,567 minor units = $12,345.67
    expect(formatAmount(1234567, 'USD')).toContain('12,345.67');
  });

  it('renders zero cleanly', () => {
    expect(formatAmount(0, 'USD')).toBe('$0.00');
  });

  it('uses a real minus sign for negative amounts', () => {
    const out = formatAmount(-500, 'USD');
    expect(out.startsWith('−')).toBe(true); // U+2212, not ASCII hyphen
    expect(out).toContain('5.00');
  });

  it('prefixes a plus only when the sign option is set', () => {
    expect(formatAmount(500, 'USD', { sign: true }).startsWith('+')).toBe(true);
    expect(formatAmount(500, 'USD').startsWith('+')).toBe(false);
  });

  it('omits the fractional part for a zero-decimal currency', () => {
    expect(formatAmount(1000, 'JPY')).not.toContain('.');
    expect(formatAmount(1000, 'JPY')).toContain('1,000');
  });

  it('renders three-decimal currencies with three fraction digits', () => {
    expect(formatAmount(1234, 'KWD')).toContain('1.234');
  });

  it('round-trips parse → format for a representative amount', () => {
    const minor = parseAmount('1234.56', 'USD');
    expect(minor).toBe(123456);
    expect(formatAmount(minor!, 'USD')).toContain('1,234.56');
  });

  it('stays on one line-worth of characters for a year-scale total', () => {
    // Year period on a real budget: eight-figure minor units.
    expect(formatAmount(1234567890, 'USD')).toBe('$12,345,678.90');
    expect(formatAmount(-1234567890, 'USD')).toBe('−$12,345,678.90');
    expect(formatAmount(1234567890, 'USD', { sign: true })).toBe('+$12,345,678.90');
  });
});

/**
 * Defect tally-20260801-1 — the home screen rendered "USD1,730.44" and the wide
 * ISO code overflowed the donut and wrapped every total mid-number.
 *
 * The trap these tests exist for: Node runs full-ICU, so
 * `Intl.NumberFormat(…, { currencyDisplay: 'narrowSymbol' })` hands back "$"
 * here and the old implementation looked correct under Jest while shipping the
 * bare code on Hermes. So these assertions pin the SYMBOL TABLE and simulate the
 * device engine explicitly rather than trusting the ambient Intl.
 */
describe('currencySymbol — deterministic on every engine', () => {
  const realIntl = globalThis.Intl;
  afterEach(() => {
    globalThis.Intl = realIntl;
  });

  // Codes with no cross-platform-safe short symbol; the ISO code is correct
  // output for these, not a fallback bug.
  const CODE_ONLY = new Set(['AED', 'SAR', 'QAR', 'KWD', 'BHD']);

  it('pins the symbols users actually see', () => {
    expect(currencySymbol('USD')).toBe('$');
    expect(currencySymbol('EUR')).toBe('€');
    expect(currencySymbol('GBP')).toBe('£');
    expect(currencySymbol('JPY')).toBe('¥');
    expect(currencySymbol('INR')).toBe('₹');
    expect(currencySymbol('BRL')).toBe('R$');
  });

  it('is case-insensitive on the code', () => {
    expect(currencySymbol('usd')).toBe('$');
    expect(currencySymbol('eur')).toBe('€');
  });

  it('keeps the ISO code only for currencies with no safe short symbol', () => {
    for (const code of CODE_ONLY) {
      expect(CURRENCY_SYMBOLS[code]).toBeUndefined();
    }
  });

  it('covers every currency the app offers', () => {
    // Drift guard: adding a code to SUPPORTED_CURRENCIES without a symbol would
    // re-introduce the wide-code overflow for that currency.
    const { SUPPORTED_CURRENCIES } = require('../currency') as {
      SUPPORTED_CURRENCIES: readonly string[];
    };
    const missing = SUPPORTED_CURRENCIES.filter(
      (code) => !CODE_ONLY.has(code) && !CURRENCY_SYMBOLS[code]
    );
    expect(missing).toEqual([]);
  });

  it('gives every table entry a symbol no wider than the ISO code it replaces', () => {
    // CHF is its own conventional symbol — the code IS the symbol there.
    for (const [code, symbol] of Object.entries(CURRENCY_SYMBOLS)) {
      expect(symbol.length).toBeGreaterThan(0);
      expect(symbol.length).toBeLessThanOrEqual(3);
      if (code !== 'CHF') expect(symbol).not.toBe(code);
    }
  });

  it('still yields a symbol when the engine has no Intl at all (Hermes floor)', () => {
    // @ts-expect-error — deliberately removing a global to model a trimmed engine.
    delete globalThis.Intl;
    expect(currencySymbol('USD')).toBe('$');
    expect(formatAmount(173044, 'USD')).toBe('$1,730.44');
    expect(formatAmount(320000, 'USD')).toBe('$3,200.00');
    expect(formatAmount(146956, 'USD', { sign: true })).toBe('+$1,469.56');
  });

  it('still yields a symbol when Intl.NumberFormat throws', () => {
    globalThis.Intl = {
      NumberFormat: function NumberFormat() {
        throw new Error('trimmed ICU');
      },
    } as unknown as typeof Intl;
    expect(currencySymbol('GBP')).toBe('£');
    expect(formatAmount(173044, 'GBP')).toBe('£1,730.44');
  });

  it('ignores an engine whose narrowSymbol just echoes the ISO code', () => {
    // The real device behaviour: Intl exists, formatToParts works, but the
    // trimmed locale data has no narrow symbol so it returns "USD".
    globalThis.Intl = {
      NumberFormat: function NumberFormat(this: unknown) {
        return {
          formatToParts: () => [
            { type: 'currency', value: 'USD' },
            { type: 'integer', value: '0' },
          ],
        };
      },
    } as unknown as typeof Intl;
    expect(currencySymbol('USD')).toBe('$');
    expect(formatAmount(173044, 'USD')).toBe('$1,730.44');
    expect(formatAmount(173044, 'USD')).not.toContain('USD');
  });

  it('falls back to the bare code for a currency the app does not ship', () => {
    // @ts-expect-error — no Intl, so there is nothing but the fallback left.
    delete globalThis.Intl;
    expect(currencySymbol('ZZZ')).toBe('ZZZ');
  });
});

describe('fitMonoFontSize — a total can never wrap or escape its box', () => {
  // IBM Plex Mono advances 0.6em per glyph; the helper budgets 0.62em.
  const widthOf = (text: string, size: number) => text.length * 0.62 * size;

  it('leaves a short total at its base size', () => {
    expect(fitMonoFontSize('$0.00', 152, 32, 14)).toBe(32);
  });

  it('shrinks the seeded home-screen total to fit the donut hole', () => {
    // size 240 donut → hole 196 → usable centre width ~152.
    const size = fitMonoFontSize('$1,730.44', 152, 32, 14);
    expect(size).toBeLessThan(32);
    expect(widthOf('$1,730.44', size)).toBeLessThanOrEqual(152);
  });

  it('keeps even the pre-fix ISO-code string inside the ring', () => {
    // Belt and braces: if some currency legitimately renders as a 3-char code,
    // the layout still has to hold it.
    const text = 'USD1,730.44';
    const size = fitMonoFontSize(text, 152, 32, 14);
    expect(widthOf(text, size)).toBeLessThanOrEqual(152);
  });

  it('holds a year-scale total inside the ring', () => {
    const text = '−$12,345,678.90';
    const size = fitMonoFontSize(text, 152, 32, 14);
    expect(size).toBeGreaterThanOrEqual(14);
    expect(widthOf(text, size)).toBeLessThanOrEqual(152);
  });

  it('holds the seeded totals inside a narrow TotalsRow column', () => {
    // iPhone SE (320pt): (320 − 32 − 2·1)/3 − 4 ≈ 91pt per column. These are the
    // three figures from the defect screenshot, which previously wrapped.
    const colWidth = 91;
    for (const text of ['$3,200.00', '$1,730.44', '+$1,469.56']) {
      const size = fitMonoFontSize(text, colWidth, 16, 10);
      expect(widthOf(text, size)).toBeLessThanOrEqual(colWidth);
    }
  });

  it('bottoms out at the floor for an impossible figure, so it truncates on one line', () => {
    // A 15-glyph total in a third of an iPhone SE cannot fit at a legible size;
    // the contract is that it stops shrinking and lets numberOfLines={1}
    // ellipsize it — never that it wraps mid-number.
    const size = fitMonoFontSize('−$12,345,678.90', 91, 16, 10);
    expect(size).toBe(10);
  });

  it('never returns below the floor, so a huge string ellipsizes instead of vanishing', () => {
    expect(fitMonoFontSize('−$999,999,999,999.99', 40, 32, 14)).toBe(14);
  });

  it('is defensive about a zero / unmeasured width', () => {
    expect(fitMonoFontSize('$1.00', 0, 16, 10)).toBe(16);
    expect(fitMonoFontSize('', 100, 16, 10)).toBe(16);
  });
});
