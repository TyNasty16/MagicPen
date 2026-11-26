# PDF library check for I-37 (2026-11-26)

Installed exact versions in a clean folder with `--ignore-scripts`, bundled with esbuild (minified) using only basic drawing (page colour, text, lines).

| Option | Version / updated | Licence | npm audit | Size in app (gzip) | Code that can reach the network or write HTML in the shipped bundle |
|---|---|---|---|---|---|
| **jsPDF** | 4.2.1, Mar 2026 | MIT (23 packages incl. optional html2canvas, canvg, dompurify, core-js with an install script) | 0 | **249 KB** | `XMLHttpRequest` ×7, `fetch(` ×4, `importScripts` ×1, `innerHTML` ×9 — from its file-loading and HTML-to-PDF features; html2canvas/canvg/dompurify referenced |
| **pdf-lib** | 1.17.1, **last release May 2022** | MIT | — | 208 KB | not scanned (unmaintained) |
| **Own small PDF writer** (no library) | — | ours | n/a | est. 5–15 KB | none — only what we write |

Notes:
- jsPDF's network/HTML code is for features Steady would not call (loading files by URL, `.html()`), but it still ships unless tree-shaken away; esbuild did not remove it in this test.
- An own writer can use the PDF standard fonts (Helvetica for body, Times for serif headings — close to the app's serif), Warm Sand colours, vector lines/rectangles for the weight chart, and US Letter pages. Limits: standard fonts cover basic Latin text only (fine for English; names with unusual characters would need care), and every layout detail is our code to test.
- Whichever is chosen, repeat the owner's security checks before shipping (audit, signatures/provenance, bundle scan, output sanitising — see `05c-zxing-security.md`).
