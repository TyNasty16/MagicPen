# Workflow 12 — Milestone celebrations
Status: Built
Milestone: Post-plan add-on (not in PLAN.md §5), owner idea I-63. Needs only data already stored.

## Owner decisions at approval (2026-11-27) — these override anything below
1. **Pop-up time:** 5 seconds, kept. A tap anywhere also closes it, including outside the card. A full-screen transparent layer catches the tap and is removed when the pop-up closes.
2. **Starting weight:** editing the Profile starting weight never shows a pop-up. Weight steps it passes are recorded silently. Weight milestones are shown only when a new weigh-in is saved, or on app open after a weigh-in.
3. **Heading:** replaced by "funky" escalating titles, inspired by shooter-game announcer call-outs but original, non-violent and copying no game.
   - **Title per step** (step index within that series):
     1. NICE START
     2. ON A ROLL
     3. HEATING UP
     4. LOCKED IN
     5. ON FIRE
     6. NO STOPPING YOU
     7. CRUSHING IT
     8. LEGENDARY
     9. HALL OF FAME
     10. HISTORY MADE (10 and beyond)
   - "Then every N" steps continue the count, capped at HISTORY MADE.
   - A broken streak climbs again from NICE START.
   - Several at once: the highest title wins, with each factual line listed under it.
   - **Style:** big, bold, slanted, uppercase title that slams in (scale and fade) with the confetti. Reduce Motion shows the title with no slam and no confetti. The "Well done" heading is gone. The factual lines are unchanged.
   - Owner asked to revisit the titles later (notepad I-73).
4. **First arrival:** up to 5 lines, kept.
5. **No end to the lists:**
   - Weight percent continues every 5% (20%, 25%, …). Pounds continue every 5 lb, and kg every 2 kg.
   - The daily streak continues every 365 days after 1460.
   - Weekly streaks continue every 52 weeks after 208.
6. **Metric profiles:** every 2 kg. Yes.

Exact text: approved as listed below, with the titles above replacing "Well done".

## Ideas considered
Ideas file: [docs/ideas/12-milestone-celebrations.md](../ideas/12-milestone-celebrations.md). The owner's answers there are binding: a fading pop-up (no Home card, no list), five categories, full streaks, confetti. Chosen approach: one pure module that works out what has been earned from existing tables, a small record of what has already been shown kept in the profile row, and one pop-up component. Existing code reused: `Profile` and `saveProfile` (`src/db/db.ts`), the backup of the `profile` table (`src/lib/backup/serialize.ts`), `dayKey` (`src/lib/dates.ts`), `injectionWeekday` (as in `src/lib/nextDose.ts`).

**Owner answer 9 (added after the Q&A):** "streaks should get progressively longer and harder to get." Every streak ladder below has strictly widening gaps, from one rule.

**Token Steward trims (applied):** ladders made strictly widening; restore merges the device's list with the backup's; restore validation specified; test matrix and mocked pass reduced; open questions and risks cut.

## Goal
When the owner's own logs pass a round number, a short pop-up with confetti says so, once. It stays inside the open app and never mentions doses, breaks or what is next.

## In scope
- Milestones in five categories (lists below), each with totals and, where stated, streaks.
- A record of what was earned, kept in the profile so it travels with backup and restore and nothing shows twice.
- A pop-up of about 5 seconds with a short confetti burst, no sound, no vibration.
- Two Settings switches, both on by default.

## Out of scope
- Home card, Milestones list or history, badges, sharing, notifications, sound, vibration.
- Using-the-app milestones (first backup, first report, photos, appointments).
- Goal weight, "to go" or countdowns, any mention of a break.
- A confetti library.

## Milestone rules (exact)
Days are local calendar days. Weeks run Monday to Sunday. Earned is never removed (a weight gain, a deleted entry or an edit does not un-earn anything).

**Ladder rule for streaks:** each gap between steps is larger than the one before, and after the first year the step doubles. Gaps are shown in brackets.

| Category | Thresholds |
|---|---|
| Injections logged (total count of injection rows) | 1, 4, 8, 12, 26, 52, 78, 104, then every 52 |
| Injections on schedule (streak, weeks in a row) | 3, 7, 12, 26, 52, 104, 208 (gaps 4, 5, 14, 26, 52, 104) |
| Weigh-in weeks (weeks with at least one weigh-in) | 1, 4, 8, 12, 26, 52, then every 26 |
| Weigh-in weeks (streak, weeks in a row) | 2, 4, 7, 12, 26, 52, 104, 208 (gaps 2, 3, 5, 14, 26, 52, 104) |
| Days with something logged (total) | 1, 10, 25, 50, 100, 150, 200, 300, 365, 500, 730, then every 365 |
| Days with something logged (streak, days in a row) | 3, 7, 14, 30, 60, 100, 180, 365, 730, 1460 (gaps 4, 7, 16, 30, 40, 80, 185, 365, 730) |
| Time on treatment (months after the first injection's date; month-end clamps, Jan 31 + 1 month = Feb 28/29) | 1, 3, 6, 9, 12, 18, 24 months, then every 12 |
| Weight lost = Profile starting weight minus the lowest weigh-in ever | Every 5 lb (imperial profile); every 2 kg (metric profile, see questions); plus 5%, 10%, 15% of starting weight |

- **"Something logged" counts:** an injection, weigh-in, symptom, food entry or water entry on that day. The "barely ate" mark, measurements and appointments do not count.
- **On schedule (decided):** an injection logged anywhere inside a schedule week counts for that week. A schedule week is 7 days starting on the profile injection weekday (Monday plan: Monday to Sunday). Two injections in one week count once. No injection weekday set means no schedule streak. Dose amounts are never read.
- **Streak rules:** a streak counts back from today. If today (or this week) has no entry yet, the streak continues from the previous day (or week) without breaking. A missed day or week ends it silently; the next entry begins a new run, and the same steps can be earned again in it, climbing from the start. Totals never reset.
- **Weight:** compared after rounding lost weight to 0.1 lb (or kg), so 5.0 lb counts and 4.9 does not. Needs a starting weight; none means no weight milestones. Percent steps stop at 15%.

## Storage
- **Where:** three optional `Profile` fields, no new table and no Dexie version bump (the v7 precedent): `milestonesEarned?: { key: string; on: string; run?: string }[]`, `showMilestones?: boolean`, `showWeightMilestones?: boolean` (missing = on). The list is capped at 500; if it ever fills, the oldest streak entries from ended runs go first.
- **Keys:** totals use the milestone id (`inj-12`). Streaks use `id@run`, where `run` is the first day of the run (week start for weekly ones; the first injection's date for the schedule streak, so changing the injection day later does not re-fire). A recorded streak counts for the current run if its `run` date falls inside the current run, so back-filling older entries never re-fires it. A recorded run that ended earlier is not current, so the step can be earned again.
- **Backup:** the `profile` table is already backed up, so the list travels with it.
- **Restore (any restore):** the backup replaces the profile row, but the device's current `milestonesEarned` is kept and merged with the backup's list by key, keeping the earliest `on`. Then everything earned by the restored data is recorded silently, with no pop-up. So nothing re-fires, whether or not the backup has a list (including backups made before this feature). Done in `src/lib/backup/run.ts`.
- **Restore validation** (`ROW_CHECKS.profile` in `src/lib/backup/serialize.ts`, all optional): `milestonesEarned` is an array of at most 500 items; each `key` is a string; `on` and `run` pass `isCalendarDay`; `showMilestones` and `showWeightMilestones` are boolean or undefined.
- **Reset:** Reset clears the profile table, so the list and both switches go with it. The app then starts again from zero.
- **First arrival** (profile exists, `milestonesEarned` undefined): work out everything already earned and record all of it. Show only one line per category, once: a currently running streak's highest step if there is one, otherwise the highest total step. For weight, the larger of the lb step and the percent step. No line for a category with nothing earned.
- **Switches off:** milestones are still recorded silently, so turning a switch on later shows only new ones. Never a flood.

## When to check
- Once the profile is loaded and the disclaimer accepted: on app open, when the app returns to the screen (`visibilitychange`, as backup does), and shortly after a save to injections, weights, symptoms, food or water (a small Dexie live query on row counts, with a 600 ms delay so a sheet can close first).
- A milestone earned while the app was closed shows on the next open. Everything newly earned in one check is one pop-up, but within one series (for example weight in lb) only the highest newly passed step is shown; the steps below it are recorded silently. The record is written before the pop-up shows, so none can repeat. A check that finds more while a pop-up is open adds its lines to it and restarts its 5 seconds.

## Pop-up
- Fixed card near the top, `role="status"` with `aria-live="polite"`, plus a visually hidden "Close" button. It does not take focus. The text is announced in full even if it fades first.
- Fades after about 5 seconds (0.4 s fade). A tap anywhere on it closes it sooner.
- Confetti: one `<canvas>` burst, about 40 pieces, about 1.5 seconds, drawn with `requestAnimationFrame` in the app's theme colours (accent, clay, gold, sage), `pointer-events: none`, `aria-hidden`. About 40 lines in `src/components/confetti.ts`, no library.
- Reduce Motion (`prefers-reduced-motion`): no confetti and no fade animation. The card appears and disappears plainly, still after 5 seconds or on tap.
- No sound, no vibration, no notification, nothing on the lock screen.
- Style note: the confetti is the owner's deliberate exception to "clinical and calm", for these pop-ups only. The card itself uses the normal colours and type.

## Exact text for owner review
Heading: "Well done" (one line below it per milestone). Footer, small: "Tap to close". Screen-reader label: "Milestone reached".

| Milestone | Text |
|---|---|
| Injections, 1 | "First injection logged" |
| Injections, N | "N injections logged" (e.g. "12 injections logged") |
| Schedule streak | "N weeks in a row logging your injection on schedule" |
| Weigh-in weeks, 1 / N | "1 week with a weigh-in" / "N weeks with a weigh-in" |
| Weigh-in streak | "N weeks in a row with a weigh-in" |
| Days logged, 1 / N | "First day logged" / "N days with something logged" |
| Days streak | "N days in a row with something logged" |
| Time, 1 month / N months | "1 month since your first injection" / "N months since your first injection" |
| Time, 12, 24, 36... | "1 year since your first injection" / "N years since your first injection" |
| Weight, lb / kg | "N lb lost since your starting weight" / "N kg lost since your starting weight" |
| Weight, percent | "5% of your starting weight lost" (10%, 15%) |

Settings, new card "Milestones" above "Reset all data":
- Switch: "Show milestones". Note: "A short pop-up with confetti when you pass a round number, such as 12 injections logged. It appears only inside the app, with no sound, and nothing leaves your phone."
- Switch: "Show weight milestones". Note: "Includes weight lost since your starting weight. Turn this off to hide only those." Greyed with "Turn on Show milestones first." when the main switch is off.

## Steps
1. `src/db/db.ts`: add the three optional `Profile` fields and the `MilestoneRecord` type. No version bump.
2. `src/lib/milestones.ts` (new, pure): the ladders, `dailyKeys`, `weekKeys`, streak and total counting, `addMonths`, `computeEarned(data, profile, today)`, `pickNew(earned, record, today)`, `firstArrival(...)`, `mergeRecords(a, b)`, and `milestoneText`.
3. `src/lib/milestoneCheck.ts` (new, thin database glue): load the five tables, run the check, write the record, return lines to show. Also `recordSilently()` for restore.
4. `src/lib/backup/serialize.ts`: the validation above. `src/lib/backup/run.ts`: merge and silent record on restore.
5. `src/components/MilestonePopup.tsx` and `src/components/confetti.ts` (new); fade styles with a reduced-motion override in `src/index.css`.
6. `src/App.tsx`: run the check on open, on return and after saves; render the pop-up.
7. `src/pages/Settings.tsx`: the "Milestones" card with two switches saved through `saveProfile`.
8. Tests (below), full run and build, one mocked iPhone pass, code review.

## Acceptance criteria
- 12 injections logged shows "12 injections logged"; 11 shows nothing.
- Logging on 7 days in a row shows "7 days in a row with something logged"; 6 shows nothing. Today still empty does not end a streak that ran through yesterday.
- After 7 days in a row, the next daily streak line is at 14, then 30, 60, 100, 180, 365 (nothing between).
- A missed day ends the run silently; 7 more days in a row earns the 7-day line again. Total counts never reset.
- Starting weight 180 lb and a weigh-in of 175.0 lb shows "5 lb lost since your starting weight"; 175.1 does not. Starting weight 200 lb and a weigh-in of 180.0 lb shows "20 lb lost since your starting weight" and "10% of your starting weight lost" in one pop-up (the 5, 10 and 15 lb steps are recorded silently).
- A weight gain afterwards never re-shows or removes anything.
- First injection 2026-01-31: "1 month since your first injection" shows from 2026-02-28.
- Injections logged in each of 3 consecutive schedule weeks show the schedule line; a late injection inside the week counts.
- First arrival with existing data shows at most one line per category, once; everything else is recorded and never shows later.
- After any restore nothing re-fires, and milestones earned on this phone before the restore stay recorded. After Reset the record and switches are cleared.
- "Show milestones" off: no pop-up. "Show weight milestones" off: no weight lines, other lines still show. Turning either back on shows only new milestones.
- Pop-up closes by tap and by itself at about 5 seconds; Reduce Motion shows no confetti or fade; no sound or vibration; announced by VoiceOver.
- No text mentions dose, mg, a break, a miss, "to go" or what is next. Nothing is sent over the network. Existing tests and the build pass.

## Tests
Automatic (Vitest, pure functions):
- Ladders as table cases: first, middle and last step of each ladder (and one step past the last of each total ladder with "then every N"), plus one test that every streak ladder's gaps strictly widen.
- Day and week keys across DST changes, month ends, Monday-start weeks across New Year, ISO times near local midnight.
- Streaks: today empty, yesterday gap, run restart and re-earn, back-fill merging two runs without re-firing, "barely ate" mark not counted, no injection weekday set.
- Time: month-end clamp, leap year. Weight: 4.9/5.0 lb, percent steps, no starting weight, lowest-ever weigh-in, regain.
- `pickNew`: same-day combining, highest step per series, already-recorded skipped, first arrival one line per category.
- Backup: `validatePayload` accepts and rejects the new fields (501 items, bad date, non-boolean switch); `mergeRecords` keeps the earliest `on`; a pre-feature backup restores silently; Reset clears the fields.
- Text guard over every string: `/dose|mg\b|increase|decrease|raise|lower|skip|escalat|titrat|should|recommend|miss|break|broke|to go|until|next|ate\b|calorie|diet/i`.

By hand: one mocked iPhone pass (390x844) with two screenshots, the pop-up with confetti and the same with Reduce Motion. On the real iPhone after deploy: confetti runs smoothly, Reduce Motion is respected, and nothing repeats after closing and reopening the app.

## Risks & open questions
- A 5-second pop-up can be too short for some people; mitigated by the polite announcement and the hidden Close button (default: keep 5 seconds).
- Editing the Profile starting weight can earn new weight steps at once (default: allowed, shown once).
- Questions, each with a suggested default:
  - Metric profiles: every 2 kg (about 4.4 lb) instead of 5 lb? (default: yes)
  - Is "Well done" the right heading? (default: yes)
  - First arrival can show up to five lines; fewer? (default: keep, it is a one-off)
  - Weight list stops at 15%, streak ladders at 1460 days / 208 weeks; fine? (default: yes)

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
- **What you'll see:** A short "Well done" card near the top of the app when your own logs pass a round number, with a few seconds of confetti. It closes by itself after about 5 seconds, or sooner if you tap it. No sound, buzzing or phone alerts.
- **What counts:** Injections, weigh-ins, symptoms, food and water entries. The "barely ate" mark, measurements and appointments do not count.
- **Streaks:** Days or weeks in a row. An empty today does not break a run. Missing a day or week ends it quietly, with no message, and the next run starts from zero. Totals never go down. Steps get further apart, so the longer streaks are harder to earn.
- **Shown once:** Each milestone is saved and never repeats. The first time this arrives, your existing milestones show once, as one line per category.
- **Two switches in Settings, both on:** "Show milestones" turns everything on or off. "Show weight milestones" hides only the weight ones.
- **Private:** Nothing leaves your phone, and no message mentions doses.

**You need to decide:**
- Approve the wording, including the heading "Well done".
- Weight steps every 2 kg instead of 5 lb for metric users? (Suggested: yes)
- Keep the pop-up at 5 seconds? (Suggested: yes)
- Show up to five lines on first open, or fewer? (Suggested: keep five)
- Stop weight steps at 15% and streaks at 1460 days or 208 weeks? (Suggested: yes)
- Let edits to your starting weight earn new weight steps, shown once? (Suggested: yes)

## Approval
- [x] Approved by owner — 2026-11-27, with the decisions at the top of this document — date:

## Build notes (2026-11-27)
- **Built as approved,** with the owner decisions at the top of this document.
- **New files:**
  - `src/lib/milestones.ts` (pure)
  - `src/lib/milestoneCheck.ts` (database glue; checks run one at a time)
  - `src/lib/useMilestones.ts`
  - `src/components/MilestonePopup.tsx`
  - `src/components/confetti.ts` (40 pieces, no library)
  - a Settings "Milestones" card
- **Extra safety:**
  - `saveProfile` now runs in a transaction.
  - The Profile screen no longer writes back old copies of fields other screens own: the milestone record, the switches and the report's questions draft.
- **Starting-weight edits:** a change to the starting weight triggers a silent check straight away, so the next weigh-in can show its weight milestone.
- **Code review fixes:**
  - The starting-weight sync above.
  - Restore is now "quiet". No pop-up can show while a restore is under way, and a milestone hiccup can't make a finished restore look failed.
  - Records from ended streak runs are dropped, so the list stays small.
  - The 500 cap keeps the newest records.
  - Lines merged into an open pop-up are de-duplicated, one per series.
  - The fading pop-up no longer blocks taps.
  - The screen reader announces "Milestone reached" plus the lines.
  - The Close button is visible when focused.
- **Known limit:** changing the injection weekday can, rarely, re-show an on-schedule streak step already seen in the current run. This is accepted as rare.
- **Pop-up taps:** the full-screen tap-to-close layer catches one tap during the 5 seconds, as the owner decided ("click away").
- **Checks:**
  - 342 tests pass and the build passes.
  - Mocked iPhone runs passed for:
    - first arrival
    - a new milestone after logging
    - tap-away close
    - auto-close at 5 seconds
    - no repeat after reload
    - Reduce Motion
    - Dropbox backup and restore
  - No CSP violations and no errors.
