# Workflow 18 — Water follow-ups: tidy Food section and bonus cups
Status: Draft
Milestone: Post-plan add-on (not in PLAN.md §5). Builds on workflow 17 (built). Uses only water totals already stored.

## Ideas considered
Ideas file: [docs/ideas/18-water-followups.md](../ideas/18-water-followups.md). The owner's decisions are binding. Chosen approach: no new stored field. Bonus-cup level and count are worked out from the day's total and the remembered `lastTotal`, as the ideas file suggests. Food's glass is the existing drawing, shown still. Not taken: the "Added today" list and the Undo chip (extras the owner did not ask for). Existing code reused: `GlassDrawing` and `goalSteps` in `src/components/WaterGlass.tsx`, `fillState` in `src/lib/shaker.ts`, `useFillAnimation`, and the water section of `src/pages/Food.tsx`.

## Goal
Part A: Food's water row becomes one glass, the amount, and a single "− / +" pair. Part B: on Home, water past the goal fills 32 fl oz "bonus cups" instead of leaving an empty glass. Nothing is advised.

## In scope
- Food: still glass, "42" and "of 90 fl oz", one "− 8 fl oz" and one "+ 8 fl oz" (metric 250 ml). The chips and the 16 fl oz / 500 ml button go.
- "−" takes 8 fl oz off the day's most recent water entry.
- Home: bonus cup of 946 ml (metric 1,000 ml). Each add pours; a filled cup plays a short drink, then the glass starts empty.
- Small label "Bonus cup N" from cup 2 on (owner question 1).

## Out of scope
- "Added today" list, Undo chip, a Preview button (ideas file extras).
- Any change to the water target, goal rule, or "Goal reached ✓". No dose logic.
- Animating Food's glass. Backing up anything new.
- Changing the first-look rule (question 3).

## Steps
1. `src/lib/water.ts`: add `bonusCupMl(u)` (imperial 946, metric 1000) and the pure `removeFromLast(entries, ml)`. Entries are the day's `{id, ml}`, and "most recent" means the highest id. It returns `null` if there are none. If the latest entry's ml is at most `ml + 0.5`, it returns `{delete: id}`. Otherwise it returns `{update: id, ml: entry − ml}`. It never goes below 0 and never spills into an earlier entry. Remove the quick-add pair's second size (`+ 16 fl oz` / `+ 500 ml`) so only the one quick amount is left. Check that nothing else uses it.
2. `src/db/db.ts`: add `removeWater(date, ml)` in one transaction, using `removeFromLast`. `addWater` and `deleteWater` stay.
3. `src/lib/shaker.ts`: `fillState(today, total, target, memory, cup = 0)`. `ShakerPlay` gains `'cup'`; `ShakerState` gains `cups` (completed cups). With `cup = 0` everything is exactly as now, so the shaker is untouched. With `cup > 0` and `m.goalShown` (or reached on first look), use these formulas, all in whole ml:
   - `over = max(0, total − target)`, `prevOver = max(0, lastTotal − target)`
   - `level = (over mod cup) / cup`, `from = (prevOver mod cup) / cup`
   - `cups = floor(over / cup)`, `prevCups = floor(prevOver / cup)`
   - `play = 'cup'` if `total > lastTotal` and `cups > prevCups`; else `'shake'` if `total > lastTotal` and `level > from`; else `'none'`.
   - A "−" or a delete gives `'none'` and moves the level quietly. The count follows the total, so it never rises on a removal.
   - The goal-crossing add keeps `play = 'goal'` only. Its `level` is the bonus level of `over` (not 0), and `goalShown` becomes true.
4. `src/components/WaterGlass.tsx`: export `REST`. `goalSteps(from, level)` ends by rising to `level` instead of 0. Give `goalSteps` a `cup` flag (no hold before the tip) rather than a new function. Several cups in one add play one drink. `play === 'cup'` selects it.
5. `src/lib/useFillAnimation.ts`: no queue change. Only `'goal'` uses `goalTurn` and waits for pop-ups, so `'cup'` plays at once and never delays protein or water goals. Only its type import changes.
6. `src/components/WaterTile.tsx`: pass `bonusCupMl(units)` into `fillState`. Add the "Bonus cup N" line under "Goal reached ✓", where N = `cups + 1`, shown only when N ≥ 2. Space is reserved so nothing shifts. The screen-reader line gains " Bonus cup 2." when shown.
7. `src/pages/Food.tsx` (water section only): replace the buttons, chips and list with the layout below. "−" is disabled when the day has no water.
   - Left: amount, "of N fl oz". Right: still `GlassDrawing` (`REST(level)`), with `level = total < target ? total / target : (over mod cup) / cup`. The drawing is `aria-hidden`.
   - Below: two equal buttons, "− 8 fl oz" and "+ 8 fl oz" (metric "− 250 ml" and "+ 250 ml"). Each is at least 44 px tall.
   - One `sr-only aria-live` line: "Water 42 of 90 fl oz."
8. Tests (below): run only touched test files while iterating; full run and build once, one mocked iPhone pass, and code review.

## Exact text
- Buttons: "− 8 fl oz" and "+ 8 fl oz" (aria "Remove 8 fl oz water", "Add 8 fl oz water"); metric "− 250 ml" and "+ 250 ml".
- New label: "Bonus cup 2", "Bonus cup 3" and so on (cup 1 unlabelled). Nothing says "drink more".

## Acceptance criteria
- Food at 42 of 90 fl oz shows the glass about 47% full, "42", "of 90 fl oz", and only "− 8 fl oz" and "+ 8 fl oz". Metric shows "− 250 ml" and "+ 250 ml".
- Entries 8 then 8: "−" leaves one 8 (the latest is deleted). An entry of 5 then "−" deletes it, and the total drops by 5, not 8. An entry of 20 becomes 12. With no entries "−" does nothing and the total is never below 0.
- Home past the goal: 90 → 98 fl oz pours into an empty glass, about 25% full. Reload plays nothing.
- Filling the cup (total reaches 122) plays pour then a short drink (no hold), then the glass is empty; "Goal reached ✓" stays. Adding 70 fl oz in one go plays one drink and ends at the right level.
- One add that crosses 90 and passes 32 over plays only the goal moment.
- "−" below the goal on Home: the glass stays empty and "Goal reached ✓" stays (the existing rule).
- "−" inside a bonus cup lowers the level with no animation. "Bonus cup 2" appears only from the second cup. It drops back to nothing if "−" brings the total back into cup 1.
- Small cup drinks do not wait for, or delay, a protein or water goal moment.
- Reduce Motion: nothing moves, same end states. Shaker behaviour and tests unchanged. No network calls, no advice wording. Existing tests and the build pass.

## Tests
Automatic (Vitest, table-driven):
- `fillState` with `cup` (about six rows): first look past the goal; add within a cup; cup completes; goal-crossing add (goal only, level is the bonus level); "−" across a cup boundary (play `'none'`, count falls); boundary over = 945/946. The existing shaker cases pass unchanged with `cup = 0`.
- `removeFromLast`: the cases listed above, plus unordered ids, entry exactly 8 fl oz (236.588 ml) deleted, and none.
- `removeWater` in `db` (fake IndexedDB, as other db tests do): the transaction deletes or reduces the latest entry for that date only.
- Component: `'cup'` skips `goalTurn`; the label shows only from cup 2; Food has exactly two water buttons.

By hand: one mocked iPhone pass (390x844), two screenshots: Food water section; Home mid-pour into a bonus cup. Check the tile does not shift. On the real iPhone after deploy: smoothness and legibility.

## Risks & open questions
- Rounding: totals are rounded to whole ml in `WaterTile`. A 32 fl oz cup is 946 ml (rounded from 946.35), so fl oz totals can drift under 1 ml from a cup edge. Compared in whole ml, never floats.
- Questions (defaults in brackets):
  1. Show the small "Bonus cup 2" label from the second cup on? (yes)
  2. After "−" drops below the goal, keep "Goal reached ✓" and an empty glass on Home? (yes)
  3. Keep the first-look rule, and Reduce Motion is off on your phone? (yes)
  4. Drop the 16 fl oz / 500 ml quick-add and the per-entry chips on Food? (yes)

## Review checkpoints
- Token Steward: done — trims applied (tests cut to essentials, owner-report and repeated risks removed, two screenshots, `cup` flag on `goalSteps`)
- Code Reviewer (sonnet): before commit
- Plain-Language Explainer (haiku): summary for owner

## In plain English

Two small tidy-ups to water tracking. No new information is stored or sent anywhere.

- **Food page:** the water row shows one glass, how much you have had, and your goal (for example, 42 of 90 fl oz, where fl oz means fluid ounces). Below it are two buttons: "− 8 fl oz" takes 8 off your most recent water entry, and "+ 8 fl oz" adds 8. The 16 fl oz button and the small per-entry buttons are removed. Metric users see 250 ml instead.
- **Home screen:** once you pass your daily goal, extra water fills "bonus cups" of 32 fl oz each. A full cup plays a short drink animation, then the glass starts empty again. A small "Bonus cup 2" label shows from the second cup on. Nothing tells you to drink more.
- **Unchanged:** your goal and the "Goal reached ✓" check stay as they are.

You need to decide
- Approve this plan. Nothing gets built until you do.
- Confirm four default answers: show the "Bonus cup 2" label (yes); keep "Goal reached ✓" and an empty glass if you drop back below goal (yes); keep the current first-look rule and confirm your phone's Reduce Motion setting (a setting that turns off movement effects) is off (yes); remove the quick-add and per-entry buttons on Food (yes).

## Approval
- [ ] Approved by owner — date:
