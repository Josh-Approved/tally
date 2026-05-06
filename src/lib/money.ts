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

export function formatAmount(minor: number, code: string, opts: { sign?: boolean } = {}): string {
  const decimals = decimalsForCurrency(code);
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const unit = minorPerUnit(code);
  const major = Math.floor(abs / unit);
  const frac = abs % unit;
  const fracStr = decimals > 0 ? '.' + frac.toString().padStart(decimals, '0') : '';
  const majorStr = major.toLocaleString('en-US');
  let symbol = '';
  try {
    const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' }).formatToParts(0);
    symbol = parts.find((p) => p.type === 'currency')?.value ?? code;
  } catch {
    symbol = code;
  }
  const body = `${symbol}${majorStr}${fracStr}`;
  if (negative) return `−${body}`;
  if (opts.sign) return `+${body}`;
  return body;
}
