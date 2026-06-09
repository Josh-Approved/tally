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
});
