/**
 * Intent fuzzer — the adversarial gate for tally's money + entry trust core
 * (Uplevel 3 / T1). Model-based on fast-check `fc.commands`.
 *
 * WHAT IT DRIVES. The REAL transaction store (`../transactions.ts`) — its real
 * SQL aggregation (`periodTotals`, `categoryTotals`), the real soft-delete
 * (`deleteTransaction`), and the real `lib/period` bucketing — against random
 * add/edit/delete/period-check stories. The ONLY swap is the native SQLite
 * driver: `expo-sqlite` (no native module under Jest) is replaced by Node's
 * built-in `node:sqlite`, so every line of store logic (schema, `buildWhere`,
 * `SUM(CASE WHEN …)`, the date-range filter) runs unchanged. This is the "fuzz
 * the REAL store, never a re-implementation" guardrail: the `Map` model is only
 * the independent intent ledger (the oracle), computed by hand from the story.
 *
 * WHY MODEL vs REALITY (recipe step 2). The spec's u3t1 bullet calls tally's
 * core "counters/entries/undo (its lib/ trust core)". Reality: tally is an
 * expense tracker with no undo/redo, and the counts a person reads (income /
 * expense / net, per-category, per-period) are computed by the SQL store, with
 * `lib/period` supplying the day/week/month/year windows. So the entries are
 * transactions, "counts" are the store totals, and the closest action to "undo"
 * is delete (soft-delete). The oracles below assert exactly the spec's intent —
 * "every count matches a hand-computed replay of the story; delete never
 * invents or loses an entry" — over that real surface.
 *
 * ORACLES (asserted after every command + at quiescence):
 *   I-SET      the live id set == the model's live ids: nothing lost, nothing
 *              resurrected after delete, no duplicate row.
 *   I-NET      periodTotals({}) income/expense/net == Σ of the still-live
 *              amounts by kind (exact integer cents; net = income − expense).
 *   I-CATEGORY categoryTotals({}) == the per-category sums of the live entries.
 *   I-PERIOD   periodTotals over a real `periodRange(kind, anchor)` window ==
 *              Σ of the live entries whose date falls in that window — the
 *              store's date filter and lib/period agreeing with a hand replay.
 *   I-DELETE   a just-deleted id is absent from listTransactions immediately.
 *
 * REPLAY DETERMINISM. Row ids come from the app's `Math.random()` uuid, so the
 * fuzzer never picks a victim by id VALUE — it picks by insertion order (Map
 * order), which the shrunk story reproduces exactly. Oracles compare id SETS
 * and integer sums, both value-order-independent, so a checked-in seed replays
 * faithfully even though the concrete uuids differ each run.
 *
 * The shared sync harness (`qa/intent-fuzz/harness.ts`) runs `fc.modelRun`
 * (synchronous); the real store is async, so this file wires the SAME
 * crystallization + seed contract via `harnessCore.cjs` around an async
 * `fc.asyncModelRun`. Failures still crystallize (fixture + intake + fuzz-log)
 * and replay forever, identically to every other app's fuzzer.
 */

// Driver swap: back the real store with Node's built-in SQLite (expo-sqlite has
// no native module under Jest). Every SQL string in the store runs for real.
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

import fc from 'fast-check';
import { intent } from '../../../qa/intent-fuzz/harness';
import { periodRange, type PeriodKind } from '../../lib/period';
import type { TxKind } from '../types';

// Runtime bridge to the pure core — same fs/seed/crystallization path the sync
// harness uses (a require() call, so this file stays tsc-clean).
interface HarnessCore {
  resolveRuns(env: Record<string, string | undefined>): number;
  resolveProfile(env: Record<string, string | undefined>): string;
  logRun(a: { app: string; model: string; seed: number; runs?: number; profile?: string; outcome: 'pass' | 'fail' }): void;
  crystallizeFailure(a: { app: string; model: string; runDetails: unknown; message?: string }): { regressionFile: string };
  listRegressions(appRoot?: string): Array<{ _file: string; _error?: string; model?: string; seed?: number; path?: string; story?: string }>;
}
// eslint-disable-next-line @typescript-eslint/no-var-requires
const core = require('../../../qa/intent-fuzz/harnessCore.cjs') as HarnessCore;

const APP = require('../../../app.json').expo.slug as string;
const MODEL = 'tally';

// --- fixed reference data (seeded once per store) --------------------------
const ACCOUNTS = ['acc-cash', 'acc-card'];
const EXPENSE_CATS = ['cat-food', 'cat-rent', 'cat-fun'];
const INCOME_CATS = ['cat-pay', 'cat-gift'];
const catsFor = (k: TxKind) => (k === 'income' ? INCOME_CATS : EXPENSE_CATS);

// Local-time YYYY-MM-DD around a fixed base, matching period.ts's own ymd().
function dateForOffset(offset: number): Date {
  const d = new Date(2026, 5, 15); // Jun 15 2026, local midnight
  d.setDate(d.getDate() + offset);
  return d;
}
function isoForOffset(offset: number): string {
  const d = dateForOffset(offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Live { kind: TxKind; amountMinor: number; categoryId: string; accountId: string; occurredAt: string }
interface Model { live: Map<string, Live> } // id -> fields; insertion-ordered oracle ledger
interface Real { tx: typeof import('../transactions') }

// --- the oracle: hand-computed replay of the story, after every command -----
async function assertOracles(m: Model, r: Real): Promise<void> {
  const rows = await r.tx.listTransactions();
  intent(`count should be ${m.live.size} (store had ${rows.length})`, rows.length === m.live.size);

  const rowIds = rows.map((x) => x.id).sort();
  const modelIds = [...m.live.keys()].sort();
  intent(
    'live id set must match (no loss, no resurrection, no duplicate)',
    rowIds.length === modelIds.length && rowIds.every((id, i) => id === modelIds[i])
  );

  let inc = 0, exp = 0;
  for (const v of m.live.values()) { if (v.kind === 'income') inc += v.amountMinor; else exp += v.amountMinor; }
  const tot = await r.tx.periodTotals({});
  intent(`income should be ${inc} (store had ${tot.incomeMinor})`, tot.incomeMinor === inc);
  intent(`expense should be ${exp} (store had ${tot.expenseMinor})`, tot.expenseMinor === exp);
  intent(`net should be ${inc - exp} (store had ${tot.netMinor})`, tot.netMinor === inc - exp);

  const expCat = new Map<string, number>();
  for (const v of m.live.values()) expCat.set(v.categoryId, (expCat.get(v.categoryId) ?? 0) + v.amountMinor);
  const cats = await r.tx.categoryTotals({});
  intent(`category count should be ${expCat.size} (store had ${cats.length})`, cats.length === expCat.size);
  for (const c of cats) {
    intent(`category ${c.categoryId} total should be ${expCat.get(c.categoryId)} (store had ${c.totalMinor})`, expCat.get(c.categoryId) === c.totalMinor);
  }
}

// --- commands = the real user actions --------------------------------------
interface AddArgs { kind: TxKind; amount: number; catPick: number; accPick: number; dayOffset: number }
class AddTransaction implements fc.AsyncCommand<Model, Real> {
  constructor(readonly a: AddArgs) {}
  check = () => true;
  async run(m: Model, r: Real): Promise<void> {
    const category = catsFor(this.a.kind)[this.a.catPick % catsFor(this.a.kind).length];
    const accountId = ACCOUNTS[this.a.accPick % ACCOUNTS.length];
    const occurredAt = isoForOffset(this.a.dayOffset);
    const t = await r.tx.createTransaction({ kind: this.a.kind, amountMinor: this.a.amount, accountId, categoryId: category, occurredAt });
    m.live.set(t.id, { kind: this.a.kind, amountMinor: this.a.amount, categoryId: category, accountId, occurredAt });
    await assertOracles(m, r);
  }
  toString = () => `add(${this.a.kind} ${this.a.amount}c cat#${this.a.catPick} acc#${this.a.accPick} day${this.a.dayOffset})`;
}

interface EditArgs { pick: number; kind: TxKind; amount: number; catPick: number; dayOffset: number }
class EditTransaction implements fc.AsyncCommand<Model, Real> {
  constructor(readonly e: EditArgs) {}
  check = (m: Model) => m.live.size > 0;
  async run(m: Model, r: Real): Promise<void> {
    const keys = [...m.live.keys()]; // insertion order — replay-stable
    const id = keys[this.e.pick % keys.length];
    const category = catsFor(this.e.kind)[this.e.catPick % catsFor(this.e.kind).length];
    const occurredAt = isoForOffset(this.e.dayOffset);
    const prev = m.live.get(id)!;
    await r.tx.updateTransaction(id, { kind: this.e.kind, amountMinor: this.e.amount, categoryId: category, occurredAt });
    m.live.set(id, { kind: this.e.kind, amountMinor: this.e.amount, categoryId: category, accountId: prev.accountId, occurredAt });
    await assertOracles(m, r);
  }
  toString = () => `edit(#${this.e.pick} -> ${this.e.kind} ${this.e.amount}c day${this.e.dayOffset})`;
}

class DeleteTransaction implements fc.AsyncCommand<Model, Real> {
  constructor(readonly pick: number) {}
  check = (m: Model) => m.live.size > 0;
  async run(m: Model, r: Real): Promise<void> {
    const keys = [...m.live.keys()];
    const id = keys[this.pick % keys.length];
    await r.tx.deleteTransaction(id);
    m.live.delete(id);
    const rows = await r.tx.listTransactions();
    intent(`deleted entry ${id} must not remain listed`, !rows.some((x) => x.id === id));
    await assertOracles(m, r);
  }
  toString = () => `delete(#${this.pick})`;
}

interface PeriodArgs { kind: PeriodKind; anchorOffset: number }
class CheckPeriod implements fc.AsyncCommand<Model, Real> {
  constructor(readonly p: PeriodArgs) {}
  check = () => true;
  async run(m: Model, r: Real): Promise<void> {
    const { startIso, endIso } = periodRange(this.p.kind, dateForOffset(this.p.anchorOffset));
    let inc = 0, exp = 0;
    for (const v of m.live.values()) {
      if (v.occurredAt >= startIso && v.occurredAt <= endIso) { if (v.kind === 'income') inc += v.amountMinor; else exp += v.amountMinor; }
    }
    const tot = await r.tx.periodTotals({ startIso, endIso });
    intent(`period ${this.p.kind}[${startIso}..${endIso}] income should be ${inc} (store had ${tot.incomeMinor})`, tot.incomeMinor === inc);
    intent(`period ${this.p.kind}[${startIso}..${endIso}] expense should be ${exp} (store had ${tot.expenseMinor})`, tot.expenseMinor === exp);
    intent(`period ${this.p.kind}[${startIso}..${endIso}] net should be ${inc - exp} (store had ${tot.netMinor})`, tot.netMinor === inc - exp);
  }
  toString = () => `checkPeriod(${this.p.kind} @day${this.p.anchorOffset})`;
}

const kindArb = fc.constantFrom<TxKind>('expense', 'income');
const commands: fc.Arbitrary<fc.AsyncCommand<Model, Real>>[] = [
  fc.record({ kind: kindArb, amount: fc.integer({ min: 1, max: 500_000 }), catPick: fc.nat({ max: 999 }), accPick: fc.nat({ max: 999 }), dayOffset: fc.integer({ min: -420, max: 60 }) }).map((a) => new AddTransaction(a)),
  fc.record({ pick: fc.nat({ max: 9999 }), kind: kindArb, amount: fc.integer({ min: 1, max: 500_000 }), catPick: fc.nat({ max: 999 }), dayOffset: fc.integer({ min: -420, max: 60 }) }).map((e) => new EditTransaction(e)),
  fc.nat({ max: 9999 }).map((p) => new DeleteTransaction(p)),
  fc.record({ kind: fc.constantFrom<PeriodKind>('day', 'week', 'month', 'year'), anchorOffset: fc.integer({ min: -420, max: 60 }) }).map((p) => new CheckPeriod(p)),
];

async function setup(): Promise<{ model: Model; real: Real }> {
  let tx!: typeof import('../transactions');
  let getDb!: typeof import('../db').getDb;
  jest.isolateModules(() => {
    tx = require('../transactions');
    getDb = require('../db').getDb;
  });
  const db = await getDb();
  for (const a of ACCOUNTS) {
    await db.runAsync("INSERT INTO account (id,name,starting_balance_minor,color_token,sort_order,archived,created_at,updated_at) VALUES (?,?,0,'teal',0,0,'t','t')", [a, a]);
  }
  for (const c of EXPENSE_CATS) {
    await db.runAsync("INSERT INTO category (id,name,kind,icon,color_token,sort_order,hidden) VALUES (?,?,'expense','dot','teal',0,0)", [c, c]);
  }
  for (const c of INCOME_CATS) {
    await db.runAsync("INSERT INTO category (id,name,kind,icon,color_token,sort_order,hidden) VALUES (?,?,'income','dot','teal',0,0)", [c, c]);
  }
  return { model: { live: new Map() }, real: { tx } };
}

// The property both the live fuzzer and the replay suite run — async because the
// store is async (drives the REAL SQLite store per run).
function buildTallyProperty(): fc.IAsyncPropertyWithHooks<unknown> {
  return fc.asyncProperty(fc.commands(commands, { maxCommands: 40 }), async (cmds) => {
    const s = await setup();
    await fc.asyncModelRun(() => ({ model: s.model, real: s.real }), cmds);
    await assertOracles(s.model, s.real); // quiescence: oracles hold after the story ends
  }) as unknown as fc.IAsyncPropertyWithHooks<unknown>;
}

function firstLine(details: fc.RunDetails<unknown>): string {
  const err = (details as { errorInstance?: unknown }).errorInstance ?? (details as { error?: unknown }).error;
  if (err instanceof Error) return err.message.split('\n')[0].slice(0, 400);
  if (typeof err === 'string') return err.split('\n')[0].slice(0, 400);
  return 'intent oracle breached';
}
function storyLines(details: fc.RunDetails<unknown>): string[] {
  const ce: unknown = (details as { counterexample?: unknown }).counterexample;
  const first = Array.isArray(ce) ? ce[0] : ce;
  if (Array.isArray(first)) return first.map((c) => String(c));
  return [String(first)];
}

// Async twin of runIntentFuzz: same seed logging + crystallization contract.
async function runTallyFuzz(): Promise<void> {
  const env = (typeof process !== 'undefined' && process.env) || {};
  const numRuns = core.resolveRuns(env);
  const profile = core.resolveProfile(env);
  const details = await fc.check(buildTallyProperty(), { numRuns });
  const seed = details.seed;
  if (!details.failed) {
    core.logRun({ app: APP, model: MODEL, seed, runs: numRuns, profile, outcome: 'pass' });
    return;
  }
  const message = firstLine(details);
  let saved = '(not written)';
  try {
    ({ regressionFile: saved } = core.crystallizeFailure({ app: APP, model: MODEL, runDetails: details, message }));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[intent-fuzz] could not crystallize failure: ${(e as Error)?.message}`);
  }
  throw new Error(
    `intent-fuzz(${MODEL}) breached user intent.\n` +
      `  seed: ${seed}   (replay: the checked-in regression)\n` +
      `  minimal story:\n    ${storyLines(details).join('\n    ')}\n` +
      `  oracle: ${message}\n` +
      `  saved: ${saved}`
  );
}

describe('tally — intent fuzzer (real SQLite store)', () => {
  it('every total + entry survives randomized add/edit/delete stories', async () => {
    await runTallyFuzz();
  });
});

// Replay every checked-in crystallized failure forever (ratified condition 2).
describe('intent-fuzz regressions (crystallized failures, replayed forever)', () => {
  const regs = core.listRegressions();
  if (regs.length === 0) {
    it('no regressions checked in yet', () => { expect(true).toBe(true); });
  } else {
    for (const reg of regs) {
      const label = reg.story ? `${reg._file} — ${String(reg.story).split('\n')[0].slice(0, 80)}` : reg._file;
      if (reg._error) {
        it(`fixture ${reg._file} is unreadable`, () => { throw new Error(`corrupt regression fixture ${reg._file}: ${reg._error}`); });
        continue;
      }
      if (reg.model !== MODEL) {
        it(`replays ${label}`, () => { throw new Error(`regression ${reg._file} references model "${reg.model}", not "${MODEL}"`); });
        continue;
      }
      it(`replays ${label}`, async () => {
        await fc.assert(buildTallyProperty(), { seed: reg.seed as number, path: reg.path as string, numRuns: 1, endOnFailure: true });
      });
    }
  }
});
