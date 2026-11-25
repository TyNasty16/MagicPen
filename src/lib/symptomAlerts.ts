// "Take a closer look" alerts from logged symptoms. Not medical advice; never mentions doses.
// Rule 3 durations come from MedlinePlus / Mayo Clinic; the other thresholds are owner-chosen defaults (Workflow 04b).
import type { Symptom } from '../db/db';
import { addDays, dayKey, startOfDay } from './dates';
import { helpFor } from './sideEffectText';
import type { DrugId } from './drugs';
import { symptomLabel } from './symptoms';

export const SEVERE = 5; // rule 1
export const STRONG_STOMACH_PAIN = 4; // rule 2
export const LASTING_MIN_SEVERITY = 2; // rule 3: a 1/5 day doesn't count toward "in a row"
export const LASTING_DAYS: Record<string, number> = { vomiting: 2, nausea: 3, diarrhea: 3 }; // rule 3 (sourced)
export const FREQUENT_MIN_SEVERITY = 3; // rule 4
export const FREQUENT_DAYS = 5; // rule 4: days out of the last 7
export const MAX_CARDS = 3;

export const ALERT_TITLE = 'Take a closer look';
export const ALERT_FOOTER = 'This isn’t medical advice. If you’re unsure, contact your healthcare provider.';

export interface SymptomAlert {
  type: string;
  rule: 1 | 2 | 3 | 4;
  reason: string;
  extra?: string; // quoted help-box line (stomach pain)
  latest: string; // ISO time of the newest entry behind the alert (used for "Hide for now")
}

export function symptomAlerts(symptoms: Pick<Symptom, 'datetime' | 'type' | 'severity'>[], now = new Date(), drug: DrugId = 'wegovy'): SymptomAlert[] {
  const today = startOfDay(now);
  const todayKey = dayKey(today);
  const recentFrom = dayKey(addDays(today, -1)); // today or yesterday
  const weekFrom = dayKey(addDays(today, -6));
  const byType = new Map<string, typeof symptoms>();
  for (const s of symptoms) byType.set(s.type, [...(byType.get(s.type) ?? []), s]);

  const alerts: SymptomAlert[] = [];
  for (const [type, entries] of byType) {
    const label = symptomLabel(type);
    const day = (s: (typeof entries)[number]) => dayKey(new Date(s.datetime));
    const newest = (list: typeof entries) => list.reduce((a, b) => (b.datetime > a ? b.datetime : a), '');
    const recent = entries.filter((s) => day(s) >= recentFrom && day(s) <= todayKey); // future-dated entries don't count

    // Rule 2 (stomach pain) and rule 1 (severe) come first.
    const strongPain = type === 'stomach-pain' ? recent.filter((s) => s.severity >= STRONG_STOMACH_PAIN) : [];
    if (strongPain.length) {
      const top = Math.max(...strongPain.map((s) => s.severity));
      alerts.push({ type, rule: 2, reason: `Stomach pain was logged as ${top}/5`, extra: helpFor(drug)[0], latest: newest(strongPain) });
      continue;
    }
    const severe = recent.filter((s) => s.severity >= SEVERE);
    if (severe.length) {
      alerts.push({ type, rule: 1, reason: `${label} was logged as severe (5/5)`, latest: newest(severe) });
      continue;
    }

    // Rule 3: consecutive days (ending today or yesterday) at severity 2+.
    const need = LASTING_DAYS[type];
    if (need) {
      const qualifying = entries.filter((s) => s.severity >= LASTING_MIN_SEVERITY);
      const days = new Set(qualifying.map(day));
      let start = days.has(dayKey(today)) ? today : days.has(recentFrom) ? addDays(today, -1) : undefined;
      let run = 0;
      while (start && days.has(dayKey(start))) {
        run++;
        start = addDays(start, -1);
      }
      if (run >= need) {
        alerts.push({ type, rule: 3, reason: `${label} logged on ${run} days in a row`, latest: newest(qualifying) });
        continue;
      }
    }

    // Rule 4: severity 3+ on 5 or more of the last 7 days.
    const frequent = entries.filter((s) => s.severity >= FREQUENT_MIN_SEVERITY && day(s) >= weekFrom && day(s) <= todayKey);
    const n = new Set(frequent.map(day)).size;
    if (n >= FREQUENT_DAYS) alerts.push({ type, rule: 4, reason: `${label} has been logged on ${n} of the last 7 days`, latest: newest(frequent) });
  }
  return alerts.sort((a, b) => b.latest.localeCompare(a.latest));
}

/** Drops alerts hidden with "Hide for now" unless a newer qualifying entry has arrived since; caps the count. */
export function visibleAlerts(alerts: SymptomAlert[], hidden: Record<string, string>): SymptomAlert[] {
  return alerts.filter((a) => !hidden[a.type] || a.latest > hidden[a.type]).slice(0, MAX_CARDS);
}
