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

/** A progress photo attached to one weigh-in. Kept in its own table so weight lists never load image data. */
export interface Photo {
  id?: number;
  weightId: number;
  blob: Blob;
  createdAt: string;
}

export const db = new Dexie('steady') as Dexie & {
  profile: EntityTable<Profile, 'id'>;
  injections: EntityTable<Injection, 'id'>;
  weights: EntityTable<WeightEntry, 'id'>;
  photos: EntityTable<Photo, 'id'>;
};

// Keep every version declared: Dexie upgrades existing databases in place, so profile data is kept.
db.version(1).stores({ profile: 'id' });
db.version(2).stores({ profile: 'id', injections: '++id, datetime', weights: '++id, date' });
db.version(3).stores({ profile: 'id', injections: '++id, datetime', weights: '++id, date', photos: '++id, weightId' });

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
/** Deletes a weigh-in together with its photo. */
export const deleteWeight = (id: number) =>
  db.transaction('rw', db.weights, db.photos, async () => {
    await db.photos.where('weightId').equals(id).delete();
    await db.weights.delete(id);
  });

/** Ids of weigh-ins that have a photo (reads index keys only, not the images). */
export const weightIdsWithPhotos = async () => new Set((await db.photos.orderBy('weightId').uniqueKeys()) as number[]);

export const getPhoto = (weightId: number) => db.photos.where('weightId').equals(weightId).first();

export const deletePhoto = (weightId: number) => db.photos.where('weightId').equals(weightId).delete();

/**
 * Saves a weigh-in and applies a photo change in one transaction, so a failed photo write
 * (e.g. storage full) leaves nothing half-saved.
 */
export const saveWeighIn = (entry: WeightEntry, photo: { kind: 'keep' } | { kind: 'new'; blob: Blob } | { kind: 'remove' }) =>
  db.transaction('rw', db.weights, db.photos, async () => {
    const id = (await db.weights.put(entry)) as number;
    if (photo.kind !== 'keep') await deletePhoto(id);
    if (photo.kind === 'new') await db.photos.add({ weightId: id, blob: photo.blob, createdAt: new Date().toISOString() });
    return id;
  });
