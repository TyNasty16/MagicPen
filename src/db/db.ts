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

/** Tape measurements (cm) and body-fat %; any subset per entry. `date` is YYYY-MM-DD. */
export interface Measurement {
  id?: number;
  date: string;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  neckCm?: number;
  upperArmCm?: number;
  thighCm?: number;
  bodyFatPct?: number;
}

/** A logged side effect. `datetime` is an ISO timestamp (UTC); severity 0 (none) – 5 (severe). */
export interface Symptom {
  id?: number;
  datetime: string;
  type: string;
  severity: number;
  notes?: string;
}

/** Nutrition per serving, shared by My Foods and log entries. */
export interface FoodValues {
  name: string;
  servingDesc?: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
}

/** A saved favourite ("My Foods"). */
export interface Food extends FoodValues {
  id?: number;
}

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'none';

/** A logged food. Stores its own per-serving values, so editing or deleting a favourite never changes the log. `date` is YYYY-MM-DD. */
export interface FoodLogEntry extends FoodValues {
  id?: number;
  date: string;
  meal: Meal;
  servings: number;
  createdAt: string;
}

/** Water drunk, in ml. `date` is YYYY-MM-DD. */
export interface WaterEntry {
  id?: number;
  date: string;
  ml: number;
}

/** A day the owner marked as "barely ate". Keyed by date. */
export interface DayMark {
  date: string;
  kind: 'low-intake';
}

export const db = new Dexie('steady') as Dexie & {
  profile: EntityTable<Profile, 'id'>;
  injections: EntityTable<Injection, 'id'>;
  weights: EntityTable<WeightEntry, 'id'>;
  photos: EntityTable<Photo, 'id'>;
  measurements: EntityTable<Measurement, 'id'>;
  symptoms: EntityTable<Symptom, 'id'>;
  foods: EntityTable<Food, 'id'>;
  foodLog: EntityTable<FoodLogEntry, 'id'>;
  water: EntityTable<WaterEntry, 'id'>;
  dayMarks: EntityTable<DayMark, 'date'>;
};

// Keep every version declared: Dexie upgrades existing databases in place, so profile data is kept.
db.version(1).stores({ profile: 'id' });
db.version(2).stores({ profile: 'id', injections: '++id, datetime', weights: '++id, date' });
db.version(3).stores({ profile: 'id', injections: '++id, datetime', weights: '++id, date', photos: '++id, weightId' });
db.version(4).stores({ profile: 'id', injections: '++id, datetime', weights: '++id, date', photos: '++id, weightId', measurements: '++id, date' });
db.version(5).stores({ profile: 'id', injections: '++id, datetime', weights: '++id, date', photos: '++id, weightId', measurements: '++id, date', symptoms: '++id, datetime' });
db.version(6).stores({
  profile: 'id', injections: '++id, datetime', weights: '++id, date', photos: '++id, weightId', measurements: '++id, date', symptoms: '++id, datetime',
  foods: '++id, name', foodLog: '++id, date', water: '++id, date', dayMarks: 'date',
});

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

export const listMeasurements = () => db.measurements.orderBy('date').toArray();
export const saveMeasurement = (m: Measurement) => db.measurements.put(m);
export const deleteMeasurement = (id: number) => db.measurements.delete(id);

export const listSymptoms = () => db.symptoms.orderBy('datetime').reverse().toArray();
/** Saves several symptoms logged together in one transaction. */
export const saveSymptoms = (entries: Symptom[]) => db.transaction('rw', db.symptoms, () => db.symptoms.bulkPut(entries));
export const deleteSymptom = (id: number) => db.symptoms.delete(id);

export const listFoods = () => db.foods.orderBy('name').toArray();
/** Saves a favourite; a favourite with the same name (any case) is updated instead of duplicated. */
export async function saveFood(values: FoodValues): Promise<void> {
  await db.transaction('rw', db.foods, async () => {
    const same = await db.foods.filter((f) => f.name.trim().toLowerCase() === values.name.trim().toLowerCase()).first();
    await db.foods.put({ ...values, ...(same?.id ? { id: same.id } : {}) });
  });
}
export const deleteFood = (id: number) => db.foods.delete(id);

/** All food entries on or after a day (inclusive), oldest first. */
export const listFoodLogSince = (fromDay: string) => db.foodLog.where('date').aboveOrEqual(fromDay).sortBy('date');
export const saveFoodLog = (e: FoodLogEntry) => db.foodLog.put(e);
export const deleteFoodLog = (id: number) => db.foodLog.delete(id);

export const listWaterSince = (fromDay: string) => db.water.where('date').aboveOrEqual(fromDay).toArray();
export const addWater = (date: string, ml: number) => db.water.add({ date, ml });
export const deleteWater = (id: number) => db.water.delete(id);

export const listDayMarksSince = (fromDay: string) => db.dayMarks.where('date').aboveOrEqual(fromDay).toArray();
export const setLowIntake = (date: string, on: boolean) => (on ? db.dayMarks.put({ date, kind: 'low-intake' }) : db.dayMarks.delete(date));

const UI_KEYS = ['steady.helpShownOn', 'steady.alertsHidden', 'steady.alertsSeen', 'steady.offNoticeAck', 'steady.barcodeNoticeAck'];

/** Deletes everything the owner has entered, in one transaction, then the saved screen preferences. */
export async function resetAllData(): Promise<void> {
  await db.transaction('rw', db.tables, () => Promise.all(db.tables.map((t) => t.clear())));
  for (const k of UI_KEYS) {
    try { localStorage.removeItem(k); } catch { /* storage blocked: nothing saved there */ }
  }
}
