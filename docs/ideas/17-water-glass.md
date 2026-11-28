# 17 Water glass: ideas

## Opening ideas — 2026-11-28

**The request, restated:** Replace the Water tile's thin bar with the owner's designed glass (ice, pour, goal drink), following the protein shaker.

**Reusing the shaker pattern.** Recommended: generalise `shakerState` into one shared "fill tracker" (same pure function, memory key passed in), with `steady.shaker` kept as is and a new `steady.waterGlass`. Pros: one tested rule set, so both behave the same. Cons: touches working shaker code, so keep its tests untouched and green. Alternative: a sibling `waterGlass.ts` copy. Faster, but the two will drift. Effort: M.

**Traps**
- The quick-add button sits inside the tile. The pour must never block it or make it jump. Keep the glass in a fixed-height box and allow repeat taps mid-pour (restart the pour; don't queue).
- Metric: only the number and unit change ("1.3 of 2.7 L"). The fill is a ratio of ml, so the drawing is unaffected. Check the long label fits.
- Targets that change with weight: the goal stays "reached for the day" once shown, as in the shaker. A lowered target only marks it reached, with no drink.
- Two goal animations at once: play them in sequence, protein first, then water after a short pause. If a milestone pop-up opens, wait for it.

**Questions for the owner**
1. Should the goal drink play if you add water that crosses the goal? Suggested: yes, as with protein.
2. Keep the old bar for screen readers? Suggested: no; give the glass a text label ("42 of 90 fl oz").
3. Is "Goal reached ✓" colour matched to the shaker's? Suggested: same wording and colour.

**Fresh ideas (optional)**
- Share the "Goal reached ✓" line style between both tiles so they read as a pair.
- Tiny ripple only (no pour) for a second quick-add within a few seconds, to keep rapid taps calm.

**Watch-outs:** No medical wording is needed. The memory stays on the phone, outside backups, and Reset clears it. There is no new network or cost.

## After-build improvements and follow-ups — 2026-11-28

**What landed:** The Water tile's bar is now the owner's glass (ice, pour on add, goal drink), sharing one fill driver with the shaker, with protein's goal playing first and water's about a second later.

1. **Undo for the last water add (new, I-97).** The "+ 8 fl oz" button sits where a stray tap is easy, and now the pour makes a mis-tap look deliberate. A short "Added 8 fl oz, Undo" chip, like the "barely ate" one, would fix it. Own data only, no wording needed.
2. **Real-phone smoothness check (I-59, extended).** Only mocked runs were done. Add "glass pour and drink are smooth, Reduce Motion goes straight to the end state" to the owner's check list.
3. **Preview of both goal sequences (joins I-74, I-94).** Goals play once a day, so the owner can't re-watch the drink or the protein-then-water order. One sample-only "Preview" button would cover the milestone pop-up and both tiles.

**Felt off or worth knowing**
- Metric profiles see litres ("1.2 of 2.7 L") while the plan's example said ml. That matches the rest of the app, so it is consistent, but a small amount like "0.25 L" may read oddly. Worth a look on the real phone.
- The glass is drawn as decorative, so its meaning rests on the spoken line and the number text. That is fine, but the written number should stay clearly visible beside the glass.
- I-95 (shared "Goal reached ✓" style) and I-96 (ripple for rapid taps) were not taken; both stay open.
