import { describe, expect, it } from 'vitest';
import { addDays, dayKey, fromDayKey } from './dates';
import { computeEarned, dropEndedRuns, firstArrivalLines, isRecorded, LADDERS, linesToShow, mergeRecords, milestoneText, monthsSince, stepsUpTo, titleFor, toRecords, type MilestoneData } from './milestones';

const empty = (): MilestoneData => ({ injections: [], weights: [], symptoms: [], foodLog: [], water: [] });
const TODAY = '2026-11-27'; // a Friday
const day = (n: number) => dayKey(addDays(fromDayKey(TODAY), -n)); // n days before today
const noon = (d: string) => new Date(`${d}T12:00:00`).toISOString();
const keys = (data: MilestoneData, p = {}) => computeEarned(data, p, TODAY).map((e) => e.key);

describe('ladders', () => {
  it.each(Object.entries(LADDERS).filter(([, l]) => l.base.length))('%s: first, middle and last steps, then it keeps going', (_, l) => {
    const last = l.base[l.base.length - 1];
    expect(stepsUpTo(l.base, l.every, l.base[0]).map((s) => s.n)).toEqual([l.base[0]]);
    expect(stepsUpTo(l.base, l.every, l.base[0] - 1)).toEqual([]);
    expect(stepsUpTo(l.base, l.every, last).length).toBe(l.base.length);
    expect(stepsUpTo(l.base, l.every, last + l.every).at(-1)).toEqual({ n: last + l.every, step: l.base.length + 1 });
  });
  it.each(['sched', 'wis', 'dstreak'] as const)('streak %s: every gap is longer than the one before', (id) => {
    const steps = stepsUpTo(LADDERS[id].base, LADDERS[id].every, 1e9).slice(0, LADDERS[id].base.length).map((s) => s.n);
    const gaps = steps.slice(1).map((n, i) => n - steps[i]);
    gaps.slice(1).forEach((g, i) => expect(g).toBeGreaterThan(gaps[i]));
  });
  it('titles escalate and stop at HISTORY MADE', () => {
    expect(titleFor(1)).toBe('NICE START');
    expect(titleFor(5)).toBe('ON FIRE');
    expect(titleFor(10)).toBe('HISTORY MADE');
    expect(titleFor(14)).toBe('HISTORY MADE');
  });
});

describe('what counts', () => {
  it('12 injections logged shows; 11 does not', () => {
    const d = empty();
    d.injections = Array.from({ length: 11 }, (_, i) => ({ datetime: noon(day(i * 7)) }));
    expect(keys(d)).not.toContain('inj-12');
    d.injections.push({ datetime: noon(day(77)) });
    expect(keys(d)).toContain('inj-12');
    expect(milestoneText('inj', 12, {})).toBe('12 injections logged');
    expect(milestoneText('inj', 1, {})).toBe('First injection logged');
  });
  it('7 days in a row; 6 is not enough; an empty today does not end it', () => {
    const d = empty();
    d.water = [1, 2, 3, 4, 5, 6].map((n) => ({ date: day(n) }));
    expect(keys(d)).not.toContain('dstreak-7');
    d.symptoms = [{ datetime: noon(day(7)) }];
    expect(keys(d)).toContain('dstreak-7');
    expect(milestoneText('dstreak', 7, {})).toBe('7 days in a row with something logged');
  });
  it('a missed day starts a new run; its steps can be earned again', () => {
    const d = empty();
    d.water = [...[0, 1, 2, 3, 4, 5, 6], ...[8, 9, 10, 11, 12, 13, 14]].map((n) => ({ date: day(n) }));
    const earned = computeEarned(d, {}, TODAY);
    const seven = earned.find((e) => e.key === 'dstreak-7')!;
    expect(seven.run).toBe(day(6));
    const old = [{ key: 'dstreak-7', on: day(8), run: day(14) }]; // recorded in the earlier run
    expect(isRecorded(seven, old)).toBe(false);
    expect(isRecorded(seven, [{ key: 'dstreak-7', on: TODAY, run: day(6) }])).toBe(true);
    expect(earned.find((e) => e.key === 'days-10')).toBeTruthy(); // totals never reset
  });
  it('back-filling an older day does not re-fire a streak step', () => {
    const d = empty();
    d.water = [0, 1, 2, 3, 4, 5, 6].map((n) => ({ date: day(n) }));
    const rec = toRecords(computeEarned(d, {}, TODAY), TODAY);
    d.water.push({ date: day(7) }); // run now starts a day earlier
    const fresh = computeEarned(d, {}, TODAY).filter((e) => !isRecorded(e, rec));
    expect(fresh.map((e) => e.key)).toEqual([]);
  });
  it('weight: 5.0 lb counts, 4.9 does not; lb and percent together; a gain never removes', () => {
    const lb = (x: number) => x * 0.45359237;
    const d = empty();
    const p = { units: 'imperial' as const, startWeightKg: lb(180) };
    d.weights = [{ date: day(1), weightKg: lb(175.1) }];
    expect(keys(d, p)).not.toContain('wabs-5');
    d.weights.push({ date: day(0), weightKg: lb(175) });
    expect(keys(d, p)).toContain('wabs-5');
    const p2 = { units: 'imperial' as const, startWeightKg: lb(200) };
    d.weights = [{ date: day(0), weightKg: lb(180) }];
    const shown = linesToShow(computeEarned(d, p2, TODAY), p2, false).map((l) => l.text);
    expect(shown).toEqual(expect.arrayContaining(['20 lb lost since your starting weight', '10% of your starting weight lost']));
    expect(shown).not.toContain('5 lb lost since your starting weight');
    d.weights.push({ date: day(0), weightKg: lb(195) }); // a gain: lowest weigh-in still counts
    expect(keys(d, p2)).toContain('wabs-20');
    expect(keys(d, p2)).toContain('wpct-10');
  });
  it('weight percent keeps going past 15%, metric uses 2 kg', () => {
    const d = empty();
    d.weights = [{ date: day(0), weightKg: 75 }];
    const k = keys(d, { units: 'metric', startWeightKg: 100 });
    expect(k).toEqual(expect.arrayContaining(['wpct-25', 'wabs-24']));
    expect(k).not.toContain('wabs-25');
    expect(milestoneText('wabs', 24, { units: 'metric' })).toBe('24 kg lost since your starting weight');
  });
  it('months since the first injection clamp at month end', () => {
    expect(monthsSince('2026-01-31', '2026-02-27')).toBe(0);
    expect(monthsSince('2026-01-31', '2026-02-28')).toBe(1);
    expect(milestoneText('time', 12, {})).toBe('1 year since your first injection');
    expect(milestoneText('time', 24, {})).toBe('2 years since your first injection');
    expect(milestoneText('time', 3, {})).toBe('3 months since your first injection');
  });
  it('injections on schedule: 3 schedule weeks in a row, a late injection inside the week counts, no dose read', () => {
    const d = empty();
    // Injection day Monday. Weeks: Nov 9, 16, 23. Late one on Thursday Nov 26.
    d.injections = ['2026-11-09', '2026-11-16', '2026-11-26'].map((x) => ({ datetime: noon(x) }));
    const e = computeEarned(d, { injectionWeekday: 1 }, TODAY);
    expect(e.map((x) => x.key)).toContain('sched-3');
    expect(milestoneText('sched', 3, {})).toBe('3 weeks in a row logging your injection on schedule');
    expect(computeEarned(d, {}, TODAY).some((x) => x.series === 'sched')).toBe(false);
  });
});

describe('showing', () => {
  it('first arrival: one line per category, the running streak first', () => {
    const d = empty();
    d.water = Array.from({ length: 30 }, (_, i) => ({ date: day(i) }));
    d.injections = [{ datetime: noon(day(40)) }];
    const lines = firstArrivalLines(computeEarned(d, {}, TODAY), {}, false);
    expect(lines.map((l) => l.text)).toEqual(['First injection logged', '30 days in a row with something logged', '1 month since your first injection']);
  });
  it('weight lines can be withheld (switch off, or a Profile edit)', () => {
    const d = empty();
    d.weights = [{ date: day(0), weightKg: 90 }];
    const e = computeEarned(d, { units: 'metric', startWeightKg: 100 }, TODAY);
    expect(linesToShow(e, {}, true).some((l) => l.series === 'wabs' || l.series === 'wpct')).toBe(false);
  });
  it('records from ended streak runs are dropped; totals and the current run stay', () => {
    const d = empty();
    d.water = [0, 1, 2].map((n) => ({ date: day(n) }));
    const earned = computeEarned(d, {}, TODAY);
    const rec = [{ key: 'days-1', on: day(30) }, { key: 'dstreak-7', on: day(20), run: day(26) }, { key: 'dstreak-3', on: TODAY, run: day(2) }, { key: 'wis-2', on: day(40), run: day(50) }];
    expect(dropEndedRuns(rec, earned).map((r) => r.key)).toEqual(['days-1', 'dstreak-3']);
  });
  it('merging keeps the earliest date per key and run', () => {
    expect(mergeRecords([{ key: 'inj-1', on: '2026-11-20' }], [{ key: 'inj-1', on: '2026-11-01' }, { key: 'inj-4', on: '2026-11-21' }])).toEqual([
      { key: 'inj-1', on: '2026-11-01' }, { key: 'inj-4', on: '2026-11-21' },
    ]);
  });
  it('no line mentions a dose, a break or what is next', () => {
    const all = (['inj', 'sched', 'wiw', 'wis', 'days', 'dstreak', 'time', 'wabs', 'wpct'] as const).flatMap((s) => [1, 7, 12, 24].map((n) => milestoneText(s, n, {})));
    for (const t of all) expect(t).not.toMatch(/\bmg\b|dose|miss|break|to go|next|keep it up/i);
  });
});
