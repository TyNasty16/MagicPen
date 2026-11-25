# Workflow 04e — Reset all data
Status: Built — 2026-11-25
Milestone: Small add-on to the Settings screen (owner request); no new milestone in PLAN.md §5

## Ideas considered
`docs/ideas/04e-reset-data.md` — chosen: approach 2, type-to-confirm, full wipe, then reload.

## Goal
Add a "Reset all data" button in Settings that wipes everything the owner has entered, after a deliberate confirmation, and returns the app to a fresh first run.

## In scope
- A "Reset all data" danger section at the bottom of Settings (muted danger colour, calm wording).
- A confirm sheet that lists what will be deleted (profile and settings, injections, weights, photos, measurements, symptoms, saved app preferences), says photos are deleted too, and says plainly that no backup exists and this cannot be undone.
- The owner must type `RESET` to enable the delete button. Cancel is always available.
- One helper, `resetAllData()`, clears all six Dexie tables in a single transaction, then removes the three localStorage keys (`steady.helpShownOn`, `steady.alertsHidden`, `steady.alertsSeen`), then reloads the page.
- The disclaimer and first-run setup return, because the disclaimer acknowledgment is stored in the profile row.

## Out of scope
- Choosing what to reset (weights only, photos only, and so on).
- "Download a copy first" or any export (Milestone 7); a link can be added there later.
- A count of items to be deleted ("14 injections...").
- Clearing the service worker or PWA cache (app files only, no health data; clearing it could break offline use).
- Dose advice or escalation logic of any kind (the app only logs doses).

## Steps
1. `src/db/db.ts`: add `resetAllData()`. One `db.transaction('rw', all six tables, ...)` clearing each table; only after it succeeds, remove the three `steady.*` localStorage keys. On failure it throws and nothing is reloaded.
2. `src/pages/Settings.tsx`: add the "Reset all data" section and the confirm sheet (warning text, text input, disabled-until-`RESET` delete button, Cancel). On success reload at the app root (`location.replace`, drops the `#/settings` hash so the restart lands on Home); on error show a short message and stay on the page. Input match is exact and case-sensitive.
3. Builder reads only the end of `Settings.tsx` and the table declarations in `db.ts`.
4. After code-reviewer fixes: run `npm test` and `npm run build` once, then one browser pass at 390px against the checklist below.

## Acceptance checklist (also the browser test)
Set up sample data of every kind, including a photo, first.
- Settings shows a "Reset all data" section; tapping it opens a confirm sheet.
- The sheet names what is deleted, mentions photos, and states there is no backup and no undo.
- The delete button is disabled until exactly `RESET` is typed; `reset` or `RESET ` keeps it disabled.
- Cancel (or closing the sheet) deletes nothing and clears the typed text.
- After confirming, the app reloads to the disclaimer and first-run setup, and Today, Weight, Photos, Measurements and Symptoms are all empty.
- All three `steady.*` localStorage keys are gone afterwards; the help pop-up and alert cards behave as on a first run.
- If the wipe fails, an error is shown and the app is not reloaded; because it is one transaction, no table is left half-cleared.
- Buttons and the input are at least 44px tall; no horizontal scroll at 390px; no new network calls.
- Existing tests and the build pass.

## Tests
No automated test: `fake-indexeddb` is not installed, and no package is added. The existing suite and build must pass. Also check that the installed app still opens offline after a reset.

## Risks & open questions
**Proposed defaults (reply "defaults OK" or change any):**
- Confirmation word: `RESET`, typed exactly. Alternative: not case-sensitive.
- Wipe includes the disclaimer and saved preferences (a true fresh start). Alternative: keep the disclaimer acknowledgment.
- Danger section sits at the bottom of Settings, in a muted red-brown, not bright red.
- No automated test (no fake-indexeddb installed); checked by hand instead. Alternative: add `fake-indexeddb` as a dev package for a unit test.

Other notes:
- The wipe is permanent until backup exists (Milestone 7); the wording says so.
- Dexie cannot clear in-flight writes from other open tabs; a reload after reset covers the normal case.

## Review checkpoints
- Token Steward: before start (applied: merged checklist and tests, shortened ideas section, targeted reads, one test/build run)
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
**What it adds**
- A "Reset all data" section at the bottom of Settings.
- Tapping it opens a warning that lists everything that will be erased: your profile, injections, weights, photos, measurements, symptoms and saved preferences.
- The delete button stays locked until you type RESET. Cancel is always available.
- After deleting, the app starts over at the disclaimer and first-time setup.

**Cost:** nothing.

**What could go wrong:** the erase is permanent. There is no backup yet, so nothing can be recovered. A backup feature is planned for later.

**You need to decide** (reply "defaults OK" or change any):
- Confirmation word: RESET, typed exactly (capitals matter).
- Erase the disclaimer and saved preferences too, for a true fresh start.
- The section sits at the bottom of Settings in a muted red-brown, not bright red.
- No automated test; it is checked by hand instead.

## Approval
- [x] Approved by owner — date: 2026-11-25 (defaults OK)
