import { buildBarcodeUrl, lookupCodes, parseBarcodeReply, type LookupResult, type ShortFormat } from './barcode';
import { buildOffUrl, errorForStatus, parseOffResults, type OffError, type OffProduct } from './offSearch';

export const OFF_TIMEOUT_MS = 8000;

/** One GET to Open Food Facts: no cookies, no referrer, no custom headers, never cached, 8 s timeout. */
async function offGet(url: string): Promise<{ ok: true; json: unknown } | { ok: false; error: OffError }> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, error: 'offline' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OFF_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'GET', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) return { ok: false, error: errorForStatus(res.status) };
    return { ok: true, json: await res.json() };
  } catch {
    if (ctrl.signal.aborted) return { ok: false, error: 'timeout' };
    return { ok: false, error: navigator.onLine === false ? 'offline' : 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}

/** Online search (05b): sends only the URL from `buildOffUrl`. */
export async function searchOnline(term: string): Promise<{ ok: true; shown: OffProduct[]; hidden: number } | { ok: false; error: OffError }> {
  const r = await offGet(buildOffUrl(term));
  return r.ok ? { ok: true, ...parseOffResults(r.json) } : r;
}

/** Barcode lookup (05c): `code` must already have passed `cleanBarcode`. At most two requests (typed 8-digit number valid as EAN-8 and UPC-E). */
export async function lookupBarcode(code: string, format?: ShortFormat): Promise<({ ok: true } & LookupResult) | { ok: false; error: OffError }> {
  for (const c of lookupCodes(code, format)) {
    const r = await offGet(buildBarcodeUrl(c));
    if (!r.ok) return r;
    const parsed = parseBarcodeReply(r.json, c);
    if (parsed.kind !== 'notfound') return { ok: true, ...parsed };
  }
  return { ok: true, kind: 'notfound' };
}
