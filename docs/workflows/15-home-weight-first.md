# Workflow 15 — Home: weight chart first
Status: Draft
Milestone: Post-plan add-on (not in PLAN.md §5). Uses only data already stored (height, birth year, weigh-ins, doses).

## Owner answers (2026-11-28)
1. Weight screen chart gets the same colours: yes.
2. Home chart range: a choice of 7 days, 30 days, 90 days or All, owner's addition. Proposed: 90 days selected by default, and the choice is remembered on the phone.
3. No-height hint: yes.
4. Birth-year hint: yes.
5. Underweight in purple #6A4C93: yes.
6. Age counts as 20 or older only when the year difference is 21 or more: yes.

## Ideas considered
Ideas file: [docs/ideas/15-home-weight-first.md](../ideas/15-home-weight-first.md). Its owner decisions are binding. Mockups: `docs/screenshots/15-mock-home-swap.png` and `docs/screenshots/15-mock-weight-bmi-line-red.png` (sources in `docs/mockups/`). Chosen approach: reuse `TrendChart` (it already draws goal line, dose marks, key and tap details) instead of extending `Sparkline`, loaded lazily on Home so Home does not pull in the chart library up front. One pure function in `body.ts` works out category and colour segments. `NutritionRings` gets a compact variant. The old Home weight tile and `Sparkline` are no longer used on Home.

## Goal
Home shows the weight chart full-width under Next injection, with the line coloured by adult BMI category, and Nutrition moves to a smaller half tile beside Water. Nothing is advised: colours and words only describe.

## In scope
- Home layout: weight chart in the full-width slot under Next injection; Nutrition in the half tile beside Water.
- Chart line colour by CDC adult BMI category of each weigh-in (from Profile height), hard steps at the boundaries.
- Dotted BMI 25 and 30 lines, goal line, dose-change markers, key, BMI label, CDC note.
- `bmiCategory` split of Obesity into classes 1, 2, 3.
- Same colours on the Weight screen's Trend chart (default yes, see questions).
- Compact Nutrition tile, protein first.

## Out of scope
- Colours on the measurement charts (waist, hips and so on).
- A "Plain line" switch in Profile, or a 30/90/All toggle on Home.
- Any "healthy", "goal" or "target" advice, or any dose logic.
- Colours for under-20s (plain line instead).
- Changing the Water tile, quick add, or any other card.

## Colours
| Category (CDC adult BMI) | Range | Colour |
|---|---|---|
| Underweight | below 18.5 | purple #6A4C93 (proposed) |
| Healthy weight | 18.5 to 24.9 | green #009E73 |
| Overweight | 25.0 to 29.9 | blue #0072B2 |
| Obesity, class 1 | 30.0 to 34.9 | red #C62828 |
| Obesity, class 2 | 35.0 to 39.9 | dark red #7F1D1D |
| Obesity, class 3 | 40.0 and above | dark red #7F1D1D |

Source: https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html (ranges, and its caveat that BMI is a screening measure). The category is worked out from BMI rounded to 1 decimal (the CDC lists ranges to 1 decimal), so the number shown, the label and the colour always agree: 24.96 shows "25.0 · Overweight".

## Exact user-facing text
- Label beside a dot of the category colour, next to the weight: "BMI 28.1 · Overweight". Categories: "Underweight", "Healthy weight", "Overweight", "Obesity, class 1", "Obesity, class 2", "Obesity, class 3".
- Key (only categories present in the chart): colour bar plus the category name. Class 2 and 3 share a key entry, "Obesity, class 2 and above".
- Note under the chart: "Line colour shows adult BMI category for your height (CDC). BMI is a screening measure, not a diagnosis."
- Dotted line labels: "BMI 25", "BMI 30".
- Tap details for a weigh-in (new second line): "BMI 28.1 · Overweight".
- Chart screen-reader label adds: "Latest BMI 28.1, Overweight."
- No-height hint (plain line, small, muted): "Add your height in Profile to see BMI colours." Birth-year variant: "Add your birth year in Profile to see BMI colours."
- Nutrition tile: title "Nutrition"; big ring centre "84 g of 114" with label "Protein"; small rings labelled "Carbs", "Fat", "Calories". Screen-reader summary unchanged.

## Rules
- BMI per weigh-in = weight / height squared, using the Profile height. Colours need: a height, a birth year giving age 20 or older, at least 2 weigh-ins in view, and every BMI between 10 and 80.
- Otherwise (fallbacks): a plain line in the accent colour, no BMI lines, no label, no key, no CDC note. The hint above shows only when height or birth year is missing.
- Age check uses birth year only: colours show when this year minus birth year is 21 or more, so the person is certainly 20 or older (see questions).
- Where the line crosses a boundary between two weigh-ins, an interpolated point splits it, so the colour changes exactly at BMI 18.5, 25, 30, 35 and 40. Each weigh-in dot takes its own category colour.
- BMI lines are weight = BMI x height squared, converted to the profile's units. Drawn only when inside the chart's y range (the range is never stretched for them).

## Steps
1. `src/lib/body.ts`: add `bmiClass(value)` (returns category id, including obesity classes 1 to 3), keep `bmiCategory(value)` returning the label text ("Obesity, class 1" and so on), add `BMI_COLOURS`, `bmiColourEligible(profile, today)`, `bmiSegments(points, heightCm)` (splits at crossings) and `weightAtBmi(bmi, heightCm)`. The Measurements BMI card picks up the new class labels automatically.
2. `src/components/TrendChart.tsx`: optional `bmi?: { heightCm: number }` prop. When set and eligible, draw one `Line` per segment, category-coloured dots, dotted BMI lines, key entries and tap-detail line; otherwise unchanged. Add the CDC note below.
3. `src/components/NutritionRings.tsx`: add `compact` prop: one larger protein ring ("84 g of 114", "Protein") and three small rings (Carbs, Fat, Calories) each labelled. Existing layout stays for Food.
4. `src/pages/Home.tsx`: remove the old Weight tile and Sparkline; add a full-width Weight tile under `DoseHero` (current weight, change since start, "BMI 28.1 · Overweight" label, chart of the last 90 days, link to `#/weight?from=home`); put the compact Nutrition tile (link `#/food?from=home`) beside Water. Lazy-load `TrendChart` with a fixed-height placeholder. Keep the "Log your first weigh-in" start-to-goal prompt when there are no weigh-ins.
5. `src/pages/Weight.tsx`: pass `bmi` to the Trend chart.
6. Remove `src/components/Sparkline.tsx` if nothing else uses it.
7. Tests (below), full run and build, one mocked iPhone pass, code review.

## Acceptance criteria
- BMI 18.4 is Underweight; 18.5 Healthy weight; 24.9 Healthy weight; 25 Overweight; 29.9 Overweight; 30 Obesity, class 1; 34.9 class 1; 35 class 2; 39.9 class 2; 40 class 3.
- 5'9" with 180 lb shows "BMI 26.6 · Overweight" with a blue dot, and the line for that weigh-in is blue.
- A line passing from 31 to 29 between two weigh-ins is red then blue, changing exactly at the BMI 30 weight.
- Home shows, top to bottom: Next injection, the weight chart (full width), then Nutrition and Water side by side.
- The Nutrition tile shows "84 g of 114" and "Protein" in one larger ring, with Carbs, Fat and Calories rings below, each labelled. Tapping opens Food.
- Colour is never the only signal: the BMI label, the key, the dotted line labels and the tap details all use words.
- No height, no birth year, age under 20 (by the rule above), a BMI under 10 or over 80, or fewer than 2 points: plain accent line, no BMI lines, no label, no key, no CDC note. The matching hint shows only for a missing height or birth year.
- Goal line and dose-change markers still show and still match the Weight screen.
- Text contains no advice or dose wording beyond the CDC category names.
- Existing tests and the build pass. Nothing is sent over the network.

## Tests
Automatic (Vitest):
- `bmiCategory` and `bmiClass` at 18.4, 18.5, 24.9, 25, 29.9, 30, 34.9, 35, 39.9, 40, plus the rounding case 24.96.
- `bmiSegments`: no crossing (one segment); one crossing (two segments, interpolated point at the exact boundary); a jump over two boundaries (three segments); a rise and fall back; points on a boundary exactly.
- Fallbacks: no height, no birth year, age 19 and 20 and 21 by year difference, BMI 9.9 and 80.1, one point, zero points.
- `weightAtBmi` round trip with `bmi`, in lb and kg.
- Text guard over the new strings.
- Existing `milestone3.test.ts` expectations updated for the class labels.

By hand: one mocked iPhone pass (390x844) with screenshots: Home with colours, Home with no height (plain line and hint), Weight screen, and the Nutrition tile after a Protein entry. Check the lazy chart does not shift the layout. On the real iPhone after deploy: colours distinguishable in daylight, chart taps work.

## Risks & open questions
- Red and green can look alike to some colour-blind readers. Mitigation: words everywhere, plus the key. Red on a weight line can read as a verdict; the CDC note stays visible.
- Class 2 and 3 share a colour; the label and tap text still say the class.
- Birth year only gives age within a year, so someone turning 20 this year sees a plain line until next year (conservative).
- A typo weigh-in (BMI outside 10 to 80) turns the whole chart plain until it is fixed.
- Recharts on Home adds a lazily loaded chunk; the placeholder avoids layout jump.
- "Body chart" is read here as the Weight screen's Trend chart; measurement charts stay plain.
- Questions, each with a suggested default:
  - Give the Weight screen chart the same colours? (default: yes)
  - Home history range? (default: last 90 days)
  - Show the no-height hint "Add your height in Profile to see BMI colours."? (default: yes)
  - Also show the birth-year variant of the hint? (default: yes)
  - Colour for Underweight, purple #6A4C93? (default: yes)
  - Treat age as 20 or older only when year difference is 21 or more? (default: yes)

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## Token Steward trims (applied)
Where these differ from the Steps, Acceptance criteria and Tests above (for example a separate `bmiClass`, or always lazy-loading), these win.
- **One BMI function.** `bmiCategory` returns a category id, and the label text is derived from that id. There is no separate `bmiClass`.
- **Tests.** One table-driven test per function: category boundaries, crossing splits and fallbacks.
- **Lazy-loading.** Check TrendChart's chunk size first. Lazy-load it on Home, with a placeholder, only if the main bundle grows noticeably.
- **Screenshots.** Two only: Home with colours, and Home without a height. The Weight screen and the Nutrition tile are checked by tests.
- **Test runs while building.** Only the body and milestone tests. The full suite and build run once, at the end.
- **Weight-screen colours.** Built only if the owner answers "yes" to question 1. Otherwise it becomes a follow-up idea.

## In plain English

**What changes on Home:** The weight chart moves to a full-width card under "Next injection," showing the last 90 days. Nutrition becomes a half-width tile beside Water, with protein as the big ring.

**Line colours:** Each weigh-in is coloured by its BMI (a height-and-weight screening number). Words always show too, so colour is never the only clue.
- Purple: underweight
- Green: healthy weight
- Blue: overweight
- Red: obesity, class 1
- Dark red: obesity, classes 2 and 3

The colours only describe. Nothing is advised.

**Without a height or birth year:** The line stays one plain colour, with no BMI labels. A short hint says what to add in Profile.

**You need to decide** (suggested answer in brackets):
- Same colours on the Weight screen? (yes)
- Home chart covers 90 days? (yes)
- Show the height hint? (yes)
- Show the birth-year hint? (yes)
- Purple for underweight, as proposed? (yes)
- Treat someone as an adult only if this year minus birth year is 21 or more? (yes)

## Approval
- [ ] Approved by owner — date:
