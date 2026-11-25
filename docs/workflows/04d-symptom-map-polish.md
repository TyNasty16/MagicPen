# Workflow 04d — Symptom map polish
Status: Awaiting approval
Milestone: Polish of the Milestone 4 symptom map (owner request), before it goes live

## Ideas considered
Opening pass: `docs/ideas/04d-symptom-map-polish.md` (plus quick wins in `docs/ideas/04c-symptom-map.md`). Chosen approach: for 4 vs 5, its recommendation of **numbers in every cell plus a modest lightness gap between steps 4 and 5**. Not chosen: a corner mark on 5, stripes (busy, clash with the calm style), bigger cells (phone width is already tight). Tap-to-highlight, tooltips and a numbers on/off toggle are left for later. The existing code is changed only where listed below.

## Goal
Tidy the symptom map before go-live: one "When to get help" entry point, clearer wording and drill-down labels, a 7-day-only map, and a 4/5 severity that looks different at a glance.

## In scope
- **One help entry point.** Keep the red "When to get help" row. Hide it while an alert card is showing, because the card's own "When to get help" button (the 04b-approved design, kept unchanged) already covers it. Result: exactly one visible entry at a time. Help text is untouched.
- **Split "New"** (descriptive only): "First logged this week" (symptom is in the window, with earlier entries absent but other earlier days existing) and "No earlier entries" (not enough history to compare). The trend rule itself is unchanged.
- **Drill-down chart weeks** labelled with dates ("Nov 3") instead of W1-W8; the trend tile shows the word beside the arrow (for example "↓ milder lately"), not the arrow alone.
- **Remove the 3-day view:** the switch, 3-day timing phrases ("daily since shot", "today", "N of 3 days"), the numbers-only-in-3-day logic, and their tests. The map is always 7 days; the "Last 7 days" heading stays.
- **4 vs 5:** the highest severity number shown in every coloured cell (empty cells stay blank); ramp steps 4 and 5 separated (about #c8664a for 4, about #5a2a2a for 5; exact hex set by the contrast test). Numbers must be at least 4.5:1 on every step; the existing WCAG unit test is kept and extended to the new colours.
- **Caption** under the row trend and the drill-down trend tile: "Compared with your last 2 injection weeks" on the tile; the row footnote keeps "these 7 days vs the 7 before". This removes the "Same" vs "milder lately" confusion.

## Out of scope
- **The owner's rule stays exactly as is:** symptoms not logged in over 3 days are hidden from the map (same rule, same note wording).
- Any change to alert-card rules, the "3 days in a row" alert wording, or help text.
- Tap-to-highlight legend, cell tooltips, tap a cell for entries, a numbers on/off toggle.
- Shading shot days on the drill-down chart.
- Dose advice or escalation logic of any kind (the app only logs doses).

## Steps
1. `src/lib/symptomMap.ts`: drop `MapWindow` 3 and the 3-day branch of `timingPhrase`; fix window to 7; add a trend reason so "new" splits into "first logged" and "no earlier entries"; update `RAMP`/`rampText` for steps 4-5.
2. `src/lib/symptomMap.test.ts`: remove 3-day tests; add tests for the new trend split and keep/extend the contrast test over all six steps.
3. `src/components/SymptomMap.tsx`: remove the switch and 3-day sizing; always print the number in coloured cells (fits about 12-13px in the 32px cells); new trend wording; footnote text.
4. `src/pages/Symptoms.tsx`: hide the red help row while alert cards are showing (needs a small signal from `AlertCards`, which is otherwise unchanged; `src/components/AlertCards.tsx` touched only for that).
5. `src/components/InjectionWeekChart.tsx`: date labels on the X axis (the tooltip already uses dates); `src/pages/SymptomDetail.tsx`: arrow plus word on the trend tile and the caption.
6. Run all tests and the build once; one browser pass at 390px.

## Acceptance criteria
- No 3-day switch or 3-day phrases anywhere; the map always shows 7 days ending today.
- Every coloured cell shows its number 1-5; a 4 and a 5 are visibly different in colour and by number; empty cells show nothing.
- Number contrast is at least 4.5:1 on all six steps (unit test passes).
- A symptom last logged 3 days ago still shows; 4 days ago is hidden with the existing note.
- With an alert card showing, the page has one "When to get help" button (in the card); with none, one red row. Both open the same help.
- A symptom with no entries in the 7 days before shows "No earlier entries" or "First logged this week" as defined; the other trend words are unchanged (a difference of exactly 0.5 is still Same).
- Drill-down week labels read like "Nov 3"; the trend tile shows an arrow and its word; the caption names the last 2 injection weeks.
- No horizontal scroll at 390px; rows and controls at least 44px tall; no new network calls.
- All remaining tests and the build pass.

## Tests
- Automated: trend split cases, ramp contrast for every step, removed 3-day tests, existing suite. UI wording and the help-row hiding are checked by hand in the browser pass.
- By hand: 390px layout with digits in 32px cells, 4 vs 5 side by side, alert card on/off, drill-down labels. **One screenshot set of the real build will be shown to the owner before go-live.**

## Risks & open questions
**Proposed defaults (reply "defaults OK" or change any):**
- 4 vs 5: numbers in every cell plus lighter 4 / darker 5. Alternative: numbers on 4 and 5 only (calmer).
- "New" wording: "First logged this week" and "No earlier entries". Alternatives: "Not logged before", "Too early to compare".
- Red help row hidden while an alert card is showing (keeps the 04b card unchanged). Alternative: always show the red row and remove the card's button, which changes the approved 04b design.

Other notes:
- Digits at about 12px in small cells are tight on narrow phones; the screenshot pass will confirm.
- Hide rule is "3 days" while the map shows 7: unchanged by owner instruction; the note keeps its wording.

Token Steward trims applied: build directly from this document (no re-reading the ideas files, no subagents for the edits); one browser pass covering 390px layout, 4 vs 5, alert card on/off and drill-down labels; tests and checks listed once in the acceptance criteria.

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
- The map always shows the last 7 days; the 3-day view is removed.
- Every coloured box shows its number (1 to 5), and levels 4 and 5 look clearly different.
- One "When to get help" button shows at a time: inside the alert card when one appears, otherwise as a red row.
- "New" becomes "First logged this week" or "No earlier entries".
- Detail charts show dates like "Nov 3", and trend arrows come with a word, such as "milder lately".
- The hiding rule is unchanged: symptoms not logged for 3 days stay hidden.
- The app still only logs doses; it gives no dose advice.

Cost: nothing extra. Risk: digits may be small on narrow phones; we will check on a phone-sized screen before go-live.

**You need to decide**
- Proposed defaults: numbers in every box; lighter 4 and darker 5 colours; "First logged this week" and "No earlier entries" wording; red help row hidden while an alert card shows. Reply "defaults OK" or name changes.

## Approval
- [ ] Approved by owner — date:
