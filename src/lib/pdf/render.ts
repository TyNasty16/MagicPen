// Lays out a doctor report as US Letter pages in Warm Sand colours (workflow 08b).
import { FOOTER, reportDate, type Block, type Report, type SectionId } from '../report';
import { fit, PAGE_H, PAGE_W, PdfDoc, textWidth, wrap, type Font } from './writer';

const C = { bg: '#f7f1ea', surface: '#fffaf5', ink: '#3a2a22', muted: '#6f5b4c', line: '#eadfd3', accent: '#a85540', amber: '#8a5a12' };
const M = 48; // margin
const W = PAGE_W - M * 2;
const TOP = 64; // below the running header
const BOTTOM = PAGE_H - 56;
const BODY = 10.5;
const LH = 15;

/** The report as a PDF file. `photos` holds JPEG bytes by weigh-in id (only for included photos). */
export function renderReport(r: Report, included: Record<SectionId, boolean>, photos: Map<number, Uint8Array>): Uint8Array {
  const doc = new PdfDoc();
  let page = -1;
  let y = 0;
  const newPage = () => {
    page = doc.addPage();
    doc.rect(page, 0, 0, PAGE_W, PAGE_H, C.bg);
    y = TOP;
  };
  const ensure = (h: number) => { if (y + h > BOTTOM) newPage(); };
  const textLines = (text: string, font: Font, size: number, color: string, x = M, width = W, lh = LH) => {
    for (const l of wrap(text, font, size, width)) {
      ensure(lh);
      doc.text(page, x, y + size, l, font, size, color);
      y += lh;
    }
  };

  newPage();
  // Title block
  doc.text(page, M, y + 22, fit(r.title, 'serif', 24, W), 'serif', 24, C.ink);
  y += 34;
  textLines(r.subtitle, 'regular', 10, C.muted, M, W, 14);
  y += 6;
  doc.line(page, M, y, M + W, y, C.accent, 1.5);
  y += 16;

  for (const s of r.sections) {
    if (!included[s.id]) continue;
    // Keep the heading with the start of its first block.
    const first = s.blocks[0];
    ensure(28 + (first?.kind === 'photos' ? 290 : first?.kind === 'chart' ? 190 : first?.kind === 'table' ? LH * 3 : LH * 2));
    doc.text(page, M, y + 14, s.title, 'serif', 15, C.accent);
    y += 20;
    doc.line(page, M, y, M + W, y, C.line, 0.75);
    y += 8;
    const listed = s.blocks.some((b) => b.kind === 'text' && b.text === s.limitedLine);
    if (s.limited && s.limitedLine && !s.empty && !listed) textLines(s.limitedLine, 'italic', 10, C.amber);
    for (const b of s.blocks) renderBlock(b);
    y += 14;
  }

  // Footer on the last page, after the content.
  ensure(LH * 2);
  y += 4;
  doc.line(page, M, y, M + W, y, C.line, 0.75);
  y += 6;
  textLines(FOOTER, 'italic', 10, C.muted);

  // Running header and page numbers on every page (known only now).
  const total = doc.pageCount;
  for (let i = 0; i < total; i++) {
    const label = r.name ? `Steady · Report for ${r.name}` : 'Steady · Report';
    doc.text(i, M, 34, fit(label, 'regular', 9, W - 90), 'regular', 9, C.muted);
    const pn = `Page ${i + 1} of ${total}`;
    doc.text(i, M + W - textWidth(pn, 'regular', 9), 34, pn, 'regular', 9, C.muted);
    doc.line(i, M, 42, M + W, 42, C.line, 0.5);
  }
  return doc.toBytes({ title: r.title });

  function renderBlock(b: Block) {
    if (b.kind === 'text') return textLines(b.text, 'regular', BODY, b.muted ? C.muted : C.ink);
    if (b.kind === 'table') return table(b.head, b.rows, b.align ?? []);
    if (b.kind === 'chart') return chart(b.points, b.unit);
    if (b.kind === 'photos') return photoRow(b.items);
  }

  function table(head: string[], rows: string[][], align: ('left' | 'right')[]) {
    // Right-aligned columns get a fixed width; left columns share the rest.
    const fixed = 82;
    const rightCount = align.filter((a) => a === 'right').length;
    const leftCount = head.length - rightCount;
    const leftW = (W - rightCount * fixed) / Math.max(leftCount, 1);
    const widths = head.map((_, i) => (align[i] === 'right' ? fixed : leftCount > 1 && i === 0 ? 92 : leftCount > 1 ? leftW * 2 - 92 : leftW));
    const xs = widths.map((_, i) => M + widths.slice(0, i).reduce((s, w) => s + w, 0));
    const row = (cells: string[], font: Font, color: string, isHead = false) => {
      const before = page;
      ensure(LH + 6);
      if (!isHead && page !== before) row(head, 'bold', C.muted, true); // header again at the top of a new page
      cells.forEach((c, i) => {
        const t = fit(c, font, BODY, widths[i] - 8);
        const x = align[i] === 'right' ? xs[i] + widths[i] - textWidth(t, font, BODY) : xs[i];
        doc.text(page, x, y + BODY, t, font, BODY, color);
      });
      y += LH;
      doc.line(page, M, y + 1, M + W, y + 1, C.line, 0.5);
      y += 5;
    };
    row(head, 'bold', C.muted, true);
    for (const r of rows) row(r, 'regular', C.ink);
  }

  function chart(points: { date: string; value: number }[], unit: string) {
    const h = 130;
    ensure(h + 46);
    y += 20;
    const x0 = M + 44, x1 = M + W - 8, y0 = y, y1 = y + h;
    const vals = points.map((p) => p.value);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (hi - lo < 2) { lo -= 1; hi += 1; }
    const t0 = new Date(points[0].date).getTime(), t1 = new Date(points.at(-1)!.date).getTime() || t0 + 1;
    const px = (d: string) => x0 + ((new Date(d).getTime() - t0) / Math.max(t1 - t0, 1)) * (x1 - x0);
    const py = (v: number) => y1 - ((v - lo) / (hi - lo)) * (y1 - y0);
    for (const v of [lo, (lo + hi) / 2, hi]) {
      doc.line(page, x0, py(v), x1, py(v), C.line, 0.5);
      const label = `${Math.round(v * 10) / 10}`;
      doc.text(page, x0 - 6 - textWidth(label, 'regular', 9), py(v) + 3, label, 'regular', 9, C.muted);
    }
    doc.text(page, M, y0 - 2, unit, 'regular', 9, C.muted);
    doc.polyline(page, points.map((p) => [px(p.date), py(p.value)]), C.accent, 1.6);
    for (const p of points) doc.dot(page, px(p.date), py(p.value), 2.2, C.accent);
    const first = reportDate(points[0].date), last = reportDate(points.at(-1)!.date);
    doc.text(page, x0, y1 + 14, first, 'regular', 9, C.muted);
    doc.text(page, x1 - textWidth(last, 'regular', 9), y1 + 14, last, 'regular', 9, C.muted);
    y = y1 + 24;
  }

  function photoRow(items: { weightId: number; caption: string }[]) {
    const boxW = (W - 16) / 2, boxH = 250;
    const placed = items.map((it) => ({ it, handle: photos.has(it.weightId) ? doc.addJpeg(photos.get(it.weightId)!) : null }));
    ensure(boxH + 24);
    placed.forEach(({ it, handle }, i) => {
      const x = M + i * (boxW + 16);
      if (handle === null) {
        doc.text(page, x, y + BODY, 'Photo unavailable.', 'italic', BODY, C.muted);
      } else {
        const { width, height } = doc.imageSize(handle);
        const s = Math.min(boxW / width, boxH / height);
        doc.image(page, handle, x, y, width * s, height * s);
      }
      doc.text(page, x, y + boxH + 14, fit(it.caption, 'regular', 10, boxW), 'regular', 10, C.muted);
    });
    y += boxH + 24;
  }
}
