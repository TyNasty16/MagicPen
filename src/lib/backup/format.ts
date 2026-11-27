// Encrypted backup file format (workflow 10a). Pure: Web Crypto + CompressionStream only, no storage, no network.
//
// Layout: "STEADYBK" (8) · format version (1) · schema version (1) · iterations (4, big-endian) · salt (16) · IV (12) · ciphertext
// The header (everything before the ciphertext) is AES-GCM additional data, so it can't be altered unnoticed.
// Key: PBKDF2-SHA-256 from the owner's password → AES-GCM-256. The password is never stored or sent.

export const MAGIC = 'STEADYBK';
export const FORMAT_VERSION = 1;
export const PBKDF2_ITERATIONS = 600_000;
/** Limits that stop a damaged or planted file from freezing the phone. Steady's own backups are a few KB. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_UNZIPPED_BYTES = 100 * 1024 * 1024;
export const MAX_ITERATIONS = 2_000_000; // Steady uses 600,000; a higher number would only make opening a file slow
const SALT_LEN = 16;
const IV_LEN = 12;
export const HEADER_LEN = 8 + 1 + 1 + 4 + SALT_LEN + IV_LEN;

export type BackupErrorCode = 'not-steady' | 'unknown-version' | 'newer' | 'wrong-password' | 'needs-password' | 'unreadable';
export class BackupError extends Error {
  constructor(public code: BackupErrorCode) {
    super(code);
  }
}

const buf = (u: Uint8Array) => u as Uint8Array<ArrayBuffer>;

export const randomSalt = () => crypto.getRandomValues(new Uint8Array(SALT_LEN));

/** AES-GCM key from a password. Non-extractable: it can be stored on the phone but never read back out. */
export async function deriveKey(password: string, salt: Uint8Array, iterations = PBKDF2_ITERATIONS): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: buf(salt), iterations }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export interface Header { format: number; schema: number; iterations: number; salt: Uint8Array; iv: Uint8Array }

export function readHeader(file: Uint8Array): Header {
  if (file.length > MAX_FILE_BYTES) throw new BackupError('unreadable');
  if (file.length < HEADER_LEN + 16 || new TextDecoder().decode(file.subarray(0, 8)) !== MAGIC) throw new BackupError('not-steady');
  const format = file[8];
  if (format !== FORMAT_VERSION) throw new BackupError('unknown-version');
  const iterations = new DataView(file.buffer, file.byteOffset + 10, 4).getUint32(0);
  if (iterations < 100_000 || iterations > MAX_ITERATIONS) throw new BackupError('not-steady');
  return { format, schema: file[9], iterations, salt: file.slice(14, 14 + SALT_LEN), iv: file.slice(14 + SALT_LEN, HEADER_LEN) };
}

async function gzip(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await new Response(new Blob([buf(data)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
}
/** Unpacks, stopping (and refusing the file) as soon as it grows past `max` bytes. */
export async function gunzip(data: Uint8Array, max = MAX_UNZIPPED_BYTES): Promise<Uint8Array> {
  const reader = new Blob([buf(data)]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > max) throw new Error('too big');
      parts.push(value);
    }
  } catch {
    reader.cancel().catch(() => undefined);
    throw new BackupError('unreadable');
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}

/** Compresses and encrypts `json` into a backup file. */
export async function encryptBackup(json: string, key: CryptoKey, salt: Uint8Array, iterations: number, schema: number): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const header = new Uint8Array(HEADER_LEN);
  header.set(new TextEncoder().encode(MAGIC), 0);
  header[8] = FORMAT_VERSION;
  header[9] = schema;
  new DataView(header.buffer).setUint32(10, iterations);
  header.set(salt, 14);
  header.set(iv, 14 + SALT_LEN);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: buf(iv), additionalData: header }, key, buf(await gzip(new TextEncoder().encode(json)))));
  const out = new Uint8Array(HEADER_LEN + cipher.length);
  out.set(header, 0);
  out.set(cipher, HEADER_LEN);
  return out;
}

/**
 * Decrypts a backup file to its JSON text. A wrong password and a damaged file look the same to AES-GCM,
 * so both are reported as 'wrong-password'.
 */
export async function decryptBackup(file: Uint8Array, key: CryptoKey, maxSchema: number): Promise<string> {
  const h = readHeader(file);
  if (h.schema > maxSchema) throw new BackupError('newer');
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf(h.iv), additionalData: buf(file.slice(0, HEADER_LEN)) }, key, buf(file.slice(HEADER_LEN)));
  } catch {
    throw new BackupError('wrong-password');
  }
  return new TextDecoder().decode(await gunzip(new Uint8Array(plain)));
}

/**
 * Decrypts with a typed password: as typed first (passwords set before workflow 11), then NFC-normalised (set since),
 * so the same letters typed on another keyboard still open the file.
 */
export async function decryptWithPassword(file: Uint8Array, password: string, maxSchema: number): Promise<string> {
  const h = readHeader(file);
  const tries = [...new Set([password, password.normalize('NFC')])];
  for (let i = 0; ; i++) {
    try {
      return await decryptBackup(file, await deriveKey(tries[i], h.salt, h.iterations), maxSchema);
    } catch (e) {
      if (!(e instanceof BackupError && e.code === 'wrong-password') || i === tries.length - 1) throw e;
    }
  }
}

/** True when a stored key was made with this file's salt and iterations (so it can open it without asking). */
export const keyFits = (h: Header, salt?: Uint8Array, iterations?: number) =>
  !!salt && iterations === h.iterations && salt.length === h.salt.length && salt.every((b, i) => b === h.salt[i]);
