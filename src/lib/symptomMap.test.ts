import { describe, expect, it } from 'vitest';
import { dailyMaxByType, injectionWeekAverages, RAMP, rampText, recentCount, timingPhrase, trendFor, visibleSymptoms, weeklyTrend, windowDays } from './symptomMap';

const now = new Date(2026, 10, 25, 20); // Wed Nov 25
const at = (d: number, h = 9) => new Date(2026, 10, d, h).toISOString();
const sym = (type: string, sev: number, d: number, h = 9) => ({ type, severity: sev, datetime: at(d, h) });
const max = (list: ReturnType<typeof sym>[], type: string) => dailyMaxByType(list, now).get(type);

describe('windows and daily max', () => {
  it('windowDays ends today, oldest first', () => expect(windowDays(3, now)).toEqual(['2026-11-23', '2026-11-24', '2026-11-25']));
  it('keeps the highest severity per day and ignores 0/5', () => {
    const m = max([sym('nausea', 2, 25, 8), sym('nausea', 4, 25, 18), sym('nausea', 0, 24)], 'nausea')!;
    expect(m.get('2026-11-25')).toBe(4);
    expect(m.has('2026-11-24')).toBe(false);
  });
  it('steps 4 and 5 are clearly apart (≥2:1)', () => {
    const lum = (hex: string) => {
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    expect((lum(RAMP[4]) + 0.05) / (lum(RAMP[5]) + 0.05)).toBeGreaterThanOrEqual(2);
  });
  it('text colour switches to white on the two darkest steps', () => expect([0, 3, 4, 5].map(rampText)).toEqual(['#3a2a22', '#3a2a22', '#ffffff', '#ffffff']));
  it('every step has ≥4.5:1 text contrast (WCAG)', () => {
    const lum = (hex: string) => {
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    RAMP.forEach((bg, step) => expect(ratio(rampText(step), bg)).toBeGreaterThanOrEqual(4.5));
  });
});

describe('visibleSymptoms (3-day rule)', () => {
  it('ignores future-dated entries', () => expect(visibleSymptoms([sym('fatigue', 2, 27)], now).shown).toEqual([]));
  it('shows symptoms logged today, yesterday or the day before; hides older; newest first', () => {
    const v = visibleSymptoms([sym('fatigue', 2, 23), sym('nausea', 3, 25), sym('headache', 2, 22), sym('heartburn', 1, 19), sym('constipation', 0, 25)], now);
    expect(v.shown).toEqual(['nausea', 'fatigue']);
    expect(v.hidden).toEqual(['headache', 'heartburn']);
  });
});

describe('trendFor (these 7 days vs the 7 before)', () => {
  it.each([
    ['worse', [sym('x', 1, 13), sym('x', 4, 24), sym('x', 4, 25)], 'worse'],
    ['better', [12, 13, 14, 15].map((d) => sym('x', 3, d)).concat(sym('x', 3, 25)), 'better'],
    ['same within ±0.5', [sym('x', 2, 14), sym('x', 2, 24)], 'same'],
    ['first logged this week', [sym('x', 3, 25)], 'first'],
    ['no earlier entries (logged before, not in the previous 7 days)', [sym('x', 3, 2), sym('x', 3, 25)], 'no-earlier'],
    ['14 days back is inside the previous window', [sym('x', 3, 12), sym('x', 3, 25)], 'same'],
    ['15 days back is outside it', [sym('x', 3, 11), sym('x', 3, 25)], 'no-earlier'],
  ] as const)('%s', (_n, list, expected) => expect(trendFor(max([...list], 'x'), now)).toBe(expected));
});

describe('timingPhrase (7 days)', () => {
  const shot = new Set(['2026-11-23']);
  it.each([
    ['none', [], 'none this week'],
    ['most days', [19, 20, 21, 22, 23].map((d) => sym('x', 2, d)), 'most days'],
    ['peaks on shot day', [sym('x', 4, 23), sym('x', 1, 25)], 'peaks on shot day'],
    ['peaks day after', [sym('x', 2, 23), sym('x', 4, 24)], 'peaks day after shot'],
    ['late in week', [sym('x', 1, 19), sym('x', 3, 25)], 'late in the week'],
    ['early in week', [sym('x', 3, 19), sym('x', 1, 25)], 'early in the week'],
    ['tie: earliest peak wins', [sym('x', 3, 19), sym('x', 3, 25)], 'early in the week'],
  ] as const)('%s', (_n, list, expected) => expect(timingPhrase(max([...list], 'x'), shot, now)).toBe(expected));
});

describe('injection weeks', () => {
  const inj = [4, 11, 18].map((d, i) => ({ datetime: at(d, 8), doseMg: i < 2 ? 0.5 : 1 }));
  const list = [sym('nausea', 4, 5), sym('nausea', 2, 6), sym('nausea', 3, 12), sym('nausea', 1, 19), sym('fatigue', 5, 19)];
  it('averages each injection week for one symptom', () => {
    expect(injectionWeekAverages(list, 'nausea', inj, now)).toEqual([
      { start: '2026-11-04', doseMg: 0.5, count: 2, average: 3 },
      { start: '2026-11-11', doseMg: 0.5, count: 1, average: 3 },
      { start: '2026-11-18', doseMg: 1, count: 1, average: 1 },
    ]);
  });
  it('weekly trend needs 2 weeks on each side', () => {
    const w = (a: number) => ({ start: '', doseMg: 1, count: 1, average: a });
    expect(weeklyTrend([w(3), w(3), w(1), w(1)])).toBe('milder lately');
    expect(weeklyTrend([w(1), w(1), w(3), w(3)])).toBe('stronger lately');
    expect(weeklyTrend([w(2), w(2), w(2.4), w(2)])).toBe('about the same');
    expect(weeklyTrend([w(2), w(2)])).toBe('not enough data');
  });
  it('recentCount covers 8 weeks and skips 0/5', () => expect(recentCount([sym('nausea', 2, 25), sym('nausea', 0, 24), sym('nausea', 2, 1)], 'nausea', now)).toBe(2));
});
