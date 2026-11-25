// Graph range filtering and dose-change detection (facts only).
import type { Injection } from '../db/db';
import { addDays, dayKey, fromDayKey, startOfDay } from './dates';

export type Range = '30d' | '90d' | 'all';
export const RANGES: { id: Range; label: string }[] = [
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'all', label: 'All' },
];

/** First day (YYYY-MM-DD) included in the range, or undefined for All. */
export function rangeStart(range: Range, today = new Date()): string | undefined {
  if (range === 'all') return undefined;
  return dayKey(addDays(startOfDay(today), -(range === '30d' ? 29 : 89)));
}

export function filterRange<T extends { date: string }>(rows: T[], range: Range, today = new Date()): T[] {
  const from = rangeStart(range, today);
  return from ? rows.filter((r) => r.date >= from) : rows;
}

export interface DoseChange {
  date: string; // local day of the injection
  doseMg: number;
  first: boolean;
}

/** The first logged dose and every injection whose dose differs from the one before it. */
export function doseChanges(injections: Pick<Injection, 'datetime' | 'doseMg'>[]): DoseChange[] {
  const sorted = [...injections].sort((a, b) => a.datetime.localeCompare(b.datetime));
  const out: DoseChange[] = [];
  sorted.forEach((inj, i) => {
    if (i === 0 || inj.doseMg !== sorted[i - 1].doseMg) out.push({ date: dayKey(new Date(inj.datetime)), doseMg: inj.doseMg, first: i === 0 });
  });
  return out;
}

export interface PlacedMark {
  date: string;
  label: string;
  t: number;
  showLabel: boolean; // false when the label would run into the previous one (the line still shows)
}

/**
 * Dose marks inside the visible window [from, to] (epoch ms). Labels are skipped when they would overlap the previous
 * label; widths are estimated at ~6px per character on a plot ~270px wide.
 */
export function placeDoseMarks(marks: { date: string; label: string }[], from: number, to: number): PlacedMark[] {
  const span = to - from || 1;
  let lastEnd = -Infinity;
  return marks
    .map((m) => ({ ...m, t: fromDayKey(m.date).getTime() }))
    .filter((m) => m.t >= from && m.t <= to)
    .map((m) => {
      const showLabel = m.t >= lastEnd;
      if (showLabel) lastEnd = m.t + ((m.label.length * 6 + 10) / 270) * span;
      return { ...m, showLabel };
    });
}

/** For each point date, the dose changes since the previous point (only marks that are visible). */
export function doseNotesByPoint(pointDates: string[], marks: { date: string; label: string }[]): Map<string, string[]> {
  const notes = new Map<string, string[]>();
  for (const m of marks) {
    const at = pointDates.find((d) => d >= m.date);
    if (at) notes.set(at, [...(notes.get(at) ?? []), m.label]);
  }
  return notes;
}
