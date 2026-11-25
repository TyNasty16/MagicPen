// Open Food Facts (OFF) search: building the request and reading the reply. Pure, no network here.
// OFF is the app's one allowed third-party call (CLAUDE.md). Data: Open Food Facts, ODbL.
import type { Pickable } from './foodSearch';

export const OFF_ENDPOINT = 'https://search.openfoodfacts.org/search';
const FIELDS = 'code,product_name,brands,nutriments,serving_size,serving_quantity,serving_quantity_unit';

/** The full request URL: only the search words, page size, language and the fields Steady reads. */
export function buildOffUrl(term: string, pageSize = 20): string {
  const q = new URLSearchParams({ q: term.trim(), page_size: String(pageSize), langs: 'en', fields: FIELDS });
  return `${OFF_ENDPOINT}?${q}`;
}

export interface OffProduct extends Pickable {
  brand?: string;
}

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** First brand, without OFF's language prefix ("xx:Chobani" → "Chobani"). */
function firstBrand(brands: unknown): string | undefined {
  const b = Array.isArray(brands) ? brands[0] : typeof brands === 'string' ? brands.split(',')[0] : undefined;
  const t = cleanText(b, 60).replace(/^[a-z]{2}:/, '').trim();
  return t || undefined;
}

/**
 * Text from OFF: strings only, control and invisible direction characters removed (they can disguise a name),
 * whitespace collapsed, length capped. Always shown as plain React text, never as HTML.
 */
export function cleanText(v: unknown, max = 120): string {
  if (typeof v !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * One OFF product, or null if it has no name, kcal or protein per 100 g (per 100 ml for drinks).
 * OFF lists drinks per 100 ml in its `_100g` fields, so an ml serving scales directly, with no ml-to-g guess.
 */
export function parseOffProduct(h: Record<string, unknown> | null | undefined): OffProduct | null {
  if (!h || typeof h !== 'object') return null;
  const n = (h.nutriments ?? {}) as Record<string, unknown>;
  const name = cleanText(h.product_name);
  const kcal = num(n['energy-kcal_100g']);
  const proteinG = num(n['proteins_100g']);
  if (!name || kcal === undefined || proteinG === undefined) return null;
  const sizeText = cleanText(h.serving_size, 60);
  const qty = num(h.serving_quantity);
  const unitField = typeof h.serving_quantity_unit === 'string' ? h.serving_quantity_unit.toLowerCase() : '';
  const unit: 'g' | 'ml' = unitField === 'ml' || (!unitField && /\bml\b/i.test(sizeText) && !/\d\s*g\b/i.test(sizeText)) ? 'ml' : 'g';
  const portions: [string, number][] = [];
  if (qty && qty > 0) portions.push([sizeText || `${qty} ${unit}`, qty]);
  portions.push([`100 ${unit}`, 100]);
  return {
    name,
    brand: firstBrand(h.brands),
    unit,
    per100: { kcal, proteinG, carbsG: num(n['carbohydrates_100g']), fatG: num(n['fat_100g']), fiberG: num(n['fiber_100g']) },
    portions,
  };
}

/** Search reply: products with nutrition are shown; the rest are counted as hidden. */
export function parseOffResults(json: unknown): { shown: OffProduct[]; hidden: number } {
  const hits = (json as { hits?: unknown })?.hits;
  if (!Array.isArray(hits)) return { shown: [], hidden: 0 };
  const shown: OffProduct[] = [];
  let hidden = 0;
  for (const h of hits as Record<string, unknown>[]) {
    const p = parseOffProduct(h);
    if (p) shown.push(p);
    else hidden++;
  }
  return { shown, hidden };
}

export const hiddenLine = (n: number) => (n === 0 ? null : `${n} ${n === 1 ? 'product' : 'products'} hidden: nutrition not listed.`);

/** Name saved to the log and My Foods: "Name (Brand)". */
export const offSavedName = (p: OffProduct) => (p.brand ? `${p.name} (${p.brand})` : p.name);

export type OffError = 'offline' | 'timeout' | 'busy' | 'unavailable';
export const OFF_MESSAGES: Record<OffError | 'empty', string> = {
  offline: 'You’re offline. Online search needs a connection; the built-in list still works.',
  timeout: 'The search took too long. Try again.',
  busy: 'Open Food Facts is busy. Wait a minute and try again.',
  unavailable: 'Open Food Facts is unavailable right now. Try again later.',
  empty: 'No online match. Try fewer words, or type the values below.',
};
export const OFF_NOTICE = 'Search online? The words you typed will be sent to Open Food Facts, a free food database. Like any website, it can see your internet address. Nothing else from this app is sent.';
export const OFF_WARNING = 'Entered by volunteers. Check against the label.';
export const OFF_CREDIT = 'Food data: Open Food Facts (ODbL).';

/** Maps an HTTP status to a message key (429 busy; anything else not OK is "unavailable"). */
export const errorForStatus = (status: number): OffError => (status === 429 ? 'busy' : 'unavailable');
