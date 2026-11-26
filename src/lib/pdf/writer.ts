// A small PDF writer (workflow 08b, option A): standard fonts, text, lines, rectangles and JPEG images.
// No dependency, no network, no HTML. Coordinates are in points from the TOP-left of a US Letter page.

export const PAGE_W = 612;
export const PAGE_H = 792;

export type Font = 'regular' | 'bold' | 'italic' | 'serif';
const FONT_RES: Record<Font, { res: string; base: string }> = {
  regular: { res: 'F1', base: 'Helvetica' },
  bold: { res: 'F2', base: 'Helvetica-Bold' },
  italic: { res: 'F3', base: 'Helvetica-Oblique' },
  serif: { res: 'F4', base: 'Times-Bold' },
};

// Helvetica advance widths (1/1000 em) for ASCII 32–126, from the standard font metrics.
const HELV = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];
// Bold and Times-Bold are estimated from Helvetica (slightly wider / narrower), which is safe for wrapping.
const FACTOR: Record<Font, number> = { regular: 1, italic: 1, bold: 1.08, serif: 0.98 };

// Widths of the WinAnsi symbols the report uses (Helvetica metrics); other non-ASCII letters use 556.
const HELV_EXTRA: Record<number, number> = { 0x80: 556, 0x99: 1000, 0x8c: 1000, 0x9c: 944, 0x89: 1000, 0x85: 1000, 0x91: 222, 0x92: 222, 0x93: 333, 0x94: 333, 0x95: 350, 0x96: 556, 0x97: 1000, 0xb7: 278, 0xa0: 278, 0xb0: 400 };

/** Width of text in points. */
export function textWidth(text: string, font: Font, size: number): number {
  let w = 0;
  for (const b of winAnsiBytes(text)) w += b >= 32 && b <= 126 ? HELV[b - 32] : (HELV_EXTRA[b] ?? 556);
  return (w * FACTOR[font] * size) / 1000;
}

// Characters outside ASCII that the PDF standard "WinAnsi" encoding has (everything else prints as "?").
const SPECIAL: Record<string, number> = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e,
  '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
  '−': 0x2d, // minus sign → hyphen
};

/** Text as WinAnsi bytes: control characters dropped, tabs/line breaks as spaces, unsupported characters as "?". */
export function winAnsiBytes(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (ch === '\t' || ch === '\n' || ch === '\r') out.push(32);
    else if (c < 32 || (c >= 0x7f && c < 0xa0)) continue;
    else if (c < 0x7f || (c >= 0xa0 && c <= 0xff)) out.push(c);
    else out.push(SPECIAL[ch] ?? 63);
  }
  return out;
}

/** A PDF string literal: ( ) and \ escaped; bytes kept as Latin-1 characters. */
export function pdfString(text: string): string {
  let s = '(';
  for (const b of winAnsiBytes(text)) s += b === 0x28 || b === 0x29 || b === 0x5c ? '\\' + String.fromCharCode(b) : String.fromCharCode(b);
  return s + ')';
}

/** Splits text into lines that fit `width`; a word longer than a line is cut. */
export function wrap(text: string, font: Font, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (textWidth(next, font, size) <= width) line = next;
    else {
      if (line) lines.push(line);
      let w = word;
      while (textWidth(w, font, size) > width && w.length > 1) {
        let cut = w.length - 1;
        while (cut > 1 && textWidth(w.slice(0, cut), font, size) > width) cut--;
        lines.push(w.slice(0, cut));
        w = w.slice(cut);
      }
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/** Shortens text with "…" to fit `width`. */
export function fit(text: string, font: Font, size: number, width: number): string {
  if (textWidth(text, font, size) <= width) return text;
  let t = text;
  while (t.length > 1 && textWidth(`${t}…`, font, size) > width) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

/** Width, height and colour components of a JPEG (from its SOF marker), or null if it isn't one. */
export function jpegInfo(bytes: Uint8Array): { width: number; height: number; components: number } | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const m = bytes[i + 1];
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { height: (bytes[i + 5] << 8) | bytes[i + 6], width: (bytes[i + 7] << 8) | bytes[i + 8], components: bytes[i + 9] };
    }
    i += 2 + len;
  }
  return null;
}

type RGB = [number, number, number];
export const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const n = (v: number) => (Math.round(v * 100) / 100).toString();
const rgb = (c: RGB) => c.map(n).join(' ');

interface Image { res: string; bytes: Uint8Array; width: number; height: number; components: number }

export class PdfDoc {
  private pages: string[][] = [];
  private images: Image[] = [];

  get pageCount() { return this.pages.length; }
  addPage() { this.pages.push([]); return this.pages.length - 1; }
  private op(page: number, s: string) { this.pages[page].push(s); }

  rect(page: number, x: number, y: number, w: number, h: number, fill: string) {
    this.op(page, `${rgb(hex(fill))} rg ${n(x)} ${n(PAGE_H - y - h)} ${n(w)} ${n(h)} re f`);
  }
  line(page: number, x1: number, y1: number, x2: number, y2: number, color: string, width = 0.75) {
    this.op(page, `${rgb(hex(color))} RG ${n(width)} w ${n(x1)} ${n(PAGE_H - y1)} m ${n(x2)} ${n(PAGE_H - y2)} l S`);
  }
  polyline(page: number, pts: [number, number][], color: string, width = 1.5) {
    if (pts.length < 2) return;
    const path = pts.map(([x, y], i) => `${n(x)} ${n(PAGE_H - y)} ${i ? 'l' : 'm'}`).join(' ');
    this.op(page, `${rgb(hex(color))} RG ${n(width)} w 1 J 1 j ${path} S`);
  }
  dot(page: number, x: number, y: number, r: number, color: string) {
    const k = 0.5523 * r, cy = PAGE_H - y;
    this.op(page, `${rgb(hex(color))} rg ${n(x + r)} ${n(cy)} m ${n(x + r)} ${n(cy + k)} ${n(x + k)} ${n(cy + r)} ${n(x)} ${n(cy + r)} c ${n(x - k)} ${n(cy + r)} ${n(x - r)} ${n(cy + k)} ${n(x - r)} ${n(cy)} c ${n(x - r)} ${n(cy - k)} ${n(x - k)} ${n(cy - r)} ${n(x)} ${n(cy - r)} c ${n(x + k)} ${n(cy - r)} ${n(x + r)} ${n(cy - k)} ${n(x + r)} ${n(cy)} c f`);
  }
  /** Text with its baseline at y. */
  text(page: number, x: number, y: number, str: string, font: Font, size: number, color: string) {
    this.op(page, `BT /${FONT_RES[font].res} ${n(size)} Tf ${rgb(hex(color))} rg ${n(x)} ${n(PAGE_H - y)} Td ${pdfString(str)} Tj ET`);
  }
  /** Adds a JPEG; returns its handle, or null if the bytes aren't a usable JPEG. */
  addJpeg(bytes: Uint8Array): number | null {
    const info = jpegInfo(bytes);
    if (!info || (info.components !== 1 && info.components !== 3)) return null;
    this.images.push({ res: `Im${this.images.length + 1}`, bytes, ...info });
    return this.images.length - 1;
  }
  imageSize(handle: number) { return { width: this.images[handle].width, height: this.images[handle].height }; }
  image(page: number, handle: number, x: number, y: number, w: number, h: number) {
    this.op(page, `q ${n(w)} 0 0 ${n(h)} ${n(x)} ${n(PAGE_H - y - h)} cm /${this.images[handle].res} Do Q`);
  }

  /** The finished file. */
  toBytes(meta: { title: string }): Uint8Array {
    const enc = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const offsets: number[] = [];
    let size = 0;
    const push = (b: Uint8Array) => { chunks.push(b); size += b.length; };
    const latin1 = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff);
    push(latin1('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'));
    const obj = (num: number, body: Uint8Array[]) => { offsets[num] = size; push(enc.encode(`${num} 0 obj\n`)); body.forEach(push); push(enc.encode('\nendobj\n')); };

    const fonts = Object.values(FONT_RES);
    const fontObj = (i: number) => 3 + i; // 3..6
    const imgObj = (i: number) => 3 + fonts.length + i;
    const firstPage = 3 + fonts.length + this.images.length;
    const pageObj = (i: number) => firstPage + i * 2;
    const contentObj = (i: number) => firstPage + i * 2 + 1;

    obj(1, [enc.encode('<< /Type /Catalog /Pages 2 0 R >>')]);
    obj(2, [enc.encode(`<< /Type /Pages /Count ${this.pages.length} /Kids [${this.pages.map((_, i) => `${pageObj(i)} 0 R`).join(' ')}] >>`)]);
    fonts.forEach((f, i) => obj(fontObj(i), [enc.encode(`<< /Type /Font /Subtype /Type1 /BaseFont /${f.base} /Encoding /WinAnsiEncoding >>`)]));
    this.images.forEach((im, i) =>
      obj(imgObj(i), [enc.encode(`<< /Type /XObject /Subtype /Image /Width ${im.width} /Height ${im.height} /ColorSpace /${im.components === 1 ? 'DeviceGray' : 'DeviceRGB'} /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`), im.bytes, enc.encode('\nendstream')]),
    );
    const resources = `<< /Font << ${fonts.map((f, i) => `/${f.res} ${fontObj(i)} 0 R`).join(' ')} >>${this.images.length ? ` /XObject << ${this.images.map((im, i) => `/${im.res} ${imgObj(i)} 0 R`).join(' ')} >>` : ''} >>`;
    this.pages.forEach((ops, i) => {
      const content = latin1(ops.join('\n'));
      obj(pageObj(i), [enc.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources ${resources} /Contents ${contentObj(i)} 0 R >>`)]);
      obj(contentObj(i), [enc.encode(`<< /Length ${content.length} >>\nstream\n`), content, enc.encode('\nendstream')]);
    });
    const infoNum = firstPage + this.pages.length * 2;
    obj(infoNum, [latin1(`<< /Title ${pdfString(meta.title)} /Producer (Steady) >>`)]);

    const xrefAt = size;
    const count = infoNum + 1;
    let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
    for (let i = 1; i < count; i++) xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    push(enc.encode(`${xref}trailer\n<< /Size ${count} /Root 1 0 R /Info ${infoNum} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`));
    const out = new Uint8Array(size);
    let at = 0;
    for (const c of chunks) { out.set(c, at); at += c.length; }
    return out;
  }
}
