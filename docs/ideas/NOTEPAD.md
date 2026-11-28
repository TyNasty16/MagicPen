# Ideas notepad

Every idea the **Ideas agent** has suggested, and what became of it.
The Ideas agent adds new ideas here on every pass (status **Suggested**); when a change is built or a choice is made, the status is updated.

**Status key:** 💡 Suggested (open) · ✅ Done · ⏭️ Skipped (with reason)

_Last updated: 2026-11-28 (17 opening, I-95 to I-96) · Totals: 💡 84 · ✅ 60 · ⏭️ 36_

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
| I-09 | Use one shared trend wording on the map and the drill-down (map says "Same" while drill-down says "milder lately") | 04d after-build | 04d added a caption; the words can still disagree. |
| I-10 | Trim the dense footnote under the map | 04d after-build | |
| I-11 | Large alert card pushes the map down — consider a slimmer card on the Symptoms screen | 04d after-build | Home already uses a pop-up. |
| I-12 | Steps 3 and 4 are close in colour (numbers carry the difference) | 04d after-build | Colour alone doesn't separate them; see I-13. |
| I-13 | Distinct mark for 5 only (corner dot), if numbers ever feel busy | 04d opening (approach 2) | Held in reserve. |
| I-14 | Show item counts in the reset sheet ("14 injections, 22 weights, 6 photos") | 04e opening | Deferred until Milestone 7 export. |
| I-15 | "Save a copy first" link inside the reset card | 04e opening | Deferred until Milestone 7 export. |
| I-16 | Short "All data erased" note after the reload | 04e after-build | Owner lands on the disclaimer with no sign the wipe worked. |
| I-18 | Check other open tabs / installed app after a reset (stale data until refresh) | 04e after-build | Possibly a refresh prompt. |
| I-21 | Custom water amount | 05 after-build | Quick-adds are only 8 oz / 250 ml and 16 oz / 500 ml; custom was deferred. |
| I-22 | 7-day protein strip on the Food screen | 05 after-build | Small bars per day vs target, so the protein note can be seen. |
| I-23 | Recent foods list (one tap to log again) | 05 after-build, 05b opening | For foods not saved to My Foods. 05b also suggested "recent online picks" for offline use; same list would cover both. |
| I-25 | Warn when an online product's calories don't match its protein/carbs/fat | 05b after-build | Volunteer entries can be wrong (one shake was about 3x off). Simple arithmetic check, no medical wording. |
| I-27 | Add common café and restaurant items to the built-in list | 05b after-build | Online search mostly misses Starbucks-type items. Needs a sourced data list. |
| I-28 | Keep the barcode on a saved food (and on "not found" hand entry) so the next scan finds it offline | 05c opening, 05c after-build | Needs a new stored field. Deliberately left out of 05c. |
| I-29 | Upgrade the dev-only tools flagged by npm audit (Vitest major upgrade, vite-plugin-pwa / Workbox) | 05c after-build, 11 after-build | Vitest done in 11 (2 critical findings gone). Left: 4 moderate build-time findings in workbox-build; wait for a vite-plugin-pwa fix instead of downgrading. |
| I-30 | Re-try the torch toggle, and "scan another" without closing the scanner | 05c after-build | Torch was left out (iPhone support unreliable). Needs a real-phone check first. |
| I-31 | Optional "Switched medicine" note on the timeline when the Medicine setting changes (no advice attached) | 07 opening | Not built. The chart mark already names a switch. |
| I-32 | First-run "Which medicine?" question so new users never see the wrong dose chips | 07 opening | Not built; Medicine defaults to Wegovy and is set in Profile. |
| I-33 | Different chart marker colour or shape for a medicine switch | 07 opening | The plan used a plain label with no colour change. |
| I-34 | Weight chart: stop a switch label being hidden when it is close to an earlier mark | 07 after-build | Existing overlap rule hides it; the dotted line still shows. |
| I-35 | Symptom page weekly injection chart should mark a medicine switch | 07 after-build | It marks dose changes only and has no medicine data. |
| I-36 | Help box could follow a one-off per-entry medicine, not just the Profile medicine | 07 after-build | Optional; only matters if someone mixes medicines. |
| I-38 | Insights section or tab that outlines your GLP-1 journey | Owner, 2026-11-26 | Your idea. Facts from your own logs (e.g. weeks on each dose, weight change, symptom trends); wording must stay factual, no advice. |
| I-39 | AI assistant that searches the web for GLP-1 questions | Owner, 2026-11-26 | Your idea. Needs care: an AI service and web search cost money and need a key (breaks the $0 rule unless free options exist); questions would leave the phone; answers would need sources and could read as medical advice. Worth its own Ideas pass. |
| I-40 | Connection to Apple Health (e.g. weight, steps, workouts in; weigh-ins and food out) | Owner, 2026-11-26 | Your idea. A web app can't reach Apple Health — it needs the App Store version (PLAN v3, Capacitor). Data would stay on the phone; Apple's own permission screen controls each item. |
| I-41 | Connection to Apple Fitness (workouts, activity rings) | Owner, 2026-11-26 | Your idea. Apple Fitness has no separate connection for apps; its workouts and activity reach apps through Apple Health, so this comes with I-40 and the App Store version. |
| I-42 | Medication curve (estimated medicine level over the week, from your logged doses) plus a plain "how GLP-1 works" explainer, including the ups and downs | Owner, 2026-11-26 | Your idea. The labels give the facts to draw it: peak "1 to 3 days post dose", half-life "approximately 1 week", steady state "4 to 5 weeks", "present in the circulation for about 5 weeks after the last dose" (Ozempic label, DailyMed). Must be shown as an estimate for understanding, never dose advice; explainer wording from cited sources, owner-approved. Pairs well with I-38 (Insights) and the symptom-by-day chart. |
| I-43 | Home reminder card the day before the next appointment, with a "Make report for this visit" button | 08 opening, 08a after-build | Unblocked: 08b (the report) is built. Facts only, no advice. |
| I-44 | Carry open questions into the report and tick them off after the visit | 08a after-build, 09 opening | "Questions open" marker built in 08a; 08b prints open questions as your own words; 09 lets you type them on the report. Still open: ticking them off after the visit. |
| I-45 | Back-to-Home link on Settings | 08a after-build | Settings has no back button today; the new menu makes this more noticeable. |
| I-46 | Several photos per weigh-in (e.g. front, side, back) | Owner, 2026-11-26 | Your idea. Today each weigh-in holds one photo (Milestone 2b). Needs the photos table to allow more than one per weigh-in, a small gallery in the viewer, and more phone storage — photos are the biggest data; the planned backup (Milestone 7) must include them. Could pair with the report's optional photos section. |
| I-47 | Warn in the report preview when a name or note has characters that print as "?" | 08b after-build | Our own PDF writer covers basic Latin plus common accented letters only. Name the affected field before sharing. |
| I-48 | "What changed since last visit" one-line summary at the top of the report | 08 opening, 08b after-build | Facts only (weight change, doses logged); no interpretation. |
| I-49 | Remember the section switches and period choice between reports | 08 opening, 08b after-build | Switches reset when the period changes today. Stored on the phone. |
| I-50 | Compact one-page report option for quick visits | 08 opening, 08b after-build | Header, questions, doses, weight, side effects only. |
| I-51 | "Clear questions" after the visit, so old ones don't print again | 09 opening, 09 after-build | Not built. Pairs with tick-off (I-44). |
| I-52 | Quiet "Questions waiting" line in Appointments when a phone-only draft exists | 09 after-build | The draft is invisible until an appointment is added. |
| I-53 | "Add the visit" link on the report screen when there is no appointment | 09 after-build | Closes the loop for the draft without leaving the report. |
| I-54 | "Backup is behind" quiet nudge after several days with no backup | 10 after-build | Backup only runs when the app is opened, so a long gap is silent today. Calm amber line (Backup screen, maybe a small Home line); never an alarm. |
| I-55 | Tidy photos left on the phone after a restore | 10 after-build | Photos for weigh-ins a restore removed stay stored but hidden (known limit in 10a). Show a count and "Remove unused photos" with a confirm. |
| I-60 | Plain-words "Security and privacy" section in Settings | 11 opening | What stays on the phone, what goes to Dropbox, what Open Food Facts sees. Also prepares the Phase 2 privacy policy. |
| I-61 | Test that fails if the CSP loses a needed host or gains unsafe-eval | 11 opening | Guards the policy against accidental edits. |
| I-62 | SECURITY.md so finders know whom to tell | 11 opening | Small file, no code. |
| I-71 | Weekly "This week" line (days logged, weigh-in done) | 12 opening | Counts only, no streak. |
| I-72 | "Clear milestones" button for a fresh start | 12 opening | Optional. |
| I-73 | Revisit the milestone pop-up titles (NICE START … HISTORY MADE) | Owner, 2026-11-27 | Your request: the titles were approved for now; come back and change them later. |
| I-74 | "Preview" button in Settings that plays a sample milestone pop-up | 12 after-build | There is nothing to look back on, so this is the only way to see the confetti and title again, or to check Reduce Motion. Sample text only, records nothing. |
| I-75 | Stop the on-schedule streak re-showing a step after the injection weekday is changed | 12 after-build | Known rare limit from 12. Fix idea: tie the run to the first injection date only, ignoring the weekday. |
| I-76 | Let a tap pass through to the screen underneath while the pop-up is open | 12 after-build | Owner chose "tap anywhere closes it", so the first tap is used up closing it. A pass-through would close it and still press the button. Owner decision needed. |
| I-77 | Planned "major upgrade pass" every few months (React 19, Vite 8, TypeScript 7, recharts 3, vitest 5 …), one package family per change, with a note of which majors are held back | 13 opening, 13 after-build | Dependabot will stop proposing majors (change 13), so they need their own planned changes. Relates to I-29. Do soon: the ignore rule hides majors for good. |
| I-78 | Split the Dependabot npm group into dev tools and app packages | 13 after-build | One failing package holds up all small updates today. |
| I-79 | Brand "steady line" as loading and empty-state artwork | 14 opening | Optional; only if the owner picks the steady-line direction. |
| I-80 | "Plain mode" switch: stronger contrast, no decoration | 14 opening | Accessibility option; stored on the phone. |
| I-81 | Before/after screenshot check for every screen after a redesign | 14 opening | Keeps screens consistent. |
| I-82 | Bullet-journal redesign: dot-grid pages, washi-tape section labels, bullet-journal signifiers, sticky notes, handwritten notes (Caveat, self-hosted) | Owner, 2026-11-27 | Your idea, parked: not sure yet. Mockups: `docs/screenshots/14-bujo-screen-*.png` (Home, Doses, Body, Food) and `14-bujo-1-dot-grid.png` (the weight chart you liked). Questions still open: handwriting for numbers?, tape colours, Symptoms and Profile screens. |
| I-83 | Profile switch "Plain line" to turn off the BMI colours on weight charts | 15 opening | Accessibility and comfort option; stored on the phone. |
| I-86 | Add a non-colour mark per BMI category (dot shape or line style) on the weight chart | 15 after-build | Red and green can look alike to some colour-blind readers; words already carry the meaning, this adds a visual cue. |
| I-87 | Show the weight change for the chosen range ("-2.1 lb in 30 days") next to the range toggle | 15 after-build | Home shows change since start only. Facts only, no advice. |
| I-88 | Name the odd weigh-in when a BMI outside 10 to 80 turns the whole chart plain | 15 after-build | Today the chart goes plain with no reason shown. Factual wording ("This weigh-in looks unusual, check it"), no advice. |
| I-89 | Still (no animation) shaker also in the Food screen header | 16 opening | Optional. |
| I-90 | Faint "last 7 days" row of tiny bottles | 16 opening | Optional; facts only. |
| I-91 | Quiet haptic tick on shake where the phone supports it | 16 opening | Optional; needs Reduce Motion respected. |
| I-92 | Move the shaker animation to CSS transforms on one group instead of redrawing the SVG every frame | 16 after-build | Only if it stutters on the real phone; add "shaker smoothness" to the I-59 check list. |
| I-93 | If a pop-up opens mid-sequence, pause the goal sequence; save "seen" only when it finishes, so a closed app still gets to see it | 16 after-build | Both are known rare limits from 16. |
| I-94 | Tint the lid softly after the goal so the empty bottle reads as "done", not "nothing logged" | 16 after-build | Calm colour only, no new text. A "Preview" for the sequence could join I-74. |
| I-95 | Share the "Goal reached ✓" line style between the shaker and the glass so they read as a pair | 17 opening | Optional. |
| I-96 | Tiny ripple only (no full pour) for rapid repeat quick-adds | 17 opening | Optional; keeps rapid taps calm. |
| I-64 | After a password change, offer "Back up now with the new password" | 11 second look | Keeps the newest Dropbox copy on the new password. |
| I-65 | Re-usable security tick-list in the docs, re-checked quarterly | 11 second look | Owner checklist split into "Now" and "When you have time". |
| I-66 | Show "Last backed up" next to the Home Screen notice | 11 second look | Makes the real protection visible. |
| I-57 | Password reminder: "write it down" check and optional hint | 10 after-build | A forgotten password cannot be recovered. A hint stored in the file header would be unencrypted, so the owner must be warned. Could also ask once, a week later, "Do you still have your password?" |
| I-58 | Restore preview that compares the backup with what is on the phone | 10 after-build | e.g. "Backup: 12 injections, 40 weights. On this phone: 14 injections, 43 weights." Facts only. Helps avoid restoring over newer data. |
| I-59 | Real-iPhone check that the Share sheet offers Calendar for the .ics reminder | 10 after-build, 11 after-build, 12 after-build, 15 after-build | Owner check after release. If it does not, fall back to a download link or a "Copy to Files" step. Same check list covers Dropbox sign-in, Back up now and Restore, plus (from 11) barcode scan, photo pick, report share and a Home Screen update, since only mocked runs were done against the new CSP. From 12: confetti runs smoothly, Reduce Motion is respected, nothing repeats after reopening. |
| I-67 | SHA-pin the GitHub Actions | 11 after-build | Left out of Phase 1 on purpose. Dependabot can keep the hashes fresh. |
| I-68 | Check the live site's CSP after deploy (no policy errors in the console) | 11 after-build | The CSP is a meta tag and does not cover sw.js (GitHub Pages cannot send headers). |
| I-69 | Show a plain build version and date in Settings | 11 after-build | Confirms the Home Screen copy has updated. Earlier "commit hash" idea was judged too developer-ish. |

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
| D-39 | Exportable PDF summary for medical professionals (was I-37) | Owner, 2026-11-26 | 08b — Doctor report: preview, PDF, share; own entries only, no advice |
| D-40 | Symptom summary to take to appointments (was I-08) | 04d after-build | 08b — covered by the doctor report |
| D-41 | One pure report builder feeding both preview and PDF, with the exact approved wording | 08 opening (approach 1 reasoning) | 08b — `src/lib/report.ts`, advice-word guard test |
| D-42 | PDF made by our own small writer, no library (hand-written PDF option) | 08 opening (PDF options) | 08b — owner chose A; 4 KB lazy chunk, no network code, audit 0 |
| D-43 | Share through the iPhone Share menu, with a download fallback | 08 opening | 08b — "Share PDF" button if the first tap is not accepted |
| D-44 | Period choice (since last appointment or custom) and section switches with amber "Limited data" tags | 08 opening (watch-out: limited-data rules) | 08b — defaults as in the brief |
| D-45 | Photos, food items and water sections, plus past appointment notes (off by default) | 08b plan ("build them") | 08b |
| D-46 | Privacy note before sharing: the PDF is outside the app once shared | 08 opening (watch-out) | 08b |
| D-47 | Type questions on the report, saved into the latest appointment (approach 1, recommended) | 09 opening | 09 — "Your questions for this visit", auto-saves; cleaned and capped at 2,000 characters |
| D-48 | Phone-only draft when there is no appointment; it fills the next appointment dated today or earlier | 09 opening (approach 1 fallback) | 09 — `questionsDraft` on the profile, cleared once used |
| D-49 | Line saying where the questions are saved | 09 opening | 09 — "Saved to your appointment on …" and "Saved" (read out to screen readers) |
| D-50 | Move backup/export (Milestone 7) earlier (was I-20) | 05 opening, 05 after-build, 08a after-build | 10a — built (PR pending); photos not included, see I-56 |
| D-51 | Encrypted daily backup to your own Dropbox, with restore, from a Backup screen in the menu | 10 opening | 10a — PR pending; automatic when the app is opened after 8 pm, newest 2 kept, Reset disconnects. Needs real-iPhone check |
| D-52 | Weekly injection-day reminder for the phone Calendar (.ics) | 10 opening | 10b — PR pending; button on the Doses screen under Next injection |
| D-53 | Security Phase 1: CSP (with deploy-time check), split CI permissions and Dependabot, vitest upgrade, backup password rule, Home Screen notice, food-value caps, restore checks, Dropbox disconnect wording, owner checklist | 11 opening, 11 second look | 11 — PR pending; needs real-iPhone check (I-59) |
| D-54 | Milestone celebrations: weight lost, injections logged, on-schedule and logging streaks, weigh-in weeks, time on treatment (was I-63) | Owner, 2026-11-27 | 12 — PR pending; 5-second pop-up with confetti and escalating titles, no end to the lists, recorded so nothing shows twice, restore-safe |
| D-55 | Off switch for milestones, and no praise for eating less (was I-70) | 12 opening | 12 — built in: "Show milestones" and "Show weight milestones" switches; "barely ate" mark and food amounts never earn anything |
| D-56 | Dependabot only proposes small, safe npm updates (patch and minor; security fixes still arrive) | 13 opening (approach 1, recommended) | 13 — PR pending; `ignore` rule for majors in `.github/dependabot.yml`, Actions left as is. Owner still to enable "Dependabot security updates" |
| D-57 | Home: weight chart first, BMI-coloured line (CDC adult categories), compact Nutrition tile beside Water | 15 opening, Owner request | 15 — PR pending; colours also on the Body screen, Sparkline removed, 368 tests pass |
| D-58 | Range toggle (7 / 30 / 90 days / All) on the Home weight chart (was I-84) | 15 opening | 15 — PR pending; 90 days default, choice remembered on the phone; 7 days also added to the Body screen |
| D-59 | Tap details on the weight chart show BMI and category as words (was I-85) | 15 opening | 15 — PR pending; label, key, dotted line labels and tap details all use words |
| D-60 | Protein shaker on Home: fills with protein, shakes on add, once-a-day goal sequence, "Goal reached ✓" (owner's design) | 16 opening, Owner request | 16 — PR pending; Reduce Motion respected, memory kept on the phone and not backed up, 381 tests pass |

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
| S-27 | One build for Appointments and report together (approach 2) | 08 opening | Owner approved the two-step split; large diff, hard to review |
| S-28 | Three steps with a separate report-on-screen step (approach 3) | 08 opening | Owner decision: two steps; one shared builder keeps preview and PDF in step |
| S-29 | jsPDF library (option B) | 08 opening, 08b plan | Owner chose A; 249 KB gzip and bundled network/HTML code we could not remove |
| S-30 | pdf-lib and pdfmake | 08 opening | Technical: pdf-lib unmaintained since 2022; pdfmake too heavy |
| S-31 | Browser "Print to PDF" only | 08 opening | Technical: no direct file share on iPhone; own writer covers it |
| S-32 | White page with Warm Sand accents instead of a full Warm Sand page | 08 opening | Owner decision: same look as the app (dark brown text kept for legibility) |
| S-33 | Separate "next visit" question list with a move step (approach 2) | 09 opening | Technical: the phone-only draft covers it with less to go wrong |
| S-34 | Report-only questions, not saved (approach 3) | 09 opening | Not a real option: text would be lost after the PDF or a reload |
| S-35 | Edit older visits' questions from the report with custom dates | 09 plan question | Owner decision: "No" — the box shows only for "Since last appointment" |
| S-36 | Opt-in photo backup to Dropbox (was I-56) | 10 after-build | Owner decision 2026-11-27 (11): photos stay out of backups; the "never photos" rule stands |

---

_Detailed write-ups: [`04c-symptom-map.md`](04c-symptom-map.md), [`04d-symptom-map-polish.md`](04d-symptom-map-polish.md), [`04e-reset-data.md`](04e-reset-data.md), [`05-nutrition.md`](05-nutrition.md), [`05b-open-food-facts.md`](05b-open-food-facts.md), [`05c-barcode.md`](05c-barcode.md), [`07-ozempic.md`](07-ozempic.md), [`10-backup.md`](10-backup.md)._
