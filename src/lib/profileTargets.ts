import type { Profile } from '../db/db';
import { ageFromBirthYear, calculateTargets, splitMacros, type Targets } from './targets';

/**
 * Calculated targets for a complete profile, or null if fields are missing.
 * Calories and water use the latest weigh-in when there is one (owner decision, workflow 05); protein uses the goal weight.
 */
export function calculatedTargets(p: Partial<Profile>, latestKg?: number): Targets | null {
  const { startWeightKg, goalWeightKg, heightCm, birthYear, sex, activity } = p;
  if (!startWeightKg || !goalWeightKg || !heightCm || !birthYear || !sex || !activity) return null;
  return calculateTargets({
    weightKg: latestKg ?? startWeightKg,
    goalWeightKg,
    heightCm,
    age: ageFromBirthYear(birthYear),
    sex,
    activity,
    proteinPerKg: p.proteinPerKg,
  });
}

/** Targets with owner overrides applied; fat and carbs re-balance around overridden values. */
export function effectiveTargets(p: Partial<Profile>, latestKg?: number): Targets | null {
  const calc = calculatedTargets(p, latestKg);
  if (!calc) return null;
  const o = p.overrides ?? {};
  const macros = splitMacros(o.calories ?? calc.calories, o.proteinG ?? calc.proteinG, o.fatG);
  return { ...calc, ...macros, ...o };
}
