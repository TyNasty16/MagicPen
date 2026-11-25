# Workflow 05b — Open Food Facts search (branded and packaged foods)
Status: Built — 2026-11-25
Milestone: 5 — Nutrition (PLAN.md §2 item 5; §5 order), part b. Follows workflow 05 (built).

## Ideas considered
Ideas file: `docs/ideas/05b-open-food-facts.md`. Chosen approach: option 1, one search box, built-in USDA results first, and a "Search online" button. Nothing is sent until the owner taps it. Reused: the USDA search box and portion/grams picker in `FoodSheet.tsx`, and `portionValues` in `foodSearch.ts`. CLAUDE.md already allows Open Food Facts as the single third-party call; this adds no new one.

## Goal
Let the owner find packaged and branded foods online and log them in the same food sheet, without weakening the privacy rules: the search term leaves the phone only after an explicit tap.

## In scope
- A "Search online for packaged foods" button under the USDA results (shown once something is typed).
- First-use privacy notice; the tap on its Search button is the consent, remembered on the device.
- Request to Open Food Facts (OFF) Search-a-licious; results list with brand; portion and grams picker with editable fields.
- Data-quality warning, attribution, and offline / busy / error messages.
- Online picks stored like any manual entry; "Save to My Foods" pre-ticked for them.
- Pure parsing module `src/lib/offSearch.ts` with tests on saved JSON fixtures.
- Confirming the service worker never caches OFF.

## Out of scope
- Barcode scanning (possible 05c).
- Searching as you type, or any automatic online search.
- Recent online picks list, per-100 g storage, OFF images, Nutri-Score, other languages.
- Correcting wrong volunteer data automatically (the owner edits the fields).
- Any advice or dose-related text.

## Steps
1. `src/lib/offSearch.ts` (new), pure and no `fetch`:
   - `buildOffUrl(term, pageSize = 20)`: `https://search.openfoodfacts.org/search` with `q`, `page_size`, `langs=en`, `fields=code,product_name,brands,nutriments,serving_size,serving_quantity`.
   - `parseOffResults(json)` returns `{ shown, hidden }`. Shown means a name plus kcal and protein per 100 g, as numbers. Each shown item carries brand, per-100 g values (fiber may be missing), and portions.
   - Portions: if `serving_quantity` > 0 and `serving_size` is in g (or ml, see below), add `"<serving_size text>"` with that quantity; always add "100 g".
2. `src/lib/offClient.ts` (new, small): `searchOnline(term)` does the single `fetch`: GET, `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, no custom headers, `AbortController` timeout of 8 s. It maps failures to messages: offline, timeout, 429, 503/other. A cooldown of 3 s between searches is enforced by the sheet.
3. `src/lib/foodSearch.ts`: let `portionValues` leave fiber blank when OFF has none (so "not listed" is never saved as 0). USDA behaviour unchanged.
4. `src/components/FoodSheet.tsx`: in `UsdaSearch`, add the online button, privacy notice dialog, results list (name, brand, kcal/100 g), "N hidden: nutrition not listed" line, warning and attribution. Reuse the existing portion/grams picker. On an online pick, tick "Save to My Foods".
5. `vite.config.ts`: add a comment and keep the Workbox config precache-only (no `runtimeCaching`); check the built `sw.js` never mentions `openfoodfacts`.
6. `src/lib/offSearch.test.ts` and one fixture file `src/lib/__fixtures__/off-sample.json` holding every case (new): tests below.
7. Run the new tests during build; full suite and build once at the end; one browser pass.

## Exact text (for approval)
- **Privacy notice (first online search):** "Search online? The words you typed will be sent to Open Food Facts, a free food database. Like any website, it can see your internet address. Nothing else from this app is sent." Buttons: "Search" and "Cancel". Cancel sends nothing and asks again next time.
- **Data-quality warning (above values after a pick):** "Entered by volunteers. Check against the label."
- **Attribution (below online results):** "Food data: Open Food Facts (ODbL)."
- **Hidden line:** "3 products hidden: nutrition not listed."
- **Messages:** offline "You're offline. Online search needs a connection; the built-in list still works." / timeout "The search took too long. Try again." / 429 "Open Food Facts is busy. Wait a minute and try again." / 503 "Open Food Facts is unavailable right now. Try again later." / empty "No online match. Try fewer words, or type the values below."
- **USDA footer** is unchanged ("Searches stay on this phone") until the online button is used; after that it reads "Built-in list searches stay on this phone."

## Acceptance criteria
- Typing never contacts OFF. With a term typed, the first tap on "Search online" shows the notice; Cancel sends no request.
- After "Search", the request goes only to `search.openfoodfacts.org`, with only `q`, `page_size`, `langs`, `fields`, no cookies and no referrer. The acknowledgement is remembered; later searches skip the notice. If localStorage is blocked, the search still works and the notice shows each time.
- A second tap within 3 s is ignored (button shows "Wait…").
- Results list shows product name, brand and kcal per 100 g; products missing kcal or protein are not listed and are counted in the hidden line.
- A product with `serving_size` "1 muffin (99 g)" and `serving_quantity` 99 offers that portion plus "100 g"; choosing the portion fills kcal, protein, carbs, fat scaled to 99 g; every field and the grams box stay editable.
- Offline, 429, 503 and timeout each show their message; the USDA list and manual entry still work.
- An online pick shows the warning and attribution, ticks "Save to My Foods", and saves per-serving values like a manual entry; re-logging from My Foods needs no network.
- The built service worker has no OFF caching; existing tests and the build pass.

## Tests
Automatic (Vitest, `offSearch.test.ts`, fixture JSON only, never the live API):
- `buildOffUrl`: exact host, params and encoding of the term; nothing else in the URL.
- `parseOffResults`: complete product shown; missing kcal, missing protein, missing name hidden; 0 kcal is kept; fiber missing stays missing; brand taken from the first of `brands`.
- Portions: g serving with matching quantity; ml serving scaled per 100 ml and labelled ml (fields: `serving_quantity_unit`); no `serving_quantity`; serving text with no unit; falls back to "100 g".

One browser pass at 390px with Playwright route interception serving the fixture (no live call), asserting in the script: the request carries only the expected parameters and no cookies, the cooldown, and the offline message. Three screenshots: (1) online button and privacy notice, (2) results with a picked product, warning and attribution, (3) one error state. The `sw.js` check runs on that same final build. One live search is made once, by the builder, to confirm the endpoint still answers (no owner decision needed).

## Risks & open questions
- Proposed defaults, owner can reply "defaults OK":
  - Products missing kcal or protein: hidden, with a count line (alternative: shown greyed "nutrition not listed").
  - Online picks: "Save to My Foods" pre-ticked (untick to skip).
  - Cooldown 3 s; timeout 8 s; 20 results; English only.
  - **ml servings (owner, 2026-11-25: "only if there is no other way"):** no conversion. OFF stores drinks per 100 ml in its `_100g` fields and gives `serving_quantity_unit` ("ml" or "g"), so a "340 ml" serving scales the per-100 values by 3.4 and is labelled in ml; the amount box says "ml" for drinks. Verified live: fairlife 8.82 g protein per 100 ml × 3.4 = 30 g, matching the label. The ≈ g approximation is not used.
  - Brand shown on its own line under the name; saved name is "Name (Brand)".
- Approve the exact text above (notice, warning, attribution, messages), or send edits.
- Honest limits: OFF necessarily sees the phone's internet address and the site name (Origin); browsers cannot set the User-Agent, so the "generic app identifier" is only the site name. The notice says so.
- Volunteer data can be wrong (one tested shake listed per-serving values as per-100 g, about 3x off). The warning and editable fields are the only guard; no automatic plausibility filter is proposed.
- Restaurant and coffee-shop items are mostly absent from OFF (tested); the USDA list remains the better source for those.
- The legacy OFF search returned 503 in testing, so only Search-a-licious is used; if it changes or goes down, search shows the 503 message and nothing else breaks.

## Build notes (2026-11-25)
- Built as planned. `fields` also asks for `serving_quantity_unit` (needed for the ml rule).
- Found in the browser pass and fixed: the built-in search missed plurals ("muffins" found nothing); typed plurals now match the singular ("muffins", "strawberries", "potatoes").
- Code review fixes: a late online reply is ignored once the words change; "Save to My Foods" follows the latest pick (ticked for online, cleared for built-in); portion labels only count as stating the amount when the whole number and unit match ("1 bar (140 g)" is not 40 g); the notice moves focus to Search and Cancel returns it; errors are announced once; the cooldown timer is cleared when the sheet closes.
- Not changed: the product's saved name "Name (Brand)" is built when picked rather than in the parser (no effect on behaviour).
- One live search during the build: 200 in 0.6 s.

- Token Steward: before start (applied: one fixture file, guard folded into the reviewer's check, 3 screenshots with in-script assertions, smoke-check question settled. Not applied: dropping ml servings — protein shakes are listed in ml and are a likely use on Wegovy, so "≈ g" stays as the default)
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
**What it adds.** A "Search online" button for packaged and branded foods. It appears once you type something. Nothing is sent until you tap it. The built-in list still shows first.

**What gets sent.** Only the words you typed, plus your phone's internet address, go to Open Food Facts, a free food database. Like any website, it can see that address. No health data is sent. The first time, a notice asks you to tap Search. Cancel sends nothing.

**What we learned from testing.**
- Restaurant and coffee-shop items, such as Starbucks, are mostly missing. Use the built-in list for those.
- About 4 in 10 results have no nutrition information. They are hidden, and a line says how many.
- Some entries are typed in by volunteers and are wrong. One tested shake was about three times off. Check against the label.

**Cost.** Nothing.

**What could go wrong.** Wrong numbers from volunteers. The service can be slow, busy, offline or down. You will see a plain message, and the built-in list still works.

**You need to decide**
- Approve the defaults: hide products without nutrition; tick "Save to My Foods" for online picks; wait 3 seconds between searches; treat milliliters as grams for drinks (close for most, a little low for milk-based ones).
- Approve the exact text: the privacy notice, the "check against the label" warning, the source credit, and the error messages.

## Approval
- [x] Approved by owner — date: 2026-11-25 (defaults 1, 2, 3, 5; 4 changed to the ml rule; exact text approved)
