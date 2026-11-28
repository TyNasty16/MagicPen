# 14 — Visual redesign: feel less like AI

## Opening ideas — 2026-11-27

**The request, restated:** fewer rounded cards, less ALL-CAPS, the weight trend as the main visual, fewer rings and more varied charts, and one original brand element used throughout; the owner wants mock-ups.

### Three directions to mock up

**A. "Field Notebook" (Recommended: warmest, most distinctive, least risky)**
- Layout: a paper page with hairline rules between sections; lists, not boxes. Only the dose and alert items keep a card.
- Type: serif headings and big numbers; sentence-case labels.
- Weight hero: a full-width chart at the top of Home, with a dotted goal line, small dose-change ticks along the bottom, and a soft band showing the trend.
- Rings become: a protein bullet bar (today against target), a stacked macro bar, and a 7-dot water tally.
- Brand: the "steady line", a slightly wobbly hand-drawn horizontal line. It underlines page titles, becomes the chart's trend line and the divider between sections, and is the progress bar on loading.

**B. "Ledger"**
- Layout: full-bleed sections divided by hairlines, with a label column on the left and the value on the right, like a clinic chart.
- Type: serif numerals, small sans labels in sentence case.
- Weight hero: a tall chart with its y-axis in the margin, a goal line and dose ticks.
- Rings become: a weekly strip (7 small bars), a dot calendar of logged days, and a tally of injections.
- Brand: a small pen-nib mark as the bullet before each section title, and as the chart's latest-point marker.

**C. "Stamped"**
- Layout: tinted full-width bands in alternating sand tones, with no borders.
- Type: bold serif headings, with italic serif for secondary text.
- Weight hero: a chart filling a coloured band, with the latest weight as a large figure over it.
- Rings become: horizontal meters and a stacked macro bar.
- Brand: a round "seal" stamp, with the injection weekday letter in the middle. It appears on the dose item, on milestones and in the report header.
- Cons: the most change, and the seal can feel gimmicky.

### Uppercase labels
- **Keep:** tiny eyebrows above a group (one or two per screen), tab-bar labels, and the milestone pop-up titles (the owner's loud exception).
- **Change to sentence case:** every card title (`Card title` in ui.tsx), form labels, chart captions, and button text.

### Traps
- **Contrast:** hairlines and the dotted goal line must still meet contrast on Warm Sand. Don't use colour alone for meaning (a tally and a bar need numbers beside them).
- **Medical judgement:** the trend band and goal line must show your own data only. No "on track" or "too fast" colours, no green and red zones, and no target-weight advice. A band is a smoothed line, not a verdict.
- **Too much at once:** ship in stages. First the shared pieces (`ui.tsx`, tokens, brand line), then Home, then the other screens.
- **Consistency:** Doses, Weight, Food, Symptoms, Settings, Report and the pop-ups must follow the same rules. A half-converted app looks worse than the old one. The PDF report should keep its own plain look.
- **Brand:** check the final mark isn't close to a known app's logo.

### Questions for the owner (after the mock-ups)
1. Which direction, A, B or C? *Suggested: A.*
2. Should the symptom heat map keep its coloured squares? *Suggested: yes, since the colours carry meaning.*
3. Should the dose item stay a card? *Suggested: yes, as the only one.*
4. Should the milestone pop-ups keep the loud look? *Suggested: yes, per your earlier decision.*
5. All screens in one change, or Home first? *Suggested: Home plus the shared pieces first, then a second change.*
6. Is a goal line shown only when you have set a goal? *Suggested: yes.*

### Ideas you may not have thought of (optional)
- A tiny brand line as the loading and empty-state illustration.
- A "Plain mode" switch with stronger contrast and no decoration.
- A lightweight screenshot check (before and after) for each screen.

### Watch-outs
Product rules: no dose advice and nothing suggesting a medical verdict. Privacy: nothing changes. Cost: fonts must be self-hosted ($0, no third-party calls). Any medical text on charts needs sourced wording.
