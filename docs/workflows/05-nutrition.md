# Workflow 05 — Nutrition: food log, My Foods, water
Status: Built — 2026-11-25
Milestone: 5 — Nutrition (PLAN.md §2 item 5; §5 order). Open Food Facts search is split out as 05b.

## Ideas considered
Ideas file: `docs/ideas/05-nutrition.md`. Chosen approach: option 2, split. This document (05) is fully on-device: manual food log, My Foods, water, rings/bars, Home tile, and a factual protein note. Open Food Facts search is 05b with its own document. Existing code reused: `CalorieRing`, `MacroBar`, `Tile`, `effectiveTargets`, the BottomSheet pattern from Symptoms.

## Goal
Let the owner log food and water and see today's totals against their targets on Home and on a Food screen. The app records and reports only; it never advises on diet or doses.

## In scope
- Food entry in a BottomSheet: name, kcal, protein, carbs, fat (grams), optional fiber, meal, servings. Add, edit, delete.
- My Foods: save an entry as a favorite; one-tap re-log from a list; edit/delete a favorite. Deleting a favorite never changes past log entries (each log entry stores its own values).
- Meals: breakfast, lunch, dinner, snacks, or none (default: none).
- Servings: decimal multiplier (default 1) with quick buttons ½ / 1 / 1½ and a typed field (0.1–20).
- Water log: quick-add buttons in the owner's units (fl oz or ml); list of today's entries with delete. (Custom amount deferred.)
- Food screen at route `#/food` (no 6th tab): day view with date back/forward, CalorieRing, protein/carbs/fat MacroBars, fiber and water progress, entries grouped by meal.
- Home: nutrition tile shows real totals and links to `#/food?from=home`; Water tile shows today's total vs target with a quick-add button (replaces "Logging soon"); Food quick-add opens the food sheet.
- Factual protein note on the Food screen, hidden when there is nothing to report, e.g. "Protein below target on 4 of the last 7 days". Counts only days that have at least one food entry.
- Dexie v6 adds `foods`, `foodLog`, `water`; v1–v5 stay and data is kept.
- `resetAllData` clears the three new tables.

## Out of scope
- Open Food Facts search for branded foods, its privacy notice and offline message (05b, separate document). The built-in USDA list IS in scope (see "Added by owner" below).
- Barcode scanning, paid food databases, meal plans, recipes.
- Any advice: no "eat more protein", no dose links, no warning text beyond the factual count.
- Export/backup (Milestone 7); a Symptoms-style tab for food.
- Per-100g storage. Entries are stored per serving only.
- Changing the target formulas themselves (only the weight they use changes; see below).

## Steps
1. `src/db/db.ts`: add types `Food` (`id`, `name`, `servingDesc?`, `kcal`, `proteinG`, `carbsG`, `fatG`, `fiberG?`), `FoodLogEntry` (`id`, `date` local day key `YYYY-MM-DD`, `meal`, `name`, `kcal`, `proteinG`, `carbsG`, `fatG`, `fiberG?`, `servings`), `WaterEntry` (`id`, `date`, `ml`). Add `db.version(6)` with `foods: '++id, name'`, `foodLog: '++id, date'`, `water: '++id, date'`, keeping every earlier version. Add list/save/delete helpers. Extend `resetAllData` (tables list and `clear()` calls) with the three tables.
2. `src/lib/nutrition.ts` (new): `MEALS`; `entryTotals(entry)` (per-serving value × servings, unrounded); `dayTotals(entries)`; `proteinLowDays(entriesByDay, target, days = 7)` returning `{ low, logged }`; `proteinNote(low, logged)` returning the factual sentence or `null`; `validateFood(input)`.
3. `src/lib/nutrition.test.ts` (new): tests below.
4. `src/components/FoodSheet.tsx` (new): BottomSheet form, servings quick buttons, meal chips, "Save to My Foods" checkbox.
5. `src/components/MyFoodsList.tsx` (new): favorites list with one-tap log (uses servings from the sheet's last choice, default 1), edit, delete (confirm).
6. `src/components/WaterSheet.tsx` (new): quick-add buttons; unit-aware using existing `mlToFlOz` helpers.
7. `src/pages/Food.tsx` (new): day navigation, ring and bars, water row, protein note, entries by meal, buttons "Log food", "My Foods", "Add water".
8. `src/App.tsx`: add `food` to `ROUTES` and render `Food` (lazy not needed). Tabs unchanged; the Home tab stays highlighted on `#/food`.
9. `src/pages/Home.tsx`: feed totals into `CalorieRing` and `MacroBar`s, point the tile at `#/food?from=home`, wire the Water tile and Food quick-add.
10. Run the new test file during build; run the full suite and build once at the end; one browser pass (below).

## Acceptance criteria
- Logging 1½ servings of a 200 kcal, 10 g protein food shows 300 kcal and 15 g protein; stored values stay 200 / 10 with servings 1.5.
- Display rounding: kcal and grams to whole numbers, water to whole ml or 1 decimal of fl oz. Totals are summed unrounded, then rounded once for display.
- ½ / 1 / 1½ buttons set the servings field to 0.5 / 1 / 1.5. Save follows the `validateFood` rules in Tests.
- A saved My Food can be re-logged in one tap; deleting it leaves earlier log entries unchanged.
- Meal "none" entries appear under "Other". Entries are grouped breakfast, lunch, dinner, snacks, other.
- Entries are bucketed by local calendar day; an entry at 23:30 stays on that day.
- The ring caps at 100% but the number shows the true total (e.g. 2,150 of 2,000 kcal).
- Home nutrition tile and Water tile match the Food screen; no Home tile says "Soon" or "Logging soon" for food or water.
- Protein note: with protein under target on 4 of the last 7 days that have entries, it reads "Protein below target on 4 of the last 7 days". It is hidden when there are fewer than 3 logged days, or when no day is below target. Wording contains no advice and no dose reference (guard test).
- With no profile targets the Food screen still logs, shows totals without ring/target, and the Home tile is unchanged (profile prompt).
- v5 data (profile, injections, weights, photos, measurements, symptoms) survives the v6 upgrade.
- Reset removes foods, food log and water.
- Works offline; no network requests. At 390px every tap target is at least 44px.
- Existing tests and the build pass.

## Tests
Automatic (Vitest, `src/lib/nutrition.test.ts`):
- `entryTotals`: servings 0.5, 1, 1.5, 2.25; precision kept; fiber optional.
- `dayTotals`: sums across entries and meals; empty day is zeros.
- `validateFood`: empty name, negative or NaN nutrient, servings 0, negative or above 20 are rejected; kcal 0 and servings 20 are allowed.
- `proteinLowDays` and `proteinNote`: 4 of 7; days without entries excluded; under 3 logged days gives null; all days met gives null; exact-target day is not low.
- Guard: note text matches no /dose|should|eat more|increase|skip/i.
- Local-day bucketing: one test covering 23:30/00:30 and a DST week.

By hand, one browser pass at 390px (no fake-indexeddb in the project, so the upgrade and reset are checked here): seed v5 data and confirm it survives v6; then 4 screenshots for the owner — Home tile, food sheet, Food screen with entries across meals, protein note; then offline check and reset clears the new tables.

## Risks & open questions
- Proposed defaults — owner can reply "defaults OK":
  - Screen: Home tile opens `#/food`; no 6th tab (five already fit at 390px).
  - Meals: breakfast, lunch, dinner, snacks, or none; default none.
  - Servings: decimal, quick ½ / 1 / 1½, range 0.1–20.
  - Rounding: stored precise; whole numbers for kcal and grams on screen.
  - Water quick-add: 8 fl oz / 250 ml and 16 fl oz / 500 ml (custom amount later).
  - Protein note: needs at least 3 logged days in the last 7; factual sentence only.
  - Fiber: optional field; shown as a progress line, not a ring.
  - Delete confirmation: yes for My Foods; entries delete with an undo-free confirm like Symptoms.
- **Owner added both extras (2026-11-25):**
  - **Protein first → two rings (owner change after mockup v1):** on Home and the Food screen, a **macro ring** of three nested arcs (protein outside, carbs, fat inside; protein grams in the centre) sits beside a separate **calorie ring**. A legend below lists protein, carbs and fat as value / target g. The MacroBars on these two views are replaced; `CalorieRing` stays for calories and a new `MacroRing` component is added.
  - **"Barely ate today":** a button on the Food screen marks the shown day as a low-intake day (new `dayMarks` table in v6: `++id, date`; cleared by reset). The day shows a calm "Marked: barely ate" chip with Undo. A marked day counts as a logged day for the protein note (with whatever was logged, often 0 g). Facts only, no advice.
- Backup/export is not yet built and food data will accumulate; consider moving Milestone 7 up.
- Small samples (3 logged days) can mislead; the note shows both counts.

## Added by owner: built-in USDA food list (2026-11-25, option B)
The owner asked how the app knows a food's nutrition, then chose to fold a built-in USDA list into this milestone (no key, no network).

- **Source:** USDA FoodData Central, "Survey Foods (FNDDS)" release 2024-10-31: 5,431 everyday foods as eaten (e.g. "Muffin, chocolate chip"), each with household portions ("1 medium", 130 g). Public domain (CC0); attribution shown anyway. Chosen over "SR Legacy" (2018, 7,793 mostly raw ingredients, no chocolate chip muffin).
- **Trim:** `scripts/build-usda-foods.py` keeps name, kcal, protein, carbs, fat, fiber per 100 g and up to 4 portions → `public/data/usda-foods.json` (measured: 660 KB, 112 KB compressed). The raw USDA zip is not committed; the script records the release date. The download host (fdc.nal.usda.gov) is allowed only in the new personal "magicpen" cloud environment, for refreshing the file; the app itself never contacts USDA.
- **Loading:** fetched from the app's own site only when the search box is first used, and precached by the service worker so it works offline. Adds nothing to app start.
- **Search (in the Log food sheet):** a "Search foods" box above the fields. Matches foods containing all typed words; ranks names starting with the first word, then shorter names; shows up to 20. Nothing typed leaves the phone.
- **Picking a result:** choose a portion (e.g. "1 medium · 130 g") or type grams. The four fields and fiber fill in for that portion and stay editable; servings (½ / 1 / 1½) multiply as before. The entry is stored like any manual entry, and "Save to My Foods" works the same.
- **Example:** Muffin, chocolate chip, 1 medium (130 g) → 523 kcal, 7.5 g protein, 72 g carbs, 24.7 g fat, 2.3 g fiber.
- **Footer line in the sheet:** "Food data: USDA FoodData Central (public domain)."
- **Steps added:** (a) the script and data file; (b) `src/lib/foodSearch.ts` with `loadFoods()`, `searchFoods(list, query)` and `portionValues(food, grams)`; (c) the search box and portion picker in `FoodSheet.tsx`.
- **Tests added:** one `portionValues` test (the muffin example, plus 0 g rejected); one table-driven `searchFoods` test (all words, ranking, case/commas, empty query, max 20). The script itself validates its output (name present, numbers ≥ 0, portion grams > 0) and fails if not, so there is no separate test of the file.
- **Acceptance added:** searching "chocolate chip muffin" offline finds it; choosing "1 medium" fills the values above; no network request goes anywhere but the app's own site.
- **Still out of scope:** branded and packaged foods (Open Food Facts, 05b), barcode scanning.

## Added by owner: targets follow the latest weigh-in (2026-11-25)
- Calories (via resting energy) and water use the **most recent weigh-in**; with no weigh-ins, the starting weight. Protein still uses the goal weight. Overrides still win.
- `calculatedTargets(profile, latestKg?)` / `effectiveTargets(profile, latestKg?)` take the latest weight; Home, Food and Profile pass it. Profile's targets card says which weight was used ("Based on your latest weigh-in, 212.4 lb").
- Tests: latest weight changes calories and water but not protein; no weigh-in falls back to starting weight.

- Token Steward: before start (USDA section: merged tests, file check moved into the script; not applied: dropping the network allowance — it was already approved and used once to fetch the file; it only matters for future refreshes. Earlier, applied: dropped `foodId`, 4 screenshots, merged day tests, removed duplicate rules, custom water deferred; upgrade/reset checks moved to the browser pass since fake-indexeddb isn't installed. Not applied: the "move Milestone 7 up" note stays — food data grows with no backup, and the owner should know)
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
**What you will get**
- Log food and water each day, and see today's totals against your targets on Home and on a new Food screen.
- My Foods: save the meals you eat often and log them again with one tap.
- A plain factual note about protein, such as "Protein below target on 4 of the last 7 days." It gives no advice.

**Not included yet:** searching an online food database. That is the separate step 05b.

**Cost:** nothing.

**What could go wrong**
- There is no backup yet, so your food log lives only on this phone. If the phone is lost or its browser data is cleared, the log is gone. Backup is planned for a later step; you may want it sooner.
- The protein note is based on only a few days at first, so it can mislead until more days are logged.

**You need to decide**
- Approve the proposed defaults (reply "defaults OK"). Covers: Food opens from the Home tile with no new tab; meals are breakfast, lunch, dinner, snacks, or none (default none); servings in steps from 0.1 to 20; water quick-adds of 8 fl oz / 250 ml and 16 fl oz / 500 ml; protein note needs at least 3 logged days in the last 7; fiber is an optional field; deleting a My Food asks you to confirm.
- Optional extras (reply "add" for either): a protein-first display, and a "barely ate today" marker.

## Approval
- [x] Approved by owner — date: 2026-11-25 (defaults OK; both extras added; mockup before build and screenshots after)
