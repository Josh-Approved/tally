/**
 * Database open concurrency (trust core).
 *
 * Regression cover for the fleet-wide "second connection" defect (ticket
 * fleet-domain-db-second-connection; packing-list + grocery-list fixed the
 * identical shape 2026-08-01): data/db.ts used to call
 * SQLite.openDatabaseAsync itself instead of routing through the shell's
 * storage/kv.ts getDb(), so the app held two connections to one file
 * (tally.db, per storage/dbConfig.ts). On the first launch after an install
 * the SQLite directory does not exist yet, so both connections raced expo-
 * sqlite's ensureDatabasePathExists and the loser rejected with "Couldn't
 * create directory … Path already points to a non-normal file" — hydration
 * caught that and failed open to an empty dataset. Reproduced at ~2 in 15
 * cold launches on packing-list/grocery-list; the same two-call-site shape
 * existed here.
 *
 * The fake database below reproduces SQLite's real async behavior closely
 * enough (every op yields a real tick) to prove the app opens exactly one
 * connection when the domain module (data/db.ts, via accounts.ts) and the
 * shell's storage/kv.ts are driven concurrently — the real cold-start shape,
 * where hydration and a settings read land in the same tick.
 */

let openCount = 0;
let userVersion = 0;

/** Yields to the microtask/timer queue so concurrent callers interleave. */
const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Every step of the fake database is a real `setTimeout(0)` (that
 * interleaving IS the race under test), so this test is timer-scheduling
 * bound rather than work bound — see grocery-list/packing-list's
 * dbInit.test.ts learning: a starved timer queue on a loaded machine can
 * blow through Jest's 5s default and read as a broken trust-core test
 * rather than a slow one.
 */
const TIMER_BOUND_TIMEOUT_MS = 30_000;

const mockDb = {
  async execAsync(sql: string) {
    await tick();
    const versionSet = /PRAGMA user_version\s*=\s*(\d+)/.exec(sql);
    if (versionSet) {
      userVersion = Number(versionSet[1]);
    }
    return undefined;
  },
  async getAllAsync() {
    await tick();
    return [];
  },
  async getFirstAsync(sql: string) {
    await tick();
    if (/PRAGMA user_version/.test(sql)) {
      return { user_version: userVersion };
    }
    return null;
  },
  async runAsync() {
    await tick();
    return undefined;
  },
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => {
    openCount += 1;
    await tick();
    return mockDb;
  }),
}));

beforeEach(() => {
  openCount = 0;
  userVersion = 0;
});

describe('db init', () => {
  it('opens once and migrates once when several domain callers race at startup', async () => {
    await jest.isolateModulesAsync(async () => {
      const accounts = require('../accounts');

      const [a, b, c] = await Promise.all([
        accounts.listAccounts(),
        accounts.listAccounts(),
        accounts.listAccounts(),
      ]);

      expect(a).toEqual([]);
      expect(b).toEqual([]);
      expect(c).toEqual([]);
      expect(openCount).toBe(1);
      // The schema migration ran to completion exactly once.
      expect(userVersion).toBe(1);
    });
  }, TIMER_BOUND_TIMEOUT_MS);

  /**
   * The whole APP opens the database exactly once — the domain module
   * (data/db.ts) and the shell's storage/kv.ts must share one connection,
   * not one each.
   *
   * Two openDatabaseAsync call sites on the same file are harmless once the
   * SQLite directory exists, which is why this hid for so long: it only
   * bites on the FIRST launch after an install, when both race expo-
   * sqlite's ensureDatabasePathExists and the loser rejects. hydrate()
   * catches that and fails open, so the user's first launch renders empty.
   *
   * A test that only ever exercises data/db.ts would count 1 open while the
   * app really made 2. This one drives BOTH modules in the same tick.
   */
  it('opens once across the whole app — domain and shell share one connection', async () => {
    await jest.isolateModulesAsync(async () => {
      const accounts = require('../accounts');
      const kv = require('../../storage/kv');

      // Cold start: domain hydration (accounts) and a shell settings read
      // land together.
      await Promise.all([
        accounts.listAccounts(),
        kv.getAppSetting('theme'),
        accounts.listAccounts(),
      ]);

      expect(openCount).toBe(1);
    });
  }, TIMER_BOUND_TIMEOUT_MS);
});
