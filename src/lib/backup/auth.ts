// Connecting Dropbox (workflow 10a). Two ways: Dropbox returns to Steady (redirect), or Dropbox shows a code the owner
// copies back into Steady. The second is the safety net for the iPhone Home Screen app, whose storage is separate
// from Safari's: if sign-in finishes in Safari, Steady can't see it there.
import { authorizeUrl, challengeFor, exchangeCode, newVerifier, PKCE_KEY, redirectUri } from './dropbox';
import { saveBackupState } from './run';

interface Pending { verifier: string; state: string; redirect: string | null }
const store = (p: Pending) => { try { localStorage.setItem(PKCE_KEY, JSON.stringify(p)); } catch { /* blocked */ } };
const load = (): Pending | null => { try { return JSON.parse(localStorage.getItem(PKCE_KEY) ?? 'null'); } catch { return null; } };
const clear = () => { try { localStorage.removeItem(PKCE_KEY); } catch { /* blocked */ } };

async function prepare(redirect: string | null): Promise<string> {
  const verifier = newVerifier();
  const state = newVerifier().slice(0, 24);
  store({ verifier, state, redirect });
  return authorizeUrl(await challengeFor(verifier), state, redirect);
}

/** Leaves for Dropbox's sign-in page; Dropbox comes back to Steady's address. */
export async function connectWithRedirect(): Promise<void> {
  location.assign(await prepare(redirectUri()));
}

/** Opens Dropbox's sign-in page in a new tab; Dropbox shows a code to paste back into Steady. */
export async function startCodeSignIn(): Promise<void> {
  const url = await prepare(null);
  window.open(url, '_blank', 'noopener');
}

async function saveTokens(code: string, p: Pending) {
  const t = await exchangeCode(code, p.verifier, p.redirect);
  await saveBackupState({ refreshToken: t.refreshToken, accessToken: t.accessToken, accessExpires: t.expiresAt, lastError: undefined, lastErrorAt: undefined });
  clear();
}

/** Finishes the copy-a-code sign-in. */
export async function finishCodeSignIn(code: string): Promise<void> {
  const p = load();
  if (!p || p.redirect !== null) throw new Error('no-pending');
  await saveTokens(code, p);
}

/**
 * On app start: if Dropbox just sent the owner back (?code=&state= or ?error=), finish sign-in and tidy the address.
 * 'browser' means the return landed where the sign-in didn't start (e.g. Safari instead of the Home Screen app).
 */
export async function handleRedirectReturn(): Promise<'none' | 'connected' | 'browser' | 'cancelled' | 'failed'> {
  const q = new URLSearchParams(location.search);
  if (!q.has('code') && !q.has('error')) return 'none';
  const code = q.get('code');
  const state = q.get('state');
  history.replaceState(null, '', `${location.pathname}#/backup`);
  const p = load();
  if (!code) {
    clear();
    return 'cancelled';
  }
  if (!p || p.state !== state || !p.redirect) {
    clear();
    return 'browser';
  }
  try {
    await saveTokens(code, p);
    return 'connected';
  } catch {
    clear();
    return 'failed';
  }
}
