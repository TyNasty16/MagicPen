# Workflow 08b — Doctor report (preview, PDF, share)
Status: Built — 2026-11-26
Milestone: Part 2 of 2 of the doctor report (I-37); pulls "PDF summary for doctor visits" (PLAN.md §2, v2) forward. Needs 08a built first.

## Ideas considered
Ideas files: [docs/ideas/08-doctor-report.md](../ideas/08-doctor-report.md); owner decisions in [docs/ideas/08-doctor-report-brief.md](../ideas/08-doctor-report-brief.md); measured library facts in [docs/sources/08-pdf-library-check.md](../sources/08-pdf-library-check.md). Chosen approach: two steps (08a done first), one pure `buildReport()` feeding both the preview and the PDF. Existing code reused: `symptomAlerts`, `nutrition`, `weight`, `range` (`doseChanges`), `drugs`, `units`, `profileTargets`, the 08a appointments.

## Goal
From the Doctor report menu item, build a short PDF of the owner's own entries for their prescriber, preview it with section switches, and share it from the phone, without any data leaving the device until the owner shares it.

## In scope
- Report builder screen with preview. Period: "Since last appointment" (default; first report uses the start of the data), or a custom start and end date.
- Sections in order: Header; Questions for this visit; Medicine and doses; Weight; Side effects; Food and protein; Measurements; Footer. Off by default: photos, individual food items, water, past appointment notes.
- Each section has an on/off switch; limited-data sections are flagged amber (a data gap, never a health concern).
- PDF: US Letter, Warm Sand colours, Profile units (pounds for the owner) only, Helvetica body, Times headings, small weight chart drawn as lines.
- Share through the Web Share API with the file; fallback to a download.
- Optional name from Profile printed on every report.
- Report maths as pure, tested functions in `src/lib/report.ts`.

## Out of scope
- Dose advice or escalation hints; "you should discuss" wording; any interpretation of numbers.
- Kilograms or a second unit; other page sizes.
- Auto-upload, cloud links, email sending from the app, analytics.
- Reminder before a visit; remembering switches between reports; "Make report for this visit" button (candidate follow-ups).
- Non-Latin characters in names and notes (see risks).

## Report rules (as decided in the brief)
- **Period:** start = last appointment dated on or before today (or the custom start); end = today (or custom end). Days covered counted inclusively.
- **Averages** use logged days only and say so: "from 9 of 28 days logged".
- **Week coverage (weight and measurements):** split the period into 7-day blocks from its start; limited unless every full block has at least one entry. A last partial block is ignored; a period under 7 days is one block.
- **Food and protein:** limited if logged on fewer than half the days. "Barely ate" days are the days the owner marked (the `dayMarks` table from Milestone 5), counted separately.
- **Side effects:** limited if none logged.
- **Doses:** limited if any gap between consecutive logged injections is over 7 days; gaps are listed as dates and day counts, nothing more.
- **Default switches for flagged sections:** off for food, measurements, weight; on for doses and side effects. An included flagged section prints one neutral line.
- **Nothing logged:** the section prints one line instead of vanishing. One weigh-in shows the weight with no change.

## Exact text for owner review
Section titles: **Report for [name]** (or "Report" with no name) with subtitle "Period covered: [date] to [date] · Medicine: [drug] · Started: [date] · Made: [date]"; **Questions for this visit**; **Medicine and doses**; **Weight**; **Side effects**; **Food and protein**; **Measurements**; **Past appointment notes** (only if switched on).

Limited-data and empty lines (plain, same wording on screen and in the PDF):
- Weight / Measurements: "Logged in [n] of [m] weeks" (limited); "Nothing logged in this period." (empty)
- Food and protein: "Logged on [n] of [m] days. Averages are from logged days only." (limited); "Nothing logged in this period." (empty)
- Side effects: "None logged in this period." 
- Doses: "Gap of [n] days between injections on [date] and [date]." (one line per gap); "No injections logged in this period." (empty)
- Questions: "No questions saved."
- One weigh-in: "One weigh-in: [x] lb on [date]."
- Averages: "Average protein [x] g (target [y] g), from 9 of 28 days logged."

Footer: "Made with Steady from the owner's own entries. Not medical advice."

Preview note (above the Share button): "This report is made on your phone. Once you share it, the PDF is outside the app and Steady can't take it back or control who sees it."
Amber flag label on the preview: "Limited data" with the section's line above, e.g. "Limited data: Logged on 9 of 28 days."
Share fallback: "Sharing isn't available here. The PDF was downloaded instead."

## PDF approach: your choice
- **Option A (recommended; owner to choose A or B): own small PDF writer** in `src/lib/pdf/`. No dependency, no network or HTML code, est. 5 to 15 KB, nothing to audit beyond our own code. Uses PDF standard fonts: Helvetica for body, Times for headings. Cost: we write and test layout (wrapping, page breaks, chart); standard fonts cover basic Latin only.
- **Option B: jsPDF 4.2.1.** Less code to write, but 249 KB gzip (lazy-loaded), and its bundle contains `XMLHttpRequest`, `fetch` and `innerHTML` code that we would not call but could not remove in testing. Security checks as for ZXing (audit, provenance, bundle scan, output sanitising) would be repeated and documented.
- pdf-lib is not offered: unmaintained since May 2022.
Reply "A" or "B".

## Steps
1. `src/lib/report.ts` (new, pure): `reportPeriod`, `weekBlocks`, `weekCoverage`, `loggedDayAverages`, `doseGaps`, `symptomSummary`, and `buildReport(data, options)`, returning a plain object with each section, its lines, and its `limited` flag. Reuses `doseChanges`, `symptomAlerts`, `dayTotals`, `proteinLowDays`, `weightStats`, `effectiveTargets`, `formatDrugDose`. No PDF or UI code.
2. The exact strings above live in `src/lib/report.ts` (with the report maths), covered by one advice-word guard test.
3. `src/lib/pdf/` (new, Option A): `writer.ts` (objects, xref, standard fonts, Latin-1 text encoding with unsupported characters replaced by "?", wrapping, page breaks, lines/rects), `render.ts` (report object to pages, weight chart). If B is chosen: lazy `import()` of jsPDF with the same `render.ts` interface, plus `docs/sources/08-pdf-security.md`.
4. `src/pages/DoctorReport.tsx` (replaces the 08a placeholder): period choice, section switches with amber flags, on-screen preview from the same report object, privacy note, Share button.
5. `src/lib/shareReport.ts`: `navigator.canShare({ files })`, then `navigator.share`; otherwise download via a Blob URL; revoke the URL afterwards.
6. Tests, one full run and build, one browser pass.

## Acceptance criteria
- Doctor report opens with "since last appointment" selected; with no appointments it starts at the first entry.
- A custom start and end date changes the period and every count.
- Every section has a switch; limited sections show the amber "Limited data" label and start off or on exactly as listed above.
- An included limited section prints its neutral line in the PDF.
- A period with 9 of 28 days of food shows "from 9 of 28 days logged" and the protein average uses only those 9 days.
- Injections 8 days apart list one gap; exactly 7 days apart list none.
- Weight with an entry in every full 7-day block is not flagged; a missing block is flagged.
- One weigh-in shows the weight and no change; no BMI line if height is missing.
- The PDF is US Letter, in the Profile units (pounds), with the footer on the last page; the name appears on every page header when set.
- Open questions from the latest appointment print at the top; past appointment notes appear only when switched on.
- Share opens the share sheet on a phone; on desktop the file downloads.
- No text in the report recommends, interprets or advises; no dose escalation text.
- No network requests are made while building or sharing; works offline; existing tests and the build pass.

## Tests
Automatic (Vitest): period defaults and custom range; week blocks (28 days, 10 days, 5 days, partial last block); coverage flags; averages over logged days; protein and "barely ate" counts; dose gaps (7 vs 8 days, first report); symptom summary (days logged, highest severity); default switch states; text guard `/increase|decrease|raise|lower|skip|escalat|titrat|should|recommend/i` over the report strings; PDF writer output starts with `%PDF-`, ends with `%%EOF`, has a valid xref and escapes `( ) \`; page break and wrapping.
By hand (one browser pass, screenshots): menu to report; period switching; switches and flags; preview; the PDF rendered to an image for the owner to read; share fallback on desktop. Real iPhone Share menu can only be checked by the owner on the phone after deploy.

## Risks & open questions
- Owner-written notes and names are printed as plain text; control characters are stripped. Characters outside basic Latin print as "?" with Option A.
- Warm Sand as a full page background prints tinted and uses ink; text will be dark brown (owner decision: same look as the app).
- Units: the report follows the Profile units with no second unit (owner: "only lbs"; the owner's Profile is in pounds).
- Proposed defaults, reply "defaults OK":
  - Week blocks counted from the period start; last partial block ignored.
  - Dose gaps measured only between injections inside the period.
  - Body text 10 pt or larger; the chart has labelled axes and survives greyscale.
  - File name "Steady-report-YYYY-MM-DD.pdf" (no name in the file name).
  - Photos, food items, water and past notes are all off and not part of the first build's switches except past notes (photos, food items and water switches are shown disabled as "Not in this version"). Reply "build them" to include.
- Reply "approve the exact text" or give changes to the wording above.
- PDF approach: "A" or "B".

## Build notes (2026-11-26)
- Built as planned with option A: `src/lib/report.ts` (pure maths + approved wording), `src/lib/pdf/writer.ts` (own PDF writer: standard fonts, WinAnsi text, JPEG photos, xref), `src/lib/pdf/render.ts` (Warm Sand US Letter layout, running header "Page i of N", tables, weight chart, photos), `src/lib/shareReport.ts`, `src/pages/DoctorReport.tsx`. Owner's "build them": water, food items and photos sections included (off by default), plus past appointment notes.
- Security (as for ZXing): no new packages; the PDF code is its own lazy chunk (4 KB gzip) with no network, eval or HTML-writing code; `npm audit --omit=dev`: 0; owner text is shown as plain text and cleaned.
- Browser pass: default period "since last appointment"; default switches exactly as the brief; amber limited-data tags; a real 3-page PDF with two photos was made, downloaded on desktop (fallback message shown), checked with pdfinfo (US Letter) and rendered with pdftoppm for the owner; no outside requests; no sideways scroll.
- Code review fixes: a half-typed year (e.g. 0002) could freeze the page — periods must now be from 2000 and at most about 10 years, and alerts are only checked on days with entries; switches no longer reset when new data arrives (only when the period changes); on iPhone, if sharing must follow a tap, a "Share PDF" button appears instead of falling back to a download; more WinAnsi letters (e.g. Š, œ) print instead of "?"; long tables repeat their header on a new page; "+0.0 lb" no longer appears; switch labels read cleanly to screen readers; the doses flag isn't repeated.
- Small wording additions beyond the approved list, all factual labels: "Last logged dose: …", "Injections logged: n", "Start of period / Now / Change in period / BMI / Change since start", table headings, "No notes / No photos in this period.", "Share PDF", and the custom-date hint "(from 2000, up to 10 years)".

- Token Steward: before start (applied: white-page alternative dropped, report strings folded into report.ts, duplicate tests removed, PDF image part of the one browser pass, owner chooses A or B explicitly — if A, tests limited to header/trailer, xref, escaping and one page break. Not applied: one combined browser pass for 08a and 08b — 08a can go online on its own, so it keeps its own short pass)
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
**What it adds:** A short PDF file (a document that prints the same on any device) of your own entries, for your prescriber (the doctor who prescribes your medicine). It covers the time since your last appointment, or dates you pick. You preview it, switch sections on or off, and share it from your phone.

**Cost:** Nothing. Nothing leaves the phone until you share.

**What could go wrong:** Once shared, the PDF is outside the app, and Steady cannot recall it or control who sees it. Sections with little data show an amber "Limited data" label. Some letters may print as "?". On a computer the file downloads instead of sharing.

**You need to decide:**
- How the PDF is made. **A:** Steady writes its own small file (about 5 to 15 KB, nothing outside to trust, plain fonts). **B:** an outside library, jsPDF (about 250 KB, including internet-fetching code we would not use).
- Defaults: since last appointment; past appointment notes off. Photos, food items and water are left for later. Say "build them" to include them.
- Approve the exact wording, or ask for changes.

## Approval
- [x] Approved by owner — date: 2026-11-26 (defaults OK; exact text approved; PDF option A; "build them": photos, food items and water switches included in the first version)
