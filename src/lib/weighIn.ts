// Weekly weigh-in cycle: 7-day windows starting on the first logged weigh-in date.
import { addDays, daysBetween, fromDayKey, startOfDay } from './dates';

export type WeighInState = 'first' | 'due' | 'still' | 'done';

export interface WeighInStatus {
  state: WeighInState;
  streak: number; // consecutive weekly windows with a weigh-in
  daysLeft: number; // days left in the current window after today
  weeks: boolean[]; // last 5 windows (oldest first); the current one is last
}

export function weighInStatus(dayKeys: string[], now = new Date()): WeighInStatus {
  if (dayKeys.length === 0) return { state: 'first', streak: 0, daysLeft: 0, weeks: [] };
  const anchor = fromDayKey([...dayKeys].sort()[0]);
  const windowOf = (d: Date) => Math.floor(daysBetween(anchor, d) / 7);
  const current = Math.max(0, windowOf(now));
  const withWeighIn = new Set(dayKeys.map((k) => windowOf(fromDayKey(k))));
  const doneThisWeek = withWeighIn.has(current);

  let streak = 0;
  for (let w = doneThisWeek ? current : current - 1; withWeighIn.has(w); w--) streak++;

  const windowStart = addDays(anchor, current * 7);
  const dayInWindow = Math.max(0, daysBetween(windowStart, startOfDay(now))); // clock before the first weigh-in counts as day 0
  const weeks = Array.from({ length: 5 }, (_, i) => current - 4 + i)
    .filter((w) => w >= 0)
    .map((w) => withWeighIn.has(w));

  return {
    state: doneThisWeek ? 'done' : dayInWindow === 0 ? 'due' : 'still',
    streak,
    daysLeft: 6 - dayInWindow,
    weeks,
  };
}
