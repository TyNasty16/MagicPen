# 15 — Home: weight chart first

## Opening ideas — 2026-11-28

**Request, restated:** Put a BMI-coloured weight chart full-width under Next injection, and shrink Nutrition into the half tile beside Water (direction already chosen from the mockups).

### How to build it with what exists
- `TrendChart` already draws goal line, dose marks, key and tap details, so reuse it rather than extend `Sparkline` (the Home tile). It is loaded only on Weight/Body today. Check Home's bundle cost, or lazy-load it.
- Colour steps: split the line into one segment per category. Cross-over points need interpolated points so the colour changes exactly at BMI 25 and 30. Dotted BMI lines are reference lines at weight = BMI x height squared.
- `body.ts` `bmiCategory` returns only "Obesity". Add a class split (1, 2, 3+) there, with tests at 18.5, 25, 30, 35 and 40.
- `NutritionRings`: add a compact variant, with a large protein ring and three small rings below it. The screen-reader summary stays.

### Traps
- **Colour only:** the label "BMI 28.1 · Overweight", the key, and the tap details (BMI and category as words) must carry the meaning. Red #C62828 and green #009E73 are hard to tell apart for some colour-blind readers, so the words matter.
- **Class 3:** it shares dark red with class 2 per your decision, so the label should still say "Class 3".
- **Under 20:** CDC adult categories apply to 20 and older. Profile may have no age or birth date, so check. If under 20, use a plain line (needs sourced wording if a reason is shown).
- **Body chart:** if Body keeps a plain line, the two charts look inconsistent.
- **Red as judgement:** red on a weight line can feel like a verdict. The CDC note helps. Underweight needs a colour: suggest purple #6A4C93, which is distinct from the others and not alarming.
- **Out of range:** weights that give BMI below 10 or above 80 are likely typos. Keep the line plain for those points, or skip the BMI lines when they would squash the chart.
- **Few weigh-ins:** with only 1–2 points, show a plain dot and no colour steps.

### Questions for the owner
1. Should the Body chart get the same colours? Suggest yes, so one rule covers both.
2. Should Home show 30 days or all time? Suggest 90 days, with the full view on Weight.
3. If a weigh-in is missing height, point to Profile? Suggest a quiet "Add height for BMI lines" link.

### Fresh ideas (optional)
- Profile switch "Plain line" to turn the colours off.
- Range toggle (30 days / 90 days / All) on the Home chart.
- Tap details show BMI and category as words for each weigh-in.

### Watch-outs
CDC wording is only what you gave me. Do not add any "healthy" or "goal" advice. Everything stays on the device and costs $0.
