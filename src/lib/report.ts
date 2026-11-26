// Doctor report (workflow 08b): pure maths and the approved wording. No PDF or UI code.
// Facts from the owner's own entries only — never advice, never interpretation (docs/ideas/08-doctor-report-brief.md).
import type { Appointment, DayMark, FoodLogEntry, Injection, Measurement, Profile, Symptom, WaterEntry, WeightEntry } from '../db/db';
import { lastAppointmentOnOrBefore, sortAppointments } from './appointments';
import { bmi, MEASURE_FIELDS } from './body';
import { addDays, dayKey, daysBetween, fromDayKey } from './dates';
import { drugName, drugOf } from './drugs';
import { formatDrugDose } from './injections';
import { dayTotals, whole } from './nutrition';
import { effectiveTargets } from './profileTargets';
import { doseChanges, doseMarkLabel } from './range';
import { symptomAlerts } from './symptomAlerts';
import { symptomLabel } from './symptoms';
import { displayLength, displayWeight, lengthUnit, mlToFlOz, round1, weightUnit } from './units';
import { dailyWeights, latestWeightKg } from './weight';

export type SectionId = 'questions' | 'doses' | 'weight' | 'symptoms' | 'food' | 'measurements' | 'water' | 'foodItems' | 'photos' | 'notes';

export const SECTIONS: { id: SectionId; title: string; extra?: boolean }[] = [
  { id: 'questions', title: 'Questions for this visit' },
  { id: 'doses', title: 'Medicine and doses' },
  { id: 'weight', title: 'Weight' },
  { id: 'symptoms', title: 'Side effects' },
  { id: 'food', title: 'Food and protein' },
  { id: 'measurements', title: 'Measurements' },
  { id: 'water', title: 'Water', extra: true },
  { id: 'foodItems', title: 'Food items', extra: true },
  { id: 'photos', title: 'Photos', extra: true },
  { id: 'notes', title: 'Past appointment notes', extra: true },
];

export const FOOTER = 'Made with Steady from the owner’s own entries. Not medical advice.';
export const PRIVACY_NOTE = 'This report is made on your phone. Once you share it, the PDF is outside the app and Steady can’t take it back or control who sees it.';
export const SHARE_FALLBACK = 'Sharing isn’t available here. The PDF was downloaded instead.';
export const NOTHING = 'Nothing logged in this period.';

export interface ReportData {
  profile: Profile;
  injections: Injection[];
  weights: WeightEntry[];
  photoWeightIds: number[]; // weigh-ins that have a photo
  measurements: Measurement[];
  symptoms: Symptom[];
  foodLog: FoodLogEntry[];
  water: WaterEntry[];
  dayMarks: DayMark[];
  appointments: Appointment[];
}

export interface Period { start: string; end: string } // YYYY-MM-DD, inclusive

export type Block =
  | { kind: 'text'; text: string; muted?: boolean }
  | { kind: 'table'; head: string[]; rows: string[][]; align?: ('left' | 'right')[] }
  | { kind: 'chart'; points: { date: string; value: number }[]; unit: string }
  | { kind: 'photos'; items: { weightId: number; caption: string }[] };

export interface Section { id: SectionId; title: string; limited: boolean; limitedLine?: string; empty: boolean; blocks: Block[] }
export interface Report { title: string; subtitle: string; name?: string; period: Period; sections: Section[] }

/** "Nov 20, 2026" — fixed US style so the report reads the same everywhere. */
export const reportDate = (key: string) => fromDayKey(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const inPeriod = (key: string, p: Period) => key >= p.start && key <= p.end;
const localKey = (iso: string) => dayKey(new Date(iso));
export const periodDays = (p: Period) => daysBetween(fromDayKey(p.start), fromDayKey(p.end)) + 1;
export const MAX_PERIOD_DAYS = 3660; // about 10 years

/** A usable period: real dates, start on or before end, no earlier than 2000, at most about 10 years. */
export const validPeriod = (p: Period) =>
  /^\d{4}-\d{2}-\d{2}$/.test(p.start) && /^\d{4}-\d{2}-\d{2}$/.test(p.end) && p.start >= '2000-01-01' && p.start <= p.end && periodDays(p) <= MAX_PERIOD_DAYS;

/** Earliest day with any entry (or undefined). */
function firstEntryDay(d: ReportData): string | undefined {
  const keys = [
    ...d.injections.map((i) => localKey(i.datetime)), ...d.weights.map((w) => w.date), ...d.measurements.map((m) => m.date),
    ...d.symptoms.map((s) => localKey(s.datetime)), ...d.foodLog.map((f) => f.date), ...d.water.map((w) => w.date),
  ];
  return keys.sort()[0];
}

/** Default period: since the last appointment on or before today; with none, since the first entry. Ends today. */
export function defaultPeriod(d: ReportData, today: Date): Period {
  const end = dayKey(today);
  const start = lastAppointmentOnOrBefore(end, d.appointments)?.date ?? firstEntryDay(d) ?? end;
  return { start: start <= end ? start : end, end };
}

/** 7-day blocks from the period start; a last partial block is dropped (a period under 7 days is one block). */
export function weekBlocks(p: Period): Period[] {
  const n = periodDays(p);
  if (n < 7) return [p];
  const out: Period[] = [];
  for (let i = 0; i + 7 <= n; i += 7) out.push({ start: dayKey(addDays(fromDayKey(p.start), i)), end: dayKey(addDays(fromDayKey(p.start), i + 6)) });
  return out;
}

/** Weeks (blocks) with at least one entry, of all blocks. */
export function weekCoverage(dates: string[], p: Period): { covered: number; weeks: number } {
  const blocks = weekBlocks(p);
  return { covered: blocks.filter((b) => dates.some((x) => inPeriod(x, b))).length, weeks: blocks.length };
}

/** Gaps over 7 days between consecutive injections inside the period. */
export function doseGaps(injections: Pick<Injection, 'datetime'>[], p: Period): { days: number; from: string; to: string }[] {
  const keys = injections.map((i) => localKey(i.datetime)).filter((k) => inPeriod(k, p)).sort();
  const out: { days: number; from: string; to: string }[] = [];
  for (let i = 1; i < keys.length; i++) {
    const days = daysBetween(fromDayKey(keys[i - 1]), fromDayKey(keys[i]));
    if (days > 7) out.push({ days, from: keys[i - 1], to: keys[i] });
  }
  return out;
}

/** Each symptom in the period: days logged (severity ≥ 1) and highest severity. */
export function symptomSummary(symptoms: Pick<Symptom, 'datetime' | 'type' | 'severity'>[], p: Period): { type: string; days: number; highest: number }[] {
  const by = new Map<string, { days: Set<string>; highest: number }>();
  for (const s of symptoms) {
    const k = localKey(s.datetime);
    if (s.severity < 1 || !inPeriod(k, p)) continue;
    const e = by.get(s.type) ?? { days: new Set<string>(), highest: 0 };
    e.days.add(k);
    e.highest = Math.max(e.highest, s.severity);
    by.set(s.type, e);
  }
  return [...by].map(([type, e]) => ({ type, days: e.days.size, highest: e.highest })).sort((a, b) => b.days - a.days || b.highest - a.highest);
}

/** "Take a closer look" cards that would have shown on some day in the period (first day each appeared). */
export function alertsInPeriod(d: ReportData, p: Period): { reason: string; first: string }[] {
  const seen = new Map<string, { reason: string; first: string }>();
  const drug = drugOf(d.profile);
  // Alerts only change on days with an entry (and the day after), so only those days are checked.
  const days = new Set<string>();
  for (const s of d.symptoms) {
    const k = localKey(s.datetime);
    for (const x of [k, dayKey(addDays(fromDayKey(k), 1))]) if (inPeriod(x, p)) days.add(x);
  }
  for (const key of [...days].sort()) {
    const day = fromDayKey(key);
    const now = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59);
    for (const a of symptomAlerts(d.symptoms.filter((s) => new Date(s.datetime) <= now), now, drug)) {
      const key = `${a.type}:${a.rule}`;
      if (!seen.has(key)) seen.set(key, { reason: a.reason, first: dayKey(day) });
    }
  }
  return [...seen.values()];
}

/** Average over logged days only. */
export function loggedDayAverage(valuesByDay: Map<string, number>): { average: number; logged: number } {
  const v = [...valuesByDay.values()];
  return { average: v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0, logged: v.length };
}

const lb = (kg: number, d: ReportData) => `${displayWeight(kg, d.profile.units)} ${weightUnit(d.profile.units)}`;

export function buildReport(d: ReportData, p: Period, made: Date): Report {
  const units = d.profile.units;
  const n = periodDays(p);
  const drug = drugOf(d.profile);
  const injAll = [...d.injections].sort((a, b) => a.datetime.localeCompare(b.datetime));
  const inj = injAll.filter((i) => inPeriod(localKey(i.datetime), p));
  const started = injAll[0] ? reportDate(localKey(injAll[0].datetime)) : '—';
  const name = d.profile.name?.trim() || undefined;
  const targets = effectiveTargets(d.profile, latestWeightKg(d.weights.filter((w) => w.date <= p.end)));
  const sections: Section[] = [];
  const section = (id: SectionId, blocks: Block[], opts: { limited?: boolean; limitedLine?: string; empty?: boolean } = {}) =>
    sections.push({ id, title: SECTIONS.find((s) => s.id === id)!.title, blocks, limited: !!opts.limited, limitedLine: opts.limitedLine, empty: !!opts.empty });

  // Questions: from the latest appointment on or before the end of the period, in the owner's own words.
  const appt = lastAppointmentOnOrBefore(p.end, d.appointments);
  const qs = (appt?.questions ?? '').split('\n').map((q) => q.trim()).filter(Boolean);
  section('questions', qs.length ? qs.map((q) => ({ kind: 'text', text: `• ${q}` })) : [{ kind: 'text', text: 'No questions saved.', muted: true }], { empty: !qs.length });

  // Medicine and doses
  const gaps = doseGaps(inj, p);
  if (!inj.length) section('doses', [{ kind: 'text', text: 'No injections logged in this period.', muted: true }], { empty: true });
  else {
    const last = inj.at(-1)!;
    const changes = doseChanges(injAll).filter((c) => inPeriod(c.date, p));
    const blocks: Block[] = [
      { kind: 'text', text: `Last logged dose: ${formatDrugDose(last)} on ${reportDate(localKey(last.datetime))}` },
      { kind: 'text', text: `Injections logged: ${inj.length}` },
      ...changes.map((c): Block => ({ kind: 'text', text: `${reportDate(c.date)}: ${doseMarkLabel(c)}` })),
      ...gaps.map((g): Block => ({ kind: 'text', text: `Gap of ${g.days} days between injections on ${reportDate(g.from)} and ${reportDate(g.to)}.` })),
    ];
    section('doses', blocks, { limited: gaps.length > 0, limitedLine: gaps.length ? `Gap of ${gaps[0].days} days between injections on ${reportDate(gaps[0].from)} and ${reportDate(gaps[0].to)}.` : undefined });
  }

  // Weight
  const daily = dailyWeights(d.weights.filter((w) => inPeriod(w.date, p)));
  const wCov = weekCoverage(daily.map((x) => x.date), p);
  const wLimited = wCov.covered < wCov.weeks;
  const wLine = `Logged in ${wCov.covered} of ${wCov.weeks} weeks`;
  if (!daily.length) section('weight', [{ kind: 'text', text: NOTHING, muted: true }], { limited: true, limitedLine: NOTHING, empty: true });
  else if (daily.length === 1) section('weight', [{ kind: 'text', text: `One weigh-in: ${lb(daily[0].kg, d)} on ${reportDate(daily[0].date)}.` }], { limited: wLimited, limitedLine: wLine });
  else {
    const first = daily[0], last = daily.at(-1)!;
    const diff = last.kg - first.kg;
    const pct = round1((Math.abs(diff) / first.kg) * 100);
    const shown = displayWeight(Math.abs(diff), units);
    const sign = shown === 0 ? '' : diff < 0 ? '−' : '+';
    const blocks: Block[] = [
      { kind: 'text', text: `Start of period: ${lb(first.kg, d)} (${reportDate(first.date)})` },
      { kind: 'text', text: `Now: ${lb(last.kg, d)} (${reportDate(last.date)})` },
      { kind: 'text', text: `Change in period: ${sign}${displayWeight(Math.abs(diff), units)} ${weightUnit(units)} (${sign}${pct}%)` },
    ];
    if (d.profile.heightCm) blocks.push({ kind: 'text', text: `BMI: ${round1(bmi(last.kg, d.profile.heightCm))}` });
    if (d.profile.startWeightKg) {
      const s = last.kg - d.profile.startWeightKg;
      const sShown = displayWeight(Math.abs(s), units);
      blocks.push({ kind: 'text', text: `Change since start (${lb(d.profile.startWeightKg, d)}): ${sShown === 0 ? '' : s < 0 ? '−' : '+'}${sShown} ${weightUnit(units)}` });
    }
    blocks.push({ kind: 'chart', points: daily.map((x) => ({ date: x.date, value: displayWeight(x.kg, units) })), unit: weightUnit(units) });
    section('weight', blocks, { limited: wLimited, limitedLine: wLine });
  }

  // Side effects
  const summary = symptomSummary(d.symptoms, p);
  if (!summary.length) section('symptoms', [{ kind: 'text', text: 'None logged in this period.', muted: true }], { limited: true, limitedLine: 'None logged in this period.', empty: true });
  else {
    const alerts = alertsInPeriod(d, p);
    section('symptoms', [
      { kind: 'table', head: ['Symptom', 'Days logged', 'Highest (1–5)'], rows: summary.map((s) => [symptomLabel(s.type), String(s.days), String(s.highest)]), align: ['left', 'right', 'right'] },
      ...alerts.map((a): Block => ({ kind: 'text', text: `“Take a closer look” shown from ${reportDate(a.first)}: ${a.reason}` })),
    ]);
  }

  // Food and protein (averages over logged days only)
  const foodIn = d.foodLog.filter((f) => inPeriod(f.date, p));
  const byDay = new Map<string, FoodLogEntry[]>();
  for (const f of foodIn) byDay.set(f.date, [...(byDay.get(f.date) ?? []), f]);
  const kcal = loggedDayAverage(new Map([...byDay].map(([k, v]) => [k, dayTotals(v).kcal])));
  const protein = loggedDayAverage(new Map([...byDay].map(([k, v]) => [k, dayTotals(v).proteinG])));
  const barely = d.dayMarks.filter((m) => inPeriod(m.date, p)).length;
  const fLimited = kcal.logged < n / 2;
  const fLine = `Logged on ${kcal.logged} of ${n} days. Averages are from logged days only.`;
  if (!kcal.logged) section('food', [{ kind: 'text', text: NOTHING, muted: true }, ...(barely ? [{ kind: 'text', text: `“Barely ate” marked on ${barely} ${barely === 1 ? 'day' : 'days'}.` } as Block] : [])], { limited: true, limitedLine: NOTHING, empty: true });
  else
    section('food', [
      { kind: 'text', text: `Average protein ${whole(protein.average)} g${targets ? ` (target ${targets.proteinG} g)` : ''}, from ${protein.logged} of ${n} days logged.` },
      { kind: 'text', text: `Average calories ${whole(kcal.average)} kcal${targets ? ` (target ${targets.calories.toLocaleString('en-US')} kcal)` : ''}, from ${kcal.logged} of ${n} days logged.` },
      ...(barely ? [{ kind: 'text', text: `“Barely ate” marked on ${barely} ${barely === 1 ? 'day' : 'days'}.` } as Block] : []),
    ], { limited: fLimited, limitedLine: fLine });

  // Measurements
  const mIn = d.measurements.filter((m) => inPeriod(m.date, p)).sort((a, b) => a.date.localeCompare(b.date));
  const mCov = weekCoverage(mIn.map((m) => m.date), p);
  if (!mIn.length) section('measurements', [{ kind: 'text', text: NOTHING, muted: true }], { limited: true, limitedLine: NOTHING, empty: true });
  else {
    const rows: string[][] = [];
    for (const f of MEASURE_FIELDS) {
      const vals = mIn.filter((m) => m[f.key] !== undefined);
      if (!vals.length) continue;
      const fmt = (v: number) => (f.kind === 'percent' ? `${round1(v)}%` : `${displayLength(v, units)} ${lengthUnit(units)}`);
      const a = vals[0][f.key]!, b = vals.at(-1)![f.key]!;
      rows.push([f.label, fmt(a), vals.length > 1 ? fmt(b) : '—']);
    }
    section('measurements', [{ kind: 'table', head: ['Measurement', 'First in period', 'Latest'], rows, align: ['left', 'right', 'right'] }], { limited: mCov.covered < mCov.weeks, limitedLine: `Logged in ${mCov.covered} of ${mCov.weeks} weeks` });
  }

  // Water (extra)
  const waterByDay = new Map<string, number>();
  for (const w of d.water.filter((x) => inPeriod(x.date, p))) waterByDay.set(w.date, (waterByDay.get(w.date) ?? 0) + w.ml);
  const water = loggedDayAverage(waterByDay);
  const wAmt = (ml: number) => (units === 'imperial' ? `${Math.round(mlToFlOz(ml))} fl oz` : `${(ml / 1000).toFixed(1)} L`);
  section('water', water.logged ? [{ kind: 'text', text: `Average water ${wAmt(water.average)} a day${targets ? ` (target ${wAmt(targets.waterMl)})` : ''}, from ${water.logged} of ${n} days logged.` }] : [{ kind: 'text', text: NOTHING, muted: true }], { empty: !water.logged, limited: !water.logged, limitedLine: water.logged ? undefined : NOTHING });

  // Food items (extra)
  const items = [...foodIn].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  section('foodItems', items.length ? [{ kind: 'table', head: ['Date', 'Food', 'Servings', 'Protein g', 'kcal'], rows: items.map((f) => [reportDate(f.date), f.name, String(f.servings), whole(f.proteinG * f.servings), whole(f.kcal * f.servings)]), align: ['left', 'left', 'right', 'right', 'right'] }] : [{ kind: 'text', text: NOTHING, muted: true }], { empty: !items.length });

  // Photos (extra): the first and the latest weigh-in photo in the period
  const withPhoto = [...d.weights].filter((w) => w.id !== undefined && inPeriod(w.date, p) && d.photoWeightIds.includes(w.id)).sort((a, b) => a.date.localeCompare(b.date));
  const picks = withPhoto.length > 1 ? [withPhoto[0], withPhoto.at(-1)!] : withPhoto;
  section('photos', picks.length ? [{ kind: 'photos', items: picks.map((w) => ({ weightId: w.id!, caption: `${reportDate(w.date)} · ${lb(w.weightKg, d)}` })) }] : [{ kind: 'text', text: 'No photos in this period.', muted: true }], { empty: !picks.length });

  // Past appointment notes (extra), the owner's own words
  const notes = sortAppointments(d.appointments.filter((a) => inPeriod(a.date, p) && a.notes)).reverse();
  section('notes', notes.length ? notes.map((a): Block => ({ kind: 'text', text: `${reportDate(a.date)}${a.who ? ` · ${a.who}` : ''}: ${a.notes!.replace(/\s*\n\s*/g, ' / ')}` })) : [{ kind: 'text', text: 'No notes in this period.', muted: true }], { empty: !notes.length });

  return {
    title: name ? `Report for ${name}` : 'Report',
    subtitle: `Period covered: ${reportDate(p.start)} to ${reportDate(p.end)} · Medicine: ${drugName(drug)} · Started: ${started} · Made: ${reportDate(dayKey(made))}`,
    name,
    period: p,
    sections,
  };
}

/** Default switches: extras off; flagged food, measurements and weight off; doses and side effects on even when flagged. */
export function defaultIncluded(r: Report): Record<SectionId, boolean> {
  const out = {} as Record<SectionId, boolean>;
  for (const s of r.sections) {
    const extra = SECTIONS.find((x) => x.id === s.id)!.extra;
    out[s.id] = extra ? false : s.limited && (s.id === 'food' || s.id === 'measurements' || s.id === 'weight') ? false : true;
  }
  return out;
}

export const reportFileName = (made: Date) => `Steady-report-${dayKey(made)}.pdf`;
