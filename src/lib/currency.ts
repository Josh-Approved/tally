import * as Localization from 'expo-localization';

// Locale region → ISO 4217 default. Best-effort; user can override in Settings.
const REGION_TO_CURRENCY: Record<string, string> = {
  US: 'USD', CA: 'CAD', GB: 'GBP', IE: 'EUR', AU: 'AUD', NZ: 'NZD',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', PT: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', FI: 'EUR', GR: 'EUR', SK: 'EUR', SI: 'EUR', LV: 'EUR', LT: 'EUR',
  EE: 'EUR', CY: 'EUR', LU: 'EUR', MT: 'EUR',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF', PL: 'PLN', CZ: 'CZK', HU: 'HUF',
  RO: 'RON', BG: 'BGN', HR: 'EUR', IS: 'ISK',
  JP: 'JPY', KR: 'KRW', CN: 'CNY', HK: 'HKD', TW: 'TWD', SG: 'SGD', MY: 'MYR',
  TH: 'THB', VN: 'VND', PH: 'PHP', ID: 'IDR', IN: 'INR', PK: 'PKR', BD: 'BDT',
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR', JO: 'JOD',
  IL: 'ILS', TR: 'TRY', EG: 'EGP', ZA: 'ZAR', NG: 'NGN', KE: 'KES',
  MX: 'MXN', BR: 'BRL', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN', UY: 'UYU',
};

export function defaultCurrencyForDevice(): string {
  try {
    const locales = Localization.getLocales();
    const region = locales[0]?.regionCode?.toUpperCase();
    if (region && REGION_TO_CURRENCY[region]) return REGION_TO_CURRENCY[region];
    const calendars = Localization.getCalendars?.();
    const cur = (locales[0] as { currencyCode?: string })?.currencyCode;
    if (cur) return cur.toUpperCase();
  } catch {}
  return 'USD';
}

export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'JPY', 'CNY', 'HKD', 'TWD', 'KRW',
  'SGD', 'MYR', 'THB', 'IDR', 'PHP', 'INR', 'PKR', 'BDT', 'VND',
  'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'ILS', 'TRY', 'EGP', 'ZAR', 'NGN', 'KES',
  'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'UYU',
  'SEK', 'NOK', 'DKK', 'CHF', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'ISK',
] as const;
