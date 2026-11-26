import { describe, expect, it } from 'vitest';
import type { ReportData } from './report';
import { buildReport, defaultIncluded, defaultPeriod, doseGaps, validPeriod, FOOTER, PRIVACY_NOTE, SHARE_FALLBACK, symptomSummary, weekBlocks, weekCoverage } from './report';

const today = new Date(2026, 10, 26, 10);
const day = (n: number) => { const d = new Date(2026, 10, 26 - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const iso = (n: number, h = 9) => new Date(2026, 10, 26 - n, h).toISOString();
const base = (): ReportData => ({
  profile: { id: 'me', units: 'imperial', heightCm: 175, startWeightKg: 100, goalWeightKg: 80, birthYear: 1985, sex: 'female', activity: 'light', injectionWeekday: 1, drug: 'ozempic' },
  injections: [], weights: [], photoWeightIds: [], measurements: [], symptoms: [], foodLog: [], water: [], dayMarks: [], appointments: [],
});
const food = (n: number, proteinG: number, kcal = 500) => ({ date: day(n), meal: 'none' as const, name: 'Meal', kcal, proteinG, carbsG: 50, fatG: 10, servings: 1, createdAt: iso(n) });
const sec = (r: ReturnType<typeof buildReport>, id: string) => r.sections.find((s) => s.id === id)!;
const texts = (r: ReturnType<typeof buildReport>, id: string) => sec(r, id).blocks.flatMap((b) => (b.kind === 'text' ? [b.text] : []));

describe('period', () => {
  it('defaults to the last appointment on or before today; with none, the first entry; ends today', () => {
    const d = base();
    expect(defaultPeriod(d, today)).toEqual({ start: day(0), end: day(0) });
    d.weights = [{ date: day(40), weightKg: 99 }];
    expect(defaultPeriod(d, today).start).toBe(day(40));
    d.appointments = [{ date: day(27) }, { date: day(10) }, { date: day(-5) }];
    expect(defaultPeriod(d, today)).toEqual({ start: day(10), end: day(0) });
  });
  it('a usable period: real dates, start ≤ end, from 2000, at most about 10 years (a half-typed year can’t freeze the page)', () => {
    expect(validPeriod({ start: '2026-10-01', end: '2026-11-26' })).toBe(true);
    expect(validPeriod({ start: '0002-10-01', end: '2026-11-26' })).toBe(false);
    expect(validPeriod({ start: '2026-11-27', end: '2026-11-26' })).toBe(false);
    expect(validPeriod({ start: '2010-01-01', end: '2026-11-26' })).toBe(false);
    expect(validPeriod({ start: '', end: '2026-11-26' })).toBe(false);
  });
  it('7-day blocks from the start; a last partial block is dropped; under 7 days is one block', () => {
    expect(weekBlocks({ start: '2026-11-01', end: '2026-11-28' })).toHaveLength(4);
    expect(weekBlocks({ start: '2026-11-01', end: '2026-11-10' })).toHaveLength(1);
    expect(weekBlocks({ start: '2026-11-01', end: '2026-11-05' })).toEqual([{ start: '2026-11-01', end: '2026-11-05' }]);
  });
  it('week coverage: an entry in every full block is complete; a missing block is not', () => {
    const p = { start: '2026-11-01', end: '2026-11-28' };
    expect(weekCoverage(['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-27'], p)).toEqual({ covered: 4, weeks: 4 });
    expect(weekCoverage(['2026-11-02', '2026-11-16', '2026-11-27'], p)).toEqual({ covered: 3, weeks: 4 });
  });
});

describe('doses and symptoms', () => {
  it('gaps: 8 days apart is a gap; exactly 7 is not; only inside the period', () => {
    const p = { start: day(30), end: day(0) };
    expect(doseGaps([{ datetime: iso(21) }, { datetime: iso(14) }], p)).toEqual([]);
    expect(doseGaps([{ datetime: iso(22) }, { datetime: iso(14) }], p)).toEqual([{ days: 8, from: day(22), to: day(14) }]);
    expect(doseGaps([{ datetime: iso(45) }, { datetime: iso(14) }], p)).toEqual([]);
  });
  it('symptom summary: days logged and highest severity; 0 and outside the period ignored', () => {
    const s = [
      { datetime: iso(3), type: 'nausea', severity: 2 }, { datetime: iso(3, 18), type: 'nausea', severity: 4 }, { datetime: iso(5), type: 'nausea', severity: 1 },
      { datetime: iso(2), type: 'fatigue', severity: 0 }, { datetime: iso(60), type: 'headache', severity: 5 },
    ];
    expect(symptomSummary(s, { start: day(30), end: day(0) })).toEqual([{ type: 'nausea', days: 2, highest: 4 }]);
  });
});

describe('buildReport', () => {
  it('header, questions from the latest appointment, footer wording', () => {
    const d = base();
    d.profile.name = 'Alex Sample';
    d.appointments = [{ date: day(10), who: 'Prescriber', questions: 'Ask about constipation\n\nRecheck labs?' }];
    d.injections = [{ datetime: iso(60), doseMg: 0.25, site: 'thigh-left', drug: 'ozempic' }];
    const r = buildReport(d, defaultPeriod(d, today), today);
    expect(r.title).toBe('Report for Alex Sample');
    expect(r.subtitle).toBe(`Period covered: Nov 16, 2026 to Nov 26, 2026 · Medicine: Ozempic · Started: Sep 27, 2026 · Made: Nov 26, 2026`);
    expect(texts(r, 'questions')).toEqual(['• Ask about constipation', '• Recheck labs?']);
    expect(FOOTER).toBe('Made with Steady from the owner’s own entries. Not medical advice.');
    expect(buildReport(base(), { start: day(5), end: day(0) }, today).title).toBe('Report');
    expect(texts(buildReport(base(), { start: day(5), end: day(0) }, today), 'questions')).toEqual(['No questions saved.']);
  });
  it('food: averages from logged days only, limited under half; barely-ate days counted separately', () => {
    const d = base();
    d.foodLog = [0, 2, 4, 6, 8, 10, 12, 14, 16].map((n) => food(n, n === 0 ? 60 : 90)); // 9 of 28 days
    d.dayMarks = [{ date: day(1), kind: 'low-intake' }];
    const r = buildReport(d, { start: day(27), end: day(0) }, today);
    const f = sec(r, 'food');
    expect(f.limited).toBe(true);
    expect(f.limitedLine).toBe('Logged on 9 of 28 days. Averages are from logged days only.');
    expect(texts(r, 'food')[0]).toMatch(/^Average protein 87 g \(target \d+ g\), from 9 of 28 days logged\.$/);
    expect(texts(r, 'food')).toContain('“Barely ate” marked on 1 day.');
  });
  it('weight: one weigh-in shows the weight and no change; nothing logged prints one line; weekly coverage flags', () => {
    const d = base();
    d.weights = [{ date: day(3), weightKg: 96 }];
    let r = buildReport(d, { start: day(27), end: day(0) }, today);
    expect(texts(r, 'weight')).toEqual(['One weigh-in: 211.6 lb on Nov 23, 2026.']);
    expect(sec(r, 'weight').limitedLine).toBe('Logged in 1 of 4 weeks');
    d.weights = [26, 19, 12, 5].map((n, i) => ({ date: day(n), weightKg: 99 - i }));
    r = buildReport(d, { start: day(27), end: day(0) }, today);
    expect(sec(r, 'weight').limited).toBe(false);
    expect(texts(r, 'weight')).toContain('Change in period: −6.6 lb (−3%)');
    expect(texts(buildReport(base(), { start: day(27), end: day(0) }, today), 'weight')).toEqual(['Nothing logged in this period.']);
  });
  it('no BMI line without a height', () => {
    const d = base();
    delete d.profile.heightCm;
    d.weights = [{ date: day(9), weightKg: 99 }, { date: day(2), weightKg: 98 }];
    expect(texts(buildReport(d, { start: day(13), end: day(0) }, today), 'weight').some((t) => t.startsWith('BMI'))).toBe(false);
  });
  it('doses: a gap flags the section; changes and switches listed as facts', () => {
    const d = base();
    d.injections = [
      { datetime: iso(40), doseMg: 1.7, site: 'thigh-left' },
      { datetime: iso(20), doseMg: 0.5, site: 'thigh-right', drug: 'ozempic' },
      { datetime: iso(10), doseMg: 0.5, site: 'arm-left', drug: 'ozempic' },
    ];
    const r = buildReport(d, { start: day(27), end: day(0) }, today);
    expect(sec(r, 'doses').limited).toBe(true);
    expect(texts(r, 'doses')).toEqual([
      'Last logged dose: Ozempic 0.5 mg on Nov 16, 2026',
      'Injections logged: 2',
      'Nov 6, 2026: Ozempic 0.5 mg',
      'Gap of 10 days between injections on Nov 6, 2026 and Nov 16, 2026.',
    ]);
  });
  it('default switches: extras off; flagged food/measurements/weight off; doses and side effects on', () => {
    const r = buildReport(base(), { start: day(27), end: day(0) }, today);
    expect(defaultIncluded(r)).toEqual({ questions: true, doses: true, weight: false, symptoms: true, food: false, measurements: false, water: false, foodItems: false, photos: false, notes: false });
  });
  it('no report text advises or interprets', () => {
    const d = base();
    d.weights = [{ date: day(9), weightKg: 99 }, { date: day(2), weightKg: 98 }];
    d.foodLog = [food(1, 50)];
    d.symptoms = [{ datetime: iso(1), type: 'stomach-pain', severity: 5 }];
    const r = buildReport(d, { start: day(13), end: day(0) }, today);
    const all = [r.title, r.subtitle, ...r.sections.flatMap((s) => [s.limitedLine ?? '', ...s.blocks.flatMap((b) => (b.kind === 'text' ? [b.text] : []))]), FOOTER, PRIVACY_NOTE, SHARE_FALLBACK].join(' ');
    expect(all).not.toMatch(/increase|decrease|raise|lower|skip|escalat|titrat|should|recommend|concern/i);
  });
});
