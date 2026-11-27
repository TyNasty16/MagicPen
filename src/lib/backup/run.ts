// Backup and restore, tying the pure modules to the phone's database and Dropbox (workflow 10a).
import { db, SCHEMA_VERSION, UI_KEYS, type BackupState } from '../../db/db';
import { deleteFile, downloadFile, DropboxError, listFiles, PKCE_KEY, refreshAccess, revoke, uploadFile, type DropboxFile } from './dropbox';
import { BackupError, decryptBackup, deriveKey, encryptBackup, keyFits, MAX_FILE_BYTES, PBKDF2_ITERATIONS, randomSalt, readHeader } from './format';
import { BACKUP_TABLES, buildPayload, entryRows, fingerprint, validatePayload, type Payload, type Tables } from './serialize';
import { backupFileName, FAILED_RETRY_MS, isBackupDue, KEEP, pickToDelete, shouldSkipAsEmpty, steadyBackups } from './schedule';

export const getBackupState = async (): Promise<BackupState> => (await db.backupState.get('me')) ?? { id: 'me' };
export const saveBackupState = async (changes: Partial<BackupState>) => db.backupState.put({ ...(await getBackupState()), ...changes, id: 'me' });

/** A working access token, refreshed when it has expired (or when `fresh`, after Dropbox refused the cached one). */
async function accessToken(fresh = false): Promise<string> {
  const s = await getBackupState();
  if (!s.refreshToken) throw new DropboxError('signed-out');
  if (!fresh && s.accessToken && s.accessExpires && s.accessExpires > Date.now()) return s.accessToken;
  try {
    const t = await refreshAccess(s.refreshToken);
    await saveBackupState({ accessToken: t.accessToken, accessExpires: t.expiresAt });
    return t.accessToken;
  } catch (e) {
    if (e instanceof DropboxError && e.code === 'signed-out') await saveBackupState({ refreshToken: undefined, accessToken: undefined, accessExpires: undefined });
    throw e;
  }
}

/** Runs a Dropbox call; if Dropbox refuses the cached access token (e.g. phone clock off), gets a fresh one and tries once more. */
async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  try {
    return await fn(await accessToken());
  } catch (e) {
    if (!(e instanceof DropboxError && e.code === 'signed-out')) throw e;
    await saveBackupState({ accessToken: undefined, accessExpires: undefined });
    return fn(await accessToken(true)); // only a failed refresh signs the owner out
  }
}

async function readTables(): Promise<Tables> {
  const t = {} as Tables;
  for (const k of BACKUP_TABLES) t[k] = (await db.table(k).toArray()) as Record<string, unknown>[];
  return t;
}
function readPrefs(): Record<string, string> {
  const p: Record<string, string> = {};
  for (const k of UI_KEYS) {
    try {
      const v = localStorage.getItem(k);
      if (v !== null) p[k] = v;
    } catch { /* storage blocked */ }
  }
  return p;
}

export const ERROR_TEXT: Record<string, string> = {
  'signed-out': 'Dropbox sign-in ended. Connect again.',
  full: 'Your Dropbox is full. Nothing was deleted. Free some space and tap Back up now.',
  'wrong-password': 'Wrong password, or the file is damaged.',
  unreadable: 'This backup can’t be read. Your data on this phone was not changed.',
  'not-steady': 'This backup can’t be read. Your data on this phone was not changed.',
  'unknown-version': 'This backup can’t be read. Your data on this phone was not changed.',
  newer: 'This backup was made by a newer Steady. Update Steady first.',
};

export type BackupResult = { ok: true; size: number } | { ok: false; reason: 'not-ready' | 'not-due' | 'too-small' | 'busy' | 'offline' | 'error'; message?: string };

let running = false; // one backup / restore / reset at a time
const idle = async () => { while (running) await new Promise((r) => setTimeout(r, 200)); };

/**
 * Makes an encrypted backup and uploads it; then keeps only the newest 2 (never deleting before the new one is safe).
 * Automatic runs (`manual` false) only when due and not suspiciously small. `force` lets "Back up now" go ahead after the owner confirms a small backup.
 */
export async function runBackup(opts: { manual: boolean; force?: boolean; now?: Date }): Promise<BackupResult> {
  if (running) return { ok: false, reason: 'busy' };
  running = true;
  const now = opts.now ?? new Date();
  try {
    const s = await getBackupState();
    if (!s.refreshToken || !s.key || !s.salt || !s.iterations) return { ok: false, reason: 'not-ready' };
    if (!opts.manual && s.lastErrorAt && now.getTime() - new Date(s.lastErrorAt).getTime() < FAILED_RETRY_MS) return { ok: false, reason: 'not-due' };
    const tables = await readTables();
    const fp = await fingerprint(tables);
    if (!opts.manual && !isBackupDue(now, s.lastBackupAt, s.eveningTime, fp !== s.lastFingerprint)) return { ok: false, reason: 'not-due' };
    const rows = entryRows(tables);
    if (!opts.force && shouldSkipAsEmpty(rows, s.lastRows)) {
      if (!opts.manual) await saveBackupState({ lastSkip: now.toISOString() });
      return { ok: false, reason: 'too-small' };
    }
    const file = await encryptBackup(JSON.stringify(buildPayload(tables, readPrefs(), SCHEMA_VERSION, now)), s.key, s.salt, s.iterations, SCHEMA_VERSION);
    const saved = await withToken((t) => uploadFile(t, backupFileName(now), file));
    if (!(await getBackupState()).refreshToken) return { ok: false, reason: 'not-ready' }; // disconnected meanwhile: don't bring the state back
    await saveBackupState({ lastBackupAt: now.toISOString(), lastFingerprint: fp, lastRows: rows, lastSize: file.length, lastError: undefined, lastErrorAt: undefined, lastSkip: undefined });
    // Rotation, after the new file is safe. A failure here leaves an extra file, never a missing one.
    try {
      // The file just saved is always kept, whatever its name sorts as (clock changes, same-minute " (1)" copies).
      const others = (await withToken(listFiles)).filter((f) => f.path !== saved);
      for (const f of pickToDelete(others, KEEP - 1)) await withToken((t) => deleteFile(t, f.path));
    } catch { /* tidy up next time */ }
    return { ok: true, size: file.length };
  } catch (e) {
    const code = e instanceof DropboxError || e instanceof BackupError ? e.code : 'failed';
    if (code === 'offline') return { ok: false, reason: 'offline' };
    const message = ERROR_TEXT[code] ?? 'The backup didn’t finish. Your data on this phone is safe. Try Back up now later.';
    await saveBackupState({ lastError: message, lastErrorAt: now.toISOString() });
    return { ok: false, reason: 'error', message };
  } finally {
    running = false;
  }
}

/** Automatic check at app open / when the app comes back to the screen. Never throws. */
export async function maybeAutoBackup(): Promise<void> {
  try {
    await runBackup({ manual: false });
  } catch { /* never disturb the app */ }
}

/** Steady backups in the Dropbox folder, newest first. */
export async function listBackups(): Promise<(DropboxFile & { made: Date })[]> {
  return steadyBackups(await withToken(listFiles));
}

/** Decrypts with the stored key, or the typed password: as typed first (passwords set before workflow 11), then NFC-normalised (set since). */
async function decryptWith(file: Uint8Array, stored: CryptoKey | null, password: string | undefined, h: { salt: Uint8Array; iterations: number }): Promise<string> {
  if (stored) return decryptBackup(file, stored, SCHEMA_VERSION);
  const tries = [...new Set([password!, password!.normalize('NFC')])];
  for (let i = 0; ; i++) {
    try {
      return await decryptBackup(file, await deriveKey(tries[i], h.salt, h.iterations), SCHEMA_VERSION);
    } catch (e) {
      if (!(e instanceof BackupError && e.code === 'wrong-password') || i === tries.length - 1) throw e;
    }
  }
}

/** Downloads and fully checks a backup without changing anything. Needs the password unless the stored key fits the file. */
export async function openBackup(f: { path: string; size: number }, password?: string): Promise<Payload> {
  if (f.size > MAX_FILE_BYTES) throw new BackupError('unreadable'); // far bigger than any Steady backup: don't download it
  const file = await withToken((t) => downloadFile(t, f.path));
  const h = readHeader(file);
  const s = await getBackupState();
  const stored = keyFits(h, s.salt, s.iterations) && s.key ? s.key : null;
  if (!stored && !password) throw new BackupError('needs-password'); // made with another password (or on another phone): ask for it
  let raw: unknown;
  try {
    raw = JSON.parse(await decryptWith(file, stored, password, h));
  } catch (e) {
    if (e instanceof BackupError) throw e;
    throw new BackupError('unreadable');
  }
  try {
    return validatePayload(raw, SCHEMA_VERSION);
  } catch (e) {
    throw new BackupError(e instanceof Error && e.message === 'newer' ? 'newer' : 'unreadable');
  }
}

/** Replaces every restorable table and the screen preferences in one step; photos and the Dropbox connection are untouched. */
export async function applyRestore(p: Payload): Promise<void> {
  await idle(); // never alongside a backup
  running = true;
  try {
    await restoreTables(p);
  } finally {
    running = false;
  }
}

async function restoreTables(p: Payload): Promise<void> {
  await db.transaction('rw', BACKUP_TABLES.map((k) => db.table(k)), async () => {
    for (const k of BACKUP_TABLES) {
      await db.table(k).clear();
      if (p.tables[k].length) await db.table(k).bulkPut(p.tables[k]);
    }
  });
  for (const k of UI_KEYS) {
    try {
      if (p.prefs[k] !== undefined) localStorage.setItem(k, p.prefs[k]);
      else localStorage.removeItem(k);
    } catch { /* storage blocked */ }
  }
  // The restored data is now the last backed-up state, so tonight's automatic backup isn't wasted on an identical copy.
  await saveBackupState({ lastFingerprint: await fingerprint(await readTables()), lastRows: entryRows(p.tables) });
}

/** Sets (or changes) the backup password: a new salt and key; the password itself is never kept. */
export async function setPassword(password: string): Promise<void> {
  const salt = randomSalt();
  const key = await deriveKey(password.normalize('NFC'), salt, PBKDF2_ITERATIONS); // same letters typed on another keyboard give the same key
  await saveBackupState({ key, salt, iterations: PBKDF2_ITERATIONS, lastFingerprint: undefined });
}

/** Disconnects Dropbox on this phone (files in Dropbox stay). */
export async function disconnect(): Promise<void> {
  await endSignIn();
  await saveBackupState({ refreshToken: undefined, accessToken: undefined, accessExpires: undefined, lastError: undefined, lastErrorAt: undefined });
}

/** Best effort: ends this phone's sign-in at Dropbox, giving up after a few seconds (no network, no wait). */
async function endSignIn(): Promise<void> {
  try {
    const s = await getBackupState();
    if (s.refreshToken) await Promise.race([accessToken().then(revoke), new Promise((r) => setTimeout(r, 6_000))]);
  } catch { /* ignored */ }
  try { localStorage.removeItem(PKCE_KEY); } catch { /* blocked */ }
}

/** Before Reset: wait for any backup to finish, end the Dropbox sign-in; Reset then clears the state with everything else. */
export async function revokeForReset(): Promise<void> {
  await idle();
  running = true; // stays set: the page reloads after Reset, and no backup may write state in between
  await endSignIn();
}
