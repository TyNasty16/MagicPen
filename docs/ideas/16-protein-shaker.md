# 16 — Protein shaker on Home

## Opening ideas — 2026-11-28

**Request:** replace the protein ring in Home's Nutrition tile with the owner's designed shaker (mockup `docs/mockups/18-shaker.html`). The design is binding; this covers build and risks only.

### How to build it
- One SVG React component (`ProteinShaker`) inside `CompactNutritionRings`; the calorie mini ring stays.
- Level is drawn by clipping the shake to the body. Shake and drain use CSS keyframes on classes where possible. The multi-step goal sequence (shake, pop, tip, drain, snap) is a short timed state machine, with `requestAnimationFrame` only if CSS can't sequence it. Style changes go through the CSSOM, so the CSP is fine.
- **"Protein was added":** keep `{date, lastTotal}` on the phone (localStorage, not in backups). On Home mount and on each total change, play once if today's total is above `lastTotal`, then save the new total. This also catches food added on the Food screen. First load of the day: just set the level, no animation.
- **Goal flag:** `{date, goalShown}` in the same place. The sequence plays once when the total crosses the goal and the flag is unset. After that, show the empty bottle.

### Traps
- Performance: animate only transform and opacity; stop timers on unmount; no loop while idle.
- Reduce Motion: the existing CSS rule and `reducedMotion()` in `confetti.ts` cover CSS only; the JS sequence must check it too.
- Accessibility: `role="img"` with the text summary; the animation is `aria-hidden`; "Goal reached" is also text, not drawing only.
- Over 100%: cap the drawing, show true grams.
- Target change mid-day (weight update): if the goal rises after "reached", keep it reached today; if it falls, don't replay.
- Deleting food after goal: stay empty and reached for the day (owner's rule); the grams text still shows the true total.
- Date rollover: key everything by day; the app already has `useNow`, so a bottle left open past midnight refills.
- Milestone pop-ups: don't start the sequence while a pop-up is open; wait for it to close.
- Backup/restore must not replay animations (the flag isn't backed up; fine).

### Questions for the owner
1. Should "Goal reached" count if protein is later edited down? Suggested: yes, stays for the day.
2. Should a tap on the shaker open Food? Suggested: yes, same as the tile.
3. A small replay for the goal sequence? Suggested: no.

### Fresh ideas (optional)
- Shaker on the Food screen header too, still (no animation).
- A faint "last 7 days" row of tiny bottles.
- A quiet haptic tick on shake where the phone supports it.

## After-build improvements and follow-ups — 2026-11-28

**What landed:** the Home protein ring is now the owner's shaker, with shake on add, a once-a-day goal sequence, and "Goal reached ✓" (381 tests pass; mocked iPhone pass fine).

1. **Smoother motion (I-92).** Each frame redraws the SVG. If the real phone stutters, drive one grouped transform instead. Add "shaker smoothness" to the real-iPhone check (I-59).
2. **Interrupted sequences (I-93).** Pause the goal sequence if a pop-up opens, and mark it seen only when it finishes, so a closed app still shows it once.
3. **Empty bottle reads as "done" (I-94).** After the goal the bottle is empty, which could look like "nothing logged". A soft lid tint would separate them, with no new wording.

**Felt off (from the notes; no screenshots checked here):** with no replay button, the only way to see the sequence again is a new day. A Settings "Preview" (I-74) would also help the real-phone check.
