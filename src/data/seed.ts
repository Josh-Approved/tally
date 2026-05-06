import { getDb } from './db';
import { uuid, nowIso } from '../lib/ids';
import { defaultCurrencyForDevice } from '../lib/currency';

interface SeedCategory {
  name: string;
  kind: 'expense' | 'income';
  icon: string;
  colorToken: string;
}

const EXPENSE_SEED: SeedCategory[] = [
  { name: 'Groceries', kind: 'expense', icon: 'shopping-basket', colorToken: 'fg' },
  { name: 'Eating out', kind: 'expense', icon: 'utensils', colorToken: 'fg' },
  { name: 'Transport', kind: 'expense', icon: 'bus', colorToken: 'fg' },
  { name: 'Fuel', kind: 'expense', icon: 'fuel', colorToken: 'fg' },
  { name: 'Bills', kind: 'expense', icon: 'receipt', colorToken: 'fg' },
  { name: 'Rent', kind: 'expense', icon: 'home', colorToken: 'fg' },
  { name: 'Subscriptions', kind: 'expense', icon: 'repeat', colorToken: 'fg' },
  { name: 'Health', kind: 'expense', icon: 'heart-pulse', colorToken: 'fg' },
  { name: 'Shopping', kind: 'expense', icon: 'shopping-bag', colorToken: 'fg' },
  { name: 'Entertainment', kind: 'expense', icon: 'film', colorToken: 'fg' },
  { name: 'Travel', kind: 'expense', icon: 'plane', colorToken: 'fg' },
  { name: 'Other', kind: 'expense', icon: 'circle', colorToken: 'fg' },
];

const INCOME_SEED: SeedCategory[] = [
  { name: 'Salary', kind: 'income', icon: 'briefcase', colorToken: 'fg' },
  { name: 'Freelance', kind: 'income', icon: 'laptop', colorToken: 'fg' },
  { name: 'Gifts', kind: 'income', icon: 'gift', colorToken: 'fg' },
  { name: 'Other income', kind: 'income', icon: 'circle', colorToken: 'fg' },
];

export async function ensureSeed(): Promise<void> {
  const db = await getDb();

  const settingRow = await db.getFirstAsync<{ id: number }>('SELECT id FROM setting WHERE id = 1');
  const isFirstLaunch = !settingRow;

  if (isFirstLaunch) {
    const code = defaultCurrencyForDevice();
    await db.runAsync(
      'INSERT INTO setting (id, currency_code, default_category_id, default_account_id, theme, sync_enabled) VALUES (1, ?, NULL, NULL, ?, 0)',
      [code, 'system']
    );
  }

  const accountCount = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM account WHERE deleted_at IS NULL');
  let defaultAccountId: string | null = null;
  if ((accountCount?.n ?? 0) === 0) {
    const id = uuid();
    const ts = nowIso();
    await db.runAsync(
      'INSERT INTO account (id, name, starting_balance_minor, color_token, sort_order, archived, created_at, updated_at) VALUES (?, ?, 0, ?, 0, 0, ?, ?)',
      [id, 'Cash', 'appAccent', ts, ts]
    );
    defaultAccountId = id;
  }

  const categoryCount = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM category');
  let defaultCategoryId: string | null = null;
  if ((categoryCount?.n ?? 0) === 0) {
    let order = 0;
    for (const c of EXPENSE_SEED) {
      const id = uuid();
      await db.runAsync(
        'INSERT INTO category (id, name, kind, icon, color_token, sort_order, hidden) VALUES (?, ?, ?, ?, ?, ?, 0)',
        [id, c.name, c.kind, c.icon, c.colorToken, order++]
      );
      if (c.name === 'Groceries') defaultCategoryId = id;
    }
    for (const c of INCOME_SEED) {
      const id = uuid();
      await db.runAsync(
        'INSERT INTO category (id, name, kind, icon, color_token, sort_order, hidden) VALUES (?, ?, ?, ?, ?, ?, 0)',
        [id, c.name, c.kind, c.icon, c.colorToken, order++]
      );
    }
  }

  if (isFirstLaunch && (defaultAccountId || defaultCategoryId)) {
    await db.runAsync(
      'UPDATE setting SET default_account_id = COALESCE(?, default_account_id), default_category_id = COALESCE(?, default_category_id) WHERE id = 1',
      [defaultAccountId, defaultCategoryId]
    );
  }
}
