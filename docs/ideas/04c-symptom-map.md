# Ideas — 04c Symptom map

Opening pass: n/a (change predates the Ideas agent; options were explored via owner mockups)

## After-build ideas — 2026-11-25

**What landed:** The Symptoms screen is now a 3/7-day symptom-by-day colour map with timing and trend words, plus a per-symptom drill-down; severity is 1–5 only.

### Quick wins
1. **Drop the duplicate "When to get help".** The alert card and the red "When to get help / Read" row sit one above the other and say the same thing. Keep the red row only, or fold it into the alert card.
2. **Separate "New" from "no earlier data".** In the 3-day screenshot every row reads "New", which hides whether the symptom is truly new or just quiet before. Consider "First logged" versus "No earlier entries" (wording is descriptive only, so no sourced text is needed).
3. **Label the drill-down chart weeks with dates** (e.g. "Nov 3") instead of W1–W8, and show the trend tile word with its arrow, since "↓" alone is easy to misread.

### Follow-ups
1. **Share the same trend window.** The 7-day row says "→ Same" while the drill-down for the same symptom says "milder lately". Both are correct (different windows), but it looks contradictory. A one-line "based on the last 2 injection weeks" caption would help.
2. **Tap a cell to see that day's entries.** It would let you check what a colour means without opening the drill-down.
3. **Compare against the injection schedule in the detail view.** Shading the "shot" days on the week chart would match the map's language.

### Anything that felt off
- In the 7-day view, cells carry no numbers and steps 4 and 5 are close in tone. The legend helps, but a user can't easily tell a 4 from a 5.
- The "💉 shot" label sits above the weekday header, so the two views start at different heights and the grid shifts when switching.
- The Tips card in the drill-down screenshot is partly hidden behind the bottom nav, so the screenshot can't confirm it is collapsed behind "More". Worth a quick look.
- The "hidden" note is easy to miss at the bottom of the card, yet it explains why a symptom you logged earlier has no row.
