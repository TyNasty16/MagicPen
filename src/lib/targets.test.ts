import { describe, expect, it } from 'vitest';
import { ageFromBirthYear, bmr, calculateTargets, tdee, type TargetInput } from './targets';

const man: TargetInput = { weightKg: 100, goalWeightKg: 80, heightCm: 180, age: 40, sex: 'male', activity: 'light' };

describe('bmr', () => {
  it('matches hand-computed Mifflin-St Jeor values', () => {
    expect(bmr(man)).toBe(1930);
    expect(bmr({ weightKg: 70, heightCm: 165, age: 30, sex: 'female' })).toBeCloseTo(1420.25, 2);
  });
});

describe('tdee', () => {
  it.each([
    ['sedentary', 2316],
    ['light', 2653.75],
    ['moderate', 2991.5],
    ['active', 3329.25],
  ] as const)('applies the %s factor', (activity, expected) => {
    expect(tdee({ ...man, activity })).toBeCloseTo(expected, 2);
  });
});

describe('calculateTargets', () => {
  it('matches the workflow example (20% deficit)', () => {
    expect(calculateTargets(man).calories).toBe(2123);
  });

  it('caps the deficit at 750 kcal', () => {
    const big = { ...man, weightKg: 160, activity: 'active' as const }; // TDEE ≈ 4364
    expect(calculateTargets(big).calories).toBe(Math.round(tdee(big) - 750));
  });

  it('never goes below the calorie floor', () => {
    const small: TargetInput = { weightKg: 45, goalWeightKg: 45, heightCm: 150, age: 70, sex: 'female', activity: 'sedentary' };
    expect(calculateTargets(small).calories).toBe(1200);
    expect(calculateTargets({ ...small, sex: 'male' }).calories).toBe(1500);
  });

  it('bases protein on goal weight, clamped to 1.2–1.6 g/kg', () => {
    expect(calculateTargets(man).proteinG).toBe(112);
    expect(calculateTargets({ ...man, proteinPerKg: 1.2 }).proteinG).toBe(96);
    expect(calculateTargets({ ...man, proteinPerKg: 3 }).proteinG).toBe(128);
  });

  it('macros add up to calories within rounding', () => {
    const t = calculateTargets(man);
    expect(Math.abs(t.proteinG * 4 + t.fatG * 9 + t.carbsG * 4 - t.calories)).toBeLessThanOrEqual(6);
  });

  it('never returns negative carbs', () => {
    const t = calculateTargets({ weightKg: 45, goalWeightKg: 200, heightCm: 150, age: 70, sex: 'female', activity: 'sedentary', proteinPerKg: 1.6 });
    expect(t.carbsG).toBe(0);
  });

  it('sets fiber and water', () => {
    const t = calculateTargets(man);
    expect(t.fiberG).toBe(28);
    expect(t.waterMl).toBe(3000);
  });
});

describe('ageFromBirthYear', () => {
  it('subtracts years', () => {
    expect(ageFromBirthYear(1986, new Date('2026-11-25'))).toBe(40);
  });
});
