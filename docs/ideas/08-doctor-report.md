# 08 Doctor report (I-37) — ideas

Brief with the owner's fixed decisions: `docs/ideas/08-doctor-report-brief.md`. Not re-asked here.

## Opening ideas — 2026-11-26

**The request, restated:** Make a one-tap, on-phone PDF summary for the owner's prescriber (since the last logged appointment), previewed first, then shared through the iPhone Share menu, with a new Appointments list and a Home menu to reach it.

### Approaches
1. **Two steps: 08a Appointments + menu, then 08b report (Recommended).** 08a: Dexie v8 `appointments` table, Appointments page, Home gear becomes a menu (Doctor report / Settings / Appointments), optional name in Profile. 08b: PDF library, preview, sharing. Owner sees something useful right away; the risky part (library + security review) is isolated. Pros: small reviewable changes, the "since" date already works in 08b. Cons: two rounds of review. Effort: M + L.
2. **One build, everything at once.** Same scope, one approval. Pros: one trip through the process. Cons: large diff, hard to review, a library problem blocks Appointments too. Effort: XL.
3. **Three steps: 08a Appointments + menu, 08b report on screen (HTML preview, with the section switches and limited-data flags), 08c PDF + Share.** Pros: the report logic (the hard part: limited-data rules, wording) is tested and approved before any library is chosen; the preview can't drift from the PDF if both read the same data object. Cons: three rounds. Effort: M + M + M.

Reason for 1: the preview and PDF can share one "report data" builder, and a two-step split is enough. Choose 3 if the owner wants to approve the wording before the PDF work.

### PDF library options (all need a fresh security review like `docs/sources/05c-zxing-security.md`: npm audit, signatures/provenance, install scripts, code scan for network/eval, output sanitising)
Figures are from memory and need checking at review time.
- **jsPDF** (MIT): about 300 KB minified; it lazy-loads fine with dynamic `import()`. It draws lines and rects, so the weight chart can be drawn directly. Custom fonts via `addFont` (TTF base64). Its optional dependencies (html2canvas, dompurify) should not be bundled. It has had past CVEs (ReDoS and similar), so audit carefully. Widely used and actively maintained. Likely front-runner.
- **pdf-lib** (MIT): about 400 KB; fonts need the separate fontkit package; effectively unmaintained since 2021 (forks exist). Clean API, no network. Weaker on provenance.
- **pdfmake** (MIT): easy layout, but about 1 MB+ with fonts. Too heavy.
- **Hand-written minimal PDF** (no library): tiny and nothing to audit, but text wrapping, fonts and the chart become our job. Only worth it if the PDF is very plain.
- **Browser Print to PDF** (no library): lowest risk and zero size, but iPhone gives less control and no direct file share. Fallback only.

All can run with no network. Embed a font file (served from the app, not a CDN) so special characters and sizes are consistent; standard PDF fonts only cover basic Latin.

### Printing Warm Sand legibly (owner's choice stands)
- Full cream background prints as a grey/tinted page and wastes ink; text contrast drops. If kept, use a light cream and dark brown text (aim for at least 7:1).
- Alternative that still looks like Steady: white page, Warm Sand accents (headings, rules, chart line, section tints). Owner may prefer this for faxing or photocopying.
- Either way: body text at least 10 pt, don't rely on colour alone (the amber "limited data" flag also needs words), chart with labelled axes and a line that survives greyscale.

### iPhone Share menu
Use `navigator.canShare({ files })` then `navigator.share({ files: [pdf] })` (iOS Safari 15+ and installed PWAs, must be triggered by a tap). Fall back to a download/open-in-new-tab link when unsupported. Print comes through the Share sheet. Test on a real iPhone, since desktop browsers differ.

### Fresh ideas (optional)
- "Make report for this visit" button plus a reminder card on Home the day before the next appointment.
- A one-line "what changed since last visit" at the top of the preview (facts only).
- Page-1 only by default, with a compact option for quick visits.
- Remember each report's section switches so they stick next time.

### Watch-outs
- **Privacy once shared:** the PDF leaves the app; preview must say so (decided). No auto-upload, no cloud link, no analytics.
- **Name field:** stored in the profile only. It must be cleared by reset, and reset must also clear appointments (Dexie `appointments` table and the stored switches). Check that the reset test covers both.
- **Dexie v8:** add `appointments: '++id, date'` as a new version; keep the v1–v7 stores untouched, and test an upgrade from v7 with real data.
- **Limited-data rules:** "at least one entry in every week between appointments" needs a clear definition (calendar weeks or 7-day blocks from the start date), edge cases (first report, no appointments, custom range) and unit tests.
- **Wording:** factual only ("Logged on 9 of 28 days"); no advice, no "you should discuss". "Take a closer look" alerts are printed as logged. Any medical text must be sourced, as with `symptomAlerts`.
- **Notes and questions** are the owner's own words; print them as plain text (sanitise control characters, long text wraps).
- **Reuse:** `symptomAlerts` (alerts), `nutrition` (`dayTotals`, `proteinLowDays`), `weight` (`dailyWeights`, `weightStats`), `range` (`doseChanges`, `filterRange`), `drugs`/`injections` (names, doses, `formatDrugDose`), `units` (pounds), `profileTargets` (targets). Add one pure `buildReport()` and test it, with no PDF code inside.
- **Cost and size:** $0, no new network calls; library loads only when the report opens, so the main bundle doesn't grow.
