# Ideas notepad

Every idea the **Ideas agent** has suggested, and what became of it.
The Ideas agent adds new ideas here on every pass (status **Suggested**); when a change is built or a choice is made, the status is updated.

**Status key:** 💡 Suggested (open) · ✅ Done · ⏭️ Skipped (with reason)

_Last updated: 2026-11-26 (08a closing pass) · Totals: 💡 42 · ✅ 38 · ⏭️ 26_

---

## 💡 Suggested — still open

| # | Idea | From | Notes |
|---|------|------|-------|
| I-01 | Tap a day-square to see that day's entries ("Nausea, Mon 23: 4 of 5"), by tap or long-press | 04c after-build, 04d opening + after-build | Suggested three times. Also helps screen readers. |
| I-02 | Shade the shot days on the drill-down "Each injection week" chart | 04c after-build | |
| I-03 | Make the "hidden symptoms" note easier to notice | 04c after-build | It explains why a symptom has no row. |
| I-04 | Tap a colour in the legend to highlight all squares of that severity | 04d opening + after-build | |
| I-05 | Option in Profile to turn the numbers in the squares on or off | 04d opening + after-build | For people who prefer the pure colour view. |
| I-06 | Reword "not logged in over 3 days" so it reads naturally under a 7-day map (the 3-day rule itself stays — owner's rule) | 04d opening + after-build | Wording only. |
| I-07 | Label the drill-down day chart "Avg severity" | 04d after-build | |
| I-08 | Symptom summary to take to appointments (your own data, no advice) | 04d after-build | Bigger idea; overlaps the planned PDF export (PLAN v2). |
| I-09 | Use one shared trend wording on the map and the drill-down (map says "Same" while drill-down says "milder lately") | 04d after-build | 04d added a caption; the words can still disagree. |
| I-10 | Trim the dense footnote under the map | 04d after-build | |
| I-11 | Large alert card pushes the map down — consider a slimmer card on the Symptoms screen | 04d after-build | Home already uses a pop-up. |
| I-12 | Steps 3 and 4 are close in colour (numbers carry the difference) | 04d after-build | Colour alone doesn't separate them; see I-13. |
| I-13 | Distinct mark for 5 only (corner dot), if numbers ever feel busy | 04d opening (approach 2) | Held in reserve. |
| I-14 | Show item counts in the reset sheet ("14 injections, 22 weights, 6 photos") | 04e opening | Deferred until Milestone 7 export. |
| I-15 | "Save a copy first" link inside the reset card | 04e opening | Deferred until Milestone 7 export. |
| I-16 | Short "All data erased" note after the reload | 04e after-build | Owner lands on the disclaimer with no sign the wipe worked. |
| I-18 | Check other open tabs / installed app after a reset (stale data until refresh) | 04e after-build | Possibly a refresh prompt. |
| I-20 | Move backup/export (Milestone 7) earlier | 05 opening, 05 after-build, 08a after-build | Food log grows daily with no copy anywhere. |
| I-21 | Custom water amount | 05 after-build | Quick-adds are only 8 oz / 250 ml and 16 oz / 500 ml; custom was deferred. |
| I-22 | 7-day protein strip on the Food screen | 05 after-build | Small bars per day vs target, so the protein note can be seen. |
| I-23 | Recent foods list (one tap to log again) | 05 after-build, 05b opening | For foods not saved to My Foods. 05b also suggested "recent online picks" for offline use; same list would cover both. |
| I-25 | Warn when an online product's calories don't match its protein/carbs/fat | 05b after-build | Volunteer entries can be wrong (one shake was about 3x off). Simple arithmetic check, no medical wording. |
| I-27 | Add common café and restaurant items to the built-in list | 05b after-build | Online search mostly misses Starbucks-type items. Needs a sourced data list. |
| I-28 | Keep the barcode on a saved food (and on "not found" hand entry) so the next scan finds it offline | 05c opening, 05c after-build | Needs a new stored field. Deliberately left out of 05c. |
| I-29 | Upgrade the dev-only tools flagged by npm audit (Vitest major upgrade, vite-plugin-pwa / Workbox) | 05c after-build | Build tools only, not shipped to the phone. Do as its own small change with the full test run. |
| I-30 | Re-try the torch toggle, and "scan another" without closing the scanner | 05c after-build | Torch was left out (iPhone support unreliable). Needs a real-phone check first. |
| I-31 | Optional "Switched medicine" note on the timeline when the Medicine setting changes (no advice attached) | 07 opening | Not built. The chart mark already names a switch. |
| I-32 | First-run "Which medicine?" question so new users never see the wrong dose chips | 07 opening | Not built; Medicine defaults to Wegovy and is set in Profile. |
| I-33 | Different chart marker colour or shape for a medicine switch | 07 opening | The plan used a plain label with no colour change. |
| I-34 | Weight chart: stop a switch label being hidden when it is close to an earlier mark | 07 after-build | Existing overlap rule hides it; the dotted line still shows. |
| I-35 | Symptom page weekly injection chart should mark a medicine switch | 07 after-build | It marks dose changes only and has no medicine data. |
| I-36 | Help box could follow a one-off per-entry medicine, not just the Profile medicine | 07 after-build | Optional; only matters if someone mixes medicines. |
| I-37 | Exportable PDF summary for medical professionals (weight, doses, symptoms, measurements, food) | Owner, 2026-11-26 | Your idea. Matches PLAN v2 "PDF summary for doctor visits" and covers I-08. Made on the phone, your own data only, no advice. 08a built (appointments + menu); 08b report next. |
| I-38 | Insights section or tab that outlines your GLP-1 journey | Owner, 2026-11-26 | Your idea. Facts from your own logs (e.g. weeks on each dose, weight change, symptom trends); wording must stay factual, no advice. |
| I-39 | AI assistant that searches the web for GLP-1 questions | Owner, 2026-11-26 | Your idea. Needs care: an AI service and web search cost money and need a key (breaks the $0 rule unless free options exist); questions would leave the phone; answers would need sources and could read as medical advice. Worth its own Ideas pass. |
| I-40 | Connection to Apple Health (e.g. weight, steps, workouts in; weigh-ins and food out) | Owner, 2026-11-26 | Your idea. A web app can't reach Apple Health — it needs the App Store version (PLAN v3, Capacitor). Data would stay on the phone; Apple's own permission screen controls each item. |
| I-41 | Connection to Apple Fitness (workouts, activity rings) | Owner, 2026-11-26 | Your idea. Apple Fitness has no separate connection for apps; its workouts and activity reach apps through Apple Health, so this comes with I-40 and the App Store version. |
| I-42 | Medication curve (estimated medicine level over the week, from your logged doses) plus a plain "how GLP-1 works" explainer, including the ups and downs | Owner, 2026-11-26 | Your idea. The labels give the facts to draw it: peak "1 to 3 days post dose", half-life "approximately 1 week", steady state "4 to 5 weeks", "present in the circulation for about 5 weeks after the last dose" (Ozempic label, DailyMed). Must be shown as an estimate for understanding, never dose advice; explainer wording from cited sources, owner-approved. Pairs well with I-38 (Insights) and the symptom-by-day chart. |
| I-43 | Home reminder card the day before the next appointment, with a "Make report for this visit" button | 08 opening, 08a after-build | Needs 08b (the report). Facts only, no advice. |
| I-44 | Carry open questions into the report and tick them off after the visit | 08a after-build | "Questions open" marker already built in 08a; printed as your own words. |
| I-45 | Back-to-Home link on Settings | 08a after-build | Settings has no back button today; the new menu makes this more noticeable. |
| I-46 | Several photos per weigh-in (e.g. front, side, back) | Owner, 2026-11-26 | Your idea. Today each weigh-in holds one photo (Milestone 2b). Needs the photos table to allow more than one per weigh-in, a small gallery in the viewer, and more phone storage — photos are the biggest data; the planned backup (Milestone 7) must include them. Could pair with the report's optional photos section. |

## ✅ Done

| # | Idea | From | Done in |
|---|------|------|---------|
| D-01 | Show only one "When to get help" at a time | 04c after-build | 04d — alert card's button when a card shows, red row otherwise |
| D-02 | Replace "New" with clearer wording: "First logged this week" / "No earlier entries" | 04c after-build, 04d opening | 04d |
| D-03 | Label drill-down weeks with dates and put the word next to the trend arrow | 04c after-build | 04d |
| D-04 | Caption explaining the drill-down trend covers the last 2 injection weeks | 04c after-build, 04d opening | 04d |
| D-05 | Make 4/5 and 5/5 look different: a number in every square | 04d opening (approach 1, recommended) | 04d |
| D-06 | Stronger colour gap at the top of the scale | 04d opening (approach 3) | 04d — step 5 darkened to #5a2318 (step 4 kept; lightening it collided with step 3) |
| D-07 | Remove the 3-day timing phrases and tests along with the 3-day view | 04d opening (watch-out) | 04d |
| D-08 | Keep the "3 days in a row" alert rule separate from the map view | 04d opening (watch-out) | 04d — unchanged |
| D-09 | Grid shifts when switching 3 ↔ 7 days | 04c after-build | 04d — no longer applies (3-day view removed) |
| D-10 | Type-to-confirm full wipe (type RESET), one transaction, then reload | 04e opening (approach 2, recommended) | 04e — Settings "Reset all data" card |
| D-11 | Disclaimer shows again after a reset | 04e opening | 04e — comes with the wipe |
| D-12 | Say plainly that photos are deleted too, and that there is no backup | 04e opening | 04e — confirm sheet lists what is erased |
| D-13 | Auto-capitalise (autocorrect off) in the RESET box on phones | 04e after-build | Already built in 04e — the box capitalises and has autocorrect off. |
| D-14 | Protein-first view | 05 opening | 05 — became two rings: a macro ring (protein outside, grams in the centre) beside a calorie ring |
| D-15 | "Barely ate today" quick log | 05 opening | 05 — Food screen button, "Marked: barely ate" chip with Undo; counts as a logged day |
| D-16 | Water quick-add buttons in your units | 05 opening | 05 — 8 fl oz / 250 ml and 16 fl oz / 500 ml |
| D-17 | Split into 05 (offline core) and 05b (Open Food Facts) | 05 opening (approach 2, recommended) | 05 — built offline; 05b still to come |
| D-18 | Small-portion quick adds | 05 opening | 05 — servings quick-picks of ½ / 1 / 1½ |
| D-19 | Open Food Facts search for packaged and branded foods (was I-19) | 05 opening, 05 after-build | 05b — commit 99619ac |
| D-20 | One search box, two sources; online only when "Search online" is tapped (approach 1, recommended) | 05b opening | 05b — built-in list still shows first; 3-second wait between searches |
| D-21 | Privacy notice on first use, Cancel sends nothing | 05b opening (watch-out) | 05b |
| D-22 | Online picks saved to My Foods so repeats need no network | 05b opening | 05b — "Save to My Foods" ticked by default for online picks |
| D-23 | Source credit line (Open Food Facts attribution) | 05b opening | 05b — credit shown under results |
| D-25 | Keep drinks in ml (no ml-to-g guess) | 05b after-build (was I-26) | Already built in 05b — drinks use Open Food Facts' per-100 ml values (owner: "only if there is no other way"). |
| D-24 | Incomplete products never shown as 0 | 05b opening (watch-out) | 05b — products without nutrition are hidden, with a line saying how many; "check against the label" warning added |
| D-26 | Barcode scan for one packaged product (was I-24) | 05b opening (approach 4) | 05c — commit 8cd52d6 |
| D-27 | Full-screen continuous scanner, loaded only when opened (approach 1, recommended) | 05c opening | 05c — zxing chunk about 126 KB, not precached |
| D-28 | Type-the-number fallback, equally prominent (approach 4) | 05c opening | 05c |
| D-29 | Separate first-scan privacy notice (camera stays on the phone, only the number is sent) | 05c opening (watch-out) | 05c — own acknowledgement; 05b notice unchanged |
| D-30 | Remember scanned products in My Foods | 05c opening | 05c — "Save to My Foods" pre-ticked |
| D-31 | Catch bad barcodes before any network call; only the number leaves the phone | 05c opening (watch-out) | 05c — digits only, 8/12/13 length, check digit; OFF text cleaned |
| D-32 | "Not found" shortcut to enter the food by hand | 05c opening | 05c — built without keeping the barcode (see I-28) |
| D-33 | Medicine stored per injection, defaulting to the Profile medicine, with a drug catalog file (approach 2 on 4, recommended) | 07 opening | 07 — commit e4afdc2; `drugs.ts`, Dexie v7, old rows read as Wegovy |
| D-34 | Per-medicine help list, footer and tips (no more Wegovy-only text) | 07 opening (watch-out) | 07 — Ozempic wording from the label; stomach-pain alert uses the profile medicine |
| D-35 | Two steps: 08a Appointments + menu first, 08b report next (approach 1, recommended) | 08 opening | 08a — Dexie v8 `appointments`, report page is a "Coming next" placeholder |
| D-36 | Appointments list and form (date, who/what for, notes, questions; "Questions open" marker; confirm before delete) | 08 opening | 08a |
| D-37 | Home gear becomes a menu: Doctor report, Appointments, Settings | 08 opening | 08a — plain disclosure, 48 px items, Escape / tap outside closes |
| D-38 | Optional name in Profile, kept on the phone and cleared by reset (appointments cleared too) | 08 opening (watch-out) | 08a |

## ⏭️ Skipped

| # | Idea | From | Why skipped |
|---|------|------|-------------|
| S-01 | Pattern / stripes on 5/5 squares | 04d opening (approach 4) | Busy at small sizes; clashes with the calm Warm Sand style |
| S-02 | Bigger squares | 04d opening (approach 5) | 7 columns + labels already tight on a phone; doesn't fix colour on its own |
| S-03 | Numbers on 4s and 5s only | 04d opening (alternative) | Owner chose numbers in every square ("defaults OK") |
| S-04 | Lighter step 4 | 04d opening (approach 3) | Too close to step 3 and the white number fell below readability; step 5 darkened instead |
| S-05 | "Not logged before" / "Too early to compare" wording | 04d opening (alternative) | Owner chose the default wording |
| S-06 | Change the hide window from 3 to 7 days | 04d opening (watch-out) | Owner's rule: hide symptoms not logged in over 3 days |
| S-07 | Keep the red help row always and remove the alert card's button | 04d plan (alternative) | Owner chose the default; keeps the approved 04b card |
| S-08 | Tips card hidden behind the tab bar | 04c after-build | Not a real issue — full-page screenshot artifact |
| S-09 | 3-day map view | 04c (owner-approved design) | Owner removed it in 04d: 7 days only |
| S-10 | Simple Yes/Cancel confirm dialog | 04e opening (approach 1) | Too easy to tap through; wipe is permanent with no backup |
| S-11 | Choose what to reset (checkboxes) | 04e opening (approach 3) | Owner asked for "all"; more screens |
| S-12 | Block reset until "Download a copy first" | 04e opening (approach 4) | Would hold the request until Milestone 7; kept as I-15 instead |
| S-13 | One big milestone including Open Food Facts | 05 opening (approach 1) | Owner approved the split; OFF stays separate as 05b (I-19) |
| S-14 | Water and Home tile first, food later | 05 opening (approach 3) | Delays the main value (food and protein) |
| S-15 | Food only, no water or protein note | 05 opening (approach 4) | Would leave the Home tile half-done; all parts were built |
| S-16 | Built-in / Online source toggle | 05b opening (approach 2) | Technical: easy to leave on Online; one box with a button is simpler and safer |
| S-17 | Auto-search online as you type | 05b opening (approach 3) | Technical/privacy: would send partial words and hit rate limits |
| S-18 | Per-result grey "no protein listed" hint | 05b opening | Technical: products without nutrition are hidden instead, with a count (D-24) |
| S-19 | Tap-to-capture still-photo scanner | 05c opening (approach 2) | Technical: continuous scan plus typed number already covers it |
| S-20 | Small inline scanner inside the food sheet | 05c opening (approach 3) | Technical: cramped, keyboard clashes with the camera |
| S-21 | Torch toggle | 05c opening | Owner default "left out" — iPhone Safari support unreliable (see I-30) |
| S-22 | Scan history (last 5) | 05c opening | Owner default: out of scope; My Foods already keeps scanned items |
| S-23 | Extend the 05b privacy notice instead of a new one | 05c opening (watch-out) | Technical: that notice says "words you typed", wrong for a number and a camera; a separate notice is clearer |
| S-24 | Brand name with a small "semaglutide" subtitle | 07 opening | Owner default: no subtitle (could be added on request) |
| S-25 | One medicine per profile, no per-entry drug (approach 1) | 07 opening | Technical: switching would relabel old entries and blur history |
| S-26 | Generic "semaglutide" mode with free-typed doses (approach 3) | 07 opening | Technical: loses preset chips and drug-specific help; weak for sourced medical wording |

---

_Detailed write-ups: [`04c-symptom-map.md`](04c-symptom-map.md), [`04d-symptom-map-polish.md`](04d-symptom-map-polish.md), [`04e-reset-data.md`](04e-reset-data.md), [`05-nutrition.md`](05-nutrition.md), [`05b-open-food-facts.md`](05b-open-food-facts.md), [`05c-barcode.md`](05c-barcode.md), [`07-ozempic.md`](07-ozempic.md)._
