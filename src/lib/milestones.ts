// Milestone celebrations (workflow 12). Pure: works out which milestones the owner's own logs have reached,
// which are new, and the words to show. Never reads a dose. Never mentions a break, a miss or what comes next.

import { addDays, dayKey, fromDayKey } from './dates';

export interface MilestoneRecord { key: string; on: string; run?: string }

export interface MilestoneData {
  injections: { datetime: string }[];
  weights: { date: string; weightKg: number }[];
  symptoms: { datetime: string }[];
  foodLog: { date: string }[];
  water: { date: string }[];
}
export interface MilestoneProfile { units?: 'imperial' | 'metric'; startWeightKg?: number; injectionWeekday?: number }

export type Category = 'injections' | 'weighins' | 'days' | 'time' | 'weight';
export type SeriesId = 'inj' | 'sched' | 'wiw' | 'wis' | 'days' | 'dstreak' | 'time' | 'wabs' | 'wpct';

/** One reached step: `n` is the threshold, `step` its place in the ladder (1 = first), `run` the start of a streak run. */
export interface Earned { series: SeriesId; n: number; step: number; key: string; run?: string; weight?: boolean }

const KG_PER_LB = 0.45359237;

// Ladders: the listed steps, then one every `every`. Streak gaps always widen (owner, 2026-11-27); no end to any list.
export const LADDERS: Record<SeriesId, { base: number[]; every: number }> = {
  inj: { base: [1, 4, 8, 12, 26, 52, 78, 104], every: 52 },
  sched: { base: [3, 7, 12, 26, 52, 104, 208], every: 52 },
  wiw: { base: [1, 4, 8, 12, 26, 52], every: 26 },
  wis: { base: [2, 4, 7, 12, 26, 52, 104, 208], every: 52 },
  days: { base: [1, 10, 25, 50, 100, 150, 200, 300, 365, 500, 730], every: 365 },
  dstreak: { base: [3, 7, 14, 30, 60, 100, 180, 365, 730, 1460], every: 365 },
  time: { base: [1, 3, 6, 9, 12, 18, 24], every: 12 },
  wabs: { base: [], every: 5 }, // every 5 lb (every 2 kg for metric profiles: see `weightStep`)
  wpct: { base: [], every: 5 }, // 5%, 10%, 15%, … of the starting weight
};
const STREAKS: SeriesId[] = ['sched', 'wis', 'dstreak'];
export const CATEGORY: Record<SeriesId, Category> = { inj: 'injections', sched: 'injections', wiw: 'weighins', wis: 'weighins', days: 'days', dstreak: 'days', time: 'time', wabs: 'weight', wpct: 'weight' };

/** Steps of a ladder reached by `value`, each with its place in the ladder. */
export function stepsUpTo(base: number[], every: number, value: number, first = every): { n: number; step: number }[] {
  const out: { n: number; step: number }[] = [];
  base.forEach((n, i) => n <= value && out.push({ n, step: i + 1 }));
  let n = base.length ? base[base.length - 1] + every : first;
  while (n <= value) {
    out.push({ n, step: out.length + 1 });
    n += every;
  }
  return out;
}

// Owner-approved titles, by place in the ladder (step 10 and beyond: HISTORY MADE). Owner wants to revisit them (I-73).
export const TITLES = ['NICE START', 'ON A ROLL', 'HEATING UP', 'LOCKED IN', 'ON FIRE', 'NO STOPPING YOU', 'CRUSHING IT', 'LEGENDARY', 'HALL OF FAME', 'HISTORY MADE'];
export const titleFor = (step: number) => TITLES[Math.min(Math.max(step, 1), TITLES.length) - 1];

const localDay = (iso: string) => dayKey(new Date(iso));
/** Monday of the week holding `day` (weeks run Monday to Sunday). */
export const mondayOf = (day: string) => { const d = fromDayKey(day); return dayKey(addDays(d, -((d.getDay() + 6) % 7))); };
/** Start of the schedule week (7 days from the injection weekday) holding `day`. */
export const scheduleWeekOf = (day: string, weekday: number) => { const d = fromDayKey(day); return dayKey(addDays(d, -((d.getDay() - weekday + 7) % 7))); };

/** Calendar months from `from` to `to` (Jan 31 + 1 month = Feb 28/29). */
export function monthsSince(from: string, to: string): number {
  const a = fromDayKey(from), b = fromDayKey(to);
  let m = (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
  const anniversary = (k: number) => { const y = a.getFullYear() + Math.floor((a.getMonth() + k) / 12), mo = (a.getMonth() + k) % 12; return new Date(y, mo, Math.min(a.getDate(), new Date(y, mo + 1, 0).getDate())); };
  if (m > 0 && anniversary(m) > b) m--;
  return Math.max(0, m);
}

/** The current run of consecutive periods ending at `current` (or the one before, if `current` has nothing yet). */
function currentRun(periods: Set<string>, current: string, prev: (p: string) => string): { length: number; start?: string } {
  let p = periods.has(current) ? current : prev(current);
  if (!periods.has(p)) return { length: 0 };
  let length = 0, start = p;
  while (periods.has(p)) { length++; start = p; p = prev(p); }
  return { length, start };
}

/** Lost weight in display units, rounded to 0.1 (so 5.0 counts and 4.9 does not). Never negative. */
export function weightLost(p: MilestoneProfile, weights: MilestoneData['weights']): { abs: number; pct: number } | null {
  if (!p.startWeightKg || !weights.length) return null;
  const lowest = Math.min(...weights.map((w) => w.weightKg));
  const lostKg = Math.max(0, p.startWeightKg - lowest);
  const abs = Math.round((p.units === 'metric' ? lostKg : lostKg / KG_PER_LB) * 10) / 10;
  const pct = Math.round((lostKg / p.startWeightKg) * 1000) / 10;
  return { abs, pct };
}
const weightStep = (p: MilestoneProfile) => (p.units === 'metric' ? 2 : 5);

/** Everything the logs have reached today. Streak steps only for the current run. */
export function computeEarned(data: MilestoneData, p: MilestoneProfile, today: string): Earned[] {
  const out: Earned[] = [];
  const add = (series: SeriesId, value: number, run?: string, every?: number) => {
    const L = LADDERS[series];
    for (const { n, step } of stepsUpTo(L.base, every ?? L.every, value)) out.push({ series, n, step, key: `${series}-${n}`, run, weight: series === 'wabs' || series === 'wpct' });
  };
  const injDays = data.injections.map((i) => localDay(i.datetime)).filter((d) => d <= today);
  add('inj', injDays.length);

  if (p.injectionWeekday !== undefined && injDays.length) {
    const weekday = p.injectionWeekday;
    const weeks = new Set(injDays.map((d) => scheduleWeekOf(d, weekday)));
    const r = currentRun(weeks, scheduleWeekOf(today, weekday), (w) => dayKey(addDays(fromDayKey(w), -7)));
    if (r.length && r.start) {
      // Run key: the first injection inside the run, so changing the injection day later does not re-fire.
      const firstInRun = injDays.filter((d) => d >= r.start!).sort()[0];
      add('sched', r.length, firstInRun);
    }
  }

  const wDays = data.weights.map((w) => w.date).filter((d) => d <= today);
  const wWeeks = new Set(wDays.map(mondayOf));
  add('wiw', wWeeks.size);
  const wr = currentRun(wWeeks, mondayOf(today), (w) => dayKey(addDays(fromDayKey(w), -7)));
  if (wr.length) add('wis', wr.length, wr.start);

  const logged = new Set([...injDays, ...wDays, ...data.symptoms.map((s) => localDay(s.datetime)), ...data.foodLog.map((f) => f.date), ...data.water.map((w) => w.date)].filter((d) => d <= today));
  add('days', logged.size);
  const dr = currentRun(logged, today, (d) => dayKey(addDays(fromDayKey(d), -1)));
  if (dr.length) add('dstreak', dr.length, dr.start);

  if (injDays.length) add('time', monthsSince([...injDays].sort()[0], today));

  const lost = weightLost(p, data.weights);
  if (lost) {
    add('wabs', lost.abs, undefined, weightStep(p));
    add('wpct', lost.pct);
  }
  return out;
}

/** True when `e` is already in the record. A streak step counts only if recorded inside the current run (so back-filling never re-fires it, and a new run can earn it again). */
export function isRecorded(e: Earned, record: MilestoneRecord[]): boolean {
  return record.some((r) => r.key === e.key && (!STREAKS.includes(e.series) || (!!r.run && !!e.run && r.run >= e.run)));
}

/** Combines two records by key and run, keeping the earliest date. */
export function mergeRecords(a: MilestoneRecord[] = [], b: MilestoneRecord[] = []): MilestoneRecord[] {
  const m = new Map<string, MilestoneRecord>();
  for (const r of [...a, ...b]) {
    const k = `${r.key}@${r.run ?? ''}`;
    const old = m.get(k);
    if (!old || r.on < old.on) m.set(k, r);
  }
  return [...m.values()];
}

export const MAX_RECORDS = 500;
/** Keeps the record within its cap: ended streak runs go first, oldest first. */
export function capRecords(record: MilestoneRecord[]): MilestoneRecord[] {
  if (record.length <= MAX_RECORDS) return record;
  const streaky = record.filter((r) => r.run).sort((x, y) => x.on.localeCompare(y.on));
  const drop = new Set(streaky.slice(0, record.length - MAX_RECORDS));
  return record.filter((r) => !drop.has(r));
}

export interface ShowLine { series: SeriesId; n: number; step: number; text: string }

/** Lines to show: within one series only the highest new step. Weight lines can be withheld. */
export function linesToShow(fresh: Earned[], p: MilestoneProfile, withholdWeight: boolean): ShowLine[] {
  const top = new Map<SeriesId, Earned>();
  for (const e of fresh) if (!(withholdWeight && e.weight) && (!top.has(e.series) || e.n > top.get(e.series)!.n)) top.set(e.series, e);
  return [...top.values()].map((e) => ({ series: e.series, n: e.n, step: e.step, text: milestoneText(e.series, e.n, p) }));
}

/** First time the feature runs: one line per category — the running streak's top step if any, else the top total; for weight, the lb/kg or percent line with the higher step. */
export function firstArrivalLines(earned: Earned[], p: MilestoneProfile, withholdWeight: boolean): ShowLine[] {
  const top = new Map<SeriesId, Earned>();
  for (const e of earned) if (!(withholdWeight && e.weight) && (!top.has(e.series) || e.n > top.get(e.series)!.n)) top.set(e.series, e);
  const pick = (streak: SeriesId | null, total: SeriesId) => (streak && top.get(streak)) || top.get(total);
  const w1 = top.get('wabs'), w2 = top.get('wpct');
  const chosen = [pick('sched', 'inj'), pick('wis', 'wiw'), pick('dstreak', 'days'), top.get('time'), w1 && w2 ? (w2.step > w1.step ? w2 : w1) : w1 ?? w2];
  return chosen.filter((e): e is Earned => !!e).map((e) => ({ series: e.series, n: e.n, step: e.step, text: milestoneText(e.series, e.n, p) }));
}

// Owner-approved wording (workflow 12). Factual, never about doses, never about what comes next.
export function milestoneText(series: SeriesId, n: number, p: MilestoneProfile): string {
  switch (series) {
    case 'inj': return n === 1 ? 'First injection logged' : `${n} injections logged`;
    case 'sched': return `${n} weeks in a row logging your injection on schedule`;
    case 'wiw': return n === 1 ? '1 week with a weigh-in' : `${n} weeks with a weigh-in`;
    case 'wis': return `${n} weeks in a row with a weigh-in`;
    case 'days': return n === 1 ? 'First day logged' : `${n} days with something logged`;
    case 'dstreak': return `${n} days in a row with something logged`;
    case 'time': return n % 12 === 0 ? (n === 12 ? '1 year since your first injection' : `${n / 12} years since your first injection`) : n === 1 ? '1 month since your first injection' : `${n} months since your first injection`;
    case 'wabs': return `${n} ${p.units === 'metric' ? 'kg' : 'lb'} lost since your starting weight`;
    case 'wpct': return `${n}% of your starting weight lost`;
  }
}

export const toRecords = (es: Earned[], today: string): MilestoneRecord[] => es.map((e) => (e.run ? { key: e.key, on: today, run: e.run } : { key: e.key, on: today }));
