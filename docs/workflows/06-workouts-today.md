# Workflow 06 — Workouts and the Today dashboard
Status: Paused by owner 2026-11-25 ("I think we can do better") — not approved, nothing built
Milestone: 6 — Workouts + Today dashboard (PLAN.md §5; scope §2 items 6–7)

## Ideas considered
Ideas file: [docs/ideas/06-workouts-today.md](../ideas/06-workouts-today.md). Chosen: approach 1, upgrade Home into the Today dashboard with a "Today's move" tile that opens a routine screen. Five tabs stay. Sources: [docs/sources/06-nhs-exercise.md](../sources/06-nhs-exercise.md).

## Goal
Give the owner a short, sourced at-home strength routine with a simple done/partly/skipped log and a daily activity-minutes log, reachable from a lean Today (Home) dashboard. The app logs only; it sets no targets and gives no coaching.

## In scope
- "Today's move" tile on Home, opening a new Move screen (route `move`, reached from Home; no new tab).
- Move screen: the default routine (exact NHS text below), a per-day workout log, an activity log, last-7-days strip.
- Workout log per day: done / partly / skipped, optional note. "Rest day" is a fourth state and is never counted as a miss.
- Activity log per day: minutes of brisk walking or other moderate activity, with a weekly total shown against the NHS 150 minutes. Optional steps number with an owner-set goal.
- Owner-set reps per exercise; NHS reps shown as the starting point.
- Dexie v7 adds `workouts` and `activity`; v6 data is kept.

## Out of scope
- Glute bridges, bird-dogs, step-ups, plank (no source; dropped unless the owner supplies one).
- Any suggested step target, auto-progression, streaks, scores or "you should" text.
- The "take it easy after injection" hint (no source).
- Timers, videos, images, notifications, new tabs.
- Export/backup (Milestone 7), but the new tables must be included when it is built (noted for that milestone).
- Any dose-related text.

## Exact text for owner review
All text below is quoted word for word from the NHS pages in `docs/sources/06-nhs-exercise.md`. Each is shown in the app with its source label and link. Wording lives in one file for review.

**Before you start** [NHS, Strength exercises and Physical activity guidelines for adults aged 19 to 64]:
> Strength exercises like these can be done at home to improve your health and mobility.
> Do not worry if you have not done much for a while, these strength exercises are gentle and easy to follow.
> For the chair-based exercises, choose a solid, stable chair that does not have wheels and that will not slip on the surface it is on.
> You should be able to sit with your feet flat on the floor and your knees bent at right angles. Avoid chairs with arms, as these will restrict your movement.
> Wear loose, comfortable clothing and keep some water handy.
> Build up slowly and aim to gradually increase the repetitions of each exercise over time.
> Speak to your GP first if you have not exercised for some time, or if you have medical conditions or concerns. Make sure your activity and its intensity are appropriate for your fitness.

**Sit-to-stand** [NHS, Strength exercises]:
> A. Sit on the edge of the chair, feet hip-width apart. Lean slightly forwards.
> B. Stand up slowly using your legs, not arms. Keep looking forward and do not look down.
> C. Stand upright and then slowly sit down, using your hands or arms just to guide you if possible.
> Aim for 5 repetitions. The slower the repetitions, the better.

**Mini-squats** [NHS, Strength exercises]:
> A. Rest your hands on the back of the chair for stability and stand with your feet hip-width apart.
> B. Slowly bend your knees as far as is comfortable, keeping them facing forwards. Aim to get them over your big toe. Keep your back straight at all times.
> C. Gently come up to standing, squeezing (clenching) your buttocks as you do so.
> Repeat 5 times.

**Wall press-up** [NHS, Strength exercises]:
> A. Stand at arm's length from the wall. Place your hands flat against the wall at chest level, with your fingers pointing upwards.
> B. With your back straight, slowly bend your arms, keeping your elbows by your side. Aim to close the gap between you and the wall as much as you can.
> C. Slowly return to the start.
> Attempt 3 sets of 5 to 10 repetitions.

**Calf raises** [NHS, Strength exercises]:
> A. Rest your hands on the back of a chair for stability.
> B. Lift both heels off the floor as far as is comfortable. The movement should be slow and controlled.
> Repeat 5 times.
> To make this more difficult, perform the exercise without support.

**Leg extension** [NHS, Strength exercises]:
> A. Rest your hands on the back of a chair for stability.
> B. Standing upright, raise your left leg backwards, keeping it straight. Avoid arching your back as you take your leg back. You should feel the effort in the back of your thigh and bottom.
> C. Repeat with the right leg.
> Hold the lift for up to 5 seconds and repeat 5 times with each leg.

**Sideways leg lift** [NHS, Strength exercises]:
> A. Rest your hands on the back of a chair for stability.
> B. Raise your right leg to the side as far as is comfortable, keeping your back and hips straight. Avoid tilting to the right.
> C. Return to the starting position. Now raise your left leg to the side as far as possible.
> Raise and lower each leg 5 times.

**Biceps curls (optional)** [NHS, Strength exercises]:
> A. Hold a pair of light weights (filled water bottles will do) and stand with your feet hip-width apart.
> B. Keeping your arms by your side, slowly bend them until the weight in your hand reaches your shoulder.
> C. Slowly lower again.
> This can also be carried out while sitting. Attempt 3 sets of 5 curls with each arm.

**How often** [NHS, Strength exercises; Physical activity guidelines for adults aged 19 to 64]:
> Try to do these exercises at least twice a week […]
> do at least 150 minutes of moderate intensity activity a week or 75 minutes of vigorous intensity activity a week

**What counts as moderate / brisk** [NHS, Physical activity guidelines; Walking for health]:
> Moderate activity will raise your heart rate, and make you breathe faster and feel warmer. One way to tell if you're working at a moderate intensity level is if you can still talk, but not sing.
> A brisk 10-minute daily walk has lots of health benefits and counts towards your 150 minutes of weekly exercise, as recommended in the physical activity guidelines for adults aged 19 to 64.
> A brisk walk is about 3 miles an hour, which is faster than a stroll.
> If you're not very active but are able to walk, increase your walking distance gradually.

Footer on the Move screen: "From NHS.uk. Not medical advice." (the only non-quoted line; it states what the text is, and gives no instruction).

App labels (not instructions): "Done", "Partly", "Skipped", "Rest day", "Minutes of activity", "This week: N of 150 min (NHS)", "Steps (optional)", "Fatigue logged yesterday" (fact only, shown only if a fatigue symptom exists yesterday; no advice).

## Steps
1. `src/db/db.ts`: add `Workout` (`date` YYYY-MM-DD key, `status` done|partly|skipped|rest, `notes?`) and `Activity` (`date` key, `minutes`, `steps?`); `db.version(7)` adds `workouts: 'date'`, `activity: 'date'` (keep v1–v6). Add `listWorkoutsSince`, `saveWorkout`, `listActivitySince`, `saveActivity`. Profile gets optional `stepGoal` and `repsOverrides` (stored in the existing profile record; no new table).
2. `src/lib/moveText.ts` (new): the exact text above as constants with source labels and URLs. Default exercise list and NHS starting reps.
3. `src/lib/move.ts` (new): `weekTotalMinutes(activity, today)` (Monday to today, local days), `last7(workouts, today)` where rest days and days with nothing logged are never misses, `isValidMinutes` (integer 0–1440), `isValidReps` (integer 1–99).
4. `src/pages/Move.tsx` (new): routine accordion (exercise text, owner reps field defaulting to the NHS number), status buttons (44px), note, activity minutes and optional steps, weekly total, 7-day strip with "N of 3 sessions this week", step-goal setting. The routine is shown every day (no planned-days setting).
5. `src/App.tsx`: add `move` to `ROUTES` (not a tab; Back returns Home via `from=home`).
6. `src/pages/Home.tsx`: add "Today's move" tile (status today or "Not logged", minutes this week). Tile order: header, alerts, weigh-in, dose hero, Today's move, nutrition, weight + water grid, quick add. Add a 5th quick-add? No: keep four. Optional "Fatigue logged yesterday" line inside the tile.
7. Mockup step (before build): a static HTML mockup of the Home and Move screens built from the text above, shown to the owner as screenshots. No app code is changed until the mockup is approved.
8. Tests (below). Run focused tests during the build, then the full suite and build once. One browser pass at 390px produces screenshots of Home, Move (routine open), activity and the 7-day strip.

## Acceptance criteria
- Five tabs unchanged and fitting at 390px; every tap target at least 44px.
- Home shows the "Today's move" tile after the dose hero; tapping it opens Move; Back returns Home.
- Every exercise instruction and guidance line in the app matches this document word for word and shows its source.
- No text mentions doses, injections as a reason to change activity, steps targets, or "should" advice beyond the quoted NHS lines.
- Marking today "Rest day" is never shown or counted as a miss; days with nothing logged show no miss either.
- Logging 30 minutes on three days shows "This week: 90 of 150 min (NHS)".
- Editing reps for an exercise to 8 persists after reload; the NHS number stays visible as the starting point.
- Minutes outside 0–1440 or non-integers cannot be saved.
- Steps goal is empty until the owner sets one; no number is suggested.
- "Fatigue logged yesterday" appears only when such a symptom exists, with no other words.
- Works offline, no network requests.
- Browser pass: with v6 data present (profile, doses, weights, food, symptoms), loading v7 keeps all of it. Reset all data empties the new tables.
- Existing tests and the build pass.

## Tests
Automatic (Vitest, `src/lib/move.test.ts`):
- Week total: Monday start, Sunday end, days outside the week excluded, missing days count as 0.
- 7-day strip: rest days and days with nothing logged are not misses; skipped is shown as skipped only when logged.
- Validation: minutes 0, 1440 pass; -1, 1441, 2.5, NaN fail. Reps 1, 99 pass; 0, 100, 2.5 fail.
- Wording: one test reads `docs/sources/06-nhs-exercise.md` and checks that every quoted line in `moveText.ts` appears in it word for word (the sources file is the single reference; no separate snapshot), plus one regex check for /dose|inject|wegovy|semaglutide/i.

By hand, one browser pass (fake-indexeddb isn't installed, so the database checks are here): v6 → v7 upgrade keeps data, reset empties the new tables, offline, and the screenshots; layout at 390px and tap sizes are checked in the same pass.

## Risks & open questions
- All wording is quoted from NHS pages (exercise page last reviewed 28 February 2024, next review due 28 February 2027). The CDC site refused automated access, so only NHS is used.
- Proposed defaults, accepted together by replying "defaults OK":
  - Routine: sit-to-stand, mini-squats, wall press-up, calf raises, leg extension, sideways leg lift. Biceps curls optional (water bottles, off by default).
  - Dropped, unless you supply a source: glute bridges, bird-dogs, step-ups, plank.
  - Schedule: a weekly count of 3 sessions ("2 of 3 sessions this week"), no fixed days. The NHS says at least twice a week; PLAN says 3. Nothing is ever called a miss.
  - Activity: minutes per day, weekly total against the NHS 150. Steps optional with your own goal, no number suggested.
  - Fatigue hint: drop the "take it easy" advice. Show only the fact "Fatigue logged yesterday" in the tile (reply "no fact" to remove even that).
  - Progression: NHS reps as the starting point; you set your own; no auto-coaching.
  - Home order as in Step 6; four quick-add buttons unchanged.
  - Mockup before the build: yes.
- Approve the exact text: reply "Approve the exact text" (or mark changes).
- Open: should "Partly" count toward weekly sessions? Default no, only "Done" counts (word: yes/no).
- Open: can the Move screen show the walking guidance only as quoted, with no suggested minutes per day? Default yes.
- Weekly total starts Monday (default); say "Sunday" to change.

## Paused (2026-11-25)
After the plan was sent, the owner asked why only 6 exercises were found. Further NHS pages give about 20: Strength (7), Balance (5, including step-up), Sitting (5), Flexibility (4; neck rotation repeats). Glute bridge, bird-dog and plank still have no source; NHS Inform and the US National Institute on Aging were proposed as places to look. The owner paused the workout part to rethink it. Resume with a fresh Ideas opening pass.

- Token Steward: before start (applied: NHS text checked against the one sources file, merged wording tests, planned days dropped for a weekly count, database checks in the single browser pass. Not applied: dropping the mockup — the owner asked for mockups as well as screenshots on Milestone 5)
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
**What it adds.** A "Today's move" box on the Home screen. Tapping it opens a short at-home strength routine, copied word for word from the NHS (the UK's public health service). You can mark each day as Done, Partly, Skipped or Rest day, and log minutes of brisk walking. The app shows your weekly total against the NHS target of 150 minutes. A rest day or a day with nothing logged is never counted as a miss.

**Why the routine changed.** Only exercises with an NHS source are kept. Glute bridges, bird-dogs, step-ups and plank had no source, so they are dropped.

**Why the "take it easy after injection" hint is gone.** It had no source, so it is removed.

**Cost.** Nothing.

**What could go wrong.** The wording matches the NHS pages as they were last reviewed (February 2024), so it may fall out of date. The NHS advises speaking to your GP first if you have not exercised for a while or have a medical condition.

**You need to decide:**
- Reply "defaults OK" to accept the proposed defaults.
- Approve the exact NHS text (reply "Approve the exact text").
- Should "Partly" count toward weekly sessions? Default: no.
- Should the weekly total start on Monday? Default: yes (say "Sunday" to change).

## Approval
- [ ] Approved by owner — date:
