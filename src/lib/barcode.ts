// Barcode scanning (05c): checking a number before anything is sent, and reading Open Food Facts' product reply.
// Pure, no network. Security review: docs/sources/05c-zxing-security.md.
import { parseOffProduct, type OffProduct } from './offSearch';

const FIELDS = 'code,product_name,brands,nutriments,serving_size,serving_quantity,serving_quantity_unit';

/** GTIN check digit (EAN-8, UPC-A, EAN-13): weights 3, 1, 3… from the right, excluding the check digit. */
function checkDigitOk(code: string): boolean {
  const d = [...code].map(Number);
  const check = d.pop()!;
  const sum = d.reverse().reduce((s, n, i) => s + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** Expands an 8-digit UPC-E (number system 0 or 1) to its 12-digit UPC-A. */
export function upcEtoA(e: string): string {
  const [ns, a, b, c, d, f, g, ck] = e;
  const body =
    g <= '2' ? `${a}${b}${g}0000${c}${d}${f}` : g === '3' ? `${a}${b}${c}00000${d}${f}` : g === '4' ? `${a}${b}${c}${d}00000${f}` : `${a}${b}${c}${d}${f}0000${g}`;
  return `${ns}${body}${ck}`;
}

/**
 * A safe barcode string, or null. Spaces and dashes are removed; the rest must be ASCII digits,
 * 8, 12 or 13 long, with a valid check digit (8-digit UPC-E is expanded to check it). Nothing else is ever sent.
 */
export function cleanBarcode(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 32) return null;
  const t = raw.replace(/[\s-]/g, '');
  if (!/^[0-9]+$/.test(t) || ![8, 12, 13].includes(t.length)) return null;
  if (checkDigitOk(t)) return t;
  if (t.length === 8 && (t[0] === '0' || t[0] === '1') && checkDigitOk(upcEtoA(t))) return t;
  return null;
}

export type ShortFormat = 'ean8' | 'upce';

/**
 * Numbers to look up, in order. OFF stores a UPC-E under its 12-digit UPC-A. An 8-digit number can be valid as
 * both EAN-8 and UPC-E: the scanner says which it read; a typed one tries EAN-8 first, then UPC-E.
 */
export function lookupCodes(code: string, format?: ShortFormat): string[] {
  if (code.length !== 8) return [code];
  const asUpce = (code[0] === '0' || code[0] === '1') && checkDigitOk(upcEtoA(code)) ? upcEtoA(code) : null;
  if (format === 'upce') return asUpce ? [asUpce] : [];
  if (format === 'ean8') return checkDigitOk(code) ? [code] : [];
  return [...(checkDigitOk(code) ? [code] : []), ...(asUpce ? [asUpce] : [])];
}

/** The lookup URL for one number from `lookupCodes`: the number in the path, and only the `fields` parameter. */
export const buildBarcodeUrl = (code: string) => `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`;

const sameCode = (a: string, b: string) => a.replace(/^0+/, '') === b.replace(/^0+/, '');

export type LookupResult = { kind: 'found'; product: OffProduct } | { kind: 'notfound' } | { kind: 'nonutrition' };

/**
 * Reads the product reply for the number that was looked up. OFF answers "not found" with HTTP 200 and `status: 0`.
 * A reply for a different number is treated as not found.
 */
export function parseBarcodeReply(json: unknown, code: string): LookupResult {
  const j = json as { status?: unknown; code?: unknown; product?: unknown } | null;
  if (!j || j.status !== 1 || typeof j.code !== 'string' || !sameCode(j.code, code) || !j.product || typeof j.product !== 'object') return { kind: 'notfound' };
  const product = parseOffProduct(j.product as Record<string, unknown>);
  return product ? { kind: 'found', product } : { kind: 'nonutrition' };
}

export const BARCODE_TEXT = {
  notice: 'Scan a barcode? The camera picture stays on this phone and is never sent. Only the barcode number is sent to Open Food Facts, a free food database. Like any website, it can see your internet address. Nothing else from this app is sent.',
  status: 'Point the camera at the barcode.',
  typedLabel: 'Type the number instead',
  typedButton: 'Look up',
  bad: 'That number doesn’t look right. Check the digits and try again.',
  denied: 'Camera access is off for this app. In the iPhone Settings app, open Safari, tap Camera, and choose Ask or Allow. Then try again. You can also type the number below.',
  noCamera: 'No camera was found on this device. Type the number below.',
  notFound: 'Open Food Facts has no product with this number. Enter the food by hand below.',
  noNutrition: 'This product is listed, but its nutrition isn’t. Enter the values by hand below.',
} as const;
