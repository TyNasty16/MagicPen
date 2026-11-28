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
