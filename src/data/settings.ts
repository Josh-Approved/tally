import { getDb, boolToInt, intToBool } from './db';
import type { Settings, ThemePref } from './types';

interface SettingRow {
  currency_code: string;
  default_category_id: string | null;
  default_account_id: string | null;
  theme: ThemePref;
  sync_enabled: number;
}

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const row = await db.getFirstAsync<SettingRow>('SELECT * FROM setting WHERE id = 1');
  if (!row) {
    throw new Error('Settings not initialized — call ensureSeed() first.');
  }
  return {
    currencyCode: row.currency_code,
    defaultCategoryId: row.default_category_id,
    defaultAccountId: row.default_account_id,
    theme: row.theme,
    syncEnabled: intToBool(row.sync_enabled),
  };
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const db = await getDb();
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  if (patch.currencyCode !== undefined) {
    sets.push('currency_code = ?');
    args.push(patch.currencyCode);
  }
  if (patch.defaultCategoryId !== undefined) {
    sets.push('default_category_id = ?');
    args.push(patch.defaultCategoryId);
  }
  if (patch.defaultAccountId !== undefined) {
    sets.push('default_account_id = ?');
    args.push(patch.defaultAccountId);
  }
  if (patch.theme !== undefined) {
    sets.push('theme = ?');
    args.push(patch.theme);
  }
  if (patch.syncEnabled !== undefined) {
    sets.push('sync_enabled = ?');
    args.push(boolToInt(patch.syncEnabled));
  }
  if (sets.length === 0) return;
  await db.runAsync(`UPDATE setting SET ${sets.join(', ')} WHERE id = 1`, args);
}
