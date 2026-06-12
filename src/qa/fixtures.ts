// QA fixtures — the deterministic data tally boots with under QA_MODE.
//
// Compile-time gated: EXPO_PUBLIC_QA_MODE is inlined by Metro, so production
// builds tree-shake every QA branch away (see qaMode.ts). These rows only ever
// exist in a capture build — they never reach a user.
//
// Determinism rules (so cross-device baselines are byte-stable):
//   - Stable ids + FIXED timestamps; never Date.now()/new Date() in fixtures.
//   - occurred_at is DATE-ONLY (YYYY-MM-DD) inside the frozen anchor month so it
//     falls in periodRange()'s ymd() bounds (transactions.ts buildWhere compares
//     occurred_at lexically against date-only range edges).
//   - The home anchor is frozen to QA_ANCHOR_MS (HomeScreen) so the period label
//     ("November 2023") and the seeded rows line up on every run, every month.

import type { SQLiteDatabase } from 'expo-sqlite';

// Fixed epoch: 2023-11-14 — the frozen "today" for QA captures. The month view
// shows November 2023; the rows below all fall in 2023-11-01..2023-11-14.
export const QA_ANCHOR_MS = 1700000000000;

const QA_MONTH = '2023-11';
const T_ISO = '2023-11-14T00:00:00.000Z'; // fixed created_at/updated_at for every row

interface QaTx {
  id: string;
  kind: 'expense' | 'income';
  amountMinor: number;
  categoryName: string;
  day: string; // DD within QA_MONTH
  note: string | null;
}

// A realistic single-account November: one salary in, a spread of expenses that
// fills the donut and totals row without overflowing one screen.
const QA_TRANSACTIONS: QaTx[] = [
  { id: 'qa-tx-1', kind: 'income',  amountMinor: 320000, categoryName: 'Salary',        day: '01', note: 'Monthly pay' },
  { id: 'qa-tx-2', kind: 'expense', amountMinor: 145000, categoryName: 'Rent',          day: '02', note: 'November rent' },
  { id: 'qa-tx-3', kind: 'expense', amountMinor: 8250,   categoryName: 'Groceries',     day: '03', note: 'Weekly shop' },
  { id: 'qa-tx-4', kind: 'expense', amountMinor: 3400,   categoryName: 'Eating out',    day: '05', note: 'Dinner' },
  { id: 'qa-tx-5', kind: 'expense', amountMinor: 1275,   categoryName: 'Transport',     day: '06', note: 'Bus pass' },
  { id: 'qa-tx-6', kind: 'expense', amountMinor: 1599,   categoryName: 'Subscriptions', day: '07', note: 'Streaming' },
  { id: 'qa-tx-7', kind: 'expense', amountMinor: 2800,   categoryName: 'Entertainment', day: '09', note: 'Cinema' },
  { id: 'qa-tx-8', kind: 'expense', amountMinor: 4720,   categoryName: 'Groceries',     day: '12', note: 'Big shop' },
  { id: 'qa-tx-9', kind: 'expense', amountMinor: 6000,   categoryName: 'Health',        day: '13', note: 'Pharmacy' },
];

// Seed the QA transactions idempotently. Categories + the default account are
// already inserted by ensureSeed() before this runs; we just map names → ids and
// drop in the rows. No-op if any transaction already exists.
export async function seedQaTransactions(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM "transaction"');
  if ((existing?.n ?? 0) > 0) return;

  const account = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM account WHERE deleted_at IS NULL ORDER BY sort_order LIMIT 1'
  );
  if (!account) return;

  const cats = await db.getAllAsync<{ id: string; name: string }>('SELECT id, name FROM category');
  const byName = new Map(cats.map((c) => [c.name, c.id]));

  for (const t of QA_TRANSACTIONS) {
    const categoryId = byName.get(t.categoryName);
    if (!categoryId) continue;
    await db.runAsync(
      'INSERT INTO "transaction" (id, kind, amount_minor, account_id, category_id, occurred_at, note, recurring_rule_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)',
      [t.id, t.kind, t.amountMinor, account.id, categoryId, `${QA_MONTH}-${t.day}`, t.note, T_ISO, T_ISO]
    );
  }
}
