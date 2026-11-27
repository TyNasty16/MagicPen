// Workflow 11 (security Phase 1): boundary tests, table-driven.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkNewPassword, counterText, PASSWORD_TEXT } from './backup/passwordRule';
import { gunzip, MAX_ITERATIONS, readHeader, HEADER_LEN, BackupError } from './backup/format';
import { BACKUP_TABLES, isCalendarDay, validatePayload, type Tables } from './backup/serialize';
import { cleanText, parseOffProduct, parseOffResults } from './offSearch';
import { isAppleMobile, shouldShowTip } from './homeScreenTip';
import { CSP, injectSecurityMeta } from './csp';

describe('new backup password rule', () => {
  it.each([
    ['15 characters', 'abcdefghijklmn!', 'short'],
    ['16 one character', 'aaaaaaaaaaaaaaaa', 'variety'],
    ['5 different characters', 'abaebdcaebdcaebd', 'variety'],
    ['a repeated word', 'passwordpassword', 'repeat'],
    ['another repeated piece', 'tiger7!Ztiger7!Z', 'repeat'],
    ['a digit run', '1234567890123456', 'run'],
    ['a keyboard run', 'my qwerty garden!', 'run'],
    ['a backwards run', 'zyxwvu tea spoon', 'run'],
    ['four words', 'river lamp tiger chair', undefined],
    ['an iPhone suggestion', 'kegjy0-bobpaf-Xahcyn', undefined],
    ['16 counted as people count them (emoji = 1)', 'pear 🍐 cloud mix', undefined],
  ])('%s', (_, pw, problem) => expect(checkNewPassword(pw)).toBe(problem));
  it('every problem has its approved message', () => {
    expect(PASSWORD_TEXT.short).toBe('Use at least 16 characters. For example: river lamp tiger chair.');
    expect(Object.keys(PASSWORD_TEXT).sort()).toEqual(['repeat', 'run', 'short', 'variety']);
  });
  it('counts by characters after NFC, and stops at 16', () => {
    expect(counterText('abcdefghijkl')).toBe('12 of 16 characters');
    expect(counterText('é'.repeat(3))).toBe('3 of 16 characters');
    expect(counterText('x'.repeat(30))).toBe('16 of 16 characters');
  });
});

describe('restore limits and checks', () => {
  const header = (iterations: number, total = HEADER_LEN + 32) => {
    const f = new Uint8Array(total);
    f.set(new TextEncoder().encode('STEADYBK'));
    f[8] = 1; f[9] = 9;
    new DataView(f.buffer).setUint32(10, iterations);
    return f;
  };
  it('accepts up to 2,000,000 iterations, refuses 3,000,000', () => {
    expect(readHeader(header(MAX_ITERATIONS)).iterations).toBe(2_000_000);
    expect(() => readHeader(header(3_000_000))).toThrow(BackupError);
  });
  it('refuses a file over 25 MB', () => expect(() => readHeader(header(600_000, 25 * 1024 * 1024 + 1))).toThrow(BackupError));
  it('stops unpacking past the limit', async () => {
    const packed = new Uint8Array(await new Response(new Blob([new Uint8Array(5000)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
    expect((await gunzip(packed, 5000)).length).toBe(5000);
    await expect(gunzip(packed, 4999)).rejects.toThrow(BackupError);
  });
  it.each([['2026-02-28', true], ['2028-02-29', true], ['2026-02-29', false], ['2026-13-45', false], ['26-1-1', false]])('calendar day %s', (d, ok) =>
    expect(isCalendarDay(d)).toBe(ok));

  const empty = () => Object.fromEntries(BACKUP_TABLES.map((k) => [k, []])) as unknown as Tables;
  const good = (): Tables => ({
    ...empty(),
    profile: [{ id: 'me', units: 'metric', heightCm: 170, injectionWeekday: 1, drug: 'wegovy', disclaimerAcceptedAt: '2026-11-01T10:00:00.000Z', overrides: {} }],
    injections: [{ id: 1, datetime: '2026-11-20T09:00:00.000Z', doseMg: 0.5, site: 'thigh-left' }],
    measurements: [{ id: 2, date: '2026-11-21', waistCm: 90, bodyFatPct: 30 }],
    symptoms: [{ id: 3, datetime: '2026-11-21T08:00:00.000Z', type: 'nausea', severity: 2 }],
    dayMarks: [{ date: '2026-11-22', kind: 'low-intake' }],
  });
  const withRow = (k: keyof Tables, row: Record<string, unknown>) => ({ format: 1, schemaVersion: 9, tables: { ...good(), [k]: [row] } });
  it('a backup made by the current app passes', () => expect(validatePayload({ format: 1, schemaVersion: 9, tables: good() }, 9).tables.injections).toHaveLength(1));
  it.each([
    ['an unknown site', 'injections', { datetime: '2026-11-20T09:00:00Z', doseMg: 0.5, site: 'elbow' }],
    ['a negative id', 'weights', { id: -1, date: '2026-11-21', weightKg: 90 }],
    ['a fractional id', 'weights', { id: 1.5, date: '2026-11-21', weightKg: 90 }],
    ['an impossible date', 'weights', { date: '2026-13-45', weightKg: 90 }],
    ['an out-of-range weight', 'weights', { date: '2026-11-21', weightKg: 9000 }],
    ['severity 6', 'symptoms', { datetime: '2026-11-21T08:00:00Z', type: 'nausea', severity: 6 }],
    ['a text measurement', 'measurements', { date: '2026-11-21', waistCm: 'big' }],
    ['an unknown day mark', 'dayMarks', { date: '2026-11-22', kind: 'party' }],
    ['a bad weekday in the profile', 'profile', { id: 'me', units: 'metric', injectionWeekday: 9 }],
  ])('refuses %s', (_, k, row) => expect(() => validatePayload(withRow(k as keyof Tables, row), 9)).toThrow('unreadable'));
});

describe('Open Food Facts plausibility', () => {
  const product = (n: Record<string, number>, extra: Record<string, unknown> = {}) => ({ product_name: 'Test', nutriments: n, ...extra });
  it.each([
    ['olive oil (880 kcal, 100 g fat)', { 'energy-kcal_100g': 880, proteins_100g: 0, fat_100g: 100 }, {}, true],
    ['900 kcal', { 'energy-kcal_100g': 900, proteins_100g: 0, fat_100g: 100 }, {}, true],
    ['950 kcal', { 'energy-kcal_100g': 950, proteins_100g: 0 }, {}, false],
    ['protein 80 + carbs 60 + fat 10', { 'energy-kcal_100g': 400, proteins_100g: 80, carbohydrates_100g: 60, fat_100g: 10 }, {}, false],
    ['missing carbs and fat count as 0', { 'energy-kcal_100g': 400, proteins_100g: 100 }, {}, true],
    ['a 2000 g serving', { 'energy-kcal_100g': 100, proteins_100g: 1 }, { serving_quantity: 2000 }, true],
    ['a 2001 g serving', { 'energy-kcal_100g': 100, proteins_100g: 1 }, { serving_quantity: 2001 }, false],
  ])('%s', (_, n, extra, shown) => expect(parseOffProduct(product(n, extra)) !== null).toBe(shown));
  it('implausible products are counted as hidden', () =>
    expect(parseOffResults({ hits: [product({ 'energy-kcal_100g': 5000, proteins_100g: 1 })] })).toEqual({ shown: [], hidden: 1 }));
  it('removes invisible characters that could disguise a name', () =>
    expect(cleanText('Oat­meal؜ bar\u{e0001}\u{e0041}')).toBe('Oatmeal bar'));
});

describe('Home Screen tip', () => {
  const iphone = { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari', touchPoints: 5, standalone: false };
  const now = new Date('2026-11-27T12:00:00Z');
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
  it.each([
    ['iPhone tab, day 3, no backup', iphone, daysAgo(3), undefined, false, true],
    ['day 2', iphone, daysAgo(2), undefined, false, false],
    ['Home Screen app', { ...iphone, standalone: true }, daysAgo(10), undefined, false, false],
    ['backup 13 days ago', iphone, daysAgo(10), daysAgo(13), false, false],
    ['backup 14 days ago', iphone, daysAgo(20), daysAgo(14), false, true],
    ['dismissed', iphone, daysAgo(10), undefined, true, false],
    ['iPad (reports Mac, has touch)', { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari', touchPoints: 5, standalone: false }, daysAgo(5), undefined, false, true],
    ['Chrome on iPhone', { ...iphone, ua: 'Mozilla/5.0 (iPhone) CriOS/130' }, daysAgo(5), undefined, false, true],
    ['Mac desktop', { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari', touchPoints: 0, standalone: false }, daysAgo(5), undefined, false, false],
    ['Android', { ua: 'Mozilla/5.0 (Linux; Android 15) Chrome/130 Mobile', touchPoints: 5, standalone: false }, daysAgo(5), undefined, false, false],
  ])('%s', (_, d, first, backup, dismissed, show) => expect(shouldShowTip(d, now, first, backup, dismissed)).toBe(show));
  it('detects Apple mobile only', () => expect(isAppleMobile({ ua: 'Windows NT', touchPoints: 10 })).toBe(false));
});

describe('browser safety rule (CSP)', () => {
  const built = injectSecurityMeta(readFileSync('index.html', 'utf8'));
  it('comes before every script and stylesheet, right after charset', () => {
    const at = built.indexOf('Content-Security-Policy');
    expect(at).toBeGreaterThan(built.indexOf('<meta charset'));
    for (const tag of ['<script', '<link']) expect(built.indexOf(tag)).toBeGreaterThan(at);
    expect(built).toContain('<meta name="referrer" content="no-referrer" />');
  });
  it('allows only the app, Open Food Facts and Dropbox, and never eval or inline scripts', () => {
    expect(CSP).toContain("connect-src 'self' https://search.openfoodfacts.org https://world.openfoodfacts.org https://api.dropboxapi.com https://content.dropboxapi.com;");
    expect(CSP).toContain("script-src 'self';");
    expect(CSP).toContain("object-src 'none'");
    expect(CSP).not.toMatch(/unsafe-eval|unsafe-inline|\*/);
  });
  it('refuses to build silently without it', () => expect(() => injectSecurityMeta('<html><head></head></html>')).toThrow());
});
