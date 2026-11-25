import { describe, expect, it } from 'vitest';
import type { Profile } from '../db/db';
import { effectiveTargets } from './profileTargets';

const base: Profile = {
  id: 'me', units: 'metric', heightCm: 180, startWeightKg: 100, goalWeightKg: 80,
  birthYear: new Date().getFullYear() - 40, sex: 'male', activity: 'light',
};

describe('effectiveTargets', () => {
  it('returns null for an incomplete profile', () => {
    expect(effectiveTargets({ ...base, heightCm: undefined })).toBeNull();
  });
  it('re-balances carbs when protein is overridden', () => {
    const t = effectiveTargets({ ...base, overrides: { proteinG: 130 } })!;
    expect(t.proteinG).toBe(130);
    expect(Math.abs(t.proteinG * 4 + t.fatG * 9 + t.carbsG * 4 - t.calories)).toBeLessThanOrEqual(6);
  });
  it('re-balances fat and carbs when calories are overridden', () => {
    const t = effectiveTargets({ ...base, overrides: { calories: 1800 } })!;
    expect(t.fatG).toBe(Math.round((1800 * 0.275) / 9));
    expect(Math.abs(t.proteinG * 4 + t.fatG * 9 + t.carbsG * 4 - 1800)).toBeLessThanOrEqual(6);
  });
  it('keeps every overridden value as typed', () => {
    const o = { calories: 2000, proteinG: 120, fatG: 60, carbsG: 150, fiberG: 30, waterMl: 2500 };
    expect(effectiveTargets({ ...base, overrides: o })).toEqual(o);
  });
});
