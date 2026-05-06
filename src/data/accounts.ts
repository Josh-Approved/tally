import { getDb, boolToInt, intToBool } from './db';
import { uuid, nowIso } from '../lib/ids';
import type { Account } from './types';

interface AccountRow {
  id: string;
  name: string;
  starting_balance_minor: number;
  color_token: string;
  sort_order: number;
  archived: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function rowToAccount(r: AccountRow): Account {
  return {
    id: r.id,
    name: r.name,
    startingBalanceMinor: r.starting_balance_minor,
    colorToken: r.color_token,
    sortOrder: r.sort_order,
    archived: intToBool(r.archived),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

export async function listAccounts(opts: { includeArchived?: boolean } = {}): Promise<Account[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<AccountRow>(
    `SELECT * FROM account WHERE deleted_at IS NULL ${opts.includeArchived ? '' : 'AND archived = 0'} ORDER BY sort_order ASC, created_at ASC`
  );
  return rows.map(rowToAccount);
}

export async function getAccount(id: string): Promise<Account | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<AccountRow>('SELECT * FROM account WHERE id = ? AND deleted_at IS NULL', [id]);
  return row ? rowToAccount(row) : null;
}

export async function createAccount(input: {
  name: string;
  startingBalanceMinor?: number;
  colorToken?: string;
}): Promise<Account> {
  const db = await getDb();
  const id = uuid();
  const ts = nowIso();
  const next = await db.getFirstAsync<{ next: number }>('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM account');
  await db.runAsync(
    'INSERT INTO account (id, name, starting_balance_minor, color_token, sort_order, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
    [id, input.name, input.startingBalanceMinor ?? 0, input.colorToken ?? 'appAccent', next?.next ?? 0, ts, ts]
  );
  return (await getAccount(id))!;
}

export async function updateAccount(
  id: string,
  patch: Partial<Pick<Account, 'name' | 'startingBalanceMinor' | 'colorToken' | 'archived' | 'sortOrder'>>
): Promise<void> {
  const db = await getDb();
  const sets: string[] = [];
  const args: (string | number)[] = [];
  if (patch.name !== undefined) { sets.push('name = ?'); args.push(patch.name); }
  if (patch.startingBalanceMinor !== undefined) { sets.push('starting_balance_minor = ?'); args.push(patch.startingBalanceMinor); }
  if (patch.colorToken !== undefined) { sets.push('color_token = ?'); args.push(patch.colorToken); }
  if (patch.archived !== undefined) { sets.push('archived = ?'); args.push(boolToInt(patch.archived)); }
  if (patch.sortOrder !== undefined) { sets.push('sort_order = ?'); args.push(patch.sortOrder); }
  if (sets.length === 0) return;
  sets.push('updated_at = ?');
  args.push(nowIso());
  args.push(id);
  await db.runAsync(`UPDATE account SET ${sets.join(', ')} WHERE id = ?`, args);
}

export async function deleteAccount(id: string): Promise<void> {
  const db = await getDb();
  const ts = nowIso();
  await db.runAsync('UPDATE account SET deleted_at = ?, updated_at = ? WHERE id = ?', [ts, ts, id]);
}

export interface AccountWithBalance extends Account {
  balanceMinor: number;
}

export async function listAccountsWithBalance(opts: { includeArchived?: boolean } = {}): Promise<AccountWithBalance[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<AccountRow & { balance: number }>(
    `SELECT a.*, a.starting_balance_minor + COALESCE((
        SELECT SUM(CASE WHEN t.kind = 'income' THEN t.amount_minor ELSE -t.amount_minor END)
        FROM "transaction" t
        WHERE t.account_id = a.id AND t.deleted_at IS NULL
      ), 0) AS balance
     FROM account a
     WHERE a.deleted_at IS NULL ${opts.includeArchived ? '' : 'AND a.archived = 0'}
     ORDER BY a.sort_order ASC, a.created_at ASC`
  );
  return rows.map((r) => ({ ...rowToAccount(r), balanceMinor: r.balance }));
}
