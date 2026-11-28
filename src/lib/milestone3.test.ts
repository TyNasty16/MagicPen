import { describe, expect, it } from 'vitest';
import { bmi, bmiCategory, changeSinceFirst, series, waistToHeight } from './body';
import { doseChanges, filterRange, rangeStart } from './range';
import { displayLength, inToCm, lbToKg, lengthToCm } from './units';

describe('BMI', () => {
  it('180 lb at 5\'9" is 26.6, Overweight', () => {
    const v = bmi(lbToKg(180), inToCm(69));
    expect(Math.round(v * 10) / 10).toBe(26.6);
    expect(bmiCategory(v)).toBe('Overweight');
  });
  it('uses the standard cut-offs', () => {
    expect(bmiCategory(18.4)).toBe('Underweight');
    expect(bmiCategory(18.5)).toBe('Healthy weight');
    expect(bmiCategory(24.9)).toBe('Healthy weight');
    expect(bmiCategory(25)).toBe('Overweight');
    expect(bmiCategory(30)).toBe('Obesity, class 1');
  });
});

describe('waist-to-height', () => {
  it('34 in waist at 69 in is 0.49', () => expect(Math.round(waistToHeight(inToCm(34), inToCm(69)) * 100) / 100).toBe(0.49));
});

describe('length units', () => {
  it('34 in is stored as 86.4 cm and shown back as 34 in', () => {
    const cm = lengthToCm('34', 'imperial')!;
    expect(Math.round(cm * 10) / 10).toBe(86.4);
    expect(displayLength(cm, 'imperial')).toBe(34);
    expect(displayLength(86.36, 'metric')).toBe(86.4);
  });
  it('rejects blank input', () => expect(lengthToCm('', 'metric')).toBeUndefined());
});

describe('measurement series', () => {
  const entries = [
    { id: 1, date: '2026-10-01', waistCm: 100, hipsCm: 110 },
    { id: 2, date: '2026-10-15', hipsCm: 108 },
    { id: 3, date: '2026-11-01', waistCm: 96 },
    { id: 4, date: '2026-11-01', waistCm: 95 },
  ];
  it('skips entries without the field; last entry of a day wins', () => {
    expect(series(entries, 'waistCm')).toEqual([{ date: '2026-10-01', value: 100 }, { date: '2026-11-01', value: 95 }]);
  });
  it('change since first', () => {
    expect(changeSinceFirst(entries, 'waistCm')).toEqual({ latest: 95, change: -5 });
    expect(changeSinceFirst([entries[0]], 'waistCm')).toEqual({ latest: 100, change: undefined });
    expect(changeSinceFirst(entries, 'neckCm')).toBeNull();
  });
});

describe('range', () => {
  const today = new Date(2026, 10, 25);
  const rows = ['2026-08-01', '2026-08-28', '2026-10-27', '2026-11-25'].map((date) => ({ date }));
  it('30 days includes today and the 29 days before', () => {
    expect(rangeStart('30d', today)).toBe('2026-10-27');
    expect(filterRange(rows, '30d', today).map((r) => r.date)).toEqual(['2026-10-27', '2026-11-25']);
  });
  it('90 days edge', () => expect(filterRange(rows, '90d', today).map((r) => r.date)).toEqual(['2026-08-28', '2026-10-27', '2026-11-25']));
  it('All keeps everything; empty stays empty', () => {
    expect(filterRange(rows, 'all', today)).toHaveLength(4);
    expect(filterRange([], '30d', today)).toEqual([]);
  });
});

describe('doseChanges', () => {
  const iso = (d: number, h = 9) => new Date(2026, 9, d, h).toISOString();
  it('marks the first dose and each change, not repeats', () => {
    const inj = [
      { datetime: iso(15), doseMg: 0.5 },
      { datetime: iso(1), doseMg: 0.25 }, // out of order on purpose
      { datetime: iso(8), doseMg: 0.25 },
      { datetime: iso(22), doseMg: 0.5 },
      { datetime: iso(29), doseMg: 1 },
    ];
    expect(doseChanges(inj)).toEqual([
      { date: '2026-10-01', doseMg: 0.25, first: true, drug: 'wegovy', drugChanged: false },
      { date: '2026-10-15', doseMg: 0.5, first: false, drug: 'wegovy', drugChanged: false },
      { date: '2026-10-29', doseMg: 1, first: false, drug: 'wegovy', drugChanged: false },
    ]);
  });
  it('none for no injections', () => expect(doseChanges([])).toEqual([]));
  it('two entries on one day with different doses both count', () => {
    expect(doseChanges([{ datetime: iso(1, 8), doseMg: 0.25 }, { datetime: iso(1, 20), doseMg: 0.5 }])).toHaveLength(2);
  });
});

import { currentBmi } from './body';
import { doseNotesByPoint, placeDoseMarks } from './range';
import { fromDayKey } from './dates';

describe('currentBmi', () => {
  it('uses the latest weigh-in, else the start weight; undefined without height', () => {
    expect(Math.round(currentBmi({ heightCm: 180, startWeightKg: 100 }, [{ date: '2026-11-01', weightKg: 90 }])! * 10) / 10).toBe(27.8);
    expect(Math.round(currentBmi({ heightCm: 180, startWeightKg: 100 }, [])! * 10) / 10).toBe(30.9);
    expect(currentBmi({ startWeightKg: 100 }, [])).toBeUndefined();
  });
});

describe('dose marks on the chart', () => {
  const t = (d: string) => fromDayKey(d).getTime();
  const marks = [
    { date: '2026-08-01', label: 'Start 0.25 mg' },
    { date: '2026-08-29', label: '0.5 mg' },
    { date: '2026-10-01', label: '1 mg' },
  ];
  it('keeps only marks inside the window', () => {
    expect(placeDoseMarks(marks, t('2026-09-01'), t('2026-11-25')).map((m) => m.label)).toEqual(['1 mg']);
  });
  it('skips a label that would overlap the previous one, keeping the line', () => {
    const placed = placeDoseMarks(marks, t('2026-07-28'), t('2026-11-25'));
    expect(placed.map((m) => [m.label, m.showLabel])).toEqual([['Start 0.25 mg', true], ['0.5 mg', false], ['1 mg', true]]);
  });
  it('notes attach to the next point and combine when two land together', () => {
    const notes = doseNotesByPoint(['2026-08-05', '2026-10-03'], [{ date: '2026-08-01', label: 'a' }, { date: '2026-08-03', label: 'b' }, { date: '2026-12-01', label: 'c' }]);
    expect([...notes.entries()]).toEqual([['2026-08-05', ['a', 'b']]]);
  });
});
