import type { WeightEntry } from '../db/db';
import { addDays, dayKey, fromDayKey } from './dates';

export interface DailyWeight {
  date: string; // YYYY-MM-DD
  kg: number; // that day's average
}

/** One value per calendar day (days with several weigh-ins are averaged), oldest first. */
export function dailyWeights(entries: Pick<WeightEntry, 'date' | 'weightKg'>[]): DailyWeight[] {
  const byDay = new Map<string, number[]>();
  for (const e of entries) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e.weightKg]);
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, kgs]) => ({ date, kg: kgs.reduce((s, k) => s + k, 0) / kgs.length }));
}

/** For each day with data: average of the days within the 7 calendar days ending that day. */
export function movingAverage7(daily: DailyWeight[]): DailyWeight[] {
  return daily.map(({ date }) => {
    const from = dayKey(addDays(fromDayKey(date), -6));
    const window = daily.filter((d) => d.date >= from && d.date <= date);
    return { date, kg: window.reduce((s, d) => s + d.kg, 0) / window.length };
  });
}

export interface WeightStats {
  currentKg: number;
  lostKg?: number; // negative = gained; undefined without a start weight
  lostPct?: number; // of starting weight, 1 decimal
  toGoalKg?: number; // 0 once the goal is reached; undefined without a goal
}

export function weightStats(daily: DailyWeight[], startKg: number | undefined, goalKg: number | undefined): WeightStats | null {
  if (daily.length === 0) return null;
  const currentKg = daily[daily.length - 1].kg;
  const lostKg = startKg ? startKg - currentKg : undefined;
  return {
    currentKg,
    lostKg,
    lostPct: startKg && lostKg !== undefined ? Math.round((lostKg / startKg) * 1000) / 10 : undefined,
    toGoalKg: goalKg ? Math.max(0, currentKg - goalKg) : undefined,
  };
}

/** The most recent day's weight (averaged if several that day), or undefined with no weigh-ins. */
export const latestWeightKg = (entries: Pick<WeightEntry, 'date' | 'weightKg'>[]) => dailyWeights(entries).at(-1)?.kg;
