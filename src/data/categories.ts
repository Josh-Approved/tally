import { getDb, boolToInt, intToBool } from './db';
import { uuid } from '../lib/ids';
import type { Category, TxKind } from './types';

interface CategoryRow {
  id: string;
  name: string;
  kind: TxKind;
  icon: string;
  color_token: string;
  sort_order: number;
  hidden: number;
}

function rowToCategory(r: CategoryRow): Category {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    icon: r.icon,
    colorToken: r.color_token,
    sortOrder: r.sort_order,
    hidden: intToBool(r.hidden),
  };
}

export async function listCategories(opts: { kind?: TxKind; includeHidden?: boolean } = {}): Promise<Category[]> {
  const db = await getDb();
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (opts.kind) { where.push('kind = ?'); args.push(opts.kind); }
  if (!opts.includeHidden) where.push('hidden = 0');
  const sql = `SELECT * FROM category${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY sort_order ASC`;
  const rows = await db.getAllAsync<CategoryRow>(sql, args);
  return rows.map(rowToCategory);
}

export async function getCategory(id: string): Promise<Category | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM category WHERE id = ?', [id]);
  return row ? rowToCategory(row) : null;
}

export async function createCategory(input: { name: string; kind: TxKind; icon: string; colorToken?: string }): Promise<Category> {
  const db = await getDb();
  const id = uuid();
  const next = await db.getFirstAsync<{ next: number }>('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM category');
  await db.runAsync(
    'INSERT INTO category (id, name, kind, icon, color_token, sort_order, hidden) VALUES (?, ?, ?, ?, ?, ?, 0)',
    [id, input.name, input.kind, input.icon, input.colorToken ?? 'fg', next?.next ?? 0]
  );
  return (await getCategory(id))!;
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, 'name' | 'icon' | 'colorToken' | 'hidden' | 'sortOrder'>>
): Promise<void> {
  const db = await getDb();
  const sets: string[] = [];
  const args: (string | number)[] = [];
  if (patch.name !== undefined) { sets.push('name = ?'); args.push(patch.name); }
  if (patch.icon !== undefined) { sets.push('icon = ?'); args.push(patch.icon); }
  if (patch.colorToken !== undefined) { sets.push('color_token = ?'); args.push(patch.colorToken); }
  if (patch.hidden !== undefined) { sets.push('hidden = ?'); args.push(boolToInt(patch.hidden)); }
  if (patch.sortOrder !== undefined) { sets.push('sort_order = ?'); args.push(patch.sortOrder); }
  if (sets.length === 0) return;
  args.push(id);
  await db.runAsync(`UPDATE category SET ${sets.join(', ')} WHERE id = ?`, args);
}
