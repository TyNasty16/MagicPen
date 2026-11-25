// Schedule display only: when the next injection day falls. No dose amounts or advice.
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function nextInjectionDay(weekday: number, today = new Date()): { dayName: string; daysAway: number; label: string } {
  const daysAway = (weekday - today.getDay() + 7) % 7;
  const label = daysAway === 0 ? 'today' : daysAway === 1 ? 'tomorrow' : `in ${daysAway} days`;
  return { dayName: WEEKDAYS[weekday], daysAway, label };
}
