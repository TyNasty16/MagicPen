// All data is stored in metric. These helpers convert for display and input.
export type UnitSystem = 'imperial' | 'metric';

const LB_PER_KG = 2.2046226218;
const CM_PER_IN = 2.54;
const ML_PER_FL_OZ = 29.5735295625;

export const kgToLb = (kg: number) => kg * LB_PER_KG;
export const lbToKg = (lb: number) => lb / LB_PER_KG;
export const cmToIn = (cm: number) => cm / CM_PER_IN;
export const inToCm = (inches: number) => inches * CM_PER_IN;
export const mlToFlOz = (ml: number) => ml / ML_PER_FL_OZ;
export const flOzToMl = (oz: number) => oz * ML_PER_FL_OZ;

/** Splits centimetres into whole feet and inches (inches rounded to 1 decimal). */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalIn = Math.round(cmToIn(cm) * 10) / 10;
  const feet = Math.floor(totalIn / 12);
  return { feet, inches: Math.round((totalIn - feet * 12) * 10) / 10 };
}

/** Parses a user-typed number; returns undefined for blank or invalid input. */
export function parseNum(text: string): number | undefined {
  const t = text.trim();
  if (!/^\d*[.,]?\d+$/.test(t)) return undefined;
  return Number(t.replace(',', '.'));
}

export const round1 = (n: number) => Math.round(n * 10) / 10;

/** Weight in the owner's display unit, rounded to 1 decimal. */
export const displayWeight = (kg: number, u: UnitSystem) => round1(u === 'imperial' ? kgToLb(kg) : kg);
export const weightUnit = (u: UnitSystem) => (u === 'imperial' ? 'lb' : 'kg');
/** Parses a typed weight in display units to kg. */
export function weightToKg(text: string, u: UnitSystem): number | undefined {
  const n = parseNum(text);
  return n === undefined ? undefined : u === 'imperial' ? lbToKg(n) : n;
}
