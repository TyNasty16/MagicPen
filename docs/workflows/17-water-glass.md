# Workflow 17 — Water glass on Home
Status: Approved
Milestone: Post-plan add-on (not in PLAN.md §5). Same pattern as workflow 16 (built). Uses only water totals already stored.

## Ideas considered
Ideas file: [docs/ideas/17-water-glass.md](../ideas/17-water-glass.md). Its owner decisions are binding. Chosen approach: generalise the shaker's rule into one shared fill tracker and give water its own memory key (the ideas file's recommendation, not a copy that could drift). Drawing source: `glass()` and `addWater` in `docs/mockups/20-steady-animations-preview.html`. Existing code reused: `src/lib/shaker.ts`, `src/components/ProteinShaker.tsx`, `src/components/NutritionRings.tsx` (how the shaker is wired) and the Water tile in `src/pages/Home.tsx`.

## Owner answers (defaults from workflow 16, to confirm)
1. Keep "Goal reached" for the day if water is deleted later: yes.
2. A tap on the glass opens nothing new: yes.
3. No replay button: yes.

## Goal
On Home, the Water tile's thin bar becomes a glass with ice that fills with today's water, pours when water is added, and plays a short "goal reached" drink once a day. Nothing is advised.

## In scope
- `WaterGlass` replaces the bar in the Water tile; the number, unit and "+ 8 fl oz" button stay.
- Pour once when today's total has risen since Home last showed it.
- Goal drink once per day, then an empty glass (a few ice cubes left) with "Goal reached ✓".
- Reduce Motion and screen-reader support.
- Shared `fillState` used by both shaker and glass.

## Out of scope
- Tap or faucet in the drawing (stream pours in from above; keep the drink and ice states).
- A replay button, a water glass elsewhere, haptics, a 7-day row.
- Changing the water target, the quick-add amount, or any dose logic.
- Backing up the glass memory.

## Exact text
- Goal state: "Goal reached ✓" (same wording and colour as the shaker).
- Number: "42" with "of 90 fl oz"; metric "1,242" with "of 2,660 ml" (the units the app shows).
- Screen-reader summary: "Water 42 of 90 fl oz." and, when reached, "Water 42 of 90 fl oz. Goal reached."
- Button label unchanged ("+ 8 fl oz"; aria "Add 8 fl oz water").

## Steps
1. `src/lib/fill.ts` (new): move the shaker's pure rule here as `fillState(today, total, target, memory)` with the same return shape and behaviour, plus `loadFillMemory(key)` / `saveFillMemory(key, m)` (try/catch for blocked storage), and the goal queue (step 4). No dose or advice logic.
2. `src/lib/shaker.ts`: becomes a thin wrapper (`SHAKER_KEY = 'steady.shaker'`, `shakerState = fillState`) so the shaker's behaviour, key and tests are unchanged. Add `WATER_KEY = 'steady.waterGlass'`.
3. `src/components/WaterGlass.tsx` (new): `glass()` ported to one SVG component with its own animation driver inside the file, as in `ProteinShaker.tsx`. Port the `addWater` steps (stream in, ripple, taper, then drink and ice states for the goal). No faucet. Only transform and opacity animate where possible; the drawing is `aria-hidden`. A tap on "+ 8" mid-pour restarts the pour; it does not queue.
4. Two goal moments: a small shared queue in `fill.ts`. Each goal registers with a priority; protein plays first, water starts after protein ends (plus a short pause). Both also wait while a milestone pop-up is open (`document.body.dataset.milestone === 'open'`, as the shaker does). Water-only or protein-only plays at once.
5. `src/pages/Home.tsx`: Water tile layout. A row: left, the number ("42"), "of 90 fl oz", "Water", and the "Goal reached ✓" line (space reserved so nothing shifts); right, the glass in a fixed-height box. The "+ 8 fl oz" button stays below the row, full width. The `role="img"` wrapper holds only the number row and the glass with the summary; the button sits outside it. Remove the old bar.
6. `src/db/db.ts`: add `WATER_KEY` to Reset's clear list (next to `SHAKER_KEY`). Not in `UI_KEYS`, not backed up.
7. Tests (below), full run and build, one mocked iPhone pass, code review.

## Acceptance criteria
- 42 of 90 fl oz shows a glass about 47% full with ice, "42" and "of 90 fl oz".
- Metric: 1,242 of 2,660 ml shows "1,242" and "of 2,660 ml"; the glass fill matches the same ratio and the label fits on a 390 px screen.
- Tapping "+ 8 fl oz" adds 8 fl oz and plays one pour. Revisiting Home with no change plays nothing. Tapping again mid-pour restarts the pour; the total is still correct.
- Deleting water lowers the level with no animation. First open of a day sets the level with no animation.
- Crossing 90 fl oz plays the drink once, ending on an empty glass with a few ice cubes and "Goal reached ✓". Reloading does not replay it.
- Protein and water goals due together: protein plays fully, then water. A milestone pop-up delays both until it closes.
- After the goal, deleting water or lowering the target keeps "Goal reached ✓". A lowered target alone marks it reached with no drink. The next day starts empty and unreached.
- Over 100% shows the true number, with the drawing capped at full.
- Reduce Motion: nothing moves; same end states.
- The button is not inside an element with `role="img"`, keeps its size, and does not move during a pour. Screen reader reads one summary for the glass.
- Shaker behaviour, key and tests are unchanged. `steady.waterGlass` is cleared by Reset and absent from backups. No network calls. Existing tests and the build pass. No advice or dose wording.

## Tests
Automatic (Vitest, table-driven):
- The existing shaker tests run through `fillState` unchanged (first of day, rise, same total, drop, goal, deleted-below-target, target change, rollover, corrupt storage).
- Water cases with ml: 1,242 of 2,660 ml, 90 fl oz target in ml, goal crossing in ml, lowered target, over 100%.
- Queue: protein then water order; water alone; protein alone; waits for a milestone pop-up.
- `steady.waterGlass` is in Reset's list and not in `UI_KEYS`; text guard over the new strings.

By hand: one mocked iPhone pass (390x844) with screenshots: add water (mid-pour), goal end state, and Reduce Motion. Check the tile does not shift and the button stays tappable. On the real iPhone after deploy: smoothness and legibility.

## Risks & open questions
- Touches working shaker code; mitigated by keeping its tests unchanged.
- Animation load on older iPhones: shaker and glass could both animate in one pass; the queue prevents that for goal moments.
- Goal flag lives only on this phone; a second device would replay once.
- Questions (defaults in brackets):
  - Pour plays when added water crosses the goal, as protein does? (yes)
  - Old bar removed, with the glass carrying the text label? (yes)
  - Pause between protein and water goal moments: about 1 second? (yes)

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## Token Steward trims (applied)
Where these differ from the sections above, these win.
- **Where the code goes:** `fillState` stays in `src/lib/shaker.ts`, made generic, with no move to a new file. Only the goal queue goes in a new small file.
- **Mocked iPhone pass:** one run, two screenshots (mid-pour, and goal end). Reduce Motion is covered by a unit test.
- **Test runs while building:** only the shaker, fill and glass tests. The full suite and build run once, before commit.
- **Text check:** the text guard is folded into existing tests.
- **Kept:** the three questions, since they're quick for the owner.

## In plain English

- **What changes:** The thin water bar on Home becomes a glass with ice. It fills as you log water and pours when you add a glass.
- **Goal moment:** Reaching 90 fl oz plays a short drink animation once a day. Afterwards the glass is empty except for a few ice cubes, with "Goal reached ✓".
- **Stays the same:** The number, the unit and the "+ 8 fl oz" button. The app still gives no advice.
- **Privacy:** No network calls. The glass is left out of backups.
- **Motion off:** If Reduce Motion is on, nothing moves, and the end states look the same.
- **Risks:** This touches the working shaker code, so its tests guard it. Older iPhones may animate less smoothly. A second device would play the goal drink once more.


## Approval
- [x] Approved by owner — 2026-11-28 (all five answers yes; text as the shaker's, already approved)
