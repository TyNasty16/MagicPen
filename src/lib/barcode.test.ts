import { describe, expect, it } from 'vitest';
import fx from './__fixtures__/off-product.json';
import { buildBarcodeUrl, cleanBarcode, lookupCodes, parseBarcodeReply, upcEtoA } from './barcode';
import { cleanText } from './offSearch';

describe('cleanBarcode: only valid barcode numbers are ever sent', () => {
  it.each([
    ['EAN-13', '5000112637922', '5000112637922'],
    ['EAN-13 typed with spaces', '5 000112 637922', '5000112637922'],
    ['EAN-13 typed with dashes', '5000-1126-37922', '5000112637922'],
    ['UPC-A', '049000551365', '049000551365'],
    ['EAN-8', '96385074', '96385074'],
    ['UPC-E', '01234565', '01234565'],
    ['real OFF 8-digit code', '81161775', '81161775'],
    ['real OFF 13-digit code', '0031076869635', '0031076869635'],
    ['wrong check digit', '5000112637923', null],
    ['letters', '50001126379AB', null],
    ['HTML injection', '<img src=x onerror=alert(1)>', null],
    ['path traversal', '../../../etc/passwd', null],
    ['query injection', '5000112637922?x=1&fields=all', null],
    ['URL', 'https://evil.example/5000112637922', null],
    ['too long', '1'.repeat(5000), null],
    ['QR text', 'WIFI:S:home;P:secret;;', null],
    ['wrong length', '123456789', null],
    ['empty', '', null],
    ['full-width digits', '５０００１１２６３７９２２', null],
    ['not a string', 12345678, null],
  ])('%s', (_, input, out) => expect(cleanBarcode(input)).toBe(out));
  it('UPC-E is looked up as its UPC-A; an 8-digit number valid both ways uses the scanned format, or tries both', () => {
    expect(upcEtoA('01234565')).toBe('012345000065');
    expect(lookupCodes('01234565', 'upce')).toEqual(['012345000065']);
    expect(lookupCodes('01234565', 'ean8')).toEqual(['01234565']);
    expect(lookupCodes('01234565')).toEqual(['01234565', '012345000065']); // typed: valid both ways
    expect(lookupCodes('96385074')).toEqual(['96385074']); // EAN-8 only (starts with 9)
    expect(lookupCodes('5000112637922')).toEqual(['5000112637922']);
    expect(parseBarcodeReply({ ...fx.found, code: '012345000065' }, '012345000065').kind).toBe('found');
  });
});

describe('buildBarcodeUrl', () => {
  it('puts only the number in the path and only `fields` in the query', () => {
    const u = new URL(buildBarcodeUrl('5000112637922'));
    expect(u.origin + u.pathname).toBe('https://world.openfoodfacts.org/api/v2/product/5000112637922.json');
    expect([...u.searchParams.keys()]).toEqual(['fields']);
  });
});

describe('parseBarcodeReply', () => {
  it('found: a drink scales per 100 ml', () => {
    const r = parseBarcodeReply(fx.found, '81161775');
    expect(r.kind).toBe('found');
    if (r.kind === 'found') {
      expect(r.product.unit).toBe('ml');
      expect(r.product.portions[0]).toEqual(['340 ml', 340]);
      expect(r.product.brand).toBe('fairlife');
    }
  });
  it('status 0 is not found; a reply for another number is not found', () => {
    expect(parseBarcodeReply(fx.notFound, '5000112637923').kind).toBe('notfound');
    expect(parseBarcodeReply(fx.otherCode, '5000112637922').kind).toBe('notfound');
    expect(parseBarcodeReply(null, '5000112637922').kind).toBe('notfound');
  });
  it('listed without kcal or protein: nutrition not listed (never 0); 0 kcal is kept', () => {
    expect(parseBarcodeReply(fx.noKcal, '5000112637922').kind).toBe('nonutrition');
    expect(parseBarcodeReply(fx.noProtein, '5000112637922').kind).toBe('nonutrition');
    const z = parseBarcodeReply(fx.zeroKcal, '5000112637922');
    expect(z.kind === 'found' && z.product.per100.kcal).toBe(0);
  });
  it('leading zeros are the same number', () => expect(parseBarcodeReply({ ...fx.found, code: '0081161775' }, '81161775').kind).toBe('found'));
  it('cleans hostile text: invisible characters removed, shown as plain text, length capped', () => {
    const r = parseBarcodeReply(fx.hostileName, '5000112637922');
    expect(r.kind === 'found' && r.product.name).toBe('Proteinekahs <script>alert(1)</script> shake');
    expect(r.kind === 'found' && r.product.brand).toBe('Acme');
    expect(cleanText('x'.repeat(500))).toHaveLength(120);
    expect(cleanText(42)).toBe('');
  });
});
