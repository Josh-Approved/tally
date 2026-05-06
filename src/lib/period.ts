// Period helpers — returns ISO date strings (YYYY-MM-DD), never times.

export type PeriodKind = 'day' | 'week' | 'month' | 'year';

export interface DateRange {
  startIso: string;
  endIso: string;
  label: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeek(d: Date): Date {
  // Monday-start. Adjust later if user-locale-Monday/Sunday becomes a setting.
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const r = new Date(d);
  r.setDate(d.getDate() - diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function periodRange(kind: PeriodKind, anchor: Date = new Date()): DateRange {
  const a = new Date(anchor);
  a.setHours(0, 0, 0, 0);
  switch (kind) {
    case 'day': {
      const label = `${monthNames[a.getMonth()]} ${a.getDate()}, ${a.getFullYear()}`;
      return { startIso: ymd(a), endIso: ymd(a), label };
    }
    case 'week': {
      const s = startOfWeek(a);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      const label = `${monthNames[s.getMonth()]} ${s.getDate()} – ${monthNames[e.getMonth()]} ${e.getDate()}`;
      return { startIso: ymd(s), endIso: ymd(e), label };
    }
    case 'month': {
      const s = new Date(a.getFullYear(), a.getMonth(), 1);
      const e = new Date(a.getFullYear(), a.getMonth() + 1, 0);
      return { startIso: ymd(s), endIso: ymd(e), label: `${monthNames[s.getMonth()]} ${s.getFullYear()}` };
    }
    case 'year': {
      const s = new Date(a.getFullYear(), 0, 1);
      const e = new Date(a.getFullYear(), 11, 31);
      return { startIso: ymd(s), endIso: ymd(e), label: `${a.getFullYear()}` };
    }
  }
}

export function shiftPeriod(kind: PeriodKind, anchor: Date, delta: number): Date {
  const a = new Date(anchor);
  switch (kind) {
    case 'day':
      a.setDate(a.getDate() + delta);
      break;
    case 'week':
      a.setDate(a.getDate() + delta * 7);
      break;
    case 'month':
      a.setMonth(a.getMonth() + delta);
      break;
    case 'year':
      a.setFullYear(a.getFullYear() + delta);
      break;
  }
  return a;
}

export function todayIso(): string {
  return ymd(new Date());
}

export function formatRowDate(iso: string): string {
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10));
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';
  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}
