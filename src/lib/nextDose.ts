// Schedule display only: when the next injection falls. Never dose amounts or advice.
import { addDays, daysBetween, startOfDay } from './dates';

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function nextInjectionDay(weekday: number, today = new Date()): { dayName: string; daysAway: number; label: string } {
  const daysAway = (weekday - today.getDay() + 7) % 7;
  return { dayName: WEEKDAYS[weekday], daysAway, label: dueLabel(daysAway) };
}

export function dueLabel(daysAway: number): string {
  if (daysAway < 0) return `overdue by ${-daysAway} day${daysAway === -1 ? '' : 's'}`;
  return daysAway === 0 ? 'today' : daysAway === 1 ? 'tomorrow' : `in ${daysAway} days`;
}

/**
 * Next due date: 7 days after the last logged injection if there is one,
 * otherwise the profile's injection weekday. Null if neither is known.
 */
export function nextDose(lastIso: string | undefined, weekday: number | undefined, now = new Date()): { date: Date; daysAway: number; label: string } | null {
  if (lastIso) {
    const date = addDays(startOfDay(new Date(lastIso)), 7);
    const daysAway = daysBetween(now, date);
    return { date, daysAway, label: dueLabel(daysAway) };
  }
  if (weekday === undefined) return null;
  const { daysAway, label } = nextInjectionDay(weekday, now);
  return { date: addDays(startOfDay(now), daysAway), daysAway, label };
}
