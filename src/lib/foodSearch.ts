import type { FoodValues } from '../db/db';

/** One USDA food: name, then kcal, protein, carbs, fat, fiber per 100 g, then household portions [description, grams]. */
export type UsdaFood = [string, number, number, number, number, number, ...[string, number][]];
export interface UsdaFile { source: string; release: string; license: string; foods: UsdaFood[] }

export const MAX_RESULTS = 20;

let cache: Promise<UsdaFood[]> | undefined;
/** Loads the built-in USDA list from the app's own site (cached offline by the service worker). Retries after a failure. */
export function loadFoods(): Promise<UsdaFood[]> {
  cache ??= fetch(`${import.meta.env.BASE_URL}data/usda-foods.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<UsdaFile>;
    })
    .then((f) => f.foods)
    .catch((err) => {
      cache = undefined;
      throw err;
    });
  return cache;
}

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
/** A name word matches a typed word that starts it; a typed plural also matches the singular ("muffins" → "muffin", "berries" → "berry"). */
const matches = (word: string, typed: string) =>
  word.startsWith(typed) ||
  (typed.length > 3 && typed.endsWith('ies') && word.startsWith(typed.slice(0, -3) + 'y')) ||
  (typed.length > 3 && typed.endsWith('es') && word === typed.slice(0, -2)) ||
  (typed.length > 2 && typed.endsWith('s') && word === typed.slice(0, -1));

/**
 * Foods whose name has a word starting with each typed word (any order; plurals match the singular).
 * Ranked: name begins with the first typed word, then shorter names, then A–Z.
 */
export function searchFoods(foods: UsdaFood[], query: string, max = MAX_RESULTS): UsdaFood[] {
  const q = words(query);
  if (q.length === 0) return [];
  const hits: { f: UsdaFood; rank: number }[] = [];
  for (const f of foods) {
    const w = words(f[0]);
    if (q.every((x) => w.some((y) => matches(y, x)))) hits.push({ f, rank: matches(w[0], q[0]) ? 0 : 1 });
  }
  hits.sort((a, b) => a.rank - b.rank || a.f[0].length - b.f[0].length || a.f[0].localeCompare(b.f[0]));
  return hits.slice(0, max).map((h) => h.f);
}

/**
 * A food chosen from a search (built-in USDA list or Open Food Facts), ready for the portion picker.
 * Values are per 100 g, or per 100 ml for drinks (`unit: 'ml'`); a value OFF does not list is left undefined.
 */
export interface Pickable {
  name: string;
  unit: 'g' | 'ml';
  per100: { kcal: number; proteinG: number; carbsG?: number; fatG?: number; fiberG?: number };
  portions: [string, number][]; // [label, amount in `unit`], always ending with "100 g" / "100 ml"
}

/** Food values with any number OFF does not list left undefined (the form shows those boxes empty). */
export type PickedValues = Omit<FoodValues, 'carbsG' | 'fatG'> & { carbsG?: number; fatG?: number };

/** True when a portion label already states this amount as a whole number with its unit, e.g. "1 muffin (99 g)" for 99 (not "1 bar (140 g)" for 40). */
export function statesAmount(label: string, amount: number, unit: 'g' | 'ml'): boolean {
  const n = String(Math.round(amount * 10) / 10).replace('.', '\\.');
  return new RegExp(`(^|[^\\d.])${n}\\s*${unit}\\b`, 'i').test(label);
}

export const fromUsda = (f: UsdaFood): Pickable => ({
  name: f[0],
  unit: 'g',
  per100: { kcal: f[1], proteinG: f[2], carbsG: f[3], fatG: f[4], fiberG: f[5] },
  portions: portionsOf(f),
});

/** Household portions of a USDA food, plus "100 g". */
export const portionsOf = (f: UsdaFood): [string, number][] => [...(f.slice(6) as [string, number][]), ['100 g', 100]];

/** Nutrition for `amount` g (or ml) of a food, rounded to 1 decimal; null for a non-positive or invalid amount. */
export function pickValues(p: Pickable, amount: number, portionLabel?: string): PickedValues | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const r = (per100?: number) => (per100 === undefined ? undefined : Math.round((per100 * amount) / 10) / 10);
  const a = Math.round(amount * 10) / 10;
  const base = `100 ${p.unit}`;
  const label = portionLabel && portionLabel !== base ? portionLabel : undefined;
  return {
    name: p.name,
    // Keep the label as given when it already states the amount (e.g. "1 bottle (414 ml)").
    servingDesc: label ? (statesAmount(label, a, p.unit) ? label : `${label} (${a} ${p.unit})`) : `${a} ${p.unit}`,
    kcal: r(p.per100.kcal)!,
    proteinG: r(p.per100.proteinG)!,
    carbsG: r(p.per100.carbsG),
    fatG: r(p.per100.fatG),
    fiberG: r(p.per100.fiberG),
  };
}

/** Nutrition for `grams` of a USDA food (see `pickValues`). */
export const portionValues = (f: UsdaFood, grams: number, portionLabel?: string) => pickValues(fromUsda(f), grams, portionLabel) as FoodValues | null;
