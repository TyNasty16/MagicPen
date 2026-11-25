import type { FoodLogEntry, FoodValues, Meal } from '../db/db';
import { addDays, dayKey, fromDayKey } from './dates';

export const MEALS: { id: Meal; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
  { id: 'none', label: 'None' },
];
/** Display order on the Food screen; "none" is listed as "Other". */
export const MEAL_GROUPS: { id: Meal; label: string }[] = [...MEALS.slice(0, 4), { id: 'none', label: 'Other' }];

export const SERVINGS_MIN = 0.1;
export const SERVINGS_MAX = 20;

export interface Totals {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}
const ZERO: Totals = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };

/** One entry's nutrition: per-serving values × servings, unrounded. */
export function entryTotals(e: FoodValues & { servings: number }): Totals {
  return { kcal: e.kcal * e.servings, proteinG: e.proteinG * e.servings, carbsG: e.carbsG * e.servings, fatG: e.fatG * e.servings, fiberG: (e.fiberG ?? 0) * e.servings };
}

/** Sum of entries, unrounded (round once, for display). */
export function dayTotals(entries: (FoodValues & { servings: number })[]): Totals {
  return entries.map(entryTotals).reduce((a, t) => ({ kcal: a.kcal + t.kcal, proteinG: a.proteinG + t.proteinG, carbsG: a.carbsG + t.carbsG, fatG: a.fatG + t.fatG, fiberG: a.fiberG + t.fiberG }), ZERO);
}

/** Problems with a food form, keyed by field; empty when valid. kcal 0 is allowed. */
export function validateFood(v: { name: string; kcal?: number; proteinG?: number; carbsG?: number; fatG?: number; fiberG?: number; servings?: number }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.name.trim()) e.name = 'Enter a name.';
  for (const k of ['kcal', 'proteinG', 'carbsG', 'fatG'] as const) {
    const n = v[k];
    if (n === undefined || !Number.isFinite(n) || n < 0) e[k] = 'Enter a number (0 or more).';
  }
  if (v.fiberG !== undefined && (!Number.isFinite(v.fiberG) || v.fiberG < 0)) e.fiberG = 'Enter a number (0 or more).';
  const s = v.servings;
  if (s === undefined || !Number.isFinite(s) || s < SERVINGS_MIN || s > SERVINGS_MAX) e.servings = `Enter ${SERVINGS_MIN}–${SERVINGS_MAX}.`;
  return e;
}

/**
 * Protein over the 7 completed days before `today` (today is still in progress, so it is left out):
 * how many days were logged (at least one food entry, or marked "barely ate") and how many of those
 * were below the target. Days with nothing logged are skipped.
 */
export function proteinLowDays(entries: Pick<FoodLogEntry, 'date' | 'proteinG' | 'servings'>[], markedDays: string[], target: number, today: Date): { low: number; logged: number } {
  const from = dayKey(addDays(today, -7));
  const to = dayKey(addDays(today, -1));
  const protein = new Map<string, number>();
  for (const d of markedDays) if (d >= from && d <= to) protein.set(d, 0);
  for (const e of entries) if (e.date >= from && e.date <= to) protein.set(e.date, (protein.get(e.date) ?? 0) + e.proteinG * e.servings);
  let low = 0;
  for (const g of protein.values()) if (g < target) low++;
  return { low, logged: protein.size };
}

/** Factual sentence about protein, or null when there is nothing to report (fewer than 3 logged days, or none below target). */
export function proteinNote(low: number, logged: number): string | null {
  if (logged < 3 || low === 0) return null;
  return `Protein below target on ${low} of the last 7 days (${logged} ${logged === 1 ? 'day' : 'days'} logged)`;
}

/** Day key `n` days from `key`. */
export const shiftDay = (key: string, n: number) => dayKey(addDays(fromDayKey(key), n));

/** Whole number for display, e.g. 1,140. */
export const whole = (n: number) => Math.round(n).toLocaleString();
