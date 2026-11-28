import { describe, expect, it } from 'vitest';
import { bmiCat, bmiCategory, bmiChart, bmiColoursOn, bmiColourStatus, plausibleBmi } from './body';
import { bmiRows } from '../components/TrendChart';
import { rangeStart } from './range';

describe('BMI categories (CDC adult ranges, from BMI rounded to 1 decimal)', () => {
  it.each([
    [18.4, 'Underweight'], [18.5, 'Healthy weight'], [24.94, 'Healthy weight'], [24.96, 'Overweight'], [25, 'Overweight'],
    [29.9, 'Overweight'], [30, 'Obesity, class 1'], [34.9, 'Obesity, class 1'], [35, 'Obesity, class 2'], [39.9, 'Obesity, class 2'], [40, 'Obesity, class 3'],
  ])('%s → %s', (v, label) => expect(bmiCategory(v)).toBe(label));
});

describe('when colours show', () => {
  const now = new Date('2026-11-28T12:00:00');
  it.each([
    [{ heightCm: 178, birthYear: 1985 }, 'ok'],
    [{ birthYear: 1985 }, 'no-height'],
    [{ heightCm: 178 }, 'no-birth-year'],
    [{ heightCm: 178, birthYear: 2006 }, 'under-20'], // 20 by year difference, but may still be 19
    [{ heightCm: 178, birthYear: 2005 }, 'ok'],
  ] as const)('%o → %s', (p, s) => expect(bmiColourStatus(p, now)).toBe(s));
  it('a believable BMI only', () => {
    expect(plausibleBmi(9.9)).toBe(false);
    expect(plausibleBmi(28)).toBe(true);
    expect(plausibleBmi(80.1)).toBe(false);
  });
});

describe('splitting the line at category boundaries', () => {
  const fns = bmiChart(178, 'imperial'); // BMI 30 ≈ 209.6 lb, BMI 25 ≈ 174.6 lb
  const row = (t: number, value: number) => ({ t, date: `d${t}`, value });
  it('adds one boundary point, in both colours, where the line crosses BMI 30', () => {
    const out = bmiRows([row(0, 214), row(10, 206)], fns.toBmi, fns.valueAt);
    expect(out.map((r) => r.cat ?? 'cross')).toEqual(['ob1', 'cross', 'over']);
    const c = out[1];
    expect(c.cross).toBe(true);
    expect(c.value).toBeCloseTo(209.6, 1);
    expect(c.ob1).toBe(c.value);
    expect(c.over).toBe(c.value);
    expect(c.t).toBeGreaterThan(0);
    expect(c.t).toBeLessThan(10);
  });
  it('crossing two boundaries between two weigh-ins adds two points, in time order', () => {
    const out = bmiRows([row(0, 214), row(10, 170)], fns.toBmi, fns.valueAt);
    expect(out.filter((r) => r.cross).map((r) => Math.round(r.value))).toEqual([210, 175]);
  });
  it('no crossing, no extra points', () => expect(bmiRows([row(0, 200), row(10, 196)], fns.toBmi, fns.valueAt)).toHaveLength(2));
  it('rounding near a boundary never makes the line overshoot', () => {
    const at = (b: number) => fns.valueAt(b);
    for (const [a, z] of [[at(29.0), at(29.96)], [at(29.96), at(29.0)]]) {
      const out = bmiRows([row(0, a), row(10, z)], fns.toBmi, fns.valueAt);
      for (const r of out) expect(r.value).toBeGreaterThanOrEqual(Math.min(a, z) - 1e-9), expect(r.value).toBeLessThanOrEqual(Math.max(a, z) + 1e-9);
    }
  });
  it('up then down across BMI 30 splits into red and blue pieces', () => {
    const out = bmiRows([row(0, 206), row(10, 212), row(20, 206)], fns.toBmi, fns.valueAt);
    expect(out.map((r) => (r.cross ? 'x' : r.cat))).toEqual(['over', 'x', 'ob1', 'x', 'over']);
    expect(out[0].ob1).toBeUndefined(); // gaps keep the red line from joining the blue points
    expect(out[4].ob1).toBeUndefined();
  });
  it('metric: BMI 30 at 1.78 m is 95.1 kg', () => expect(bmiChart(178, 'metric').valueAt(30)).toBeCloseTo(95.05, 1));
  it('colours need 2 points and believable BMIs', () => {
    expect(bmiColoursOn([200], fns.toBmi)).toBe(false);
    expect(bmiColoursOn([200, 198], fns.toBmi)).toBe(true);
    expect(bmiColoursOn([200, 20], fns.toBmi)).toBe(false); // a typing slip
    expect(bmiColoursOn([200, 198], undefined)).toBe(false);
  });
  it('the BMI shown matches the category: 24.96 counts as 25.0', () => expect(bmiCat(24.96)).toBe('over'));
});

it('7-day range starts 6 days back', () => expect(rangeStart('7d', new Date('2026-11-28T12:00:00'))).toBe('2026-11-22'));
