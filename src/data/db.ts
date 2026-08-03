import * as SQLite from 'expo-sqlite';
import { getDb as getSharedDb } from '../storage/kv';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * The connection comes from the shell's storage/kv.ts — the app's ONE
 * database connection — never from a second openDatabaseAsync here. This
 * module used to open its own handle (same file as kv.ts's DB_NAME, from
 * dbConfig.ts): on the first launch after an install the SQLite directory
 * does not exist yet, so both connections raced expo-sqlite's
 * ensureDatabasePathExists and the loser rejected, failing hydration open to
 * an empty dataset (packing-list/grocery-list fixed the identical shape
 * 2026-08-01, ~2-in-15 cold launches). Routing through the shared connection
 * removes the second opener entirely.
 */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await getSharedDb();
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await migrate(db);
      return db;
    })().catch((err) => {
      dbPromise = null; // a failed open must not be cached
      throw err;
    });
  }
  return dbPromise;
}

const SCHEMA_VERSION = 1;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const current = row?.user_version ?? 0;

  if (current < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        starting_balance_minor INTEGER NOT NULL DEFAULT 0,
        color_token TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS category (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        kind TEXT NOT NULL CHECK(kind IN ('expense','income')),
        icon TEXT NOT NULL,
        color_token TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        hidden INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS recurring_rule (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL CHECK(kind IN ('expense','income')),
        amount_minor INTEGER NOT NULL,
        account_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        note TEXT,
        frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly','monthly','yearly')),
        interval INTEGER NOT NULL DEFAULT 1,
        start_date TEXT NOT NULL,
        next_due_date TEXT NOT NULL,
        paused INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        FOREIGN KEY (account_id) REFERENCES account(id),
        FOREIGN KEY (category_id) REFERENCES category(id)
      );

      CREATE TABLE IF NOT EXISTS "transaction" (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL CHECK(kind IN ('expense','income')),
        amount_minor INTEGER NOT NULL,
        account_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        note TEXT,
        recurring_rule_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        FOREIGN KEY (account_id) REFERENCES account(id),
        FOREIGN KEY (category_id) REFERENCES category(id),
        FOREIGN KEY (recurring_rule_id) REFERENCES recurring_rule(id)
      );

      CREATE INDEX IF NOT EXISTS idx_transaction_occurred_at ON "transaction"(occurred_at);
      CREATE INDEX IF NOT EXISTS idx_transaction_account_id ON "transaction"(account_id);
      CREATE INDEX IF NOT EXISTS idx_transaction_category_id ON "transaction"(category_id);
      CREATE INDEX IF NOT EXISTS idx_transaction_deleted ON "transaction"(deleted_at);

      CREATE TABLE IF NOT EXISTS setting (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        currency_code TEXT NOT NULL,
        default_category_id TEXT,
        default_account_id TEXT,
        theme TEXT NOT NULL DEFAULT 'system' CHECK(theme IN ('system','light','dark')),
        sync_enabled INTEGER NOT NULL DEFAULT 0
      );
    `);
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  }
}

export function intToBool(v: number | null | undefined): boolean {
  return v === 1;
}

export function boolToInt(v: boolean): number {
  return v ? 1 : 0;
}
