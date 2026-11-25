# Workflow 04 — Side effects, tips and "When to get help"
Status: Built — final approval by owner 2026-11-25
Milestone: 4 — Side-effect log + tips + red flags (PLAN.md §5; scope §2 item 4)

## Goal
Let the owner log symptoms quickly, see which days after an injection each symptom tends to appear, and read sourced tips plus an always-visible "When to get help" box. The app logs and reports only; it never advises on doses.

## In scope
- Symptom log: date-time, type, severity 0–5 (0 none, 5 severe), optional notes. Add, edit, delete.
- Types (15): nausea, vomiting, diarrhea, constipation, stomach pain, heartburn/reflux, burping, bloating/gas, fatigue, headache, dizziness, low appetite, hair shedding, injection-site reaction, other.
- Fast logging in a BottomSheet: tap one or more symptom chips, set severity per selected chip (default 2), optional shared note, Save. Several chips = one saved entry each, all sharing the same date-time and note. Editing an entry edits that one symptom only.
- Pattern view: pick a symptom, see a small bar chart of average severity by days since last injection (day 0–6), plus a recent list. Reuses `Segmented` and the Recharts setup used by `TrendChart`.
- Tip card per symptom and the always-visible help box (exact text below).
- New 5th tab "Symptoms". Home Symptom quick-add becomes active and opens the log sheet.
- Dexie v5 adds `symptoms`; v4 data is kept.

## Out of scope
- Any dose advice, "skip/lower your dose" tips, or tips not in the sourced list below.
- Food logging (Milestone 5), export/backup (Milestone 7), PDF summary (v2).
- Interpretation of patterns beyond showing averages. No alerts or automatic "see a doctor" triggers.
- Vision changes in the help box (PLAN §2 lists it; no sourced wording supplied). See open questions.
- Network calls of any kind.

## Exact text for owner review

**Tips** (shown in a card under the chosen symptom)

Nausea [wegovy.com "Common side effects" / "Keeping an eye on common side effects"]:
> Eat more slowly. Get fresh air. Choose bland, low-fat foods such as crackers, toast and rice. Try foods that contain water, such as soups. Avoid greasy foods. Avoid lying down right after eating. Ask your care team whether smaller, more frequent meals and stopping as soon as you feel full would help.

Vomiting and diarrhea [Wegovy label/Medication Guide; MedlinePlus semaglutide]:
> Vomiting and diarrhea can cause fluid loss, which can lead to kidney problems. Drink fluids to help avoid dehydration. Tell your healthcare provider right away if nausea, vomiting or diarrhea does not go away.

All other symptoms [Cleveland Clinic semaglutide page; Mayo Clinic semaglutide]:
> Many side effects ease with time. Tell your care team if it continues or bothers you.

Stomach pain: the general line above, plus a link "See When to get help" that scrolls to the help box.

**When to get help** (always visible on the Symptoms screen and inside the log sheet; collapsed to a single heading row is NOT allowed, it stays open) [Wegovy label and Medication Guide, FDA label 215256 / DailyMed]:
- Stop using Wegovy and call your healthcare provider right away if you have severe pain in your stomach area that will not go away, with or without vomiting.
- Tell your healthcare provider right away if nausea, vomiting or diarrhea does not go away.
- Stop using Wegovy and get medical help right away for signs of a serious allergic reaction: swelling of the face, lips, tongue or throat; trouble breathing or swallowing; severe rash or itching; fainting or feeling dizzy; very rapid heartbeat.
- Gallbladder problems: pain in the upper stomach, fever, yellowing of the skin or eyes, or clay-colored stools. Call your healthcare provider. [Verified 2026-11-25: wegovy.com safety page lists "pain in your upper stomach (abdomen), fever, yellowing of the skin or eyes (jaundice), or clay-colored stools"; matches Drugs.com and WebMD.]
- Tell your healthcare provider about a lump or swelling in your neck, hoarseness, trouble swallowing, or shortness of breath.
- Pay attention to changes in mood. Call your healthcare provider right away for new or worse depression or thoughts of suicide. In a crisis, call or text 988 (US).
- If you also take insulin or a sulfonylurea, low blood sugar is possible. Follow your diabetes plan and tell your provider.
- Emergency: call 911.

Footer: "From the Wegovy label and Medication Guide. This is not a complete list — read the Medication Guide that came with your medicine."

## Steps
1. `src/db/db.ts`: add `Symptom` type (`id`, `datetime` ISO UTC, `type`, `severity` 0–5, `notes?`) and `db.version(5)` adding `symptoms: '++id, datetime'` (keep all earlier versions). Add `listSymptoms`, `saveSymptoms(entries[])` (one transaction), `saveSymptom`, `deleteSymptom`.
2. `src/lib/symptoms.ts` (new): `SYMPTOM_TYPES` (id + label), `isValidSeverity(n)` (integer 0–5), `daysSinceLastInjection(symptomIso, injectionsIso[])` returning 0–6 or `null` (no earlier injection, or 7+ days), using local calendar days; `patternByDay(symptoms, injections, type)` returning 7 buckets of `{day, average, count}`.
3. `src/lib/sideEffectText.ts` (new): the tip and help text above as constants with a source label each, so wording lives in one file for review.
4. `src/components/HelpBox.tsx` (new): always-open "When to get help" box with footer.
5. `src/components/SymptomSheet.tsx` (new): BottomSheet with chips (multi-select), per-chip severity buttons 0–5 (44px), date-time (defaults to now), notes, Save. Used for add and edit; HelpBox shown inside.
6. `src/components/PatternChart.tsx` (new): bar chart, day 0–6, empty days shown as blank, count in the screen-reader label. Lazy-loaded.
7. `src/pages/Symptoms.tsx` (new): HelpBox on top, "Log symptom" button, symptom picker (chips), tip card, PatternChart, recent list with edit/delete (delete asks to confirm).
8. `src/App.tsx`: add `symptoms` route and 5th tab (Home · Doses · Body · Symptoms · Profile).
9. `src/pages/Home.tsx`: Symptom quick-add opens the sheet (remove "Soon"). Optional one line "Last logged: nausea 3 · 2 days ago", hidden when empty. Food stays "Soon".
10. Tests (below). Run the suite and build once at the end.

## Acceptance criteria
- At 390px width the 5-tab bar fits and every tap target is at least 44px.
- Selecting nausea and fatigue, setting 3 and 1, and pressing Save adds two entries with the same time.
- Severity outside 0–5 or non-integer cannot be saved. Save is disabled with no chip selected.
- A symptom 3 days after the latest earlier injection appears in the day-3 bar. With no injections the chart shows an empty-state message, and the list still works.
- Symptoms before the first injection, or 7+ days after the last, are excluded from the chart but kept in the list.
- Editing and deleting a symptom updates the list and chart.
- The HelpBox is visible without tapping on the Symptoms screen and in the log sheet. Tip text matches this document word for word.
- No tip or help text mentions skipping, lowering, raising or changing a dose.
- Works offline with no network requests.
- Browser walkthrough: with v4 data present (profile, injections, weights, photos, measurements), loading the new build keeps all of it, and symptoms can be saved afterward.
- Existing 78 tests and the build pass.

## Tests
Automatic (Vitest, `src/lib/symptoms.test.ts`):
- Severity validation: 0 and 5 pass; -1, 6, 2.5, NaN fail.
- Bucketing: same-day injection is day 0; 6 days is day 6; 7+ days is excluded; no injections gives null; symptom before first injection gives null; symptom before an injection on the same day (earlier time) is not counted against it; uses the latest earlier injection when several exist.
- Day boundaries: symptom at 23:30 vs 00:30 local across an injection date; a DST-change week counts calendar days, not 24-hour blocks; UTC timestamps near midnight bucket by local date.
- Pattern averages: mean and count per day; empty days return count 0 and no average; filters by type.
- Text file: no tip or help string matches /dose|skip|lower|increase/i, other than the quoted "Wegovy" product name lines (guard test).

By hand: 390px layout, tap sizes, offline mode, multi-chip save, edit/delete, v4 to v5 upgrade, help box visible in both places, source wording check.

## Risks & open questions
- Medical wording is quoted verbatim from the listed sources (gallbladder line verified before build).
- Proposed defaults — owner can reply "defaults OK":
  - Tab: add a 5th tab "Symptoms" (recommended over a switch inside Doses, since logging is frequent, the screen needs the help box always visible, and Doses already has a lot). Five tabs still fit at 390px.
  - Several symptoms per log: yes, per-chip severity, shared time and note.
  - Default severity when a chip is tapped: 2.
  - Pattern chart window: all time (no range toggle).
  - Home: add the one-line "Last logged" summary; no separate "How are you feeling?" card.
  - Vision changes: leave out of the help box (no sourced wording). Reply "add" if you want it and can supply a source.
  - Delete confirmation: yes.
- Pattern averages from few entries can mislead, so the chart shows the count per day.

Token Steward review: applied — the focused test file runs during the build, with the full suite and build once at the end; all by-hand checks are one browser pass. Not applied, with reasons: (1) "stomach pain" and "bloating/gas" stay — both are listed side effects in the Wegovy label, and stomach pain links to the most important warning sign; (2) the chart stays lazy-loaded — it uses the chart library, which would otherwise add about 120 KB to every app start.

**Owner change after screenshots (2026-11-25):** on the Symptoms screen, "When to get help" is now a pop-up that can be dismissed ("Got it", tap outside, or Escape). It opens automatically the first time the screen is opened each day, and a red "When to get help" button at the top (and the stomach-pain tip's link) reopens it. Wording unchanged. The box inside the log panel stays inline.

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
**What this adds:** A new Symptoms tab where you can quickly log how you feel (nausea, headache, bloating and others), rate each from 0 (none) to 5 (severe), and see which days after a shot each one tends to show up. Each symptom gets a short tip. A "When to get help" box stays visible at all times. The app only records and shows; it never suggests changing your dose.

**Cost:** Nothing extra.

**What could go wrong:**
- The tips and warning text are quoted from the official Wegovy label and other medical sources. They need your OK before we build.
- One gallbladder line is still being double-checked against the full Medication Guide.
- Patterns from only a few entries can mislead, so the chart shows how many entries each day is based on.

**You need to decide:**
- Reply "defaults OK" to accept the proposed defaults: a 5th "Symptoms" tab; several symptoms per log; default severity 2; all-time chart; a one-line "Last logged" on Home; no vision-change item; delete asks to confirm.
- Approve the medical wording.

## Approval
- [x] Approved by owner for build — 2026-11-25 (defaults OK; wording approved "for now", final approval after screenshots)
