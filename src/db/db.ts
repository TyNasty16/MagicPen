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

export type Site = 'abdomen-left' | 'abdomen-right' | 'thigh-left' | 'thigh-right' | 'arm-left' | 'arm-right';

/** A logged injection. `datetime` is an ISO timestamp (UTC). */
export interface Injection {
  id?: number;
  datetime: string;
  doseMg: number;
  site: Site;
  notes?: string;
}

/** A weigh-in. `date` is a local calendar date, YYYY-MM-DD. */
export interface WeightEntry {
  id?: number;
  date: string;
  weightKg: number;
}

export const db = new Dexie('steady') as Dexie & {
  profile: EntityTable<Profile, 'id'>;
  injections: EntityTable<Injection, 'id'>;
  weights: EntityTable<WeightEntry, 'id'>;
};

// Keep every version declared: Dexie upgrades existing databases in place, so profile data is kept.
db.version(1).stores({ profile: 'id' });
db.version(2).stores({ profile: 'id', injections: '++id, datetime', weights: '++id, date' });

export const getProfile = async (): Promise<Profile | null> => (await db.profile.get('me')) ?? null;

/** True if IndexedDB can be opened (it can fail in some private-browsing modes). */
export const storageAvailable = () => db.open().then(() => true, () => false);

export async function saveProfile(changes: Omit<Partial<Profile>, 'id'>): Promise<void> {
  const current = (await db.profile.get('me')) ?? { id: 'me' as const, units: 'imperial' as const };
  await db.profile.put({ ...current, ...changes, id: 'me' });
}

export const listInjections = () => db.injections.orderBy('datetime').reverse().toArray();
export const listWeights = () => db.weights.orderBy('date').toArray();

export async function saveInjection(entry: Injection): Promise<void> {
  await db.injections.put(entry);
}
export async function saveWeight(entry: WeightEntry): Promise<void> {
  await db.weights.put(entry);
}
