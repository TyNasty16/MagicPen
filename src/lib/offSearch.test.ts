import { describe, expect, it } from 'vitest';
import sample from './__fixtures__/off-sample.json';
import { pickValues, statesAmount } from './foodSearch';
import { buildOffUrl, errorForStatus, hiddenLine, offSavedName, OFF_MESSAGES, OFF_NOTICE, OFF_WARNING, parseOffResults } from './offSearch';

describe('buildOffUrl', () => {
  it('sends only the search words, page size, language and fields to the search host', () => {
    const u = new URL(buildOffUrl('  fairlife protein shake '));
    expect(u.origin + u.pathname).toBe('https://search.openfoodfacts.org/search');
    expect([...u.searchParams.keys()]).toEqual(['q', 'page_size', 'langs', 'fields']);
    expect(u.searchParams.get('q')).toBe('fairlife protein shake');
    expect(u.searchParams.get('page_size')).toBe('20');
    expect(u.searchParams.get('langs')).toBe('en');
  });
  it('encodes the term', () => expect(buildOffUrl('M&M’s 100%')).toContain('q=M%26M%E2%80%99s+100%25'));
});

describe('parseOffResults', () => {
  const { shown, hidden } = parseOffResults(sample);
  it('shows products with a name, kcal and protein; counts the rest as hidden', () => {
    expect(shown.map((p) => p.name)).toEqual(['Chocolate chip muffins', 'Protein shake', 'Sparkling water', 'Crackers']);
    expect(hidden).toBe(3);
    expect(hiddenLine(hidden)).toBe('3 products hidden: nutrition not listed.');
    expect(hiddenLine(1)).toBe('1 product hidden: nutrition not listed.');
    expect(hiddenLine(0)).toBeNull();
  });
  it('keeps 0 kcal, reads numeric strings, leaves unlisted values undefined', () => {
    expect(shown[2].per100.kcal).toBe(0);
    expect(shown[3].per100).toEqual({ kcal: 430, proteinG: 9, carbsG: undefined, fatG: undefined, fiberG: undefined });
    expect(shown[1].per100.fiberG).toBeUndefined();
  });
  it('takes the first brand without its language prefix', () => {
    expect(shown[0].brand).toBe('two-bite');
    expect(shown[2].brand).toBe('Brand A');
    expect(offSavedName(shown[1])).toBe('Protein shake (fairlife)');
    expect(offSavedName(shown[3])).toBe('Crackers');
  });
  it('portions: serving first, then 100 g / 100 ml; drinks stay in ml', () => {
    expect(shown[0].unit).toBe('g');
    expect(shown[0].portions).toEqual([['1 muffin (99 g)', 99], ['100 g', 100]]);
    expect(shown[1].unit).toBe('ml');
    expect(shown[1].portions).toEqual([['340 ml', 340], ['100 ml', 100]]);
    expect(shown[2].unit).toBe('ml'); // no unit field; "330 ml" in the text
    expect(shown[3].portions).toEqual([['100 g', 100]]);
  });
  it('a 340 ml shake scales per 100 ml with no ml-to-g guess (8.82 g × 3.4 = 30 g)', () => {
    const v = pickValues(shown[1], 340, '340 ml')!;
    expect(v.proteinG).toBe(30);
    expect(v.kcal).toBe(149.9);
    expect(v.servingDesc).toBe('340 ml');
    expect(v.fiberG).toBeUndefined();
    expect(pickValues(shown[0], 99, '1 muffin (99 g)')!.servingDesc).toBe('1 muffin (99 g)');
    expect(pickValues(shown[3], 50)!.carbsG).toBeUndefined();
    expect(pickValues(shown[0], 0)).toBeNull();
  });
  it('a label states the amount only as a whole number with its unit', () => {
    expect(statesAmount('1 muffin (99 g)', 99, 'g')).toBe(true);
    expect(statesAmount('340 ml', 340, 'ml')).toBe(true);
    expect(statesAmount('1 bar (140 g)', 40, 'g')).toBe(false);
    expect(statesAmount('250 g', 25, 'g')).toBe(false);
    expect(statesAmount('1 cup (2.5 g)', 2.5, 'g')).toBe(true);
    expect(pickValues(shown[0], 40, '1 bar (140 g)')!.servingDesc).toBe('1 bar (140 g) (40 g)');
  });
  it('tolerates a malformed reply', () => {
    expect(parseOffResults(null)).toEqual({ shown: [], hidden: 0 });
    expect(parseOffResults({ hits: 'x' })).toEqual({ shown: [], hidden: 0 });
  });
});

describe('errors and wording', () => {
  it('maps status codes', () => {
    expect(errorForStatus(429)).toBe('busy');
    expect(errorForStatus(503)).toBe('unavailable');
    expect(errorForStatus(500)).toBe('unavailable');
  });
  it('approved wording contains no advice', () => {
    for (const t of [OFF_NOTICE, OFF_WARNING, ...Object.values(OFF_MESSAGES)]) expect(t).not.toMatch(/dose|should|eat more|increase|skip/i);
  });
});
