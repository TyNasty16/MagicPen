import { describe, expect, it } from 'vitest';
import { buildReport, type ReportData } from '../report';
import { renderReport } from './render';
import { jpegInfo, pdfString, PdfDoc, winAnsiBytes, wrap } from './writer';

const latin1 = (b: Uint8Array) => Array.from(b, (c) => String.fromCharCode(c)).join('');

describe('PDF writer', () => {
  it('has a header, a trailer and a cross-reference table whose offsets point at each object', () => {
    const doc = new PdfDoc();
    const p = doc.addPage();
    doc.text(p, 48, 60, 'Hello (world) \\ test', 'regular', 12, '#3a2a22');
    const s = latin1(doc.toBytes({ title: 'T' }));
    expect(s.startsWith('%PDF-1.4')).toBe(true);
    expect(s.trimEnd().endsWith('%%EOF')).toBe(true);
    const xrefAt = Number(s.match(/startxref\n(\d+)/)![1]);
    expect(s.slice(xrefAt, xrefAt + 4)).toBe('xref');
    const entries = [...s.slice(xrefAt).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
    entries.forEach((off, i) => expect(s.slice(off, off + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`));
  });
  it('escapes ( ) \\ and maps text to WinAnsi; unsupported characters become "?"', () => {
    expect(pdfString('a(b)c\\d')).toBe('(a\\(b\\)c\\\\d)');
    expect(winAnsiBytes('’—•é−')).toEqual([0x92, 0x97, 0x95, 0xe9, 0x2d]);
    expect(winAnsiBytes('日\u0007x\n')).toEqual([63, 120, 32]);
    expect(winAnsiBytes('Šťœ')).toEqual([0x8a, 63, 0x9c]); // ť isn't in WinAnsi
  });
  it('wraps long text and cuts an over-long word', () => {
    const lines = wrap('word '.repeat(60), 'regular', 10.5, 200);
    expect(lines.length).toBeGreaterThan(5);
    expect(wrap('x'.repeat(200), 'regular', 10, 100).length).toBeGreaterThan(1);
  });
  it('reads JPEG size; rejects non-JPEG', () => {
    const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 11, 8, 0, 120, 0, 160, 3, 0, 0, 0, 0]);
    expect(jpegInfo(jpg)).toEqual({ width: 160, height: 120, components: 3 });
    expect(jpegInfo(new Uint8Array([0x89, 0x50]))).toBeNull();
  });
  it('a long report breaks onto more pages with "Page i of N" on each', () => {
    const d: ReportData = {
      profile: { id: 'me', units: 'imperial' }, injections: [], weights: [], photoWeightIds: [], measurements: [], symptoms: [], water: [], dayMarks: [], appointments: [],
      foodLog: Array.from({ length: 120 }, (_, i) => ({ date: `2026-11-${String((i % 26) + 1).padStart(2, '0')}`, meal: 'none' as const, name: `Food ${i}`, kcal: 100, proteinG: 5, carbsG: 10, fatG: 2, servings: 1, createdAt: '' })),
    };
    const r = buildReport(d, { start: '2026-11-01', end: '2026-11-26' }, new Date(2026, 10, 26));
    const inc = { questions: true, doses: true, weight: true, symptoms: true, food: true, measurements: true, water: true, foodItems: true, photos: false, notes: true };
    const s = latin1(renderReport(r, inc, new Map()));
    const pages = Number(s.match(/\/Type \/Pages \/Count (\d+)/)![1]);
    expect(pages).toBeGreaterThan(1);
    expect(s).toContain(`(Page ${pages} of ${pages})`);
    expect(s).toContain('(Made with Steady from the owner\x92s own entries. Not medical advice.)');
  });
});
