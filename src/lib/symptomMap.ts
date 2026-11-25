// Symptom map (Workflow 04c): pure, deterministic, descriptive only — no advice.
import type { Injection, Symptom } from '../db/db';
import { addDays, dayKey, daysBetween, fromDayKey, startOfDay } from './dates';

export const MAP_DAYS = 7;
export type Trend = 'better' | 'same' | 'worse' | 'first' | 'no-earlier';

/** Colour steps 0 (none) → 5 (severe); text colour chosen so numbers are ≥4.5:1 on every step. Step 5 is much darker so 4 and 5 read apart (04d). */
export const RAMP = ['#f3ebe3', '#efc4b0', '#e6a98f', '#d6866b', '#b0553d', '#5a2318'];
export const rampText = (step: number) => (step >= 4 ? '#ffffff' : '#3a2a22');
export const TREND_DEAD_BAND = 0.5;
const STALE_DAYS = 3; // a symptom needs an entry today or in the 2 days before to get a row

type Entry = Pick<Symptom, 'datetime' | 'type' | 'severity'>;
const counted = (s: Entry) => s.severity >= 1; // 0/5 entries are ignored (owner decision)
const notFuture = (s: Entry, now: Date) => new Date(s.datetime).getTime() <= now.getTime() + 60_000;

/** Day keys of the window, oldest first, ending today. */
export const windowDays = (n: number, now = new Date()) => Array.from({ length: n }, (_, i) => dayKey(addDays(startOfDay(now), i - n + 1)));

/** Highest severity per day for each symptom type. */
export function dailyMaxByType(symptoms: Entry[], now = new Date()): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const s of symptoms.filter((x) => counted(x) && notFuture(x, now))) {
    const d = dayKey(new Date(s.datetime));
    const m = out.get(s.type) ?? new Map<string, number>();
    m.set(d, Math.max(m.get(d) ?? 0, s.severity));
    out.set(s.type, m);
  }
  return out;
}

/** Types with an entry in the last 3 days (newest entry first), and the others (hidden). */
export function visibleSymptoms(symptoms: Entry[], now = new Date()): { shown: string[]; hidden: string[] } {
  const latest = new Map<string, string>();
  for (const s of symptoms.filter((x) => counted(x) && notFuture(x, now))) if (!latest.has(s.type) || s.datetime > latest.get(s.type)!) latest.set(s.type, s.datetime);
  const from = windowDays(STALE_DAYS, now)[0];
  const sorted = [...latest].sort((a, b) => b[1].localeCompare(a[1]));
  return {
    shown: sorted.filter(([, iso]) => dayKey(new Date(iso)) >= from).map(([t]) => t),
    hidden: sorted.filter(([, iso]) => dayKey(new Date(iso)) < from).map(([t]) => t),
  };
}

/**
 * These 7 days vs the 7 before (average daily max; empty days count 0).
 * Without entries in the previous 7 days: 'first' if never logged before this week, else 'no-earlier'.
 */
export function trendFor(byDay: Map<string, number> | undefined, now = new Date()): Trend {
  const n = MAP_DAYS;
  const cur = windowDays(n, now);
  const prev = windowDays(n, addDays(startOfDay(now), -n));
  const avg = (days: string[]) => days.reduce((s, d) => s + (byDay?.get(d) ?? 0), 0) / days.length;
  if (!prev.some((d) => byDay?.has(d))) return [...(byDay?.keys() ?? [])].some((d) => d < cur[0]) ? 'no-earlier' : 'first';
  const diff = avg(cur) - avg(prev);
  return diff > TREND_DEAD_BAND ? 'worse' : diff < -TREND_DEAD_BAND ? 'better' : 'same';
}

/** Short description of when a symptom shows up in the last 7 days. */
export function timingPhrase(byDay: Map<string, number> | undefined, injectionDays: Set<string>, now = new Date()): string {
  const n = MAP_DAYS;
  const days = windowDays(n, now);
  const active = days.filter((d) => (byDay?.get(d) ?? 0) >= 1);
  if (active.length === 0) return 'none this week';
  if (active.length >= 5) return 'most days';
  let peak = active[0];
  for (const d of active) if ((byDay!.get(d) ?? 0) > (byDay!.get(peak) ?? 0)) peak = d; // earliest wins ties
  if (injectionDays.has(peak)) return 'peaks on shot day';
  if (injectionDays.has(dayKey(addDays(fromDayKey(peak), -1)))) return 'peaks day after shot';
  return days.indexOf(peak) >= n - 3 ? 'late in the week' : 'early in the week';
}

export interface InjectionWeek {
  start: string; // day key of the injection
  doseMg: number;
  average?: number; // average severity of the symptom until the next injection
  count: number;
}

/** Average severity of one symptom per injection week (injections in the last 8 weeks). */
export function injectionWeekAverages(symptoms: Entry[], type: string, injections: Pick<Injection, 'datetime' | 'doseMg'>[], now = new Date(), weeks = 8): InjectionWeek[] {
  const from = addDays(startOfDay(now), -weeks * 7);
  const inj = [...injections].sort((a, b) => a.datetime.localeCompare(b.datetime)).filter((i) => new Date(i.datetime) >= from);
  const mine = symptoms.filter((s) => s.type === type && counted(s) && notFuture(s, now));
  return inj.map((i, k) => {
    const end = inj[k + 1]?.datetime ?? '9999';
    const inWeek = mine.filter((s) => s.datetime >= i.datetime && s.datetime < end);
    const count = inWeek.length;
    return {
      start: dayKey(new Date(i.datetime)),
      doseMg: i.doseMg,
      count,
      average: count ? Math.round((inWeek.reduce((t, s) => t + s.severity, 0) / count) * 10) / 10 : undefined,
    };
  });
}

/** Drill-down trend: last 2 injection weeks vs the 2 before. */
export function weeklyTrend(weeks: InjectionWeek[]): 'milder lately' | 'about the same' | 'stronger lately' | 'not enough data' {
  const avg = (ws: InjectionWeek[]) => {
    const n = ws.reduce((t, w) => t + w.count, 0);
    return n ? ws.reduce((t, w) => t + (w.average ?? 0) * w.count, 0) / n : undefined;
  };
  const recent = avg(weeks.slice(-2));
  const before = avg(weeks.slice(-4, -2));
  if (recent === undefined || before === undefined) return 'not enough data';
  const diff = recent - before;
  return diff > TREND_DEAD_BAND ? 'stronger lately' : diff < -TREND_DEAD_BAND ? 'milder lately' : 'about the same';
}

/** Entries of one type in the last 8 weeks. */
export const recentCount = (symptoms: Entry[], type: string, now = new Date()) =>
  symptoms.filter((s) => s.type === type && counted(s) && notFuture(s, now) && daysBetween(new Date(s.datetime), now) < 56).length;
