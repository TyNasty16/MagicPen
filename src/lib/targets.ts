// Daily nutrition target estimates. Pure functions; all inputs metric.
// Defaults approved by the owner in docs/workflows/01-foundation.md.

export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active';

export const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export const CALORIE_FLOOR: Record<Sex, number> = { female: 1200, male: 1500 };
export const DEFICIT_FRACTION = 0.2;
export const DEFICIT_CAP_KCAL = 750;
export const FAT_FRACTION = 0.275;
export const FIBER_G = 28;
export const WATER_ML_PER_KG = 30;
export const PROTEIN_PER_KG_DEFAULT = 1.4;
export const PROTEIN_PER_KG_MIN = 1.2;
export const PROTEIN_PER_KG_MAX = 1.6;

export interface TargetInput {
  weightKg: number;
  goalWeightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activity: Activity;
  proteinPerKg?: number;
}

export interface Targets {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  waterMl: number;
}

/** Mifflin-St Jeor basal metabolic rate (kcal/day). */
export function bmr({ weightKg, heightCm, age, sex }: Pick<TargetInput, 'weightKg' | 'heightCm' | 'age' | 'sex'>): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
}

export function tdee(input: TargetInput): number {
  return bmr(input) * ACTIVITY_FACTORS[input.activity];
}

export function calculateTargets(input: TargetInput): Targets {
  const energy = tdee(input);
  const deficit = Math.min(energy * DEFICIT_FRACTION, DEFICIT_CAP_KCAL);
  const calories = Math.round(Math.max(energy - deficit, CALORIE_FLOOR[input.sex]));

  const perKg = clamp(input.proteinPerKg ?? PROTEIN_PER_KG_DEFAULT, PROTEIN_PER_KG_MIN, PROTEIN_PER_KG_MAX);
  const proteinG = Math.round(input.goalWeightKg * perKg);

  return {
    ...splitMacros(calories, proteinG),
    fiberG: FIBER_G,
    waterMl: Math.round(input.weightKg * WATER_ML_PER_KG),
  };
}

/** Fat = 27.5% of calories (unless given); carbs fill the remaining calories (never negative). */
export function splitMacros(calories: number, proteinG: number, fatG = Math.round((calories * FAT_FRACTION) / 9)) {
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  return { calories, proteinG, fatG, carbsG };
}

/** Age in whole years from a birth year (approximate: assumes birthday has passed). */
export const ageFromBirthYear = (birthYear: number, today = new Date()) => today.getFullYear() - birthYear;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
