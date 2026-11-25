import type { Injection, Site } from '../db/db';

/** Wegovy pen strengths (mg). For logging only. */
export const WEGOVY_DOSES_MG = [0.25, 0.5, 1, 1.7, 2.4];

export const SITES: { id: Site; label: string }[] = [
  { id: 'abdomen-left', label: 'Left abdomen' },
  { id: 'abdomen-right', label: 'Right abdomen' },
  { id: 'thigh-left', label: 'Left thigh' },
  { id: 'thigh-right', label: 'Right thigh' },
  { id: 'arm-left', label: 'Left upper arm' },
  { id: 'arm-right', label: 'Right upper arm' },
];

export const siteLabel = (site: Site) => SITES.find((s) => s.id === site)?.label ?? site;

/** The site used longest ago; never-used sites first (in SITES order). */
export function suggestSite(history: Pick<Injection, 'site' | 'datetime'>[]): Site {
  const lastUsed = new Map<Site, string>();
  for (const h of history) {
    const prev = lastUsed.get(h.site);
    if (!prev || h.datetime > prev) lastUsed.set(h.site, h.datetime);
  }
  let best = SITES[0].id;
  let bestTime: string | undefined;
  for (const { id } of SITES) {
    const t = lastUsed.get(id);
    if (t === undefined) return id;
    if (bestTime === undefined || t < bestTime) {
      best = id;
      bestTime = t;
    }
  }
  return best;
}

export const formatDose = (mg: number) => `${mg} mg`;
