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

/**
 * Foods whose name has a word starting with each typed word (any order).
 * Ranked: name begins with the first typed word, then shorter names, then A–Z.
 */
export function searchFoods(foods: UsdaFood[], query: string, max = MAX_RESULTS): UsdaFood[] {
  const q = words(query);
  if (q.length === 0) return [];
  const hits: { f: UsdaFood; rank: number }[] = [];
  for (const f of foods) {
    const w = words(f[0]);
    if (q.every((x) => w.some((y) => y.startsWith(x)))) hits.push({ f, rank: w[0].startsWith(q[0]) ? 0 : 1 });
  }
  hits.sort((a, b) => a.rank - b.rank || a.f[0].length - b.f[0].length || a.f[0].localeCompare(b.f[0]));
  return hits.slice(0, max).map((h) => h.f);
}

/** Household portions of a food, plus "100 g". */
export const portionsOf = (f: UsdaFood): [string, number][] => [...(f.slice(6) as [string, number][]), ['100 g', 100]];

/** Nutrition for `grams` of a food, rounded to 1 decimal; null for a non-positive or invalid weight. */
export function portionValues(f: UsdaFood, grams: number, portionLabel?: string): FoodValues | null {
  if (!Number.isFinite(grams) || grams <= 0) return null;
  const r = (per100: number) => Math.round((per100 * grams) / 10) / 10;
  const g = Math.round(grams * 10) / 10;
  return {
    name: f[0],
    servingDesc: portionLabel && portionLabel !== '100 g' ? `${portionLabel} (${g} g)` : `${g} g`,
    kcal: r(f[1]),
    proteinG: r(f[2]),
    carbsG: r(f[3]),
    fatG: r(f[4]),
    fiberG: r(f[5]),
  };
}
