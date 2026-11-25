# Workflow 07 — Ozempic as a second medicine
Status: Draft
Milestone: Pulls part of "Other medications" (PLAN.md v3) forward; owner request 2026-11-25: "Add ozempic as a potential drug"

## Ideas considered
Ideas file: [docs/ideas/07-ozempic.md](../ideas/07-ozempic.md). Chosen approach: drug stored per injection, defaulting to a profile "Medicine" setting, with a small drug catalog. Build Ozempic only; tirzepatide stays a later catalog entry. Existing code touched: `injections.ts`, `injectionGuide.ts`, `sideEffectText.ts`, `symptomAlerts.ts`, `range.ts`, `db.ts` (v6), `HelpBox`, Injections and Profile pages.

## Goal
Let the owner log Ozempic injections as well as Wegovy, with the right dose chips and label-sourced help text for each, while the app still only logs and never advises on doses.

## In scope
- Dexie v7: optional `drug` ('wegovy' | 'ozempic') on each injection; `drug` on the Profile (default 'wegovy'). Old rows without `drug` are read as Wegovy (no rewrite).
- `src/lib/drugs.ts` catalog: id, brand name, generic "semaglutide", dose chips, help list, help footer, source label.
- Profile "Medicine" setting; injection form defaults to it, with a small switch for one entry; the dose list shows each entry's drug.
- Chart dose marks that show a drug change as a fact ("Ozempic 0.5 mg").
- "When to get help" box, footer, tip text and injection-site guide follow the profile drug.
- Ozempic text quoted only from `docs/sources/07-ozempic-label.md` (DailyMed, set ID adec4fd2, 10 Jun 2026).

## Out of scope
- Dose advice, titration or escalation schedules, "next dose" hints (never shown, even though the label has them).
- Oral Ozempic tablet, Rybelsus, compounded semaglutide, tirzepatide (later catalog entry).
- Ozempic missed-dose text (stays as is; open question below).
- A "Switched medicine" timeline note, first-run "Which medicine?" screen.
- New network calls.

## Exact text for owner review
All quoted from the Ozempic label / Medication Guide (source file above). Dose chips (mg): **0.25, 0.5, 1, 2** (label, pen doses). Wegovy chips unchanged: 0.25, 0.5, 1, 1.7, 2.4.

**When to get help, Ozempic** (same order as the Wegovy list):
- Stop using Ozempic and call your healthcare provider right away if you have severe pain in your stomach area (abdomen) that will not go away, with or without vomiting. You may feel the pain from your abdomen to your back.
- Tell your healthcare provider right away if you have nausea, vomiting, or diarrhea that does not go away.
- Stop using Ozempic and get medical help right away, if you have any symptoms of a serious allergic reaction including: swelling of your face, lips, tongue or throat; problems breathing or swallowing; severe rash or itching; fainting or feeling dizzy; very rapid heartbeat.
- Tell your healthcare provider right away if you get symptoms of gallbladder problems which may include: pain in your upper stomach (abdomen); yellowing of skin or eyes (jaundice); fever; clay-colored stools.
- Tell your healthcare provider if you get a lump or swelling in your neck, hoarseness, trouble swallowing, or shortness of breath.
- Tell your healthcare provider if you have changes in vision during treatment with Ozempic.
- Your risk for getting low blood sugar may be higher if you use Ozempic with another medicine that can cause low blood sugar, such as a sulfonylurea or insulin. Signs and symptoms of low blood sugar may include: dizziness or light-headedness; blurred vision; anxiety, irritability, or mood changes; sweating; slurred speech; hunger; confusion or drowsiness; shakiness; weakness; headache; fast heartbeat; feeling jittery.
- Emergency: call 911. (App's own line, as in the Wegovy list; not from the label.)
- 988 crisis line: **omitted** by default (see defaults).

Footer: "From the Ozempic label and Medication Guide. This is not a complete list — read the Medication Guide that came with your medicine." (Wegovy footer keeps its current wording.)

**Tips, Ozempic**
- Vomiting and diarrhea: "Diarrhea, nausea, and vomiting may cause a loss of fluids (dehydration) which may cause kidney problems. It is important for you to drink fluids to help reduce your chance of dehydration. Tell your healthcare provider right away if you have nausea, vomiting, or diarrhea that does not go away."
- Nausea: the same fluids text (label has no nausea food tips; the wegovy.com tip is not used for Ozempic).
- Everything else: "Talk to your healthcare provider about any side effect that bothers you or does not go away." (label wording; replaces the Cleveland/Mayo general line for Ozempic).

**Injection-site guide, Ozempic**: label wording "OZEMPIC is injected under the skin (subcutaneously) of your stomach (abdomen), thigh, or upper arm. Do not inject OZEMPIC into a muscle (intramuscularly) or vein (intravenously)." and "Change (rotate) your injection site with each injection. Do not use the same site for each injection." Source line: "From the Ozempic Medication Guide. Always follow the Instructions for Use that came with your pen." The existing Wegovy per-area tips (2 inches from the belly button, etc.) are not label-quoted for Ozempic, so they are hidden when Ozempic is the profile drug.

**Alert cards**: `ALERT_FOOTER` does not name a drug, so it stays. The stomach-pain card quotes help line 1, which names Wegovy, so it will quote the profile drug's line 1 instead.

**Chart marks**: first entry "Start Ozempic 0.5 mg"; when the drug changes, "Ozempic 0.5 mg"; a plain dose change within one drug stays "1 mg". Wegovy-only users see no change.

## Steps
1. `src/lib/drugs.ts` (new): `DrugId`, `DRUGS` catalog, `drugOf(row)` (missing = 'wegovy'), `drugName(id)`. Moves `WEGOVY_DOSES_MG` here; `injections.ts` re-exports or imports it.
2. `src/db/db.ts`: add `drug?` to `Injection` and `Profile`; `db.version(7)` with the same stores as v6 (no index change); profile default 'wegovy' where it is read.
3. `src/lib/sideEffectText.ts`: per-drug `helpFor(drug)`, `footerFor(drug)`, `tipFor(type, drug)`; Wegovy strings unchanged word for word.
4. `src/lib/injectionGuide.ts`: per-drug guide; Ozempic uses the quoted lines only.
5. `src/lib/symptomAlerts.ts`: stomach-pain `extra` uses the profile drug's help line 1.
6. `src/lib/range.ts`: `doseChanges` also emits a mark when `drug` changes, with `drug` and `drugChanged` fields; no "increase" logic.
7. UI, done together: `HelpBox.tsx` takes the drug (`Symptoms.tsx` and the log sheet pass the profile drug); `Profile.tsx` "Medicine" switch (Wegovy / Ozempic); `Injections.tsx` dose chips and per-entry switch from the catalog, drug name on each list row, site guide per drug; `Weight.tsx` mark labels via the new fields.
8. Tests (below), then one full test run and build; one browser pass.

## Acceptance criteria
- Profile Medicine set to Ozempic: the new-injection form shows chips 0.25, 0.5, 1, 2 and 2.4 is not offered.
- The form defaults to the profile drug; the switch changes it for that one entry only; the list row shows "Ozempic 0.5 mg".
- Old injections show as Wegovy after the upgrade; nothing is lost from a v6 database.
- Logging Wegovy 2.4 then Ozempic 2 gives marks "Start Wegovy 2.4 mg" and "Ozempic 2 mg"; nothing says increase or decrease.
- With Ozempic selected, the help box and footer show only the Ozempic text above; with Wegovy, the current text exactly.
- No Ozempic string mentions raising, lowering, skipping or changing a dose.
- Reset all data returns Medicine to Wegovy.
- Works offline; no new network calls. Existing tests and the build pass.

## Tests
Automatic (Vitest):
- Catalog: both drugs present, generic "semaglutide", chips per drug match the lists above.
- Rows without `drug` read as Wegovy; rows with `drug` keep it.
- `doseChanges`: same drug same dose, no mark; same drug new dose, mark; drug switch with the same or a lower number marks the switch; mixed history sorted by time.
- Text guard over every Ozempic string: no match for /increase|decrease|raise|lower|skip|escalat|titrat|next dose/i (the label's own escalation lines are not in the file).
- Wegovy text tests and `symptomAlerts` tests stay; add a case for Ozempic stomach-pain `extra`.

By hand (one browser pass, screenshots; fake-indexeddb isn't installed, so the upgrade is checked here): a v6 database upgrading to v7 with profile, injections, weights, symptoms and photos intact; Profile switch; form default and per-entry switch; list rows; chart marks; both help boxes. No new network calls are added, so no separate offline check. Mockup only if you ask.

## Risks & open questions
- All Ozempic wording is quoted from one label file; nothing is added from general knowledge except the 911 line.
- Proposed defaults — reply "defaults OK":
  - Medicine setting in Profile, default Wegovy; per-entry switch on the injection form.
  - 988 line omitted from the Ozempic list (the Ozempic guide has no mood or suicidal-thoughts item). Reply "keep 988" to add it back, noting it is not from this label.
  - Ozempic tips: fluids text for nausea, vomiting and diarrhea; the label's "bothers you or does not go away" line for the rest. The wegovy.com nausea tip stays Wegovy-only.
  - Ozempic site guide: the label's stomach, thigh or upper arm line plus rotate line only.
  - Vision changes: included for Ozempic (the label lists it). This also settles the open vision item in PLAN.
  - Drug-change chart mark: shown, with a plain label and no colour change.
  - No "semaglutide" subtitle under the brand name (reply "add subtitle" to show it).
  - Changing the Medicine setting never changes past entries; each keeps the medicine it was logged with.
- Switching drug is never described as a dose change or advice; the app only records what you enter.

## Review checkpoints
- Token Steward: before start (applied: missed-dose item removed — the app shows none; open questions set as defaults; UI steps batched before one test run; lean browser pass. Not applied: dropping the drug-change chart mark — without it a Wegovy 2.4 → Ozempic 1 switch would look like a plain dose drop; the upgrade check stays in the browser pass because fake-indexeddb isn't installed)
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
**What this adds**
- You can log Ozempic as well as Wegovy. Pick one in Profile under "Medicine"; new entries use it by default.
- On the injection form you can switch medicine for a single entry. Past entries keep the medicine they were logged with.
- Ozempic has its own dose buttons: 0.25, 0.5, 1 and 2 mg.
- With Ozempic selected, the "When to get help" list uses wording taken from Ozempic's official leaflet.

**Key differences from Wegovy**
- The Ozempic list adds vision changes and a longer low-blood-sugar list.
- It has no mood item, so the 988 crisis line (a US suicide-prevention phone line) is left out by default.

**Cost**
- Nothing extra. No new online connections.

**What could go wrong**
- The app only records what you enter. It never advises on doses, and switching medicine is shown as a fact, not a dose change.
- Ozempic wording comes from one leaflet. The 911 emergency line is the only addition from outside it.

**You need to decide**
- The defaults: Medicine starts as Wegovy, and the 988 line stays off for Ozempic (plus the other proposed defaults in the plan).
- Approve the exact text: the Ozempic wording shown in the plan.

## Approval
- [ ] Approved by owner — date:
