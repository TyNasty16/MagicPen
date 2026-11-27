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
const optStr = (r: Record<string, unknown>, k: string) => r[k] === undefined || str(r, k);
/** A finite number within [min, max]. */
const num = (r: Record<string, unknown>, k: string, min = 0, max = 1e6) => typeof r[k] === 'number' && Number.isFinite(r[k]) && (r[k] as number) >= min && (r[k] as number) <= max;
const optNum = (r: Record<string, unknown>, k: string, min = 0, max = 1e6) => r[k] === undefined || num(r, k, min, max);
const oneOf = (r: Record<string, unknown>, k: string, list: readonly string[]) => typeof r[k] === 'string' && list.includes(r[k] as string);
const optOneOf = (r: Record<string, unknown>, k: string, list: readonly string[]) => r[k] === undefined || oneOf(r, k, list);
/** A real calendar date "YYYY-MM-DD" (2026-13-45 fails). */
export function isCalendarDay(v: unknown): boolean {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}
const day = (r: Record<string, unknown>, k: string) => isCalendarDay(r[k]);
/** A date-time Steady wrote: starts with a real calendar day and parses. */
const dateTime = (r: Record<string, unknown>, k: string) => str(r, k) && isCalendarDay((r[k] as string).slice(0, 10)) && !Number.isNaN(Date.parse(r[k] as string));
const optDateTime = (r: Record<string, unknown>, k: string) => r[k] === undefined || dateTime(r, k);
/** Row ids are optional on new rows; when present, a positive whole number. */
const id = (r: Record<string, unknown>) => r.id === undefined || (Number.isSafeInteger(r.id) && (r.id as number) > 0);
const MAX_ROWS = 200_000;

const SITES = ['abdomen-left', 'abdomen-right', 'thigh-left', 'thigh-right', 'arm-left', 'arm-right'] as const;
const DRUGS = ['wegovy', 'ozempic'] as const;
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack', 'none'] as const;
const MEASURES = ['waistCm', 'hipsCm', 'chestCm', 'neckCm', 'upperArmCm', 'thighCm'] as const;
const food = (r: Record<string, unknown>) =>
  str(r, 'name') && num(r, 'kcal', 0, 100_000) && num(r, 'proteinG', 0, 10_000) && optNum(r, 'carbsG', 0, 10_000) && optNum(r, 'fatG', 0, 10_000) && optNum(r, 'fiberG', 0, 10_000);

const optBool = (r: Record<string, unknown>, k: string) => r[k] === undefined || typeof r[k] === 'boolean';
/** Milestone record and switches on the profile (workflow 12), all optional. */
const milestoneFields = (r: Record<string, unknown>) =>
  optBool(r, 'showMilestones') && optBool(r, 'showWeightMilestones') && optNum(r, 'milestoneStartKg', 0, 1000) &&
  (r.milestonesEarned === undefined ||
    (Array.isArray(r.milestonesEarned) && r.milestonesEarned.length <= 500 &&
      r.milestonesEarned.every((m) => isObj(m) && typeof m.key === 'string' && isCalendarDay(m.on) && (m.run === undefined || isCalendarDay(m.run)))));

// What each table's rows must look like to be restored safely: the fields the app relies on, with types, allowed values and sane ranges.
const ROW_CHECKS: Record<BackupTable, (r: Record<string, unknown>) => boolean> = {
  profile: (r) =>
    r.id === 'me' && oneOf(r, 'units', ['imperial', 'metric']) && optNum(r, 'heightCm', 30, 300) && optNum(r, 'startWeightKg', 20, 500) &&
    optNum(r, 'goalWeightKg', 20, 500) && optNum(r, 'birthYear', 1900, 2100) && (r.injectionWeekday === undefined || (Number.isInteger(r.injectionWeekday) && num(r, 'injectionWeekday', 0, 6))) &&
    optNum(r, 'proteinPerKg', 0, 10) && optOneOf(r, 'drug', DRUGS) && optStr(r, 'name') && optStr(r, 'questionsDraft') && optDateTime(r, 'disclaimerAcceptedAt') &&
    (r.overrides === undefined || isObj(r.overrides)) && milestoneFields(r),
  injections: (r) => id(r) && dateTime(r, 'datetime') && num(r, 'doseMg', 0, 100) && oneOf(r, 'site', SITES) && optOneOf(r, 'drug', DRUGS) && optStr(r, 'notes'),
  weights: (r) => id(r) && day(r, 'date') && num(r, 'weightKg', 20, 500),
  measurements: (r) => id(r) && day(r, 'date') && MEASURES.every((k) => optNum(r, k, 0, 500)) && optNum(r, 'bodyFatPct', 0, 100),
  symptoms: (r) => id(r) && dateTime(r, 'datetime') && str(r, 'type') && Number.isInteger(r.severity) && num(r, 'severity', 1, 5) && optStr(r, 'notes'),
  foods: (r) => id(r) && food(r),
  foodLog: (r) => id(r) && day(r, 'date') && food(r) && num(r, 'servings', 0, 1000) && optOneOf(r, 'meal', MEALS),
  water: (r) => id(r) && day(r, 'date') && num(r, 'ml', 0, 50_000),
  dayMarks: (r) => day(r, 'date') && r.kind === 'low-intake',
  appointments: (r) => id(r) && day(r, 'date') && optStr(r, 'who') && optStr(r, 'notes') && optStr(r, 'questions'),
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
