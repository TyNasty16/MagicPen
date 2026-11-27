// Weekly injection-day reminder as a calendar file (workflow 10b). Made on the phone; facts only — no dose, no medicine.
import { addDays, dayKey, startOfDay } from './dates';

export const EVENT_TITLE = 'Injection day (Steady)';
export const ICS_FILE = 'Steady-injection-day.ics';
const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** The next date on `weekday` (0 = Sunday), today included. */
export function nextWeekday(weekday: number, today: Date): Date {
  const t = startOfDay(today);
  return addDays(t, (weekday - t.getDay() + 7) % 7);
}

/** A repeating all-day event on the injection weekday, with no alarm and no description. Lines end in CRLF. */
export function injectionDayIcs(weekday: number, today: Date, uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@steady`): string {
  const start = dayKey(nextWeekday(weekday, today)).replace(/-/g, '');
  const end = dayKey(addDays(nextWeekday(weekday, today), 1)).replace(/-/g, '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Steady//Injection day//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[weekday]}`, `SUMMARY:${EVENT_TITLE}`, 'TRANSP:TRANSPARENT', 'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
}
