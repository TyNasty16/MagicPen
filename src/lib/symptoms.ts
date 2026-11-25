import type { Injection, Symptom } from '../db/db';
import { daysBetween } from './dates';

export const SYMPTOM_TYPES: { id: string; label: string }[] = [
  { id: 'nausea', label: 'Nausea' },
  { id: 'vomiting', label: 'Vomiting' },
  { id: 'diarrhea', label: 'Diarrhea' },
  { id: 'constipation', label: 'Constipation' },
  { id: 'stomach-pain', label: 'Stomach pain' },
  { id: 'heartburn', label: 'Heartburn / reflux' },
  { id: 'burping', label: 'Burping' },
  { id: 'bloating', label: 'Bloating / gas' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'headache', label: 'Headache' },
  { id: 'dizziness', label: 'Dizziness' },
  { id: 'low-appetite', label: 'Low appetite' },
  { id: 'hair-shedding', label: 'Hair shedding' },
  { id: 'injection-site', label: 'Injection-site reaction' },
  { id: 'other', label: 'Other' },
];

export const symptomLabel = (id: string) => SYMPTOM_TYPES.find((t) => t.id === id)?.label ?? id;

/** Severity 1 (mild) – 5 (severe). 0/5 is not logged (owner decision, Workflow 04c). */
export const isValidSeverity = (n: number) => Number.isInteger(n) && n >= 1 && n <= 5;

/** Local calendar days since the latest injection at or before the symptom (0–6), or null. */
export function daysSinceLastInjection(symptomIso: string, injectionIsos: string[]): number | null {
  const at = new Date(symptomIso).getTime();
  let latest: string | undefined;
  for (const i of injectionIsos) if (new Date(i).getTime() <= at && (!latest || i > latest)) latest = i;
  if (!latest) return null;
  const d = daysBetween(new Date(latest), new Date(symptomIso));
  return d <= 6 ? d : null;
}

export interface DayBucket {
  day: number; // 0–6 days after an injection
  count: number;
  average?: number;
}

/** Average severity of one symptom type by days since the last injection. */
export function patternByDay(symptoms: Pick<Symptom, 'datetime' | 'type' | 'severity'>[], injections: Pick<Injection, 'datetime'>[], type: string): DayBucket[] {
  const isos = injections.map((i) => i.datetime);
  const sums = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }));
  for (const s of symptoms) {
    if (s.type !== type || s.severity < 1) continue; // ignore any old 0/5 entries
    const d = daysSinceLastInjection(s.datetime, isos);
    if (d === null) continue;
    sums[d].total += s.severity;
    sums[d].count++;
  }
  return sums.map((b, day) => ({ day, count: b.count, average: b.count ? Math.round((b.total / b.count) * 10) / 10 : undefined }));
}
