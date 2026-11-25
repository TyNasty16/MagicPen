import Dexie, { type EntityTable } from 'dexie';
import type { Activity, Sex, Targets } from '../lib/targets';
import type { UnitSystem } from '../lib/units';

/** The single profile record. All measurements metric. */
export interface Profile {
  id: 'me';
  disclaimerAcceptedAt?: string;
  units: UnitSystem;
  heightCm?: number;
  startWeightKg?: number;
  goalWeightKg?: number;
  birthYear?: number;
  sex?: Sex;
  activity?: Activity;
  injectionWeekday?: number; // 0 = Sunday
  proteinPerKg?: number;
  overrides?: Partial<Targets>;
}

export const db = new Dexie('steady') as Dexie & { profile: EntityTable<Profile, 'id'> };

db.version(1).stores({ profile: 'id' });

export const getProfile = async (): Promise<Profile | null> => (await db.profile.get('me')) ?? null;

/** True if IndexedDB can be opened (it can fail in some private-browsing modes). */
export const storageAvailable = () => db.open().then(() => true, () => false);

export async function saveProfile(changes: Omit<Partial<Profile>, 'id'>): Promise<void> {
  const current = (await db.profile.get('me')) ?? { id: 'me' as const, units: 'imperial' as const };
  await db.profile.put({ ...current, ...changes, id: 'me' });
}
