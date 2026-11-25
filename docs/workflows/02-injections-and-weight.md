# Workflow 02 — Injections, Next-Dose Card and Weight Graph
Status: Built — 2026-11-25
Milestone: 2 — Injection log + site rotation + next-dose card (PLAN §5), plus a weight graph (owner addition) with minimal weight logging pulled forward from Milestone 3

## Goal
Let the owner log injections (dose, site, notes) with a rotation suggestion, see an accurate next-dose card, and log weights to see them on a trend graph. The app only records doses; it never recommends them.

## In scope
- Dexie v2: new `injections` (id, datetime, doseMg, site, notes) and `weights` (id, date, weightKg) tables. `profile` is untouched.
- Injection log screen: list, add, edit, delete.
- Dose picker: 0.25 / 0.5 / 1 / 1.7 / 2.4 mg, plus "Other" (free entry).
- Body-map site picker: L/R abdomen, L/R thigh, L/R upper arm. Pre-selects the site used longest ago (never-used sites come first). The owner can override.
- Next-dose card on Home: last logged injection + 7 days if one exists, otherwise the profile weekday. Shows the last dose as a fact ("Last: 1 mg on Mon"). Tapping it opens Injections.
- Weight log: add, edit, delete (date + weight only; entered in lb or kg per profile, stored in kg).
- Weight screen: line graph (entries, 7-day average line, goal line) and stats (current, lost in lb/kg and %, to goal).
- Home: weight tile shows latest weight, change since start and a sparkline, and taps to the Weight screen. Quick-add Weight and Dose become active. Food and Symptom stay "Soon".
- Tab bar: Home · Doses · Weight · Profile (proposed default below).
- Tests for the calculations listed below.

## Out of scope
- Tape measurements, body-fat %, BMI, waist-to-height (Milestone 3).
- Dose-history step line under the chart, dose-change markers on the graph, and a 30/90/All range toggle (Milestone 3).
- Any dose recommendation, escalation, or "what to do if you missed a dose" logic.
- Reminders, calendar (.ics) export, JSON backup (Milestone 7).
- Weight-entry sync, photos, notifications.

## Steps
1. `src/db/db.ts`: add `Injection` and `WeightEntry` types and `db.version(2).stores({ profile: 'id', injections: '++id, datetime', weights: '++id, date' })`. Keep version 1 declared so existing profile data upgrades in place. Add small helpers (add/update/delete/list).
2. One pass, tests run once at the end: `src/lib/injections.ts` (new): `WEGOVY_DOSES_MG`, `suggestSite(history)`, `nextDoseDate(lastInjection, profileWeekday, now)`, `formatLastDose(...)`.
3. `src/lib/weight.ts` (new): `movingAverage7(entries)` (7-day window by calendar date, not entry count), `weightStats(entries, goalKg, startKg)`, and sparkline point helper.
4. `src/lib/units.ts`: add display helper `formatWeight(kg, units)` (rounds to 1 decimal, labelled lb or kg).
5. `src/components/BodyMap.tsx` (new): simple SVG body outline with six tappable site zones plus a text list for accessibility; marks the suggested site.
6. `src/pages/Injections.tsx` (new): history list, add/edit form (date-time, dose picker, body map, notes), delete with confirm.
7. `src/components/WeightChart.tsx` (new): Recharts line chart (approved in PLAN §3) and a small `Sparkline`.
8. `src/pages/Weight.tsx` (new): stats row, chart, entries list, add/edit/delete.
9. `src/App.tsx`: add routes `injections` and `weight` (with the existing `?from=home` back header) and tabs "Doses" and "Weight". Add icons in `src/components/icons`.
10. `src/pages/Home.tsx`: next-dose hero uses the last injection; make hero a link to `#/injections?from=home`; weight tile uses real data + sparkline and links to `#/weight?from=home`; activate Weight and Dose quick-add (open the add form directly).
11. Tests (below), then manual check on a phone-width browser.

## Acceptance criteria
- Upgrading from a v1 database keeps the existing profile and disclaimer acceptance.
- Logging 1 mg on Mon in the left abdomen shows Home "Next injection: Monday" 7 days later and "Last: 1 mg on Mon".
- With no injections, the card still follows the profile weekday exactly as it does today.
- With six logged injections using each site once, the suggested site is the one used earliest. A site never used is suggested before any used site.
- Choosing "Other" accepts a custom mg value; invalid or blank values are rejected with a message.
- Editing or deleting an injection updates the card and rotation suggestion immediately.
- Entering 180 lb stores 81.6 kg and displays 180 lb; a kg-profile shows 81.6 kg.
- The 7-day average on a day uses only entries within the 7 calendar days ending that day.
- Stats: start 200 lb, current 180 lb, goal 160 lb shows "Lost 20 lb (10%)" and "20 lb to goal".
- Graph shows entries, average line and goal line; with 0 entries it shows an empty-state message, with 1 entry only a point.
- Home weight tile and sparkline update after a new entry; tapping goes to Weight and the back header returns Home.
- The app text contains no dose advice; the dose card states only what was logged.
- Works offline and at 375 px width; tap targets at least 44 px.

## Tests
Automated (Vitest):
- `suggestSite`: empty history, partly used, all used, ties, edited/deleted entries.
- `nextDoseDate`: from last injection, from weekday fallback, late injection (next due is last + 7 days from the actual date), DST boundary.
- `movingAverage7`: gaps, multiple entries on one day, a single entry.
- `weightStats`: loss, gain, percent rounding, goal reached or passed, missing start weight.
- Unit display: lb/kg conversion and rounding, round-trip of 180 lb.
- DB upgrade v1 to v2 keeps the profile: checked by hand in the browser (no extra test package).

By hand, in one pass after the build: body-map taps, form validation, chart appearance and sparkline on a phone-width window, offline reload, tab bar and back navigation.

## Risks & open questions
- Chart: Recharts (already approved in PLAN §3) — adds roughly 100 KB to the download but gives touch tooltips for free and less custom code to maintain.
- A lapsed or late dose makes "last + 7 days" potentially already past. The card will show "Overdue by N days" as a plain fact only.
- Weight entered twice in one day is allowed; the graph uses that day's average.

**Proposed defaults — owner can reply "defaults OK" or change any:**
1. Missed-dose wording from the Wegovy label: **not now**. Revisit later once you have reviewed the exact text; the app never advises.
2. Tab bar: **Home · Doses · Weight · Profile** (four tabs, each feature one tap away).
3. Weight graph shows **all entries**; range toggle and dose-change markers move to Milestone 3.
4. Injection date and time **can be edited** after logging (to fix mistakes).

Token Steward trims applied: Recharts instead of hand-written chart; no fake-indexeddb (upgrade checked by hand); range toggle and dose markers deferred; tab-bar question resolved as a default before building; library code written in one pass with one test run; phone-width/offline checks done once.

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
This update lets you log each Wegovy shot (dose, body spot, notes). The app suggests the body spot you used least recently, but you can pick a different one. The Home card shows when your next shot is due, 7 days after your last logged shot, and states only what you logged. The app never suggests doses.

You can also log your weight and see it on a simple graph with a 7-day average, a goal line, and stats such as pounds lost.

Cost stays at $0 a month. Your data stays on your device. Things that could go wrong: a late shot shows "Overdue by N days," and mistakes can be fixed by editing a shot's date and time.

You need to decide:
- Missed-dose wording from the label: leave it out for now.
- Bottom tabs: Home, Doses, Weight, Profile.
- Weight graph shows all entries; date-range buttons come later.
- A shot's date and time can be edited after logging.

Reply "defaults OK" to accept all four.

## Approval
- [x] Approved by owner — date: 2026-11-25 (defaults OK)
