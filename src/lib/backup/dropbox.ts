// Dropbox from the phone (workflow 10a): OAuth 2 with PKCE (no App secret) and the four file calls Steady needs.
// Plain fetch, no library. The App key is public by design; it only identifies the app.

export const DROPBOX_APP_KEY = '7sybextdkplxswz';
/** The one-time sign-in secret kept in localStorage while signing in; removed after use and by Reset; never backed up. */
export const PKCE_KEY = 'steady.dropboxPkce';
const AUTH = 'https://www.dropbox.com/oauth2/authorize';
const TOKEN = 'https://api.dropboxapi.com/oauth2/token';
const API = 'https://api.dropboxapi.com/2';
const CONTENT = 'https://content.dropboxapi.com/2';

/** Where Dropbox sends the owner back: the app's own address (must be listed in the Dropbox app's settings). */
export const redirectUri = () => `${location.origin}${import.meta.env.BASE_URL}`;

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export function newVerifier(): string {
  return b64url(crypto.getRandomValues(new Uint8Array(48))); // 64 characters
}
export async function challengeFor(verifier: string): Promise<string> {
  return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
}

/** The Dropbox sign-in page. With `redirect`, Dropbox returns to Steady; without, Dropbox shows a code to copy. */
export function authorizeUrl(challenge: string, state: string, redirect: string | null): string {
  const q = new URLSearchParams({ client_id: DROPBOX_APP_KEY, response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256', token_access_type: 'offline', state });
  if (redirect) q.set('redirect_uri', redirect);
  return `${AUTH}?${q}`;
}

export type DropboxErrorCode = 'offline' | 'signed-out' | 'full' | 'not-found' | 'failed';
export class DropboxError extends Error {
  constructor(public code: DropboxErrorCode, detail?: string) {
    super(detail ?? code);
  }
}

const TIMEOUT_MS = 30_000; // a stalled network must not hang the app (e.g. Reset waiting on Dropbox)

async function call(url: string, init: RequestInit, timeoutMs = TIMEOUT_MS): Promise<Response> {
  let res: Response;
  try {
    const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(timeoutMs) : undefined;
    res = await fetch(url, { ...init, signal, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
  } catch {
    throw new DropboxError('offline');
  }
  if (res.ok) return res;
  const text = await res.text().catch(() => '');
  if (res.status === 401 || /invalid_grant|expired_access_token|invalid_access_token/.test(text)) throw new DropboxError('signed-out');
  if (/insufficient_space/.test(text)) throw new DropboxError('full');
  if (res.status === 409 && /not_found/.test(text)) throw new DropboxError('not-found');
  throw new DropboxError('failed', `${res.status}`);
}

export interface Tokens { accessToken: string; expiresAt: number; refreshToken?: string }

async function tokenRequest(form: Record<string, string>): Promise<Tokens> {
  const res = await call(TOKEN, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ ...form, client_id: DROPBOX_APP_KEY }) });
  const j = (await res.json()) as { access_token?: string; expires_in?: number; refresh_token?: string };
  if (!j.access_token) throw new DropboxError('failed', 'no token');
  return { accessToken: j.access_token, expiresAt: Date.now() + Math.max(60, (j.expires_in ?? 14_400) - 60) * 1000, refreshToken: j.refresh_token };
}

/** Swaps the sign-in code for tokens (redirect must match the one used to sign in, or be null for the copy-a-code flow). */
export const exchangeCode = (code: string, verifier: string, redirect: string | null) =>
  tokenRequest({ grant_type: 'authorization_code', code: code.trim(), code_verifier: verifier, ...(redirect ? { redirect_uri: redirect } : {}) });
export const refreshAccess = (refreshToken: string) => tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken });

/** Dropbox-API-Arg must be plain ASCII; escape anything else. */
const apiArg = (o: object) => JSON.stringify(o).replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

export interface DropboxFile { name: string; path: string; size: number }

/** The Steady app folder only — the app can't see the rest of the owner's Dropbox. */
export async function listFiles(token: string): Promise<DropboxFile[]> {
  const res = await call(`${API}/files/list_folder`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ path: '' }) });
  const j = (await res.json()) as { entries?: { '.tag': string; name: string; path_lower: string; size?: number }[] };
  return (j.entries ?? []).filter((e) => e['.tag'] === 'file').map((e) => ({ name: e.name, path: e.path_lower, size: e.size ?? 0 }));
}

/** Uploads a new file and returns the path Dropbox saved it under (it may add " (1)" if the name was taken). */
export async function uploadFile(token: string, name: string, bytes: Uint8Array): Promise<string> {
  const res = await call(`${CONTENT}/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream', 'Dropbox-API-Arg': apiArg({ path: `/${name}`, mode: 'add', autorename: true, mute: true }) },
    body: bytes as Uint8Array<ArrayBuffer>,
  });
  const j = (await res.json().catch(() => ({}))) as { path_lower?: string };
  return j.path_lower ?? `/${name}`.toLowerCase();
}

export async function downloadFile(token: string, path: string): Promise<Uint8Array> {
  const res = await call(`${CONTENT}/files/download`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Dropbox-API-Arg': apiArg({ path }) } });
  return new Uint8Array(await res.arrayBuffer());
}

export async function deleteFile(token: string, path: string): Promise<void> {
  await call(`${API}/files/delete_v2`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) });
}

/** Ends this phone's sign-in at Dropbox (best effort). */
export async function revoke(token: string): Promise<void> {
  await call(`${API}/auth/token/revoke`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }, 5_000).catch(() => undefined);
}
