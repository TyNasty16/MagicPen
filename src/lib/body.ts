// Body measures. Neutral facts only: no advice about what the numbers mean.
import type { Measurement, Profile, WeightEntry } from '../db/db';
import { dailyWeights } from './weight';

export const bmi = (kg: number, heightCm: number) => kg / (heightCm / 100) ** 2;

// Adult BMI categories, from the CDC: https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html
// (for adults 20 and older; "BMI is a screening measure"). Worked out from BMI rounded to 1 decimal, as the
// CDC lists its ranges, so the number shown, the label and the colour always agree (24.96 shows "25.0 · Overweight").
export type BmiCat = 'under' | 'healthy' | 'over' | 'ob1' | 'ob2' | 'ob3';
export const BMI_CATS: { id: BmiCat; from: number; label: string; colour: string }[] = [
  { id: 'under', from: 0, label: 'Underweight', colour: '#6A4C93' },
  { id: 'healthy', from: 18.5, label: 'Healthy weight', colour: '#009E73' },
  { id: 'over', from: 25, label: 'Overweight', colour: '#0072B2' },
  { id: 'ob1', from: 30, label: 'Obesity, class 1', colour: '#C62828' },
  { id: 'ob2', from: 35, label: 'Obesity, class 2', colour: '#7F1D1D' },
  { id: 'ob3', from: 40, label: 'Obesity, class 3', colour: '#7F1D1D' },
];
export const BMI_BOUNDARIES = [18.5, 25, 30, 35, 40];

export function bmiCat(value: number): BmiCat {
  const v = Math.round(value * 10) / 10;
  let id: BmiCat = 'under';
  for (const c of BMI_CATS) if (v >= c.from) id = c.id;
  return id;
}
export const bmiCategory = (value: number): string => BMI_CATS.find((c) => c.id === bmiCat(value))!.label;
export const bmiColour = (cat: BmiCat) => BMI_CATS.find((c) => c.id === cat)!.colour;
/** Weight (kg) at a given BMI for this height. */
export const kgAtBmi = (value: number, heightCm: number) => value * (heightCm / 100) ** 2;

/** Whether BMI colours can be shown: needs a height and an adult (birth year at least 21 years ago, so certainly 20+). */
export function bmiColourStatus(profile: Pick<Profile, 'heightCm' | 'birthYear'>, today = new Date()): 'ok' | 'no-height' | 'no-birth-year' | 'under-20' {
  if (!profile.heightCm) return 'no-height';
  if (!profile.birthYear) return 'no-birth-year';
  return today.getFullYear() - profile.birthYear >= 21 ? 'ok' : 'under-20';
}
const LB = 0.45359237;
/** For the weight chart: shown value (lb or kg) ↔ BMI, for this height. */
export function bmiChart(heightCm: number, units: Profile['units']) {
  const toKg = (v: number) => (units === 'imperial' ? v * LB : v);
  return { toBmi: (v: number) => bmi(toKg(v), heightCm), valueAt: (b: number) => (units === 'imperial' ? kgAtBmi(b, heightCm) / LB : kgAtBmi(b, heightCm)) };
}
/** Why the chart has no BMI colours, when the owner can fix it. */
export const BMI_HINT: Partial<Record<ReturnType<typeof bmiColourStatus>, string>> = {
  'no-height': 'Add your height in Profile to see BMI colours.',
  'no-birth-year': 'Add your birth year in Profile to see BMI colours.',
};

/** A BMI that can't be right (a typing slip): colours are left off rather than guessing. */
export const plausibleBmi = (value: number) => value >= 10 && value <= 80;

/** BMI from the latest weigh-in (or the profile's starting weight if none yet). Undefined without height. */
export function currentBmi(profile: Pick<Profile, 'heightCm' | 'startWeightKg'>, weights: Pick<WeightEntry, 'date' | 'weightKg'>[]): number | undefined {
  const kg = dailyWeights(weights).at(-1)?.kg ?? profile.startWeightKg;
  return kg && profile.heightCm ? bmi(kg, profile.heightCm) : undefined;
}

export const waistToHeight = (waistCm: number, heightCm: number) => waistCm / heightCm;

export type MeasureField = 'waistCm' | 'hipsCm' | 'chestCm' | 'neckCm' | 'upperArmCm' | 'thighCm' | 'bodyFatPct';

export const MEASURE_FIELDS: { key: MeasureField; label: string; kind: 'length' | 'percent' }[] = [
  { key: 'waistCm', label: 'Waist', kind: 'length' },
  { key: 'hipsCm', label: 'Hips', kind: 'length' },
  { key: 'chestCm', label: 'Chest', kind: 'length' },
  { key: 'neckCm', label: 'Neck', kind: 'length' },
  { key: 'upperArmCm', label: 'Upper arm', kind: 'length' },
  { key: 'thighCm', label: 'Thigh', kind: 'length' },
  { key: 'bodyFatPct', label: 'Body fat', kind: 'percent' },
];

/** One value per day for a field (last entry of a day wins), oldest first. */
export function series(entries: Measurement[], field: MeasureField): { date: string; value: number }[] {
  const byDay = new Map<string, number>();
  for (const e of [...entries].sort((a, b) => a.date.localeCompare(b.date) || (a.id ?? 0) - (b.id ?? 0))) {
    const v = e[field];
    if (v !== undefined) byDay.set(e.date, v);
  }
  return [...byDay.entries()].map(([date, value]) => ({ date, value })); // insertion order is already by date
}

/** Latest value and change since the first entry (undefined change with only one entry). */
export function changeSinceFirst(entries: Measurement[], field: MeasureField): { latest: number; change?: number } | null {
  const s = series(entries, field);
  if (s.length === 0) return null;
  const latest = s[s.length - 1].value;
  return { latest, change: s.length > 1 ? latest - s[0].value : undefined };
}
