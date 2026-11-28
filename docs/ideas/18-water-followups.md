# 18 Water: cleaner Food section and bonus cups

## Opening ideas — 2026-11-28

**Request:** tidy the Food water row to one glass, the amount and "− / +" buttons, and turn the empty glass after the goal into 32 fl oz bonus cups.

**Modelling bonus cups (pure tracker).** Let over = max(0, total − target). Level = (over mod cup) / cup. A cup completes when floor(over / cup) rises since the remembered total. The old memory already holds `lastTotal`, so no new stored field is needed. The goal moment and a cup fill in one add are two different plays. Let `play` stay 'goal' for the goal and add a separate 'cup' value.

**Traps**
- Deleting or "−" inside a bonus cup: the level drops quietly, and a cup count must never fall below what was shown. Play nothing on removals.
- Rounding: use whole ml. Use 946 ml for 32 fl oz (US units, 29.57 ml per fl oz, rounded) and 1000 ml for the metric cup. Compare in ml, never floats.
- One add can cross the goal and fill a cup. Play the goal first, then the small drink, or skip the small drink. Several cups in one add: play one drink only.
- `goalTurn` is the shared queue for big goal moments. Small cup drinks should skip it, so they never delay protein or water goals.
- "−" below the goal: `reached` stays true for the day (existing rule), so the glass would stay empty. Check this one.
- "−" must clamp at 0 and delete an entry of 8 fl oz or less.

**Questions, with suggested answers**
- Count label "Bonus cup 2"? Yes, small and quiet, shown only from cup 2 on. "Goal reached ✓" stays.
- Does "−" at the Food screen undo a bonus cup? Yes, quietly.
- Is the first-look rule changed? No. It is almost certainly release-day memory being empty, and a test showed the pour works. Keep the rule, because a reload must not replay. Optional: the I-74 "Preview" button would let the owner see it on demand.

**Fresh ideas (optional)**
- Show the static glass on Food, tapping it opens a quick "Added today" list for fixing mistakes, since chips are going.
- A tiny "Added 8 fl oz, Undo" chip (I-97) would make "−" less needed.

**Watch-outs:** no advice wording. Bonus cups must not read as "drink more". Use neutral text only. Restore range 0–50000 ml still holds.
