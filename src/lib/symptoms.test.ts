import { describe, expect, it } from 'vitest';
import { daysSinceLastInjection, isValidSeverity, patternByDay } from './symptoms';
import { tipFor, WHEN_TO_GET_HELP } from './sideEffectText';

const at = (m: number, d: number, h = 9, min = 0) => new Date(2026, m - 1, d, h, min).toISOString();

describe('severity', () => {
  it('accepts whole numbers 1–5 only (0/5 is not logged)', () => {
    expect([1, 5].every(isValidSeverity)).toBe(true);
    expect([0, -1, 6, 2.5, NaN].some(isValidSeverity)).toBe(false);
  });
});

describe('daysSinceLastInjection', () => {
  const inj = [at(11, 4), at(11, 11)];
  it('same day is day 0; 6 days is day 6; 7+ excluded', () => {
    expect(daysSinceLastInjection(at(11, 11, 20), inj)).toBe(0);
    expect(daysSinceLastInjection(at(11, 17, 20), inj)).toBe(6);
    expect(daysSinceLastInjection(at(11, 18, 20), inj)).toBeNull();
  });
  it('no injections, or before the first, gives null', () => {
    expect(daysSinceLastInjection(at(11, 5), [])).toBeNull();
    expect(daysSinceLastInjection(at(11, 1), inj)).toBeNull();
  });
  it('a symptom earlier the same day than an injection counts against the previous one', () => {
    expect(daysSinceLastInjection(at(11, 11, 7), inj)).toBeNull(); // 7 days after Nov 4, so outside the window
    expect(daysSinceLastInjection(at(11, 10, 23, 30), inj)).toBe(6);
  });
  it('uses the latest earlier injection', () => expect(daysSinceLastInjection(at(11, 13), inj)).toBe(2));
  it('counts calendar days across midnight and a DST change', () => {
    expect(daysSinceLastInjection(at(11, 5, 0, 30), [at(11, 4, 23, 30)])).toBe(1);
    expect(daysSinceLastInjection(at(3, 10, 8), [at(3, 5, 22)])).toBe(5);
  });
});

describe('patternByDay', () => {
  const inj = [{ datetime: at(11, 4) }];
  const sym = [
    { datetime: at(11, 5), type: 'nausea', severity: 3 },
    { datetime: at(11, 5, 18), type: 'nausea', severity: 1 },
    { datetime: at(11, 6), type: 'nausea', severity: 2 },
    { datetime: at(11, 5), type: 'fatigue', severity: 5 },
  ];
  it('averages and counts per day for one type', () => {
    const p = patternByDay(sym, inj, 'nausea');
    expect(p[1]).toEqual({ day: 1, count: 2, average: 2 });
    expect(p[2]).toEqual({ day: 2, count: 1, average: 2 });
    expect(p[0]).toEqual({ day: 0, count: 0, average: undefined });
    expect(p).toHaveLength(7);
  });
});

describe('side-effect wording guard', () => {
  it('no tip or help line mentions doses', () => {
    const all = [...WHEN_TO_GET_HELP, ...['nausea', 'vomiting', 'other'].map((t) => tipFor(t).text)];
    for (const line of all) expect(line).not.toMatch(/dose|skip|lower|increase/i);
  });
});
