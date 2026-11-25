# Ideas — 06 Workouts + Today dashboard

## Opening ideas — 2026-11-25

**The request, restated:** Build Milestone 6: a basic no-equipment workout routine with a log and manual step goal, plus a "Today" view that pulls dose, macros, water, workout and quick-log together.

### Approaches

1. **Workout card on Home, no new tab (Today = upgraded Home).** Home gains a "Today's move" tile (done / not done, steps) that opens a routine screen, like Food does. Owner sees: the same five tabs, one calmer Home. Pros: no tab-bar crowding; Home already is the Today dashboard. Cons: Home gets longer. Effort: M. **Recommended** — Home already holds dose, rings, water, quick add; a new tab would duplicate it and crowd five tabs.
2. **New "Move" tab (six tabs).** Owner sees: a dedicated place for routine, history, steps. Pros: room to grow. Cons: tight on a phone, pushes toward coach-app territory. Effort: M-L.
3. **Fold into Doses/Body tab.** Workouts sit as a section in Body. Pros: no new tab. Cons: hard to find, not a daily action. Effort: S-M.
4. **Minimal: log only.** Tick "did my workout" and a steps number, with the routine as a static how-to page. Pros: smallest, least advice. Cons: less helpful on the day. Effort: S.

**Sub-choices.** Steps: one manual number per day plus a goal the owner sets (never suggested by the app). Timer: skip in v1; the routine is rep-based, and a plank timer could come later. Routine page: static list with one tick per exercise, and a "harder version" note the owner switches by hand.

### Fresh ideas (optional)
- **Muscle-protection nudge as a view, not advice:** show protein and workout days side by side in a weekly strip, with no commentary.
- **Low-energy day:** one-tap "rest day" in the workout log that is not counted as a miss, so streak guilt never appears.
- **Link to the "barely ate" marker:** show that marker on the same day row in history so patterns are visible; no auto-advice.
- **Dose-day context chip:** show "injection day +1" next to the workout tile as a fact.

### Watch-outs
- **Exercise how-tos need sources:** instructions and progressions must come from cited official sources (NHS, CDC, or similar), approved by the owner. If none are found, show only exercise names plus a link out.
- **"Take it easy" hint is advice.** Safest option: drop it, or show only a factual line quoting a cited source (for example the Wegovy label's fatigue wording). Needs sourced wording; the owner decides.
- **Not a coach:** no targets suggested, no "you should", no dose-related links.
- **Tab bar:** keep five tabs.
- **Dexie v7:** adds a `workouts` table (date, completed, steps, notes) plus a goal setting. resetAllData clears it automatically; check the export and backup code includes it.
- **Privacy/cost:** all local, $0, no video hosting. Use text or link-outs only.
