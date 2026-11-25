import { describe, expect, it } from 'vitest';
import { suggestSite } from './injections';
import { nextDose, dueLabel } from './nextDose';
import { dailyWeights, movingAverage7, weightStats } from './weight';
import { displayWeight, lbToKg, weightToKg } from './units';
import { addDays, daysBetween, fromLocalInput, toLocalInput } from './dates';

const iso = (y: number, m: number, d: number, h = 9) => new Date(y, m - 1, d, h).toISOString();

describe('suggestSite', () => {
  it('starts with the first site when nothing is logged', () => expect(suggestSite([])).toBe('abdomen-left'));
  it('prefers a never-used site', () => {
    expect(suggestSite([{ site: 'abdomen-left', datetime: iso(2026, 11, 1) }])).toBe('abdomen-right');
  });
  it('picks the site used longest ago once all are used', () => {
    const h = [
      { site: 'abdomen-left' as const, datetime: iso(2026, 10, 5) },
      { site: 'abdomen-right' as const, datetime: iso(2026, 10, 12) },
      { site: 'thigh-left' as const, datetime: iso(2026, 9, 28) },
      { site: 'thigh-right' as const, datetime: iso(2026, 10, 19) },
      { site: 'arm-left' as const, datetime: iso(2026, 10, 26) },
      { site: 'arm-right' as const, datetime: iso(2026, 11, 2) },
    ];
    expect(suggestSite(h)).toBe('thigh-left');
  });
  it('uses each site’s most recent use', () => {
    const h = ['abdomen-right', 'thigh-left', 'thigh-right', 'arm-left', 'arm-right'].map((site, i) => ({ site: site as never, datetime: iso(2026, 10, 10 + i) }));
    h.push({ site: 'abdomen-left' as never, datetime: iso(2026, 9, 1) }, { site: 'abdomen-left' as never, datetime: iso(2026, 11, 1) });
    expect(suggestSite(h)).toBe('abdomen-right');
  });
});

describe('nextDose', () => {
  const mon = iso(2026, 11, 23); // Monday
  it('is 7 days after the last injection', () => {
    const r = nextDose(mon, 3, new Date(2026, 10, 25, 12))!;
    expect(r.date.getDay()).toBe(1);
    expect(r.daysAway).toBe(5);
  });
  it('reports overdue as a fact', () => {
    const r = nextDose(mon, undefined, new Date(2026, 11, 2, 12))!;
    expect(r.daysAway).toBe(-2);
    expect(r.label).toBe('overdue by 2 days');
  });
  it('follows a late injection (last + 7 from the actual date)', () => {
    const r = nextDose(iso(2026, 11, 25), 1, new Date(2026, 10, 25, 20))!;
    expect(r.date.getDay()).toBe(3);
    expect(r.daysAway).toBe(7);
  });
  it('falls back to the profile weekday', () => {
    expect(nextDose(undefined, 1, new Date(2026, 10, 25))!.daysAway).toBe(5);
    expect(nextDose(undefined, undefined)).toBeNull();
  });
  it('counts calendar days across a daylight-saving change', () => {
    const before = new Date(2026, 2, 5); // early March
    expect(daysBetween(before, addDays(before, 7))).toBe(7);
    expect(daysBetween(new Date(2026, 9, 28), addDays(new Date(2026, 9, 28), 7))).toBe(7);
  });
  it('round-trips the datetime input', () => expect(toLocalInput(fromLocalInput('2026-11-23T09:30'))).toBe('2026-11-23T09:30'));
  it('labels singular overdue', () => expect(dueLabel(-1)).toBe('overdue by 1 day'));
});

describe('weights', () => {
  it('averages several weigh-ins on one day', () => {
    expect(dailyWeights([{ date: '2026-11-02', weightKg: 90 }, { date: '2026-11-01', weightKg: 91 }, { date: '2026-11-02', weightKg: 92 }])).toEqual([
      { date: '2026-11-01', kg: 91 },
      { date: '2026-11-02', kg: 91 },
    ]);
  });
  it('7-day average uses only the 7 calendar days ending that day', () => {
    const daily = [
      { date: '2026-11-01', kg: 100 },
      { date: '2026-11-07', kg: 94 },
      { date: '2026-11-08', kg: 92 },
    ];
    const avg = movingAverage7(daily);
    expect(avg[0].kg).toBe(100);
    expect(avg[1].kg).toBe(97); // Nov 1–7
    expect(avg[2].kg).toBe(93); // Nov 2–8 excludes Nov 1
  });
  it('single entry', () => expect(movingAverage7([{ date: '2026-11-01', kg: 80 }])).toEqual([{ date: '2026-11-01', kg: 80 }]));
  it('stats: 200 → 180 lb with goal 160', () => {
    const s = weightStats([{ date: '2026-11-01', kg: lbToKg(180) }], lbToKg(200), lbToKg(160))!;
    expect(displayWeight(s.lostKg!, 'imperial')).toBe(20);
    expect(s.lostPct).toBe(10);
    expect(displayWeight(s.toGoalKg!, 'imperial')).toBe(20);
  });
  it('stats: gain shows negative loss; goal passed shows 0 to go', () => {
    expect(weightStats([{ date: '2026-11-01', kg: 105 }], 100, 80)!.lostKg).toBe(-5);
    expect(weightStats([{ date: '2026-11-01', kg: 75 }], 100, 80)!.toGoalKg).toBe(0);
  });
  it('stats need data; missing start or goal leaves those stats out', () => {
    expect(weightStats([], 100, 80)).toBeNull();
    expect(weightStats([{ date: '2026-11-01', kg: 90 }], undefined, 80)).toEqual({ currentKg: 90, lostKg: undefined, lostPct: undefined, toGoalKg: 10 });
    expect(weightStats([{ date: '2026-11-01', kg: 90 }], 100, undefined)!.toGoalKg).toBeUndefined();
  });
  it('180 lb round-trips', () => {
    const kg = weightToKg('180', 'imperial')!;
    expect(Math.round(kg * 10) / 10).toBe(81.6);
    expect(displayWeight(kg, 'imperial')).toBe(180);
    expect(displayWeight(81.6, 'metric')).toBe(81.6);
  });
});
