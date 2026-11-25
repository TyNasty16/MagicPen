# Workflow 03 — Measurements and graph extras
Status: Awaiting approval
Milestone: 3 — Weight & measurements + charts (PLAN.md §5), plus graph extras deferred from Milestone 2

## Goal
Let the owner log tape measurements and body-fat %, see BMI and waist-to-height ratio, and see trends over time. Add a 30d / 90d / All range toggle and dose-change markers to the weight graph.

## In scope
- Tape measurements: waist, hips, chest, neck, upper arm, thigh. Any subset per entry, dated. Stored in cm, shown in inches or cm per profile units.
- Optional body-fat % on the same entry.
- BMI from the latest weight and profile height, with the standard category label shown neutrally.
- Waist-to-height ratio (latest waist ÷ height).
- Per-measurement change since first entry (e.g. "Waist −2.5 in since first") and a simple chart per selected measurement, reusing the WeightChart style and validated colors.
- Weight graph: 30 days / 90 days / All toggle.
- Weight graph: dose-change markers, a vertical mark labeled with the new dose (e.g. "0.5 mg"). Facts only.
- Home weight tile: one extra line showing BMI.
- Dexie v4 adds a `measurements` table. v3 data is kept.

## Out of scope
- Food logging and symptoms (later milestones).
- Any interpretation or advice about BMI, ratio, or measurements beyond the neutral category label.
- Dose recommendations or escalation logic. Markers only report what was logged.
- Measurement photos, goals or targets for measurements, export.
- Network calls of any kind.

## Steps
1. `src/db/db.ts`: add `Measurement` type (`id`, `date`, optional `waistCm`, `hipsCm`, `chestCm`, `neckCm`, `upperArmCm`, `thighCm`, `bodyFatPct`) and `db.version(4)` adding `measurements: '++id, date'`. Add `listMeasurements`, `saveMeasurement`, `deleteMeasurement`.
2. `src/lib/body.ts` (new): `bmi(kg, cm)`, `bmiCategory(bmi)`, `waistToHeight(waistCm, heightCm)`, `latestOf(entries, field)`, `changeSinceFirst(entries, field)`.
3. `src/lib/units.ts`: add `displayLength(cm, u)`, `lengthToCm(text, u)`, `lengthUnit(u)`, built on existing `cmToIn` / `inToCm`.
4. `src/lib/range.ts` (new): `filterRange(daily, range, today)` for 30d / 90d / all, and `doseChanges(injections)` returning `{date, doseMg}` where the dose differs from the previous logged dose.
5. `src/components/WeightChart.tsx`: generalise into one trend chart that takes a series label and unit, so measurements reuse it (no separate chart file). Lazy-loaded with the screen as today.
6. `src/components/WeightChart.tsx`: accept `range` and `doseChanges`. Draw labeled vertical reference lines for changes inside the visible range. Update the screen-reader label to mention them.
7. `src/pages/Weight.tsx` becomes the "Body" screen with a Weight / Measurements switch; the Measurements part lives in a new `src/pages/Measurements.tsx` rendered inside it. Entry form with six optional fields plus body-fat %. Require at least one value. Edit and delete as for weigh-ins. Stat tiles (BMI, waist-to-height). Per-measurement chips with change since first, tap to chart. Range toggle with 44px buttons above the weight chart.
8. `src/App.tsx`: relabel tab if the owner chooses "Body". Keep the `weight` route so existing links still work.
9. `src/pages/Home.tsx`: add BMI line to the weight tile. Hidden if height or weight is missing.
10. Tests (see below). Run the test suite and build once, at the end.

## Acceptance criteria
- Entering 180 lb with height 5'9" shows BMI 26.6, with a neutral category label ("Overweight" by the standard cut-offs). No advice text.
- Waist 34 in with height 69 in shows waist-to-height 0.49.
- A waist entered as 34 in is stored as 86.4 cm and shown as 34 in (or 86.4 cm in metric).
- Logging only a waist, or only body-fat %, saves. An empty entry is rejected.
- "Waist −2.5 in since first" appears once there are two or more waist entries. With one entry it shows the value and no change.
- 30d / 90d / All changes the graph. A range with no data shows a short message, not a blank chart.
- A dose change from 0.25 to 0.5 mg shows a vertical mark labeled "0.5 mg" on that date. No mark where the dose is unchanged. Marks outside the visible range are hidden.
- Layout works at 390px. All taps are at least 44px. Works offline with no network calls.
- Upgrading from v3 keeps all profile, injections, weights, and photos.
- The existing 61 tests and the build pass.

## Tests
Automatic (Vitest):
- BMI and category boundaries (18.5, 25, 30).
- Waist-to-height.
- Length conversion in both directions and round-trip.
- Change since first.
- Range filtering (edges, empty, All).
- Dose-change detection (first dose, repeats, out-of-order input, same-day entries).

Browser walkthrough, one pass at the end (390px), also covering the v3→v4 upgrade (no new test package):
- Add, edit, delete a measurement.
- Chart per measurement.
- Range toggle and dose markers.
- Offline reload.
- Tap sizes.

## Risks & open questions
**Proposed defaults — owner can reply "defaults OK" or change any:**
1. Measurements live in the Weight tab, renamed **"Body"**, with a Weight / Measurements switch at the top (four tabs stay; existing links keep working).
2. The first logged dose also gets a graph marker ("Started 0.25 mg").
3. Home weight tile adds a **BMI** line.
4. Body-fat % is a single optional number per measurement entry (no separate chart for now).
5. BMI uses the standard adult category labels (Underweight, Healthy weight, Overweight, Obesity), shown neutrally with no advice.
6. Dose markers show only the mg on the graph; the date is in the tap details.

Risks:
- Many dose changes in a short range can overlap labels. Mitigation: abbreviate labels and skip labels that would collide. The mark itself stays.

Token Steward trims applied: one shared chart component instead of a copy; Body screen file decided up front; upgrade checked in the browser walkthrough (no new test package); questions turned into defaults; tests and build run once.

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
Your Weight tab becomes "Body," with a switch between Weight and Measurements.

Log waist, hips, chest, neck, upper arm, thigh and body-fat %, in any mix. Empty entries are refused.

Two new numbers:
- BMI: a body-size score from weight and height, with a neutral label such as "Overweight." No advice.
- Waist-to-height: waist divided by height.

Charts show 30 days, 90 days, or all. Dose changes appear as labeled lines (e.g. "0.5 mg"). The app only reports what you logged and never suggests doses. Works offline.

Risk: many close dose changes may crowd the labels. The lines still show.

You need to decide
Reply "defaults OK" or change any of these:
1. Rename the Weight tab to "Body," with a switch.
2. Also mark the first dose ("Started 0.25 mg").
3. Add a BMI line to the Home weight tile.
4. Body-fat % is one number per entry, no chart.
5. BMI labels: Underweight, Healthy weight, Overweight, Obesity; no advice.
6. Dose lines show mg only; the date appears on tap.

## Approval
- [ ] Approved by owner — date:
