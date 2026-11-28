// Protein shaker (workflow 16). Pure: what the shaker shows today and whether to play an animation.
// The phone remembers, per day, the last protein total Home showed and whether the goal moment has played.
// This memory stays on the phone: it is not backed up (a restore at worst changes the level without a shake).

export const SHAKER_KEY = 'steady.shaker';

export interface ShakerMemory { date: string; lastTotal: number; goalShown: boolean }
export type ShakerPlay = 'none' | 'shake' | 'goal';

export interface ShakerState {
  /** Fill before any animation (0..1): where the bottle was last time Home showed it. */
  from: number;
  /** Fill when settled (0..1). Empty once the goal is reached: the shake has been drunk. */
  level: number;
  play: ShakerPlay;
  /** Goal reached today (stays for the day, even if food is deleted later or the target changes). */
  reached: boolean;
  next: ShakerMemory;
}

const fill = (total: number, target: number) => (target > 0 ? Math.min(1, Math.max(0, total / target)) : 0);

export function shakerState(today: string, total: number, target: number, memory: ShakerMemory | null): ShakerState {
  const m: ShakerMemory = memory && memory.date === today ? memory : { date: today, lastTotal: 0, goalShown: false }; // a new day starts empty
  if (m.goalShown) return { from: 0, level: 0, play: 'none', reached: true, next: { ...m, lastTotal: total } };
  const from = fill(m.lastTotal, target);
  if (target > 0 && total >= target) return { from, level: 0, play: 'goal', reached: true, next: { date: today, lastTotal: total, goalShown: true } };
  return { from, level: fill(total, target), play: total > m.lastTotal ? 'shake' : 'none', reached: false, next: { date: today, lastTotal: total, goalShown: false } };
}

export function loadShakerMemory(): ShakerMemory | null {
  try {
    const v = JSON.parse(localStorage.getItem(SHAKER_KEY) ?? 'null') as ShakerMemory | null;
    return v && typeof v.date === 'string' && typeof v.lastTotal === 'number' && typeof v.goalShown === 'boolean' ? v : null;
  } catch {
    return null;
  }
}
export function saveShakerMemory(m: ShakerMemory): void {
  try { localStorage.setItem(SHAKER_KEY, JSON.stringify(m)); } catch { /* storage blocked: it may shake again next time */ }
}
