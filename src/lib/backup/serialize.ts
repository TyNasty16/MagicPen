// What goes in a backup and how it's checked before a restore (workflow 10a). Pure.
// Every table except photos and the backup state itself; plus the screen preferences Reset also clears.

export const BACKUP_TABLES = ['profile', 'injections', 'weights', 'measurements', 'symptoms', 'foods', 'foodLog', 'water', 'dayMarks', 'appointments'] as const;
export type BackupTable = (typeof BACKUP_TABLES)[number];
export type Tables = Record<BackupTable, Record<string, unknown>[]>;

export interface Payload {
  format: 1;
  schemaVersion: number;
  appVersion: string;
  createdAt: string;
  tables: Tables;
  prefs: Record<string, string>;
}

/** Rows that count as "entries" for the empty-data guard. */
const ENTRY_TABLES: BackupTable[] = ['injections', 'weights', 'measurements', 'symptoms', 'foodLog', 'water', 'appointments'];
export const entryRows = (t: Tables) => ENTRY_TABLES.reduce((n, k) => n + t[k].length, 0);

export function buildPayload(tables: Tables, prefs: Record<string, string>, schemaVersion: number, now: Date): Payload {
  return { format: 1, schemaVersion, appVersion: 'steady-web', createdAt: now.toISOString(), tables, prefs };
}

/** SHA-256 of the tables, to tell whether anything changed since the last backup. Order-stable. */
export async function fingerprint(tables: Tables): Promise<string> {
  const sorted = Object.fromEntries(BACKUP_TABLES.map((k) => [k, tables[k]]));
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(sorted)));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (r: Record<string, unknown>, k: string) => typeof r[k] === 'string';
const num = (r: Record<string, unknown>, k: string) => typeof r[k] === 'number' && Number.isFinite(r[k]);
const optNum = (r: Record<string, unknown>, k: string) => r[k] === undefined || num(r, k);
const day = (r: Record<string, unknown>, k: string) => str(r, k) && /^\d{4}-\d{2}-\d{2}$/.test(r[k] as string);
const MAX_ROWS = 200_000;

// The fields each table must have to be restored safely (enough to catch a wrong or damaged file).
const ROW_CHECKS: Record<BackupTable, (r: Record<string, unknown>) => boolean> = {
  profile: (r) => r.id === 'me' && (r.units === 'imperial' || r.units === 'metric'),
  injections: (r) => str(r, 'datetime') && num(r, 'doseMg') && str(r, 'site'),
  weights: (r) => day(r, 'date') && num(r, 'weightKg'),
  measurements: (r) => day(r, 'date'),
  symptoms: (r) => str(r, 'datetime') && str(r, 'type') && num(r, 'severity'),
  foods: (r) => str(r, 'name') && num(r, 'kcal') && num(r, 'proteinG'),
  foodLog: (r) => day(r, 'date') && str(r, 'name') && num(r, 'kcal') && num(r, 'proteinG') && num(r, 'servings'),
  water: (r) => day(r, 'date') && num(r, 'ml'),
  dayMarks: (r) => day(r, 'date'),
  appointments: (r) => day(r, 'date') && optNum(r, 'id'),
};

/** The backup's contents if every table and row passes; throws 'unreadable' / 'newer' otherwise. Nothing is changed. */
export function validatePayload(raw: unknown, maxSchema: number): Payload {
  if (!isObj(raw) || raw.format !== 1 || typeof raw.schemaVersion !== 'number' || !isObj(raw.tables)) throw new Error('unreadable');
  if (raw.schemaVersion > maxSchema) throw new Error('newer');
  const tables = {} as Tables;
  for (const k of BACKUP_TABLES) {
    const rows = (raw.tables as Record<string, unknown>)[k]; // every table must be there: a damaged file must never empty a table
    if (!Array.isArray(rows) || rows.length > MAX_ROWS || !rows.every((r) => isObj(r) && ROW_CHECKS[k](r))) throw new Error('unreadable');
    tables[k] = rows as Record<string, unknown>[];
  }
  if (tables.profile.length > 1) throw new Error('unreadable');
  const prefs: Record<string, string> = {};
  if (isObj(raw.prefs)) for (const [k, v] of Object.entries(raw.prefs)) if (k.startsWith('steady.') && typeof v === 'string') prefs[k] = v;
  return { format: 1, schemaVersion: raw.schemaVersion, appVersion: String(raw.appVersion ?? ''), createdAt: String(raw.createdAt ?? ''), tables, prefs };
}

/** Counts and the last entry date, for the restore confirmation. */
export function summarize(p: Payload) {
  const dates = [
    ...p.tables.injections.map((r) => String(r.datetime).slice(0, 10)), ...p.tables.weights.map((r) => String(r.date)),
    ...p.tables.measurements.map((r) => String(r.date)), ...p.tables.symptoms.map((r) => String(r.datetime).slice(0, 10)),
    ...p.tables.foodLog.map((r) => String(r.date)), ...p.tables.appointments.map((r) => String(r.date)),
  ].sort();
  return {
    injections: p.tables.injections.length, weighIns: p.tables.weights.length, measurements: p.tables.measurements.length,
    symptoms: p.tables.symptoms.length, food: p.tables.foodLog.length, appointments: p.tables.appointments.length, lastEntry: dates.at(-1),
  };
}
