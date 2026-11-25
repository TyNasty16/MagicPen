# Workflow 04c — Symptom map
Status: Built — 2026-11-25 (awaiting go-live)
Milestone: Improvement to Milestone 4 (owner request)

## Goal
Replace the symptom dropdown and single pattern chart with an at-a-glance symptom-by-day map, plus a per-symptom drill-down page. The design is already approved by the owner: overview `docs/mockups/04c-symptom-map-3-7-days.png`; drill-down is the right panel of `docs/mockups/04c-symptom-map-with-trends.png`.

## In scope
Overview (Symptoms screen; Log button, When-to-get-help button, alert cards and Recent list stay unchanged):
- Segmented switch "3 days / 7 days", default 7.
- Grid, one row per symptom. Columns are real calendar days (last 3 or 7, ending today) with weekday + date. Injection day(s) in view get a terracotta outline and "💉 shot".
- Cell colour = highest severity logged that day, on a 6-step light-to-dark terracotta ramp (step 0 = none). The 3-day view also prints the number in the cell.
- Row label = symptom name, timing phrase, trend word.
- Only symptoms with an entry in the last 3 days (today + 2 previous calendar days) get a row. Others are hidden, with the note "N symptoms not logged in over 3 days are hidden (a, b)". Rows sorted by most recent entry, newest first.
- Legend None to Severe, and a footnote explaining 💉, the 3-day numbers and the trend.
- Tapping a row opens the drill-down.

Drill-down (new route `#/symptoms/<type>`, back header to Symptoms):
- Three stat tiles: entries in last 8 weeks; usual peak day after injection; trend wording.
- Existing day-after-injection bar chart (`PatternChart`, all history).
- New "Each injection week" line chart: average severity per injection week, last 8 weeks, with dose-change lines via `doseChanges`/`placeDoseMarks` from `src/lib/range.ts`.
- The symptom's tip (`tipFor`), collapsed behind "More".
- That symptom's entries; tap to edit (existing `SymptomSheet`).

Rules (pure logic, all deterministic):
- Daily max = highest severity among that symptom's entries on a local calendar day. An "active day" has daily max of at least 1.
- Trend (row): average of daily max over the chosen window (days with no entry count 0) versus the previous window of equal length. Difference within ±0.5 = "→ Same"; below -0.5 = "↓ Better"; above +0.5 = "↑ Worse". If the previous window has no entries at all = "New".
- Timing phrase, 7 days, first match wins: no active days = "none this week"; 5 or more active days = "most days"; peak (highest daily max, earliest day on ties) on the injection day = "peaks on shot day"; peak the day after = "peaks day after shot"; peak in the last 3 days of the window = "late in the week"; otherwise "early in the week".
- Timing phrase, 3 days, first match wins: an injection day is in view and every day from it to today is active = "daily since shot"; only today active = "today"; otherwise "N of 3 days" (N = active days).
- Drill-down trend: average severity over the last 2 injection weeks versus the 2 before. Within ±0.5 = "about the same"; lower = "milder lately"; higher = "stronger lately". Too little data (either period empty) = "not enough data".
- Peak tile: day 0–6 after injection with the highest average (existing `patternByDay`); "not enough data" if no entries.
- Wording is descriptive only. No dose advice or escalation logic anywhere.

## Out of scope
- Any recommendation, dose suggestion, or "should I" wording.
- Changes to symptom logging, alert-card rules, Recent list, or the database schema.
- Choosing which symptoms to show beyond the 3-day rule (no manual pin or hide).
- Windows other than 3 and 7 days; export of the map.
- Notifications.

## Steps
1. `src/lib/symptomMap.ts`: pure functions `windowDays`, `dailyMax`, `visibleSymptoms` (stale hiding, sort), `trendFor`, `timingPhrase`, `injectionWeekAverages`, `weeklyTrend`, `severityStep`/ramp constants.
2. `src/lib/symptomMap.test.ts`: tests listed below.
3. `src/components/SymptomMap.tsx`: segmented switch, grid, legend, footnote, hidden-symptoms note. Rows are buttons, minimum 44px high.
4. `src/components/InjectionWeekChart.tsx`: line chart with dose-change lines; lazy-loaded like `PatternChart`.
5. `src/pages/SymptomDetail.tsx`: stat tiles, `PatternChart`, week chart, collapsed tip, entries list with edit sheet.
6. `src/pages/Symptoms.tsx`: remove dropdown, tip card and pattern chart; render `SymptomMap`. Tip and chart move to the drill-down.
7. Route wiring (`src/lib/route.ts` and the app router file): add `#/symptoms/<type>`; unknown type falls back to Symptoms.
8. Run existing tests (114), new tests, and the build; check at 390px width.

## Acceptance criteria
- The Symptoms screen shows a 7-day grid by default; switching to 3 days shows 3 columns with numbers in the cells.
- The last column is today. Headers show weekday and date.
- A symptom whose latest entry was 3 calendar days ago (today and the 2 days before count as in range) shows a row. One whose latest entry was 4 days ago is hidden and named in the note, for example "2 symptoms not logged in over 3 days are hidden (Fatigue, Headache)".
- With no symptom in range, the grid is replaced by a short empty message, and the hidden note still appears if applicable.
- A day with entries of severity 2 and 4 shows the step-4 colour (and "4" in the 3-day view).
- The injection day in view has a terracotta outline and "💉 shot"; with two injections in the 7-day view, both are marked.
- Trend shows exactly one of Better, Same, Worse, New as defined above. A difference of exactly 0.5 shows Same.
- Rows are ordered by most recent entry.
- Tapping a row opens the drill-down; the back header returns to Symptoms. Every row and control is at least 44px tall.
- Drill-down shows the three tiles, bar chart, week chart with dose-change lines, collapsed tip ("More" expands), and entries that open the edit sheet.
- Colour: the ramp steps are distinguishable from each other and from the page background. Every cell number and "N" label has at least 4.5:1 contrast: white text on the 3 darkest steps, dark text on the lighter steps. Checked by a unit test that computes WCAG contrast. Meaning is never colour-only (numbers in the 3-day view, the Legend, and trend words with arrows).
- Layout holds at 390px without horizontal page scroll. Works offline with no network calls. No dose advice appears.
- The existing 114 tests and the build pass.

## Tests
Automated (`symptomMap.test.ts`):
- Window days for 3 and 7 ending today, including a month boundary.
- Daily max with multiple entries per day and none.
- Stale hiding at exactly 3 days (shown) and 4 days (hidden); sort order by latest entry.
- Trend: -0.5, +0.5 (Same), just beyond each (Better/Worse), and New when the previous window is empty.
- Timing phrases: each branch in both views, including "daily since shot" and the "first match wins" order.
- Per-injection-week averages (weeks with no entries omitted), weekly trend wording and not-enough-data.
- Ramp contrast check as described above.

By hand: 390px layout, tap targets, chart lazy-loading, offline reload, one pass with real-looking data against the mockups.

## Risks & open questions
- Colour ramp hex values will be proposed in step 1 and checked by the contrast test. They may differ slightly from the mockup shades if a step fails 4.5:1.
- A symptom logged with severity 0 only is treated as logged (it gets a row) but has no active days, so the timing phrase reads "none this week" (7 days) or "0 of 3 days" (3 days). This is the plan unless the owner prefers otherwise.
- Few entries make trends noisy; the footnote will say so, matching the existing "a few entries can be misleading" note.

Token Steward trims applied: tests written with the logic and iterated alone, full suite + build once at the end; page edit and route wiring done in one pass; one browser pass at 390px with screenshots of the 3-day view, 7-day view and drill-down, with tap-size, offline and no-network checks automated in that same pass; colour ramp chosen by running the contrast check once.

**Owner decision (2026-11-25):** a 0/5 symptom is not logged. The log panel offers severity 1–5 only; any existing 0/5 entries are ignored by the map, drill-down, patterns and alerts.

Build notes: drill-down route is `#/symptoms?detail=<type>` (keeps the existing hash router; looks the same to the owner). Colour steps checked for ≥4.5:1 text contrast — dark text on steps 0–3, white on steps 4–5 (step 3 lightened to #d6866b, step 1 to #efc4b0; step 0 has a hairline border). Future-dated entries are ignored everywhere.

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
This plan builds the design you already approved. The Symptoms screen becomes a grid: one row per symptom, one column per day, with colour showing the worst reaction logged that day. You can switch between the last 3 and 7 days. Shot days are marked with a syringe icon. Each row shows a short timing note (such as "peaks day after shot") and a trend word: Better, Same, Worse, or New. Symptoms not logged in the last 3 days are hidden, with a note saying so. Tapping a row opens a detail page with summary numbers, two charts, and that symptom's entries. The app only describes patterns; it gives no dose advice.

You need to decide: approve this plan.
Also confirm one open question: a symptom logged only at severity 0 still gets a row, reading "none this week." This is the plan's default unless you prefer otherwise.

## Approval
- [x] Approved by owner — date: 2026-11-25 (0/5 is not logged: severity buttons become 1–5; existing 0/5 entries are ignored by the map)
