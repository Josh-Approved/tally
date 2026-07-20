/**
 * Trust-core tests for the transaction store's query building and patch
 * semantics — the deterministic sibling of the intent fuzzer (which drives
 * random stories but always edits every field and never filters a list).
 *
 * WHAT IT DRIVES. The REAL store (`../transactions.ts`) — its real SQL —
 * with the same driver swap the fuzzer uses: `expo-sqlite` (no native module
 * under Jest) is replaced by Node's built-in `node:sqlite`, so `buildWhere`,
 * the LEFT JOIN, and every UPDATE run unchanged against a real SQLite engine.
 *
 * Intent pinned here (each was a mutation-survivor hole):
 *  - every filter (account / category / kind / search) actually narrows the
 *    list to matching rows — a dropped WHERE clause is a wrong report;
 *  - search matches note OR category name, trims its input, and a
 *    whitespace-only search is NO filter (and never hides an orphan-category
 *    row — the LEFT JOIN exists so rows outlive their category);
 *  - categoryTotals returns real {categoryId, totalMinor} rows;
 *  - periodTotals degrades to zeros if the driver yields no row;
 *  - updateTransaction patches ONLY the fields present (partial patches must
 *    not null out the rest) and an empty patch touches nothing.
 */

// Driver swap: back the real store with Node's built-in SQLite (same pattern
// as intentFuzz.test.ts — every SQL string in the store runs for real).
jest.mock('expo-sqlite', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { DatabaseSync } = require('node:sqlite');
  const adapt = (db: any) => ({
    execAsync: async (sql: string) => { db.exec(sql); },
    runAsync: async (sql: string, params: any[] = []) => {
      const info = db.prepare(sql).run(...(params ?? []));
      return { lastInsertRowId: Number(info.lastInsertRowid ?? 0), changes: Number(info.changes ?? 0) };
    },
    getFirstAsync: async (sql: string, params: any[] = []) => db.prepare(sql).get(...(params ?? [])) ?? null,
    getAllAsync: async (sql: string, params: any[] = []) => db.prepare(sql).all(...(params ?? [])),
  });
  return { openDatabaseAsync: async () => adapt(new DatabaseSync(':memory:')) };
});

import type { TxKind } from '../types';

type TxModule = typeof import('../transactions');
type Db = Awaited<ReturnType<typeof import('../db').getDb>>;

const ACCOUNTS = ['acc-cash', 'acc-card'];
// name matters: the search tests match against these.
const CATEGORIES: Array<{ id: string; name: string; kind: TxKind }> = [
  { id: 'cat-food', name: 'Groceries', kind: 'expense' },
  { id: 'cat-rent', name: 'Rent', kind: 'expense' },
  { id: 'cat-pay', name: 'Paycheck', kind: 'income' },
];

/** Fresh module registry + fresh in-memory DB per test (fuzzer pattern). */
async function initStore(): Promise<{ tx: TxModule; db: Db }> {
  let tx!: TxModule;
  let getDb!: typeof import('../db').getDb;
  jest.isolateModules(() => {
    tx = require('../transactions');
    getDb = require('../db').getDb;
  });
  const db = await getDb();
  for (const a of ACCOUNTS) {
    await db.runAsync(
      "INSERT INTO account (id,name,starting_balance_minor,color_token,sort_order,archived,created_at,updated_at) VALUES (?,?,0,'teal',0,0,'t','t')",
      [a, a]
    );
  }
  for (const c of CATEGORIES) {
    await db.runAsync(
      "INSERT INTO category (id,name,kind,icon,color_token,sort_order,hidden) VALUES (?,?,?,'dot','teal',0,0)",
      [c.id, c.name, c.kind]
    );
  }
  return { tx, db };
}

const base = {
  kind: 'expense' as TxKind,
  amountMinor: 500,
  accountId: 'acc-cash',
  categoryId: 'cat-food',
  occurredAt: '2026-06-10',
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('listTransactions filters (buildWhere)', () => {
  it('filters by accountId — only that account’s rows come back', async () => {
    const { tx } = await initStore();
    const cash = await tx.createTransaction({ ...base, accountId: 'acc-cash' });
    await tx.createTransaction({ ...base, accountId: 'acc-card' });
    const rows = await tx.listTransactions({ accountId: 'acc-cash' });
    expect(rows.map((r) => r.id)).toEqual([cash.id]);
  });

  it('filters by categoryId', async () => {
    const { tx } = await initStore();
    await tx.createTransaction({ ...base, categoryId: 'cat-food' });
    const rent = await tx.createTransaction({ ...base, categoryId: 'cat-rent' });
    const rows = await tx.listTransactions({ categoryId: 'cat-rent' });
    expect(rows.map((r) => r.id)).toEqual([rent.id]);
  });

  it('filters by kind', async () => {
    const { tx } = await initStore();
    await tx.createTransaction({ ...base });
    const pay = await tx.createTransaction({ ...base, kind: 'income', categoryId: 'cat-pay' });
    const rows = await tx.listTransactions({ kind: 'income' });
    expect(rows.map((r) => r.id)).toEqual([pay.id]);
  });

  it('search matches note text', async () => {
    const { tx } = await initStore();
    // Both rows sit in a category whose name does NOT contain the term, so
    // only the note can match.
    const match = await tx.createTransaction({ ...base, categoryId: 'cat-rent', note: 'weekly groceries run' });
    await tx.createTransaction({ ...base, categoryId: 'cat-rent', note: 'gas station' });
    const rows = await tx.listTransactions({ search: 'groceries' });
    expect(rows.map((r) => r.id)).toEqual([match.id]);
  });

  it('search matches the category name when the note does not', async () => {
    const { tx } = await initStore();
    const rent = await tx.createTransaction({ ...base, categoryId: 'cat-rent', note: null });
    await tx.createTransaction({ ...base, categoryId: 'cat-food', note: null });
    const rows = await tx.listTransactions({ search: 'rent' });
    expect(rows.map((r) => r.id)).toEqual([rent.id]);
  });

  it('search input is trimmed before matching', async () => {
    const { tx } = await initStore();
    const match = await tx.createTransaction({ ...base, note: 'weekly groceries run' });
    const rows = await tx.listTransactions({ search: '  groceries  ' });
    expect(rows.map((r) => r.id)).toEqual([match.id]);
  });

  it('whitespace-only search is no filter at all — even for an orphan-category row', async () => {
    const { tx, db } = await initStore();
    // The LEFT JOIN exists so a transaction outlives its category (e.g. a
    // restored backup referencing a category that no longer exists). Create
    // that shape for real: FK off, a category id with no category row, no note.
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    const orphan = await tx.createTransaction({ ...base, categoryId: 'cat-ghost', note: null });
    const all = await tx.listTransactions({});
    expect(all.map((r) => r.id)).toEqual([orphan.id]);
    // A search of only spaces trims to nothing → must behave exactly like no
    // search, not like LIKE '%%' (which would silently hide this row).
    const searched = await tx.listTransactions({ search: '   ' });
    expect(searched.map((r) => r.id)).toEqual([orphan.id]);
  });
});

describe('categoryTotals', () => {
  it('returns real {categoryId, totalMinor} rows, largest first', async () => {
    const { tx } = await initStore();
    await tx.createTransaction({ ...base, categoryId: 'cat-food', amountMinor: 250 });
    await tx.createTransaction({ ...base, categoryId: 'cat-food', amountMinor: 250 });
    await tx.createTransaction({ ...base, categoryId: 'cat-rent', amountMinor: 120000 });
    const totals = await tx.categoryTotals({});
    expect(totals).toEqual([
      { categoryId: 'cat-rent', totalMinor: 120000 },
      { categoryId: 'cat-food', totalMinor: 500 },
    ]);
  });
});

describe('periodTotals', () => {
  it('sums income and expense into exact integer cents', async () => {
    const { tx } = await initStore();
    await tx.createTransaction({ ...base, kind: 'income', categoryId: 'cat-pay', amountMinor: 5000 });
    await tx.createTransaction({ ...base, amountMinor: 1250 });
    expect(await tx.periodTotals({})).toEqual({ incomeMinor: 5000, expenseMinor: 1250, netMinor: 3750 });
  });

  it('degrades to zeros when the driver yields no row (never crashes)', async () => {
    const { tx, db } = await initStore();
    jest.spyOn(db, 'getFirstAsync').mockResolvedValueOnce(null);
    expect(await tx.periodTotals({})).toEqual({ incomeMinor: 0, expenseMinor: 0, netMinor: 0 });
  });
});

describe('updateTransaction — partial patches', () => {
  it('patches only the account; every other field is untouched', async () => {
    const { tx } = await initStore();
    const t = await tx.createTransaction({ ...base, note: 'keep me' });
    await tx.updateTransaction(t.id, { accountId: 'acc-card' });
    const [row] = await tx.listTransactions({});
    expect(row.accountId).toBe('acc-card');
    expect(row.kind).toBe(t.kind);
    expect(row.amountMinor).toBe(t.amountMinor);
    expect(row.categoryId).toBe(t.categoryId);
    expect(row.occurredAt).toBe(t.occurredAt);
    expect(row.note).toBe('keep me');
  });

  it('patches only the note; every other field is untouched', async () => {
    const { tx } = await initStore();
    const t = await tx.createTransaction({ ...base, note: 'old note' });
    await tx.updateTransaction(t.id, { note: 'new note' });
    const [row] = await tx.listTransactions({});
    expect(row.note).toBe('new note');
    expect(row.kind).toBe(t.kind);
    expect(row.amountMinor).toBe(t.amountMinor);
    expect(row.accountId).toBe(t.accountId);
    expect(row.categoryId).toBe(t.categoryId);
    expect(row.occurredAt).toBe(t.occurredAt);
  });

  it('clears a note with an explicit null', async () => {
    const { tx } = await initStore();
    const t = await tx.createTransaction({ ...base, note: 'temporary' });
    await tx.updateTransaction(t.id, { note: null });
    const [row] = await tx.listTransactions({});
    expect(row.note).toBeNull();
  });

  it('an empty patch is a true no-op — updated_at is not touched', async () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date('2026-06-15T10:00:00.000Z'));
      const { tx } = await initStore();
      const t = await tx.createTransaction({ ...base });
      jest.setSystemTime(new Date('2026-06-15T10:01:00.000Z'));
      await tx.updateTransaction(t.id, {});
      const [row] = await tx.listTransactions({});
      expect(row.updatedAt).toBe(t.updatedAt);
    } finally {
      jest.useRealTimers();
    }
  });
});
