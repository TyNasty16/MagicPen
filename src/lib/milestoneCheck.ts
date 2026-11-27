// Milestone celebrations (workflow 12): the database side. Reads the owner's logs, works out what is new,
// records it before anything is shown (so nothing shows twice), and returns the lines for the pop-up.
import { db, type Profile } from '../db/db';
import { dayKey } from './dates';
import { capRecords, computeEarned, dropEndedRuns, firstArrivalLines, isRecorded, linesToShow, mergeRecords, titleFor, toRecords, type MilestoneData, type ShowLine } from './milestones';

export interface Celebration { title: string; lines: ShowLine[] }

let busy: Promise<unknown> = Promise.resolve();
let quiet = false; // true while a restore is under way: checks record but never show
/** One check at a time, so two quick saves can never show the same milestone twice. */
const serial = <T>(fn: () => Promise<T>): Promise<T> => { const next = busy.then(fn, fn); busy = next.catch(() => undefined); return next; };

async function loadData(): Promise<MilestoneData> {
  const [injections, weights, symptoms, foodLog, water] = await Promise.all([db.injections.toArray(), db.weights.toArray(), db.symptoms.toArray(), db.foodLog.toArray(), db.water.toArray()]);
  return { injections, weights, symptoms, foodLog, water };
}

async function check(show: boolean, now: Date): Promise<Celebration | null> {
  const profile = await db.profile.get('me');
  if (!profile?.disclaimerAcceptedAt) return null;
  const today = dayKey(now);
  const earned = computeEarned(await loadData(), profile, today);
  const weightOff = profile.showWeightMilestones === false;
  let lines: ShowLine[];
  let record;
  if (!profile.milestonesEarned) {
    lines = firstArrivalLines(earned, profile, weightOff); // first arrival: the latest in each category, once
    record = toRecords(earned, today);
  } else {
    const fresh = earned.filter((e) => !isRecorded(e, profile.milestonesEarned!));
    const startChanged = profile.milestoneStartKg !== profile.startWeightKg; // a Profile edit never shows a weight pop-up
    lines = linesToShow(fresh, profile, weightOff || startChanged);
    record = mergeRecords(profile.milestonesEarned, toRecords(fresh, today));
  }
  const changes: Partial<Profile> = { milestonesEarned: capRecords(dropEndedRuns(record, earned)), milestoneStartKg: profile.startWeightKg };
  await db.profile.update('me', changes);
  if (!show || quiet || profile.showMilestones === false || !lines.length) return null;
  return { title: titleFor(Math.max(...lines.map((l) => l.step))), lines };
}

/** Checks for new milestones and records them; returns what to show, if anything. Never throws. */
export const checkMilestones = (now = new Date()): Promise<Celebration | null> => serial(() => check(true, now)).catch(() => null);

/** Before a restore replaces the data: no pop-up may show until `afterRestore` has run. */
export const beforeRestore = () => { quiet = true; };

/** After a restore: keep this phone's record (merged with the backup's) and record everything the restored data reaches, silently. Never throws. */
export async function afterRestore(deviceRecord: Profile['milestonesEarned']): Promise<void> {
  try {
    await serial(async () => {
      const p = await db.profile.get('me');
      if (!p) return;
      await db.profile.update('me', { milestonesEarned: capRecords(mergeRecords(deviceRecord, p.milestonesEarned ?? [])) });
      await check(false, new Date());
    });
  } catch { /* the restore itself has worked; milestones catch up at the next check */ } finally {
    quiet = false;
  }
}
