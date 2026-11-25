import { buildOffUrl, errorForStatus, parseOffResults, type OffError, type OffProduct } from './offSearch';

export const OFF_TIMEOUT_MS = 8000;

/**
 * The single request to Open Food Facts. Sends only the URL from `buildOffUrl`:
 * no cookies, no referrer, no custom headers, never cached.
 */
export async function searchOnline(term: string): Promise<{ ok: true; shown: OffProduct[]; hidden: number } | { ok: false; error: OffError }> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, error: 'offline' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OFF_TIMEOUT_MS);
  try {
    const res = await fetch(buildOffUrl(term), { method: 'GET', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) return { ok: false, error: errorForStatus(res.status) };
    return { ok: true, ...parseOffResults(await res.json()) };
  } catch (e) {
    if (ctrl.signal.aborted) return { ok: false, error: 'timeout' };
    return { ok: false, error: navigator.onLine === false ? 'offline' : 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}
