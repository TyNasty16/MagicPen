import { describe, expect, it } from 'vitest';
import { nextInjectionDay } from './nextDose';

const tuesday = new Date(2026, 10, 24); // Tue Nov 24 2026
const thursday = new Date(2026, 10, 26);
const saturday = new Date(2026, 10, 28);

describe('nextInjectionDay', () => {
  it('same day is today', () => expect(nextInjectionDay(2, tuesday)).toEqual({ dayName: 'Tuesday', daysAway: 0, label: 'today' }));
  it('Thursday on a Thursday is today', () => expect(nextInjectionDay(4, thursday).label).toBe('today'));
  it('next day is tomorrow', () => expect(nextInjectionDay(3, tuesday).label).toBe('tomorrow'));
  it('counts days ahead', () => expect(nextInjectionDay(4, tuesday)).toEqual({ dayName: 'Thursday', daysAway: 2, label: 'in 2 days' }));
  it('wraps past Saturday', () => expect(nextInjectionDay(1, saturday).daysAway).toBe(2));
  it('is always 0–6 days away for every weekday', () => {
    for (let w = 0; w < 7; w++) {
      const d = nextInjectionDay(w, tuesday).daysAway;
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(6);
    }
  });
});
