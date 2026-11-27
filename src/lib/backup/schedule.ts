// When to back up, which files to keep, and file names (workflow 10a). Pure.

export const DEFAULT_EVENING = '20:00';
export const EVENING_CHOICES = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
export const KEEP = 2;
export const MIN_ENTRY_ROWS = 5;
export const FAILED_RETRY_MS = 30 * 60_000;

/** The latest evening time at or before `now` (today's if it has passed, otherwise yesterday's). */
export function mostRecentEvening(now: Date, evening = DEFAULT_EVENING): Date {
  const [h, m] = evening.split(':').map(Number);
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  if (t > now) t.setDate(t.getDate() - 1);
  return t;
}

/** Due when something changed and the last backup is older than the most recent evening time (so once per evening; a missed evening is caught at the next open). */
export function isBackupDue(now: Date, lastBackupAt: string | undefined, evening: string | undefined, changed: boolean): boolean {
  if (!changed) return false;
  if (!lastBackupAt) return now >= mostRecentEvening(now, evening);
  return new Date(lastBackupAt) < mostRecentEvening(now, evening);
}

/** Skip an automatic backup that would replace good backups with (nearly) nothing, e.g. right after Reset. */
export const shouldSkipAsEmpty = (rows: number, lastRows?: number) => rows < MIN_ENTRY_ROWS || (!!lastRows && rows < lastRows / 2);

const pad = (n: number) => String(n).padStart(2, '0');
/** "steady-2026-11-27-2014.steadybackup", in phone local time. */
export const backupFileName = (d: Date) => `steady-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.steadybackup`;
const NAME = /^steady-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})(?: \(\d+\))?\.steadybackup$/;
export function parseBackupName(name: string): Date | null {
  const m = NAME.exec(name);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
}

/** Steady backups in the folder, newest first; anything else in the folder is ignored. */
export function steadyBackups<T extends { name: string }>(files: T[]): (T & { made: Date })[] {
  return files.flatMap((f) => { const made = parseBackupName(f.name); return made ? [{ ...f, made }] : []; }).sort((a, b) => b.made.getTime() - a.made.getTime() || b.name.localeCompare(a.name));
}

/** Files to delete so only the newest KEEP remain. */
export const pickToDelete = <T extends { name: string }>(files: T[], keep = KEEP) => steadyBackups(files).slice(keep);
