# Workflow 16 — Protein shaker on Home
Status: Draft
Milestone: Post-plan add-on (not in PLAN.md §5). Builds on workflow 15 (not yet merged). Uses only food totals already stored.

## Owner answers (2026-11-28)
1. Keep "Goal reached" for the day if food is deleted later: yes.
2. A tap on the shaker opens Food: yes.
3. No replay button: yes.

## Ideas considered
Ideas file: [docs/ideas/16-protein-shaker.md](../ideas/16-protein-shaker.md). Its owner decisions are binding. Design source: `docs/mockups/18-shaker.html` (lid B, no whisk ball, DRINK and COVER states); previews `docs/screenshots/18-mock-shaker-shake.gif` and `18-mock-shaker-goal.gif`. Chosen approach: port the mockup drawing into one pure SVG component, drive it with a small timed animation driver, and keep the "protein was added" memory in localStorage. Existing code touched: `CompactNutritionRings` (`src/components/NutritionRings.tsx`) and `src/pages/Home.tsx`.

## Goal
On Home, the protein ring becomes a protein shaker that fills with today's protein, shakes when protein is added, and plays a short "goal reached" sequence once a day. Nothing is advised.

## In scope
- `ProteinShaker` replaces the protein ring inside `CompactNutritionRings`; the calories mini ring and line stay.
- Shake once when today's total has risen since Home last showed it, including additions made on the Food screen.
- Goal sequence once per day, then an empty bottle with "Goal reached ✓" for the rest of the day.
- Reduce Motion and screen-reader support.

## Out of scope
- Shaker on the Food screen, a 7-day row of bottles, haptics (ideas file extras).
- A replay button for the goal sequence.
- Changing the protein target, the calories line, other tiles, or any dose logic.
- Backing up the shaker memory.

## Exact text
- "84 g of 114" and "Protein"; goal state: "Goal reached ✓" (true grams stay visible).
- Calories line "1,240 of 1,982" and "Calories" (already approved).
- Screen-reader summary: "Protein 84 of 114 g. Calories 1,240 of 1,982 kcal." and when reached "Protein 84 of 114 g. Goal reached. Calories ..."

## Rules
- **Level:** protein / target, clamped 0 to 1 for the drawing; the text shows true grams (over 100% allowed).
- **Add detection:** per-day `{date, lastTotal}` in localStorage (`steady.shakerSeen`), not backed up, not in `UI_KEYS`. On Home mount and on each total change: first sight of the day sets the level silently. Total above `lastTotal`: play one shake, then save. Total below: lower the level with no animation, save.
- **Goal flag:** per-day `{date, reached}` (`steady.shakerGoal`), same rules. Set when the total first reaches the target. The sequence plays once if the flag was unset; it is saved at the start so a reload does not replay it.
- **Goal sequence (about 4 s):** one big shake, lid pops open with a bounce, tip back and drain through the spout, back upright, lid shut, "Goal reached ✓". If a milestone pop-up is open, wait until it closes.
- **After the goal:** empty bottle, lid shut, true grams, "Goal reached ✓" all day. It stays reached if food is deleted or the target changes. The next day starts empty and unreached.
- **Date rollover:** keyed by local day via `useNow`; a screen left open past midnight refills to the new day's total.
- **Reduce Motion:** no animation; the same end states (level, or empty bottle with "Goal reached ✓") shown immediately. The JS driver checks this too, not only CSS.
- **Accessibility:** the tile keeps `role="img"` with the summary; the drawing and animation are `aria-hidden`; "Goal reached ✓" is real text. The tile link to Food (`#/food?from=home`) is unchanged.

## Steps
1. `src/lib/shaker.ts` (new): pure functions `shakerLevel(total, target)`, `shakerDecision(stored, today, total)` (returns `{play: 'none'|'shake'|'goal', next}` and the saved state), `goalState(stored, today, total, target)`, plus load/save helpers for the two localStorage keys (try/catch for blocked storage).
2. `src/components/ProteinShaker.tsx` (new): pure SVG, props `level`, `angle`, `slosh`, `covered`, ported from the mockup (lid B, DRINK and COVER states). No timers, no state. Only transform and opacity animate.
3. `src/lib/useShakerAnimation.ts` (new): small driver hook that runs the shake and goal sequences from a timed list, returns the current `angle`, `slosh`, `covered` and `level`; stops timers on unmount; no loop when idle; skips to the end state under Reduce Motion; waits while a milestone pop-up is open (reads the same state `useMilestones` exposes).
4. `src/components/NutritionRings.tsx`: `CompactNutritionRings` swaps the protein ring for `ProteinShaker` plus the text above; calories line unchanged; summary updated.
5. `src/pages/Home.tsx`: pass what the driver needs (today's date from `useNow`, pop-up open flag); no layout change to the tile.
6. Tests (below), full run and build, one mocked iPhone pass, code review.

## Acceptance criteria
- 84 g of 114 shows a bottle about 74% full, "84 g of 114" and "Protein".
- Adding 20 g of protein on Food, then returning to Home, plays one shake; revisiting Home without changes does not.
- Deleting food lowers the level with no animation.
- First open of a day sets the level with no animation.
- Crossing 114 g plays the goal sequence once (about 4 s), ending on an empty bottle and "Goal reached ✓". Reloading or leaving and returning does not replay it.
- With a milestone pop-up open at that moment, the sequence starts only after it closes.
- After the goal, deleting food or raising the target keeps the empty bottle and "Goal reached ✓", with the true grams. Next day starts empty and unreached.
- 130 g of 114 shows "130 g of 114", with the drawing capped.
- With Reduce Motion on, nothing moves, and the end states are the same.
- Screen reader reads one summary; the drawing is hidden; tapping the tile opens Food.
- Calories line unchanged. No network calls; shaker keys absent from backups. Existing tests and the build pass. No advice or dose wording.

## Tests
Automatic (Vitest, table-driven):
- `shakerLevel`: 0, 84/114, exactly the target, 130/114, target 0.
- `shakerDecision`: first of the day (silent), rise (shake), same total (none), drop (none, saved lower), date rollover (silent, state reset).
- `goalState`: crossing sets the flag and plays; already set does not replay; food deleted below target stays reached; target rises or falls stays reached; rollover resets; corrupt or missing storage.
- Shaker keys are not in `UI_KEYS`; text guard over the new strings.

By hand: one mocked iPhone pass (390x844) with screenshots: normal level, mid-shake, goal sequence end state, and Reduce Motion. Check the sequence runs and ends on the empty bottle with "Goal reached ✓", and that the tile does not shift layout. On the real iPhone after deploy: smoothness and legibility.

## Risks & open questions
- Animation load on older iPhones: only transform and opacity animate, no idle loop.
- Home must not show a shake for food added by a restore or sync; backup and restore does not replay (keys not backed up), but a restore may show one silent level change.
- Goal flag lives only on this phone; a second device would replay once.
- If the bottle is empty after the goal, the progress level is no longer drawn; the grams text carries it.
- Questions, each with a default:
  - Keep "Goal reached" if food is deleted later? (default: yes)
  - Tap on the shaker opens Food? (default: yes)
  - No replay button? (default: yes)

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## Token Steward trims (applied)
Where these differ from the sections above, these win.
- **One pure function:** `shakerState(today, total, target, stored)` decides the level, whether to shake, and the goal state. There is no separate `goalState`, and one set of tests covers it, including the date rollover.
- **One file:** the animation driver lives inside `ProteinShaker.tsx`. There is no `useShakerAnimation.ts`.
- **Screenshots:** two in the mocked pass, the goal end state and Reduce Motion. The sequence itself is checked by a test that it runs and ends.
- **Text checks:** added to the existing text tests.
- **Kept:** the three questions, which are quick for the owner and change behaviour.
- **Order:** build after workflow 15 is online, to avoid rework.

## In plain English

On Home, the protein ring becomes a shaker bottle that fills as you log protein.

- Adding protein makes it shake once. Reopening Home does not.
- Reaching your target plays a short sequence of about 4 seconds, once a day. Afterwards the bottle sits empty with "Goal reached ✓" for the rest of the day.
- Deleting food later keeps the goal reached for that day.
- The app never suggests amounts.
- If your phone's Reduce Motion setting is on, nothing moves; the same end picture appears immediately.
- No extra cost, and no new internet connections. Shaker memory stays on this phone and is left out of backups.
- Risks: a second phone would play the goal sequence once more. A restore may change the bottle level without a shake. Building waits for workflow 15.

You need to decide:
- Keep "Goal reached" if food is deleted later? (default: yes)
- Tapping the shaker opens Food? (default: yes)
- No replay button? (default: yes)

## Approval
- [ ] Approved by owner — date:
