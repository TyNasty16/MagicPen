import type { Appointment } from '../db/db';

export const TEXT_MAX = 2000;
export const WHO_MAX = 120;

/**
 * The owner's own text: control characters and invisible direction marks removed (line breaks kept for notes),
 * trimmed, length capped. Stored and shown as plain text only. Empty becomes undefined.
 */
export function cleanText(v: string, max = TEXT_MAX, multiline = true): string | undefined {
  if (!multiline) v = v.replace(/\s+/g, ' '); // one line: any line break becomes a space first
  // eslint-disable-next-line no-control-regex
  let t = v.replace(multiline ? /[\u0000-\u0009\u000b-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g : /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g, '');
  t = (multiline ? t.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n') : t.replace(/\s+/g, ' ')).trim().slice(0, max);
  return t || undefined;
}

/** Newest first; same day keeps the later-added entry first. */
export const sortAppointments = (list: Appointment[]) => [...list].sort((a, b) => b.date.localeCompare(a.date) || (b.id ?? 0) - (a.id ?? 0));

/** The latest appointment on or before `day` (YYYY-MM-DD); future visits are ignored. */
export function lastAppointmentOnOrBefore(day: string, list: Appointment[]): Appointment | undefined {
  return sortAppointments(list.filter((a) => a.date <= day))[0];
}
