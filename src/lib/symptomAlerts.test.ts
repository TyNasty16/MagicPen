import { describe, expect, it } from 'vitest';
import { ALERT_FOOTER, ALERT_TITLE, symptomAlerts, visibleAlerts } from './symptomAlerts';
import { WHEN_TO_GET_HELP } from './sideEffectText';

const now = new Date(2026, 10, 25, 20, 0); // Wed Nov 25, 8 pm
const at = (daysAgo: number, h = 9) => new Date(2026, 10, 25 - daysAgo, h).toISOString();
const s = (type: string, severity: number, daysAgo: number, h = 9) => ({ type, severity, datetime: at(daysAgo, h) });
const rules = (list: ReturnType<typeof s>[]) => symptomAlerts(list, now).map((a) => [a.type, a.rule]);

describe('rule 1 — severe (5/5) today or yesterday', () => {
  it.each([
    ['today', [s('headache', 5, 0)], [['headache', 1]]],
    ['yesterday', [s('headache', 5, 1)], [['headache', 1]]],
    ['2 days ago', [s('headache', 5, 2)], []],
    ['4/5 is not severe', [s('headache', 4, 0)], []],
  ])('%s', (_n, list, expected) => expect(rules(list)).toEqual(expected));
});

describe('rule 2 — stomach pain 4/5 or more', () => {
  it('fires at 4 with the quoted help line', () => {
    const [a] = symptomAlerts([s('stomach-pain', 4, 0)], now);
    expect(a.rule).toBe(2);
    expect(a.reason).toBe('Stomach pain was logged as 4/5');
    expect(a.extra).toMatch(/^Stop using Wegovy and call your healthcare provider right away/);
  });
  it('3/5 does not fire', () => expect(rules([s('stomach-pain', 3, 0)])).toEqual([]));
});

describe('rule 3 — days in a row (sourced)', () => {
  it.each([
    ['vomiting 2 days ending today', [s('vomiting', 2, 0), s('vomiting', 2, 1)], [['vomiting', 3]]],
    ['vomiting 2 days ending yesterday', [s('vomiting', 2, 1), s('vomiting', 3, 2)], [['vomiting', 3]]],
    ['vomiting run ended 2 days ago', [s('vomiting', 2, 2), s('vomiting', 2, 3)], []],
    ['nausea needs 3', [s('nausea', 2, 0), s('nausea', 2, 1)], []],
    ['nausea 3 in a row', [s('nausea', 2, 0), s('nausea', 2, 1), s('nausea', 3, 2)], [['nausea', 3]]],
    ['a gap breaks the run', [s('diarrhea', 2, 0), s('diarrhea', 2, 1), s('diarrhea', 2, 3)], []],
    ['1/5 days do not count', [s('diarrhea', 1, 0), s('diarrhea', 2, 1), s('diarrhea', 2, 2)], []],
    ['several entries in one day count once', [s('vomiting', 2, 0, 8), s('vomiting', 2, 0, 18)], []],
    ['other symptoms have no day rule', [s('fatigue', 2, 0), s('fatigue', 2, 1), s('fatigue', 2, 2)], []],
  ])('%s', (_n, list, expected) => expect(rules(list)).toEqual(expected));
  it('reason text', () => expect(symptomAlerts([s('vomiting', 2, 0), s('vomiting', 2, 1)], now)[0].reason).toBe('Vomiting logged on 2 days in a row'));
});

describe('rule 4 — 3/5 or more on 5 of the last 7 days', () => {
  it.each([
    ['5 of 7', [0, 1, 2, 4, 6].map((d) => s('fatigue', 3, d)), [['fatigue', 4]]],
    ['4 of 7', [0, 1, 2, 4].map((d) => s('fatigue', 3, d)), []],
    ['day 7 ago is outside', [0, 1, 2, 4, 7].map((d) => s('fatigue', 3, d)), []],
    ['2/5 does not count', [0, 1, 2, 3, 4].map((d) => s('fatigue', 2, d)), []],
  ])('%s', (_n, list, expected) => expect(rules(list)).toEqual(expected));
});

describe('one card per symptom, strongest rule wins', () => {
  it('severe beats days-in-a-row', () => expect(rules([s('nausea', 5, 0), s('nausea', 2, 1), s('nausea', 2, 2)])).toEqual([['nausea', 1]]));
});

describe('visibleAlerts', () => {
  const alerts = symptomAlerts([s('headache', 5, 0, 9), s('dizziness', 5, 0, 10), s('fatigue', 5, 0, 11), s('nausea', 5, 0, 12)], now);
  it('caps at 3, newest first', () => expect(visibleAlerts(alerts, {}).map((a) => a.type)).toEqual(['nausea', 'fatigue', 'dizziness']));
  it('"Hide for now" hides until a newer qualifying entry', () => {
    const hidden = { nausea: at(0, 12) };
    expect(visibleAlerts(alerts, hidden).map((a) => a.type)).not.toContain('nausea');
    const newer = symptomAlerts([s('nausea', 5, 0, 12), s('nausea', 5, 0, 15)], now);
    expect(visibleAlerts(newer, hidden).map((a) => a.type)).toEqual(['nausea']);
  });
});

describe('wording guard', () => {
  it('no alert text mentions doses; the stomach-pain line is the one exact approved quote', () => {
    const all = symptomAlerts([s('stomach-pain', 5, 0), s('vomiting', 2, 0), s('vomiting', 2, 1), ...[0, 1, 2, 3, 4].map((d) => s('fatigue', 3, d))], now);
    for (const text of [ALERT_TITLE, ALERT_FOOTER, ...all.map((a) => a.reason)]) expect(text).not.toMatch(/dose|skip|lower|increase|raise/i);
    for (const a of all) if (a.extra) expect(a.extra).toBe(WHEN_TO_GET_HELP[0]);
  });
});

describe('precedence and edges', () => {
  it('stomach pain at 5/5 is rule 2, not rule 1', () => expect(rules([s('stomach-pain', 5, 0)])).toEqual([['stomach-pain', 2]]));
  it('days-in-a-row beats 5-of-7', () => expect(rules([0, 1, 2, 4, 6].map((d) => s('nausea', 3, d)))).toEqual([['nausea', 3]]));
  it('local midnight: 23:30 two days ago is not "yesterday"; 00:30 yesterday is', () => {
    const atTime = (daysAgo: number, h: number, m: number) => ({ type: 'headache', severity: 5, datetime: new Date(2026, 10, 25 - daysAgo, h, m).toISOString() });
    expect(rules([atTime(2, 23, 30)])).toEqual([]);
    expect(rules([atTime(1, 0, 30)])).toEqual([['headache', 1]]);
  });
  it('future-dated entries do not count as recent', () => expect(rules([s('headache', 5, -2)])).toEqual([]));
});
