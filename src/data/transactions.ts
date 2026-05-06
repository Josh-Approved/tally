import { getDb } from './db';
import { uuid, nowIso } from '../lib/ids';
import type { Transaction, TxKind } from './types';

interface TransactionRow {
  id: string;
  kind: TxKind;
  amount_minor: number;
  account_id: string;
  category_id: string;
  occurred_at: string;
  note: string | null;
  recurring_rule_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function rowToTransaction(r: TransactionRow): Transaction {
  return {
    id: r.id,
    kind: r.kind,
    amountMinor: r.amount_minor,
    accountId: r.account_id,
    categoryId: r.category_id,
    occurredAt: r.occurred_at,
    note: r.note,
    recurringRuleId: r.recurring_rule_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

export interface TransactionFilter {
  startIso?: string;
  endIso?: string;
  accountId?: string | null;
  categoryId?: string | null;
  kind?: TxKind;
  search?: string;
}

function buildWhere(f: TransactionFilter): { sql: string; args: (string | number)[] } {
  const where: string[] = ['t.deleted_at IS NULL'];
  const args: (string | number)[] = [];
  if (f.startIso) { where.push('t.occurred_at >= ?'); args.push(f.startIso); }
  if (f.endIso) { where.push('t.occurred_at <= ?'); args.push(f.endIso); }
  if (f.accountId) { where.push('t.account_id = ?'); args.push(f.accountId); }
  if (f.categoryId) { where.push('t.category_id = ?'); args.push(f.categoryId); }
  if (f.kind) { where.push('t.kind = ?'); args.push(f.kind); }
  if (f.search && f.search.trim().length > 0) {
    where.push('(t.note LIKE ? OR c.name LIKE ?)');
    const term = `%${f.search.trim()}%`;
    args.push(term, term);
  }
  return { sql: where.join(' AND '), args };
}

export async function listTransactions(filter: TransactionFilter = {}): Promise<Transaction[]> {
  const db = await getDb();
  const { sql, args } = buildWhere(filter);
  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT t.* FROM "transaction" t LEFT JOIN category c ON t.category_id = c.id WHERE ${sql} ORDER BY t.occurred_at DESC, t.created_at DESC`,
    args
  );
  return rows.map(rowToTransaction);
}

export interface CategoryTotal {
  categoryId: string;
  totalMinor: number;
}

export async function categoryTotals(filter: TransactionFilter): Promise<CategoryTotal[]> {
  const db = await getDb();
  const { sql, args } = buildWhere(filter);
  const rows = await db.getAllAsync<{ category_id: string; total: number }>(
    `SELECT t.category_id, SUM(t.amount_minor) AS total FROM "transaction" t LEFT JOIN category c ON t.category_id = c.id WHERE ${sql} GROUP BY t.category_id ORDER BY total DESC`,
    args
  );
  return rows.map((r) => ({ categoryId: r.category_id, totalMinor: r.total }));
}

export interface PeriodTotals {
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
}

export async function periodTotals(filter: TransactionFilter): Promise<PeriodTotals> {
  const db = await getDb();
  const { sql, args } = buildWhere(filter);
  const row = await db.getFirstAsync<{ income: number | null; expense: number | null }>(
    `SELECT
       SUM(CASE WHEN t.kind = 'income' THEN t.amount_minor ELSE 0 END) AS income,
       SUM(CASE WHEN t.kind = 'expense' THEN t.amount_minor ELSE 0 END) AS expense
     FROM "transaction" t LEFT JOIN category c ON t.category_id = c.id WHERE ${sql}`,
    args
  );
  const incomeMinor = row?.income ?? 0;
  const expenseMinor = row?.expense ?? 0;
  return { incomeMinor, expenseMinor, netMinor: incomeMinor - expenseMinor };
}

export async function createTransaction(input: {
  kind: TxKind;
  amountMinor: number;
  accountId: string;
  categoryId: string;
  occurredAt: string;
  note?: string | null;
  recurringRuleId?: string | null;
}): Promise<Transaction> {
  const db = await getDb();
  const id = uuid();
  const ts = nowIso();
  await db.runAsync(
    'INSERT INTO "transaction" (id, kind, amount_minor, account_id, category_id, occurred_at, note, recurring_rule_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, input.kind, input.amountMinor, input.accountId, input.categoryId, input.occurredAt, input.note ?? null, input.recurringRuleId ?? null, ts, ts]
  );
  const row = await db.getFirstAsync<TransactionRow>('SELECT * FROM "transaction" WHERE id = ?', [id]);
  return rowToTransaction(row!);
}

export async function updateTransaction(
  id: string,
  patch: Partial<Pick<Transaction, 'kind' | 'amountMinor' | 'accountId' | 'categoryId' | 'occurredAt' | 'note'>>
): Promise<void> {
  const db = await getDb();
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  if (patch.kind !== undefined) { sets.push('kind = ?'); args.push(patch.kind); }
  if (patch.amountMinor !== undefined) { sets.push('amount_minor = ?'); args.push(patch.amountMinor); }
  if (patch.accountId !== undefined) { sets.push('account_id = ?'); args.push(patch.accountId); }
  if (patch.categoryId !== undefined) { sets.push('category_id = ?'); args.push(patch.categoryId); }
  if (patch.occurredAt !== undefined) { sets.push('occurred_at = ?'); args.push(patch.occurredAt); }
  if (patch.note !== undefined) { sets.push('note = ?'); args.push(patch.note); }
  if (sets.length === 0) return;
  sets.push('updated_at = ?');
  args.push(nowIso());
  args.push(id);
  await db.runAsync(`UPDATE "transaction" SET ${sets.join(', ')} WHERE id = ?`, args);
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  const ts = nowIso();
  await db.runAsync('UPDATE "transaction" SET deleted_at = ?, updated_at = ? WHERE id = ?', [ts, ts, id]);
}
