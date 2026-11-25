# 05 Nutrition: ideas

## Opening ideas — 2026-11-25

**The request, restated:** Start Milestone 5: let the owner log food and water, see today against their targets, and get a factual nudge when protein runs low.

### Approaches

1. **One big milestone (everything incl. Open Food Facts).** Manual log, My Foods, water, rings, Home tile, OFF search together. Pros: one review. Cons: largest diff; the only network feature lands with the rest. Effort L.
2. **Split: 05 offline core, 05b OFF search.** 05 = manual entry, My Foods, water, Home tile, rings/bars. 05b = OFF search. Pros: 05 is fully on-device and ships fast; the privacy and service-worker questions get their own review. Cons: two review cycles. Effort M + S/M. **Recommended** because the app is useful before any network call exists, and OFF is the one rule exception.
3. **Water and Home tile first, food later.** Tiny, safe. Cons: the main value (food and protein) is delayed. Effort S.
4. **Food only, no water or warning yet.** Cons: leaves the Home tile half-done. Effort M.

### Ideas you may not have thought of (optional)
- **Protein-first view:** show protein as the main ring, with calories second, since protein is the usual concern on GLP-1.
- **Small-portion quick adds:** one-tap "half" or "quarter" of a My Food, for small meals.
- **"Barely ate today" quick log:** one tap records a small entry or a "low-intake day" marker, so a gap in the log is not mistaken for forgetting.
- **Water quick-add buttons** (glass, bottle) in your units.

### Watch-outs
- **Privacy:** an OFF search sends the typed search term to a third party. Show a one-line notice before first use, and send nothing else (no ID, no key). Add a clear offline message.
- **Service worker:** never cache OFF responses, and keep them out of the offline cache. Check src sw config.
- **Data model:** per-serving vs per-100g must be stored and labelled clearly. Round only for display, and keep stored values precise. Pick one rule for kcal and grams.
- **Database:** Dexie v6 migration must add food, My Foods and water tables without touching existing data.
- **Reset:** `resetAllData` in src/db/db.ts must clear every new table. Add a test.
- **No backup exists yet:** a lot of daily entries will build up, so consider backup/export as the next milestone.
- **Low-protein warning:** wording must be factual only (for example "Protein is under your target for 3 days"). Show no advice and no dose link. If it needs any medical text, it needs sourced wording. The existing disclaimer already says targets are estimates.
- **Cost:** OFF is free with no key. Stay at $0.

## After-build — 2026-11-25

**What landed:** manual food and water log, My Foods, two rings (macro and calorie), "Barely ate today", a factual protein note, a built-in USDA list (offline search), and targets that follow the latest weigh-in (commit fe15d42).

### Follow-ups
1. **Open Food Facts search (05b)** for packaged and branded foods. The USDA list covers everyday foods but not brands. It is still the one planned network exception, so it needs the privacy notice and no caching.
2. **Backup/export sooner.** The food log now grows daily with no copy anywhere. This is the biggest risk to the owner's data.
3. **Custom water amount.** Quick-adds cover 8 oz / 250 ml and 16 oz / 500 ml only. A custom amount was deferred.
4. **7-day protein strip** on the Food screen: small bars per day against the target, so the "4 of the last 7 days" note can be seen, not just read.
5. **Recent foods list:** the last few foods logged, one tap to log again, for foods not saved to My Foods.
