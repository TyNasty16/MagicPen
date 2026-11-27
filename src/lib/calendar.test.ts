import { describe, expect, it } from 'vitest';
import { EVENT_TITLE, injectionDayIcs, nextWeekday } from './calendar';
import { dayKey } from './dates';

describe('injection-day calendar file', () => {
  it('Monday injection day, today Wednesday 2026-12-02 → starts Monday 2026-12-07, weekly on MO', () => {
    const ics = injectionDayIcs(1, new Date(2026, 11, 2, 15), 'x@steady');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261207\r\n');
    expect(ics).toContain('DTEND;VALUE=DATE:20261208\r\n');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO\r\n');
    expect(ics).toContain(`SUMMARY:${EVENT_TITLE}\r\n`);
    expect(ics.split('\r\n').every((l) => !l.includes('\n'))).toBe(true);
  });
  it('today is the injection day → starts today; every weekday maps; month and year roll over', () => {
    expect(dayKey(nextWeekday(3, new Date(2026, 11, 2)))).toBe('2026-12-02');
    const codes = [0, 1, 2, 3, 4, 5, 6].map((w) => injectionDayIcs(w, new Date(2026, 11, 2), 'u').match(/BYDAY=(\w+)/)![1]);
    expect(codes).toEqual(['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']);
    expect(dayKey(nextWeekday(1, new Date(2026, 11, 29)))).toBe('2027-01-04');
  });
  it('facts only: no dose, medicine or time of day', () => {
    const ics = injectionDayIcs(1, new Date(2026, 11, 2), 'u');
    expect(ics).not.toMatch(/dose|mg|wegovy|ozempic|increase|decrease|raise|lower|skip|escalat|titrat|should|recommend|VALARM|DTSTART:/i);
  });
});
