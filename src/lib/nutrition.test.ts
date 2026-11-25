import { describe, expect, it } from 'vitest';
import { dayTotals, entryTotals, proteinLowDays, proteinNote, validateFood } from './nutrition';
import { portionValues, portionsOf, searchFoods, type UsdaFood } from './foodSearch';
import { calculatedTargets } from './profileTargets';
import { dayKey } from './dates';

const food = { name: 'Shake', kcal: 200, proteinG: 10, carbsG: 20, fatG: 5 };

describe('entryTotals / dayTotals', () => {
  it('multiplies per-serving values by servings and keeps precision', () => {
    expect(entryTotals({ ...food, servings: 1.5 })).toEqual({ kcal: 300, proteinG: 15, carbsG: 30, fatG: 7.5, fiberG: 0 });
    expect(entryTotals({ ...food, servings: 0.5 }).kcal).toBe(100);
    expect(entryTotals({ ...food, servings: 2.25 }).fatG).toBe(11.25);
    expect(entryTotals({ ...food, fiberG: 3, servings: 2 }).fiberG).toBe(6);
  });
  it('sums entries; an empty day is zero', () => {
    expect(dayTotals([{ ...food, servings: 1 }, { ...food, servings: 0.5 }]).proteinG).toBe(15);
    expect(dayTotals([])).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 });
  });
});

describe('validateFood', () => {
  const ok = { ...food, servings: 1 };
  it.each([
    ['valid', ok, []],
    ['kcal 0 allowed', { ...ok, kcal: 0 }, []],
    ['servings 20 allowed', { ...ok, servings: 20 }, []],
    ['empty name', { ...ok, name: '  ' }, ['name']],
    ['negative protein', { ...ok, proteinG: -1 }, ['proteinG']],
    ['missing fat', { ...ok, fatG: undefined }, ['fatG']],
    ['NaN carbs', { ...ok, carbsG: NaN }, ['carbsG']],
    ['servings 0', { ...ok, servings: 0 }, ['servings']],
    ['servings negative', { ...ok, servings: -1 }, ['servings']],
    ['servings 20.1', { ...ok, servings: 20.1 }, ['servings']],
  ])('%s', (_, input, keys) => expect(Object.keys(validateFood(input))).toEqual(keys));
});

describe('protein note', () => {
  const today = new Date(2026, 10, 25);
  const day = (n: number) => dayKey(new Date(2026, 10, 25 - n));
  const e = (n: number, proteinG: number, servings = 1) => ({ date: day(n), proteinG, servings });
  it('counts low days among logged days in the 7 days before today (days without entries skipped)', () => {
    const entries = [e(7, 50), e(1, 120), e(2, 30), e(2, 30), e(3, 100, 0.5), e(5, 112)];
    // day 7: 50 low; day 1: 120 ok; day 2: 60 low; day 3: 50 low; day 5: 112 = target, not low
    expect(proteinLowDays(entries, [], 112, today)).toEqual({ low: 3, logged: 5 });
  });
  it('leaves out today (still in progress), older days and future days', () => {
    expect(proteinLowDays([e(0, 10), e(8, 10), e(-1, 10)], [day(0)], 112, today)).toEqual({ low: 0, logged: 0 });
  });
  it('a "barely ate" day counts as logged, using what was logged that day', () => {
    expect(proteinLowDays([e(1, 120)], [day(2), day(1)], 112, today)).toEqual({ low: 1, logged: 2 });
  });
  it('local-day bucketing: day keys follow the local calendar across midnight and DST', () => {
    expect(dayKey(new Date(2026, 2, 7, 23, 30))).toBe('2026-03-07');
    expect(dayKey(new Date(2026, 2, 8, 0, 30))).toBe('2026-03-08');
    const dstWeek = new Date(2026, 2, 10); // US DST began 8 Mar 2026; window is 3–9 Mar
    expect(proteinLowDays([{ date: '2026-03-03', proteinG: 1, servings: 1 }, { date: '2026-03-02', proteinG: 1, servings: 1 }], [], 50, dstWeek)).toEqual({ low: 1, logged: 1 });
  });
  it('sentence is factual, needs 3 logged days and at least one low day', () => {
    expect(proteinNote(4, 5)).toBe('Protein below target on 4 of the last 7 days (5 days logged)');
    expect(proteinNote(2, 2)).toBeNull();
    expect(proteinNote(0, 7)).toBeNull();
    expect(proteinNote(4, 5)).not.toMatch(/dose|should|eat more|increase|skip|try|need/i);
  });
});

describe('USDA search and portions', () => {
  const muffin: UsdaFood = ['Muffin, chocolate chip', 402, 5.8, 55.4, 19, 1.8, ['1 large', 180], ['1 medium', 130]];
  const list: UsdaFood[] = [
    ['Pie, oatmeal', 400, 4, 50, 20, 2],
    ['Oatmeal, NFS', 70, 2.5, 12, 1.5, 1.7],
    ['Oatmeal, made with milk, sweetened', 110, 4, 18, 2.5, 1.5],
    muffin,
    ['Banana, raw', 89, 1.1, 22.8, 0.3, 2.6, ['1 medium', 118]],
    ['Eggplant, cooked', 35, 0.8, 8.7, 0.2, 2.5],
  ];
  it.each([
    ['chocolate chip muffin', ['Muffin, chocolate chip']],
    ['MUFFIN, Chocolate', ['Muffin, chocolate chip']],
    ['oatmeal', ['Oatmeal, NFS', 'Oatmeal, made with milk, sweetened', 'Pie, oatmeal']],
    ['ban', ['Banana, raw']],
    ['pizza', []],
    ['   ', []],
  ])('"%s"', (q, names) => expect(searchFoods(list, q).map((f) => f[0])).toEqual(names));
  it('returns at most the limit', () => {
    const many: UsdaFood[] = Array.from({ length: 30 }, (_, i) => [`Rice ${i}`, 1, 1, 1, 1, 1]);
    expect(searchFoods(many, 'rice')).toHaveLength(20);
  });
  it('scales per-100 g values to a portion; 0 g is rejected', () => {
    expect(portionValues(muffin, 130, '1 medium')).toEqual({ name: 'Muffin, chocolate chip', servingDesc: '1 medium (130 g)', kcal: 522.6, proteinG: 7.5, carbsG: 72, fatG: 24.7, fiberG: 2.3 });
    expect(portionValues(muffin, 100, '100 g')?.servingDesc).toBe('100 g');
    expect(portionValues(muffin, 0)).toBeNull();
    expect(portionsOf(muffin).at(-1)).toEqual(['100 g', 100]);
  });
});

describe('targets follow the latest weigh-in', () => {
  const p = { startWeightKg: 100, goalWeightKg: 80, heightCm: 180, birthYear: 1986, sex: 'male' as const, activity: 'light' as const };
  it('uses the latest weight for calories and water, not protein', () => {
    const start = calculatedTargets(p)!;
    const latest = calculatedTargets(p, 90)!;
    expect(latest.calories).toBeLessThan(start.calories);
    expect(latest.waterMl).toBe(2700);
    expect(latest.proteinG).toBe(start.proteinG);
  });
  it('falls back to the starting weight with no weigh-in', () => {
    expect(calculatedTargets(p, undefined)).toEqual(calculatedTargets(p));
    expect(calculatedTargets(p)!.waterMl).toBe(3000);
  });
});
