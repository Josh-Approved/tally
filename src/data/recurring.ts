import { getDb, boolToInt, intToBool } from './db';
import { uuid, nowIso } from '../lib/ids';
import { todayIso } from '../lib/period';
import { createTransaction } from './transactions';
import type { Frequency, RecurringRule, TxKind } from './types';

interface RecurringRow {
  id: string;
  kind: TxKind;
  amount_minor: number;
  account_id: string;
  category_id: string;
  note: string | null;
  frequency: Frequency;
  interval: number;
  start_date: string;
  next_due_date: string;
  paused: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function rowToRule(r: RecurringRow): RecurringRule {
  return {
    id: r.id,
    kind: r.kind,
    amountMinor: r.amount_minor,
    accountId: r.account_id,
    categoryId: r.category_id,
    note: r.note,
    frequency: r.frequency,
    interval: r.interval,
    startDate: r.start_date,
    nextDueDate: r.next_due_date,
    paused: intToBool(r.paused),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

export async function listRecurringRules(): Promise<RecurringRule[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RecurringRow>('SELECT * FROM recurring_rule WHERE deleted_at IS NULL ORDER BY created_at DESC');
  return rows.map(rowToRule);
}

export async function createRecurringRule(input: {
  kind: TxKind;
  amountMinor: number;
  accountId: string;
  categoryId: string;
  note?: string | null;
  frequency: Frequency;
  interval?: number;
  startDate: string;
}): Promise<RecurringRule> {
  const db = await getDb();
  const id = uuid();
  const ts = nowIso();
  await db.runAsync(
    'INSERT INTO recurring_rule (id, kind, amount_minor, account_id, category_id, note, frequency, interval, start_date, next_due_date, paused, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
    [id, input.kind, input.amountMinor, input.accountId, input.categoryId, input.note ?? null, input.frequency, input.interval ?? 1, input.startDate, input.startDate, ts, ts]
  );
  const row = await db.getFirstAsync<RecurringRow>('SELECT * FROM recurring_rule WHERE id = ?', [id]);
  return rowToRule(row!);
}

export async function updateRecurringRule(id: string, patch: Partial<Pick<RecurringRule, 'paused' | 'amountMinor' | 'note' | 'frequency' | 'interval'>>): Promise<void> {
  const db = await getDb();
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  if (patch.paused !== undefined) { sets.push('paused = ?'); args.push(boolToInt(patch.paused)); }
  if (patch.amountMinor !== undefined) { sets.push('amount_minor = ?'); args.push(patch.amountMinor); }
  if (patch.note !== undefined) { sets.push('note = ?'); args.push(patch.note); }
  if (patch.frequency !== undefined) { sets.push('frequency = ?'); args.push(patch.frequency); }
  if (patch.interval !== undefined) { sets.push('interval = ?'); args.push(patch.interval); }
  if (sets.length === 0) return;
  sets.push('updated_at = ?');
  args.push(nowIso());
  args.push(id);
  await db.runAsync(`UPDATE recurring_rule SET ${sets.join(', ')} WHERE id = ?`, args);
}

export async function deleteRecurringRule(id: string): Promise<void> {
  const db = await getDb();
  const ts = nowIso();
  await db.runAsync('UPDATE recurring_rule SET deleted_at = ?, updated_at = ? WHERE id = ?', [ts, ts, id]);
}

function advanceDate(iso: string, frequency: Frequency, interval: number): string {
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10));
  const date = new Date(y, m - 1, d);
  switch (frequency) {
    case 'daily': date.setDate(date.getDate() + interval); break;
    case 'weekly': date.setDate(date.getDate() + 7 * interval); break;
    case 'monthly': date.setMonth(date.getMonth() + interval); break;
    case 'yearly': date.setFullYear(date.getFullYear() + interval); break;
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Materializes all rules whose next_due_date <= today. Returns the number of
// transactions created.
export async function materializeRecurring(): Promise<number> {
  const db = await getDb();
  const today = todayIso();
  const rows = await db.getAllAsync<RecurringRow>(
    'SELECT * FROM recurring_rule WHERE deleted_at IS NULL AND paused = 0 AND next_due_date <= ?',
    [today]
  );
  let created = 0;
  for (const r of rows) {
    let due = r.next_due_date;
    while (due <= today) {
      await createTransaction({
        kind: r.kind,
        amountMinor: r.amount_minor,
        accountId: r.account_id,
        categoryId: r.category_id,
        occurredAt: due,
        note: r.note,
        recurringRuleId: r.id,
      });
      created++;
      due = advanceDate(due, r.frequency, r.interval);
    }
    await db.runAsync('UPDATE recurring_rule SET next_due_date = ?, updated_at = ? WHERE id = ?', [due, nowIso(), r.id]);
  }
  return created;
}
