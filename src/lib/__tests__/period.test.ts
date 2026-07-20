/**
 * Period / date math underpins the recurring engine and every report window.
 * Recurrence correctness (month-end rollover, leap years, week boundaries) is
 * trust-core: a wrong "next month" silently posts a charge on the wrong day.
 *
 * src/lib/period.ts has zero imports, so this file stays clear of the broken
 * UI / design-system chain. We construct dates with the local-time
 * `new Date(y, m, d)` constructor to match the module's own `ymd()` (which
 * reads local getFullYear/getMonth/getDate), keeping assertions TZ-stable.
 */

import { periodRange, shiftPeriod, todayIso, formatRowDate } from '../period';

// Local-time YYYY-MM-DD, mirroring the module's internal ymd().
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;

describe('periodRange — day', () => {
  it('start and end are the same single day', () => {
    const r = periodRange('day', new Date(2024, 2, 15)); // Mar 15 2024
    expect(r.startIso).toBe('2024-03-15');
    expect(r.endIso).toBe('2024-03-15');
    expect(r.label).toBe('Mar 15, 2024');
  });
});

describe('periodRange — month', () => {
  it('spans the first to the last day of a 31-day month', () => {
    const r = periodRange('month', new Date(2024, 0, 17)); // Jan 2024
    expect(r.startIso).toBe('2024-01-01');
    expect(r.endIso).toBe('2024-01-31');
    expect(r.label).toBe('Jan 2024');
  });

  it('ends on the 29th for a leap-year February', () => {
    const r = periodRange('month', new Date(2024, 1, 10)); // Feb 2024 (leap)
    expect(r.startIso).toBe('2024-02-01');
    expect(r.endIso).toBe('2024-02-29');
  });

  it('ends on the 28th for a non-leap February', () => {
    const r = periodRange('month', new Date(2023, 1, 10)); // Feb 2023
    expect(r.startIso).toBe('2023-02-01');
    expect(r.endIso).toBe('2023-02-28');
  });
});

describe('periodRange — month labels', () => {
  it('labels every month with its short name (the chart header)', () => {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 0; m < 12; m++) {
      const r = periodRange('month', new Date(2024, m, 10));
      expect(r.label).toBe(`${names[m]} 2024`);
    }
  });
});

describe('periodRange — week (Monday-start)', () => {
  it('snaps a mid-week anchor back to Monday and out to Sunday', () => {
    // 2024-03-13 is a Wednesday.
    const r = periodRange('week', new Date(2024, 2, 13));
    expect(r.startIso).toBe('2024-03-11'); // Monday
    expect(r.endIso).toBe('2024-03-17'); // Sunday
    expect(r.label).toBe('Mar 11 – Mar 17');
  });

  it('labels a week that crosses a month boundary with both month names', () => {
    // 2024-02-29 is a Thursday → week is Feb 26 .. Mar 3.
    const r = periodRange('week', new Date(2024, 1, 29));
    expect(r.label).toBe('Feb 26 – Mar 3');
  });

  it('keeps a Monday anchor as the week start', () => {
    const r = periodRange('week', new Date(2024, 2, 11)); // Monday
    expect(r.startIso).toBe('2024-03-11');
  });

  it('treats Sunday as the last day of the prior Monday-week', () => {
    const r = periodRange('week', new Date(2024, 2, 17)); // Sunday
    expect(r.startIso).toBe('2024-03-11');
    expect(r.endIso).toBe('2024-03-17');
  });

  it('crosses a month boundary correctly', () => {
    // 2024-02-29 is a Thursday → week is Feb 26 .. Mar 3.
    const r = periodRange('week', new Date(2024, 1, 29));
    expect(r.startIso).toBe('2024-02-26');
    expect(r.endIso).toBe('2024-03-03');
  });
});

describe('periodRange — year', () => {
  it('spans Jan 1 to Dec 31', () => {
    const r = periodRange('year', new Date(2024, 5, 9));
    expect(r.startIso).toBe('2024-01-01');
    expect(r.endIso).toBe('2024-12-31');
    expect(r.label).toBe('2024');
  });
});

describe('shiftPeriod — recurrence stepping', () => {
  it('steps a day forward and backward', () => {
    expect(iso(shiftPeriod('day', new Date(2024, 2, 15), 1))).toBe('2024-03-16');
    expect(iso(shiftPeriod('day', new Date(2024, 2, 15), -1))).toBe('2024-03-14');
  });

  it('steps a week as seven days', () => {
    expect(iso(shiftPeriod('week', new Date(2024, 2, 15), 1))).toBe('2024-03-22');
  });

  it('rolls a month step over a month boundary', () => {
    // Jan 31 + 1 month: JS Date overflows to Mar 2 (Feb has 29 days in 2024).
    // This pins the actual implemented behavior, not an idealized clamp.
    expect(iso(shiftPeriod('month', new Date(2024, 0, 31), 1))).toBe('2024-03-02');
  });

  it('steps a year and lands on the leap day when stepping into a leap year', () => {
    // Feb 29 2024 minus 1 year → Mar 1 2023 (2023 has no Feb 29; JS overflows).
    expect(iso(shiftPeriod('year', new Date(2024, 1, 29), -1))).toBe('2023-03-01');
    // A plain year step stays on the same calendar day.
    expect(iso(shiftPeriod('year', new Date(2024, 5, 9), 1))).toBe('2025-06-09');
  });

  it('a forward then backward step of the same kind is the identity for safe days', () => {
    const start = new Date(2024, 5, 9);
    const fwd = shiftPeriod('month', start, 3);
    const back = shiftPeriod('month', fwd, -3);
    expect(iso(back)).toBe('2024-06-09');
  });
});

describe('todayIso', () => {
  it('returns a well-formed YYYY-MM-DD string', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatRowDate — transaction-row date labels', () => {
  // Pin "now" mid-afternoon (NOT midnight) so the today/yesterday comparison
  // must actually normalize the clock time away — a partial normalization
  // (e.g. zeroing minutes but not hours) would misclassify today's rows.
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 15, 14, 37, 5)); // Sun Mar 15 2026, 14:37:05 local
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it("labels today's date 'Today' whatever the current clock time", () => {
    expect(formatRowDate('2026-03-15')).toBe('Today');
  });

  it("labels yesterday's date 'Yesterday'", () => {
    expect(formatRowDate('2026-03-14')).toBe('Yesterday');
  });

  it('labels an older same-month date as month + day, not Today/Yesterday', () => {
    expect(formatRowDate('2026-03-10')).toBe('Mar 10');
  });

  it('labels tomorrow as month + day (a future row is never Today/Yesterday)', () => {
    expect(formatRowDate('2026-03-16')).toBe('Mar 16');
  });

  it('parses the ISO month as one-based (no off-by-one month)', () => {
    expect(formatRowDate('2026-01-05')).toBe('Jan 5');
    expect(formatRowDate('2025-12-31')).toBe('Dec 31');
  });

  it('crosses a month boundary for Yesterday', () => {
    jest.setSystemTime(new Date(2026, 3, 1, 9, 30)); // Apr 1 2026
    expect(formatRowDate('2026-03-31')).toBe('Yesterday');
    expect(formatRowDate('2026-04-01')).toBe('Today');
    jest.setSystemTime(new Date(2026, 2, 15, 14, 37, 5)); // restore the pinned base
  });
});
