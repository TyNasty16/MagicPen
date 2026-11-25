# Ideas — 04d Symptom map polish

## Opening ideas — 2026-11-25

**The request, restated:** Do the three 04c quick wins, drop the 3-day view so only the 7-day map remains, and find a way to make severity 4 and 5 look clearly different.

### Approaches to the 4 vs 5 problem
Current ramp: 4 is #b0553d, 5 is #86392a. Both are dark rust with white text, so they read as one colour at a glance.

1. **Number in every cell (1-5).** Small digit on each coloured cell, none on empty ones.
   - Owner sees: an exact value, whatever the colour.
   - Pros: works for colourblind users and in bright light; no new visual language; text contrast is already tested.
   - Cons: slightly busier; cells are small, so the digit must be about 12-13px.
   - Effort: S.
2. **Distinct mark for 5 only.** Severity 5 gets a thick dark border or a small corner dot or bar, while 1-4 stay plain.
   - Pros: 5 stands out as the one to notice; the map stays calm.
   - Cons: the shot-day outline is already a ring, so the mark must not look like it (use a corner dot, not a ring). It also needs a legend entry.
   - Effort: S.
3. **Stronger ramp separation.** Make step 4 a lighter, warmer terracotta (about #c8664a) and keep 5 as a very dark brown-plum (about #5a2a2a), so there is a clear lightness jump at the top.
   - Pros: no extra elements.
   - Cons: colour alone fails for colourblind users, and the middle steps get squeezed. Needs contrast re-checking against the 4.5 test.
   - Effort: S.
4. **Pattern or texture on 5.** Diagonal stripes on 5, which also work in greyscale.
   - Pros: strong and accessible.
   - Cons: looks busy at about 28px cells and clashes with the calm Warm Sand style.
   - Effort: M.
5. **Taller or wider cells.** Bigger cells so the numbers or marks fit.
   - Pros: easier tapping.
   - Cons: 7 columns plus the label column is already tight on a phone; it does not fix the colour problem on its own.
   - Effort: S-M.

**Recommended: 1 plus 3 (light touch).** Numbers solve it for everyone, and a modest lightness gap between 4 and 5 helps at a glance. If the owner wants less clutter, use numbers on 4 and 5 only. Only add 2 if the numbers still feel busy.

### How to word the "New" split (descriptive only)
- **First logged this week**: the symptom appears in the window and not earlier, but earlier days exist.
- **No earlier entries**: nothing to compare with, such as a first-time user or less than 2 weeks of history.
- Alternatives: "Not logged before" and "Too early to compare".
- Keep "New" out entirely, since it implies a judgement. No sourced text is needed because this is descriptive.

### Ideas the owner may not have thought of
- Tap a legend step to highlight all cells of that severity.
- Long-press (or tap) a cell for a tooltip such as "Nausea, Mon 23: 4 of 5".
- A "numbers on/off" toggle in Profile for people who prefer the pure colour view.

### Watch-outs
- **Removing the 3-day view has knock-ons.**
  - The 3-day timing phrases ("2 of 3 days", "today") and their tests go.
  - The "hidden if not logged in over 3 days" rule and its note need rewording. Decide whether the hide window becomes 7 days, and update the tests.
  - The "Take a closer look" alert says "3 days in a row". That rule is separate from the view toggle, so keep it, but check the wording still makes sense.
- **"Same" vs "milder lately" mismatch.** The map row's trend and the drill-down trend use different windows. Dropping 3-day removes one source of confusion. A caption such as "compared with your last 2 injection weeks" is still worth adding.
- **Duplicate "When to get help".** Keep a single entry point. The wording is already sourced, so do not edit the text, only remove the duplicate.
- **Privacy and cost.** No effect; everything stays local.

## After-build ideas — 2026-11-25

**What landed:** 7-day-only map with numbers in every cell, a darker step 5, a single help entry point, clearer "First logged this week" / "No earlier entries" wording, and a drill-down with a trend word, caption and dated week labels.

**Quick wins**
- Tapping a legend step could highlight matching cells.
- The "not logged in over 3 days" note still says 3 days under a 7-day map. Consider "this week" wording.
- Label the drill-down chart axis "Avg severity" so the 2.9 bar values are self-explanatory.

**Follow-ups**
- Tooltip or long-press on a cell ("Nausea, Mon 23: 4 of 5"). It helps small cells and screen readers.
- Profile toggle for numbers on or off. Some people may prefer the pure colour view.
- Export a symptom summary for appointments (the owner's own data, no advice). It makes the map useful at a clinic visit.

**Anything that felt off**
- Steps 3 and 4 in the legend are still close in colour. The numbers carry the difference, so this is fine, but colour alone does not separate them.
- The map row says "Same" while the drill-down says "milder lately" for Nausea. The caption explains the windows, but the two words disagree. Use one shared vocabulary, or show the window on the map row too.
- The map's footnote is long and dense (shot icon, numbers, trend window, tap hint). Consider splitting it or trimming it.
- The alert card is large and sits above the primary button. It is fine while it lasts, but it pushes the map down.
