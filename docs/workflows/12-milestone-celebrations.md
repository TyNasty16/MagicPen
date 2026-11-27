# Workflow 12 — Milestone celebrations
Status: Draft
Milestone: Post-plan add-on (not in PLAN.md §5), owner idea I-63. Needs only data already stored.

## Ideas considered
Ideas file: [docs/ideas/12-milestone-celebrations.md](../ideas/12-milestone-celebrations.md). The owner's answers there are binding: a fading pop-up (no Home card, no list), five categories, full streaks, confetti. Chosen approach: one pure module that works out what has been earned from existing tables, a small record of what has already been shown kept in the profile row, and one pop-up component. Existing code reused: `Profile` and `saveProfile` (`src/db/db.ts`), the backup of the `profile` table (`src/lib/backup/serialize.ts`), `dayKey` (`src/lib/dates.ts`), `injectionWeekday` (as in `src/lib/nextDose.ts`).

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

| Category | Thresholds |
|---|---|
| Injections logged (total count of injection rows) | 1, 4, 8, 12, 26, 52, 78, 104, then every 52 |
| Injections on schedule (streak) | 4, 8, 12, 26, 52 weeks in a row |
| Weigh-in weeks (weeks with at least one weigh-in) | 1, 4, 8, 12, 26, 52, then every 26 |
| Weigh-in weeks (streak) | 2, 4, 8, 12, 26, 52 weeks in a row |
| Days with something logged (total) | 1, 10, 25, 50, 100, 150, 200, 300, 365, 500, 730, then every 365 |
| Days with something logged (streak) | 3, 7, 14, 30, 60, 100, 180, 365 days in a row |
| Time on treatment (months after the first injection's date; month-end clamps, Jan 31 + 1 month = Feb 28/29) | 1, 3, 6, 9, 12, 18, 24 months, then every 12 |
| Weight lost = Profile starting weight minus the lowest weigh-in ever | Every 5 lb (imperial profile); every 2 kg (metric profile, see questions); plus 5%, 10%, 15% of starting weight |

- **"Something logged" counts:** an injection, weigh-in, symptom, food entry or water entry on that day. The "barely ate" mark, measurements and appointments do not count.
- **On schedule (decided):** an injection logged anywhere inside a schedule week counts for that week. A schedule week is 7 days starting on the profile injection weekday (Monday plan: Monday to Sunday). Two injections in one week count once. No injection weekday set means no schedule streak. Dose amounts are never read.
- **Streak rules:** a streak counts back from today. If today (or this week) has no entry yet, the streak continues from the previous day (or week) without breaking. A missed day or week ends it silently; the next entry begins a new run, and the same thresholds can be earned again in it. Totals never reset.
- **Weight:** compared after rounding lost weight to 0.1 lb (or kg), so 5.0 lb counts and 4.9 does not. Needs a starting weight; none means no weight milestones. Percent steps stop at 15%.

## Storage
- **Where:** three optional `Profile` fields, no new table and no Dexie version bump (the v7 precedent): `milestonesEarned?: { key: string; on: string; run?: string }[]`, `showMilestones?: boolean`, `showWeightMilestones?: boolean` (missing = on).
- **Keys:** totals use the milestone id (`inj-12`). Streaks use `id@run`, where `run` is the first day of the run (week start for weekly ones; the first injection's date for the schedule streak, so changing the injection day later does not re-fire). A recorded streak counts for the current run if its `run` date falls inside the current run, so back-filling older entries never re-fires it. A recorded run that ended earlier is not current, so the milestone can be earned again.
- **Backup and restore:** the `profile` table is already backed up, so the list travels. `validatePayload` gets optional checks for the three fields (array length capped, `on`/`run` real dates). A backup made before this feature has no list. On restore from one, the app records everything earned so far silently, with no pop-up (`src/lib/backup/run.ts`). A restore from a backup that has the list needs nothing more.
- **Reset:** Reset clears the profile table, so the list and both switches go with it. The app then starts again from zero.
- **First arrival** (profile exists, `milestonesEarned` undefined): work out everything already earned and record all of it. Show only one line per category, once: a currently running streak's highest step if there is one, otherwise the highest total step. For weight, the larger of the lb step and the percent step. No line for a category with nothing earned.
- **Switches off:** milestones are still recorded silently, so turning a switch on later shows only new ones. Never a flood.

## When to check
- Once the profile is loaded and the disclaimer accepted: on app open, when the app returns to the screen (`visibilitychange`, as backup does), and shortly after a save to injections, weights, symptoms, food or water (a small Dexie live query on row counts, with a 600 ms delay so a sheet can close first).
- A milestone earned while the app was closed shows on the next open. Everything newly earned in one check is one pop-up. The record is written before the pop-up shows, so none can repeat. A check that finds more while a pop-up is open adds its lines to it and restarts its 5 seconds.

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
2. `src/lib/milestones.ts` (new, pure): `dailyKeys`, `weekKeys`, streak and total counting, `addMonths`, `computeEarned(data, profile, today)`, `pickNew(earned, record, today)`, `firstArrival(...)`, and `milestoneText`.
3. `src/lib/milestoneCheck.ts` (new, thin database glue): load the five tables, run the check, write the record, return lines to show. Also `recordSilently()` for restore.
4. `src/lib/backup/serialize.ts`: optional validation of the three fields. `src/lib/backup/run.ts`: silent record after restoring a backup with no list.
5. `src/components/MilestonePopup.tsx` and `src/components/confetti.ts` (new); fade styles with a reduced-motion override in `src/index.css`.
6. `src/App.tsx`: run the check on open, on return and after saves; render the pop-up.
7. `src/pages/Settings.tsx`: the "Milestones" card with two switches saved through `saveProfile`.
8. Tests (below), full run and build, one mocked iPhone pass, code review.

## Acceptance criteria
- 12 injections logged shows "12 injections logged"; 11 shows nothing.
- Logging on 7 days in a row shows "7 days in a row with something logged"; 6 shows nothing. Today still empty does not end a streak that ran through yesterday.
- A missed day ends the run silently; 7 more days in a row earns the 7-day line again. Total counts never reset.
- Starting weight 180 lb and a weigh-in of 175.0 lb shows "5 lb lost since your starting weight"; 175.1 does not. 162.0 lb (10%) shows both "18 lb lost..." and "10% of your starting weight lost" in the same pop-up.
- A weight gain afterwards never re-shows or removes anything.
- First injection 2026-01-31: "1 month since your first injection" shows from 2026-02-28.
- Injections logged in each of 4 consecutive schedule weeks show the schedule line; a late injection inside the week counts.
- First arrival with existing data shows at most one line per category, once; everything else is recorded and never shows later.
- After a restore (with or without a list in the backup) nothing re-fires. After Reset the record and switches are cleared.
- "Show milestones" off: no pop-up. "Show weight milestones" off: no weight lines, other lines still show. Turning either back on shows only new milestones.
- Pop-up closes by tap and by itself at about 5 seconds; Reduce Motion shows no confetti or fade; no sound or vibration; announced by VoiceOver.
- No text mentions dose, mg, a break, a miss, "to go" or what is next. Nothing is sent over the network. Existing tests and the build pass.

## Tests
Automatic (Vitest, pure functions with boundary cases):
- Totals at each threshold minus one, at, plus one; generator steps past the listed values.
- Day and week keys across DST changes, month ends, Monday-start weeks across New Year, ISO times near local midnight.
- Streaks: today empty, yesterday gap, run restart and re-earn, back-fill merging two runs without re-firing, "barely ate" mark not counted, no injection weekday set.
- Time: month-end clamp, leap year.
- Weight: 4.9/5.0 lb, percent steps, no starting weight, lowest-ever weigh-in, regain.
- `pickNew`: same-day combining, already-recorded skipped, first arrival one line per category.
- Backup: `validatePayload` accepts and rejects the new fields; a pre-feature backup is recorded silently; Reset clears the fields.
- Text guard over every string: `/dose|mg\b|increase|decrease|raise|lower|skip|escalat|titrat|should|recommend|miss|break|broke|to go|until|next|ate\b|calorie|diet/i`.

By hand (one mocked iPhone pass, 390x844, with screenshots): pop-up with confetti, the same with Reduce Motion, two lines combined, after saving an injection, Settings switches including the greyed state, switches off, first arrival with seeded data. On the real iPhone after deploy: confetti runs smoothly, Reduce Motion is respected, and nothing repeats after closing and reopening the app.

## Risks & open questions
- Pop-up timing and screen readers: a 5-second pop-up can be too short for some people. Mitigated by the polite announcement and the hidden Close button. Default: keep 5 seconds.
- Editing the Profile starting weight can earn new weight milestones at once. Default: allowed, shown once like any other.
- The record changes the profile row, so the next automatic backup includes it. Normal.
- Questions, each with a suggested default:
  - Weeks start on Monday? (default: yes)
  - Metric profiles: every 2 kg (about 4.4 lb) instead of 5 lb? (default: yes)
  - Is "Well done" the right heading? (default: yes)
  - Does the "barely ate" mark stay uncounted for "something logged"? (default: yes)
  - First arrival shows one line per category, so up to five lines; fewer at once? (default: keep, it is a one-off)
  - Is 5 lb / 5% / 10% / 15% the full weight list, with no 20% and above? (default: yes)

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
(Left blank — filled by the Plain-Language Explainer.)

## Approval
- [ ] Approved by owner — date:
