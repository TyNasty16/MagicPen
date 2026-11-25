# Workflow 04b — Symptom "take a closer look" alerts
Status: Awaiting approval
Milestone: Addition to Milestone 4 (owner request), before Milestone 4 goes live

## Goal
Show a calm in-app card when a logged symptom is very strong or has lasted a long time, so the owner knows to look more closely. It is not medical advice and never mentions doses.

## In scope
- A pure function over logged symptoms that returns alerts (local calendar days). Thresholds are named constants in one file.
- An alert card on Home (top) and on the Symptoms screen. In-app only.
- "Hide for now" per alert, stored locally.
- This **reverses Workflow 04's out-of-scope line** "No alerts or automatic 'see a doctor' triggers", by owner request.

## Out of scope
- Push notifications or any background scheduling (an installed iPhone web app cannot do this).
- Any dose wording, dose advice or escalation logic.
- Alerts for weight, food or injections.
- Changing existing tips or the "When to get help" text.
- Network calls.

## Rules
Rules 1 and 4 and every severity threshold are owner-chosen defaults, not from a source. Rule 3 durations come from the sources.
1. **Severe:** any symptom logged at severity 5 in the last 2 days (today or yesterday). Reason: "<Symptom> was logged as severe (5/5)".
2. **Strong stomach pain:** stomach pain at severity 4 or more in the last 2 days. Reason: "Stomach pain was logged as 4/5" (or 5/5), plus the help-box line on severe stomach pain, quoted exactly from `src/lib/sideEffectText.ts`.
3. **Long-lasting, sourced** (run of consecutive days with an entry for that symptom at severity 2 or more, which must include today or yesterday):
   - Vomiting on 2 or more days in a row. [MedlinePlus: contact a provider if vomiting lasts longer than 24 hours](https://medlineplus.gov/ency/patientinstructions/000122.htm)
   - Nausea on 3 or more days in a row. [MedlinePlus: nausea lasting more than 48 hours](https://medlineplus.gov/ency/article/003117.htm)
   - Diarrhea on 3 or more days in a row. [Mayo Clinic: adults, more than two days without improvement](https://www.mayoclinic.org/symptoms/diarrhea/basics/when-to-see-doctor/sym-20050926)
   - Reason: "Vomiting logged on 2 days in a row".
4. **Long-lasting, general:** any symptom at severity 3 or more on 5 or more of the last 7 days. Reason: "<Symptom> has been logged on N of the last 7 days".

Display: one card per symptom (strongest rule wins: 2 or 1, then 3, then 4); at most 3 cards, newest qualifying entry first.

## Exact card wording (for review)
- Title: **Take a closer look**
- Reason line: from the rules above.
- Link: **When to get help** (opens the existing pop-up).
- Button: **Hide for now**
- Footer: "This isn't medical advice. If you're unsure, contact your healthcare provider."
- Style: amber/gold border and soft background, distinct from the red help box. No red, no exclamation marks.

## Steps
1. `src/lib/symptomAlerts.ts` (new): constants (`SEVERE_AT = 5`, `STOMACH_PAIN_AT = 4`, `RECENT_DAYS = 2`, `RUN_DAYS = { vomiting: 2, nausea: 3, diarrhea: 3 }`, `GENERAL_SEVERITY = 3`, `GENERAL_DAYS_REQUIRED = 5`, `GENERAL_WINDOW = 7`), source URLs, and `symptomAlerts(symptoms, now)` returning `{ type, rule, reason, latest }[]`, with a `latest` timestamp (newest qualifying entry) used for dismissal.
2. `src/lib/alertDismissals.ts` (new): `hideAlert(type, latest)` and `visibleAlerts(alerts)` using localStorage, all in try/catch (if storage fails, alerts simply stay visible). An alert is hidden while its `latest` is no newer than the stored value; a newer qualifying entry shows it again.
3. `src/components/SymptomAlerts.tsx` (new): renders up to 3 cards (44px buttons, 390px layout) and takes an `onOpenHelp` callback.
4. `src/pages/Symptoms.tsx`: show the alerts above the content; `onOpenHelp` opens the existing `HelpPopup`.
5. `src/pages/Home.tsx`: show the alerts at the top (symptoms are already loaded there). "When to get help" opens the same pop-up. Needs a small shared way to open it from Home (see open question 3).
6. Tests (below), then the full suite and build once at the end.

## Acceptance criteria
- Severity 5 logged yesterday shows "Nausea was logged as severe (5/5)"; the same entry 2 days ago shows nothing.
- Stomach pain at 4 shows the card with the exact help-box line; at 3 shows nothing from rule 2.
- Vomiting on today and yesterday shows the alert; vomiting on today and 2 days ago (gap) does not.
- Nausea on 2 days in a row shows nothing; on 3 days in a row ending today or yesterday shows it.
- A symptom at severity 3 on 5 of the last 7 days shows the general alert; on 4 days does not; severity 2 days do not count.
- A symptom matching several rules shows one card. Four qualifying symptoms show 3 cards.
- "Hide for now" removes the card; it stays hidden after reload; a new qualifying entry brings it back.
- If localStorage is unavailable, the app still works and alerts show.
- No card text mentions doses, and the card never says to stop, skip, lower or raise anything. The stomach-pain help line is the one exact quote (see open question 1).
- 390px width, 44px tap targets, works offline, no network requests.
- Existing 86 tests and the build pass.

## Tests
Automatic (Vitest, `src/lib/symptomAlerts.test.ts`):
- Rule 1: yesterday vs 2 days ago; severity 4 vs 5.
- Rule 2: severity 3 vs 4 vs 5.
- Rule 3: runs of 1, 2 and 3 days per symptom; a gap breaks the run; a run ending 2 days ago does not count; several entries on one day count as one day; local-midnight boundaries.
- Rule 4: 5 of 7 vs 4 of 7; severity 2 excluded; days outside the 7-day window excluded.
- One card per symptom, strongest rule wins; maximum 3, newest first.
- Dismissal: hidden after hide; reappears after a newer qualifying entry; still works when localStorage throws.
- Guard test: all alert strings (reasons, title, footer) fail /dose|skip|lower|increase|raise/i.

By hand: 390px layout, tap sizes, offline, amber style next to the red help box, pop-up opens from both screens.

## Risks & open questions
- Rules 1, 2 and 4 and the severity levels are owner-chosen, not sourced. The card says only "take a closer look", never a diagnosis.
- Risk: too many alerts become noise. Mitigation: 3-card cap and "Hide for now".
**Proposed defaults — owner can reply "defaults OK" or change any:**
1. Thresholds and sources exactly as in the rules above.
2. Alerts appear on Home (top) and on the Symptoms screen; at most 3 cards; one per symptom.
3. "Hide for now" hides an alert until a new qualifying entry is logged.
4. For stomach pain, the card quotes the approved help-box line exactly (it starts "Stop using Wegovy…" — the label's own emergency instruction, already approved in Workflow 04).
5. Rule 3 counts a day only if that symptom was logged at severity 2 or more (a 1/5 "barely there" entry doesn't count toward "lasting").
6. The card wording above.

Token Steward trims applied: questions folded into one defaults list; rule tests written as table-driven cases in one test file with the wording guard; Home opens the existing pop-up component directly (no new helper module); full suite and build run once at the end.

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
**What it does:** If a logged symptom is very strong or keeps going, the app shows an amber card: "Take a closer look." It appears on Home and the Symptoms screen, inside the app only. It is not medical advice and never mentions doses.

**Where the limits come from:**
- **MedlinePlus and Mayo Clinic (medical websites):** how many days in a row vomiting, nausea or diarrhea counts as lasting too long.
- **Your choices:** strength cut-offs (5 out of 5 is "severe"; 4 or more for stomach pain), "3 or more out of 5 on 5 of the last 7 days," the 3-card cap, and "Hide for now."

**You need to decide:**
- Reply "defaults OK," or change any: sources and cut-offs as written; cards on Home and Symptoms; max 3; "Hide for now" lasts until a newer entry; stomach-pain card quotes the label's line exactly; 1/5 days don't count toward "lasting."
- Approve the card wording: "Take a closer look" and "This isn't medical advice. If you're unsure, contact your healthcare provider."

## Approval
- [ ] Approved by owner — date:
