import { afterEach, describe, expect, it, vi } from 'vitest';
import { authorizeUrl, challengeFor, DropboxError, listFiles, newVerifier, uploadFile } from './dropbox';
import { BackupError, decryptBackup, deriveKey, encryptBackup, HEADER_LEN, keyFits, readHeader, randomSalt } from './format';
import { backupFileName, isBackupDue, mostRecentEvening, parseBackupName, pickToDelete, shouldSkipAsEmpty, steadyBackups } from './schedule';
import { BACKUP_TABLES, entryRows, fingerprint, summarize, validatePayload, type Tables } from './serialize';

const ITER = 100_000; // fewer iterations keep the tests fast; the app uses 600,000
const emptyTables = (): Tables => Object.fromEntries(BACKUP_TABLES.map((k) => [k, []])) as unknown as Tables;
const sample = (): Tables => ({
  ...emptyTables(),
  profile: [{ id: 'me', units: 'imperial', name: 'Alex' }],
  injections: [{ id: 1, datetime: '2026-11-20T09:00:00.000Z', doseMg: 0.5, site: 'thigh-left', drug: 'ozempic' }],
  weights: [{ id: 1, date: '2026-11-21', weightKg: 96 }],
  foodLog: [{ id: 1, date: '2026-11-22', meal: 'none', name: 'Soup', kcal: 200, proteinG: 20, carbsG: 10, fatG: 5, servings: 1, createdAt: '' }],
  appointments: [{ id: 1, date: '2026-11-24', questions: 'Ask about sleep' }],
});

describe('encrypted file format', () => {
  it('round-trips; the header is readable; a wrong password fails the same way as damage', async () => {
    const salt = randomSalt();
    const key = await deriveKey('correct horse battery staple', salt, ITER);
    const file = await encryptBackup('{"hello":"Grüße ✓"}', key, salt, ITER, 9);
    expect(new TextDecoder().decode(file.subarray(0, 8))).toBe('STEADYBK');
    const h = readHeader(file);
    expect(h).toMatchObject({ format: 1, schema: 9, iterations: ITER });
    expect(keyFits(h, salt, ITER)).toBe(true);
    expect(keyFits(h, randomSalt(), ITER)).toBe(false);
    expect(await decryptBackup(file, key, 9)).toBe('{"hello":"Grüße ✓"}');
    const wrong = await deriveKey('wrong password here', salt, ITER);
    await expect(decryptBackup(file, wrong, 9)).rejects.toMatchObject({ code: 'wrong-password' });
    const damaged = file.slice(); damaged[HEADER_LEN + 3] ^= 0xff;
    await expect(decryptBackup(damaged, key, 9)).rejects.toMatchObject({ code: 'wrong-password' });
    const headerEdited = file.slice(); headerEdited[9] = 8; // schema byte changed: authenticated, so it fails
    await expect(decryptBackup(headerEdited, key, 9)).rejects.toMatchObject({ code: 'wrong-password' });
  });
  it('rejects files that aren’t Steady backups, unknown formats and newer schemas', async () => {
    expect(() => readHeader(new TextEncoder().encode('{"not":"a backup"}'.padEnd(80, ' ')))).toThrow(BackupError);
    const salt = randomSalt();
    const key = await deriveKey('another long password', salt, ITER);
    const file = await encryptBackup('{}', key, salt, ITER, 10);
    await expect(decryptBackup(file, key, 9)).rejects.toMatchObject({ code: 'newer' });
    const v2 = file.slice(); v2[8] = 2;
    expect(() => readHeader(v2)).toThrow(expect.objectContaining({ code: 'unknown-version' }));
  });
  it('each file gets a fresh IV, so the same data encrypts differently', async () => {
    const salt = randomSalt();
    const key = await deriveKey('a long enough password', salt, ITER);
    const [a, b] = [await encryptBackup('same', key, salt, ITER, 9), await encryptBackup('same', key, salt, ITER, 9)];
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });
});

describe('contents and validation', () => {
  it('a valid backup passes; counts and last entry are summarised; photos are not a table', () => {
    const p = validatePayload({ format: 1, schemaVersion: 9, createdAt: 'x', tables: sample(), prefs: { 'steady.helpShownOn': '2026-11-27', other: 'dropped' } }, 9);
    expect(BACKUP_TABLES).not.toContain('photos');
    expect(BACKUP_TABLES).not.toContain('backupState');
    expect(p.prefs).toEqual({ 'steady.helpShownOn': '2026-11-27' });
    expect(summarize(p)).toEqual({ injections: 1, weighIns: 1, measurements: 0, symptoms: 0, food: 1, appointments: 1, lastEntry: '2026-11-24' });
    expect(entryRows(sample())).toBe(4);
  });
  it.each([
    ['not an object', 'x'],
    ['wrong format', { format: 2, schemaVersion: 9, tables: {} }],
    ['a table that isn’t a list', { format: 1, schemaVersion: 9, tables: { ...sample(), weights: {} } }],
    ['a bad row', { format: 1, schemaVersion: 9, tables: { ...sample(), weights: [{ date: 'yesterday', weightKg: 'heavy' }] } }],
    ['a missing table', { format: 1, schemaVersion: 9, tables: (({ injections: _, ...rest }) => rest)(sample()) }],
    ['two profiles', { format: 1, schemaVersion: 9, tables: { ...sample(), profile: [{ id: 'me', units: 'imperial' }, { id: 'me', units: 'metric' }] } }],
  ])('rejects %s before anything is changed', (_, raw) => expect(() => validatePayload(raw, 9)).toThrow('unreadable'));
  it('rejects a backup from a newer Steady', () => expect(() => validatePayload({ format: 1, schemaVersion: 10, tables: sample() }, 9)).toThrow('newer'));
  it('fingerprint changes when data changes', async () => {
    const a = await fingerprint(sample());
    const t = sample(); t.weights.push({ id: 2, date: '2026-11-25', weightKg: 95.5 });
    expect(await fingerprint(sample())).toBe(a);
    expect(await fingerprint(t)).not.toBe(a);
  });
});

describe('when to back up', () => {
  const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m);
  it('once per evening after the evening time; a missed evening is caught at the next open; nothing if unchanged', () => {
    expect(mostRecentEvening(at(27, 21))).toEqual(at(27, 20));
    expect(mostRecentEvening(at(27, 9))).toEqual(at(26, 20));
    expect(isBackupDue(at(27, 21), at(27, 20, 30).toISOString(), '20:00', true)).toBe(false); // already backed up tonight
    expect(isBackupDue(at(27, 21), at(27, 8).toISOString(), '20:00', true)).toBe(true); // this morning's backup is before tonight's time
    expect(isBackupDue(at(27, 15), at(27, 8).toISOString(), '20:00', true)).toBe(false); // afternoon: not yet
    expect(isBackupDue(at(28, 8), at(26, 21).toISOString(), '20:00', true)).toBe(true); // missed last evening → next open
    expect(isBackupDue(at(27, 21), at(26, 21).toISOString(), '20:00', false)).toBe(false); // nothing changed
    expect(isBackupDue(at(27, 23, 30), at(27, 22).toISOString(), '23:00', true)).toBe(true); // custom evening time
  });
  it('empty-data guard: under 5 entries, or under half the last backup', () => {
    expect(shouldSkipAsEmpty(0)).toBe(true);
    expect(shouldSkipAsEmpty(4)).toBe(true);
    expect(shouldSkipAsEmpty(40, 100)).toBe(true);
    expect(shouldSkipAsEmpty(60, 100)).toBe(false);
  });
  it('file names in local time; keep the newest 2; other files ignored', () => {
    expect(backupFileName(at(27, 20, 14))).toBe('steady-2026-11-27-2014.steadybackup');
    expect(parseBackupName('steady-2026-11-27-2014 (1).steadybackup')).toEqual(at(27, 20, 14));
    expect(parseBackupName('notes.txt')).toBeNull();
    const files = ['steady-2026-11-25-2001.steadybackup', 'steady-2026-11-27-2014.steadybackup', 'notes.txt', 'steady-2026-11-26-2003.steadybackup'].map((name) => ({ name }));
    expect(steadyBackups(files).map((f) => f.name)).toEqual(['steady-2026-11-27-2014.steadybackup', 'steady-2026-11-26-2003.steadybackup', 'steady-2026-11-25-2001.steadybackup']);
    expect(pickToDelete(files).map((f) => f.name)).toEqual(['steady-2026-11-25-2001.steadybackup']);
  });
});

describe('Dropbox', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('sign-in URL: app key, PKCE S256, offline access; redirect only when given; never a secret', async () => {
    const v = newVerifier();
    expect(v).toMatch(/^[A-Za-z0-9_-]{64}$/);
    const u = new URL(authorizeUrl(await challengeFor(v), 'st', 'https://tynasty16.github.io/MagicPen/'));
    expect(u.origin + u.pathname).toBe('https://www.dropbox.com/oauth2/authorize');
    expect(Object.fromEntries(u.searchParams)).toMatchObject({ client_id: '7sybextdkplxswz', response_type: 'code', code_challenge_method: 'S256', token_access_type: 'offline', redirect_uri: 'https://tynasty16.github.io/MagicPen/' });
    expect(new URL(authorizeUrl('c', 's', null)).searchParams.has('redirect_uri')).toBe(false);
    expect(u.toString()).not.toMatch(/secret/i);
  });
  it.each([
    [() => Promise.reject(new TypeError('network')), 'offline'],
    [() => Promise.resolve(new Response('{"error_summary":"invalid_access_token/"}', { status: 401 })), 'signed-out'],
    [() => Promise.resolve(new Response('{"error_summary":"path/insufficient_space/"}', { status: 409 })), 'full'],
    [() => Promise.resolve(new Response('oops', { status: 500 })), 'failed'],
  ])('maps errors (%#)', async (impl, code) => {
    vi.stubGlobal('fetch', vi.fn(impl));
    await expect(listFiles('t')).rejects.toMatchObject({ code });
  });
  it('upload sends only bytes, to the app folder root, with no cookies and an ASCII-safe argument', async () => {
    const f = vi.fn(() => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', f);
    await uploadFile('tok', 'steady-2026-11-27-2014.steadybackup', new Uint8Array([1, 2, 3]));
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://content.dropboxapi.com/2/files/upload');
    expect(init.credentials).toBe('omit');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/octet-stream');
    expect(JSON.parse((init.headers as Record<string, string>)['Dropbox-API-Arg'])).toEqual({ path: '/steady-2026-11-27-2014.steadybackup', mode: 'add', autorename: true, mute: true });
    expect(DropboxError).toBeDefined();
  });
  it('returns the name Dropbox saved the file under', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ path_lower: '/steady-2026-11-27-2014 (1).steadybackup' }))));
    expect(await uploadFile('tok', 'steady-2026-11-27-2014.steadybackup', new Uint8Array([1]))).toBe('/steady-2026-11-27-2014 (1).steadybackup');
  });
});
