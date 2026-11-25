# 07 — Add Ozempic as a potential drug

## Opening ideas — 2026-11-25

**The request, restated:** let the app be used with Ozempic (semaglutide, weekly, a different product from Wegovy) as well as Wegovy.

### Approaches

1. **Drug per profile (one setting).** Profile gets a "Medicine" choice (Wegovy / Ozempic). Dose chips, help text and guide follow it.
   - Owner sees: one picker in Profile; everything else switches.
   - Pros: simplest; no per-entry UI.
   - Cons: switching drugs rewrites how old entries are labelled, and history gets blurry.
   - Effort: S-M.
2. **Drug per injection, defaulting to the profile drug.** Each logged injection stores its drug. The profile holds the "current" drug that pre-fills the form. Existing injections count as Wegovy (Dexie v7, plain backfill).
   - Owner sees: a picker in Profile, plus a small drug label on each history entry.
   - Pros: honest history when someone switches; charts and dose-change marks stay correct; the shape also fits tirzepatide later.
   - Cons: a bit more UI and migration.
   - Effort: M.
3. **Generic "semaglutide" mode with free-typed doses.** No drug list. The user types any dose.
   - Pros: tiny.
   - Cons: loses preset chips and drug-specific help text; weak for medical wording.
   - Effort: S.
4. **Drug catalog file (data-driven).** Approach 2, plus one `drugs.ts` holding each drug's name, dose steps, guide text and help text, so new drugs are added as data, not code edits.
   - Pros: Zepbound/Mounjaro later means adding an entry, not rewiring pages.
   - Cons: slightly more upfront structure.
   - Effort: M.

**Recommended: 2 built on 4's catalog.** It keeps history truthful when someone switches, and it avoids another rewrite when tirzepatide arrives. Build only Ozempic now.

### Ideas you may not have thought of (optional)
- When the drug is changed in Profile, offer an optional "Switched medicine" note on the timeline, with no advice attached.
- Show the brand name only in the UI, with "semaglutide" as a small subtitle, so the generic is still visible.
- The first-run screen asks "Which medicine?" so new users never see the wrong chips.
- Chart marker colour or shape for the drug-change point, separate from dose-change marks.

### Watch-outs
- **Sourcing:** every Ozempic string (dose steps, "When to get help", side-effect tips, injection guide) needs wording quoted from the Ozempic label/Medication Guide and approved by the owner. The label also lists items Wegovy does not, such as diabetic retinopathy/vision changes and low blood sugar with insulin or sulfonylureas. Needs sourced wording. Dose steps (0.25, 0.5, 1, 2 mg) must be checked against the label.
- **No recommending:** chips only log. No titration hints, "next step up", or "typical" doses. Check `nextDose.ts` for any missed-dose text, which also needs Ozempic-sourced wording or should stay generic.
- **Per-drug help:** HelpBox, `HELP_FOOTER` and the symptom alert text currently name Wegovy (`symptomAlerts.test.ts` asserts it). They must resolve by drug and have tests for each.
- **Migration:** Dexie v7 must default old injections to Wegovy and never lose data. Test an upgrade from v6.
- **Charts:** dose-change marks across a drug switch must not read as a dose "increase" (for example 2.4 Wegovy to 2 Ozempic).
- **Reset button:** it clears `db.tables`, so it picks up any new table. Confirm the drug setting resets too.
- **Scope:** compounded semaglutide stays out. No new third-party calls and no cost.
- **Docs:** `PLAN.md` lists "Other medications" under v3, so note this pulls part of it forward.
