# 12 — Milestone celebrations

## Opening ideas — 2026-11-27

**The request, restated:** Add calm "well done" moments when the owner's own logs pass a round number (weight, injections, logging habits, time on treatment). This is idea I-63; it pairs with I-38 (Insights).

Data check: everything needed is already stored (`injections`, `weights`, `symptoms`, `foodLog`, `water`, `dayMarks`, `profile.startWeightKg`). No new health data is needed. The only new thing to store is "which milestones were already shown".

### 1. Candidate milestones

| Category | Example thresholds | Note |
|---|---|---|
| Weight lost (from start weight) | 1, 2, 5, 10 kg (or 2, 5, 10, 20 lb); 5% and 10% of start weight | Use the owner's units. Count the best weight ever, not today's. |
| Injections logged | 1st, 4th, 8th, 12th, 26th, 52nd | Counts only. Never doses. |
| Injection-day consistency | 4 or 8 injections in a row within 1 day of the set weekday | Phrase as "on your usual day", not "on time". |
| Logging streaks (food, water, symptoms) | 3, 7, 14, 30 days with any entry | A "barely ate" mark counts as logged but never earns food praise. |
| Weigh-in consistency | 4, 8, 12 weeks with a weigh-in | Weeks, not days. |
| Time on treatment | 1 month, 3, 6 months, 1 year since first injection | Pure calendar. |
| Other | First photo, first doctor report made, first backup, first appointment logged, first full week of symptom logging | Rewards using the tools, not outcomes. |

### 2. How they appear

- **A. Calm card on Home (recommended).** One slim card, "4 weeks in a row of logging your weight", with "Thanks" to dismiss. At most one at a time. Pros: matches the style, easy to build. Cons: easy to miss. Effort S.
- **B. One-time toast.** Pops on save. Pros: immediate. Cons: fleeting, can feel noisy. Effort S.
- **C. "Milestones" list in the menu.** A plain dated list of what you have reached. Pros: always there to revisit, never nags. Cons: needs a screen. Effort M.
- **D. Badge shelf.** Grid of icons. Pros: fun. Cons: implies "missing" badges, which is pressure; off-style. Effort M/L.
- **Best combo:** A plus C. The card shows once and is dismissed. It is then kept in the list.
- **Remembering:** store a small list of earned items (id and date) in the profile. A milestone is "earned" the moment it first shows. It is never recomputed afterwards.

### 3. Traps

- **Dose-neutral:** no milestone mentions mg, a dose step, or a higher dose. Injection counts and weekday only.
- **Weight:** celebrate only "reached", never "not yet" or "X kg to go". Goal weight is not used.
- **Regain:** earned items are stored and never removed, and nothing says "lost again".
- **Disordered eating:** a Profile switch, "Show milestones", on by default. Never praise eating less, low calories, or the "barely ate" mark. Consider no weight milestones if the owner turns weight ones off separately.
- **Streak breaks:** no "streak lost" text. Show "longest run: 12 days" only. Prefer "days logged this month" over streaks.
- **Missed injections:** no consistency item can show a miss. A late dose just does not extend the run, silently.
- **Restore and backup:** a restore must not re-fire everything. On restore, mark everything already earned as seen. Keep the earned list in the profile so it travels with the backup.
- **Privacy:** no notifications and nothing on the lock screen. Shown only inside the open app. Nothing is sent anywhere. Any share button is out of scope.
- **Medical wording:** none needed. Keep text to facts ("12 injections logged"). If any health claim is wanted, it needs sourced wording.

### 4. Questions for the owner (one at a time, with a suggested answer)

1. Home card plus a Milestones list in the menu? *Suggested: yes.*
2. Which categories first? *Suggested: injections logged, weigh-in weeks, logging days, time on treatment, weight lost.*
3. Include weight-lost milestones at all? *Suggested: yes, with their own off switch, default on.*
4. Percent milestones (5%, 10%)? *Suggested: no, kg or lb only, to keep it simple.*
5. Streaks or "days logged"? *Suggested: weekly or total counts, not daily streaks.*
6. Card dismissed once, or stays until tapped? *Suggested: stays until tapped.*
7. Any confetti or animation? *Suggested: no, a quiet check mark, and respect reduced-motion.*
8. Should a tool-use milestone (first backup, first report) count? *Suggested: yes, a few.*
9. Should earning be backdated when the feature first arrives? *Suggested: show nothing old, record it silently, and show only new ones.*

### 5. Fresh ideas (optional)

- A single weekly "This week" line: "3 days logged, weigh-in done".
- Quiet "first anniversary" card showing counts only.
- Pair with I-38 so Milestones is a tab inside Insights.
- A "Clear milestones" button for a fresh start.

### Watch-outs

Rules touched: dose-neutral, no advice. Privacy: all local, stored in the profile. Cost: $0. Backup: the new profile field must be included in backup and restore, with a version bump to the stored shape.
