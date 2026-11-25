// Body measures. Neutral facts only: no advice about what the numbers mean.
import type { Measurement, Profile, WeightEntry } from '../db/db';
import { dailyWeights } from './weight';

export const bmi = (kg: number, heightCm: number) => kg / (heightCm / 100) ** 2;

/** Standard adult BMI categories (WHO/CDC cut-offs). */
export function bmiCategory(value: number): string {
  if (value < 18.5) return 'Underweight';
  if (value < 25) return 'Healthy weight';
  if (value < 30) return 'Overweight';
  return 'Obesity';
}

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
