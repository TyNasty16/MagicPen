# Workflow 10b — Weekly injection reminder (calendar file)
Status: Built
Milestone: 7 — Backup/restore, calendar reminder, deploy (PLAN.md §5). Part 2 of 2; independent of 10a, but the button sits on the 10a Backup screen if built after it.

## Ideas considered
Ideas file: [docs/ideas/10-backup.md](../ideas/10-backup.md) (section "Calendar reminder"); owner's fixed decisions: [docs/ideas/10-backup-brief.md](../ideas/10-backup-brief.md) item 11. Chosen approach A: a small separate build. Existing code reused: `src/lib/shareReport.ts` (made file-type aware), profile `injectionWeekday` (0 = Sunday), `WEEKDAYS` in `src/lib/nextDose.ts`.

## Goal
A button creates a weekly all-day calendar event on the owner's injection weekday, built on the phone and handed to the phone's Calendar. Off unless tapped.

## In scope
- Button "Add weekly injection reminder to Calendar" with a short note beneath it.
- `.ics` file made on the phone: one all-day event, `RRULE:FREQ=WEEKLY;BYDAY=<day>`, starting on the next occurrence of the weekday (today counts).
- Shared or downloaded with the same helper as the report (Web Share with the file, else download).

## Out of scope
- Time of day, alarms or notifications, dose, drug or any medical text in the event.
- Updating or removing an event already in the Calendar if the weekday changes.
- Any push or background reminder from Steady itself.

## Steps
1. `src/lib/calendar.ts` (new, pure): `buildInjectionIcs(weekday, today, uid)` returns the file text (CRLF lines, `VCALENDAR` 2.0, `PRODID:-//Steady//EN`, `VEVENT` with `UID`, `DTSTAMP`, `DTSTART;VALUE=DATE`, `RRULE`, `SUMMARY`, `TRANSP:TRANSPARENT`).
2. `src/lib/shareReport.ts`: add an optional file-type parameter (default PDF, existing calls unchanged); reuse for `text/calendar`.
3. Button and note on `src/pages/Backup.tsx` (default; see questions). If there is no injection weekday, the button is disabled with: "Choose your injection day in Profile first."
4. Tests, one full run and build, one browser pass.

## Exact text for owner review
- Button: "Add weekly injection reminder to Calendar"
- Note: "Makes a repeating all-day event on your injection day. It has no dose or medicine in it. Tapping again adds another copy, and changing your injection day later does not change the event already in your Calendar."
- Event title (SUMMARY): "Injection day (Steady)"
- Event description: none.
- File name: `Steady-injection-day.ics`
- Share title: "Injection day reminder"
- Fallback message: "Sharing isn't available here. The calendar file was downloaded instead."

## Acceptance criteria
- With injection day Monday and today Wednesday 2026-12-02, the file has `DTSTART;VALUE=DATE:20261207`, `RRULE:FREQ=WEEKLY;BYDAY=MO` and `SUMMARY:Injection day (Steady)`.
- Today being the injection day starts today.
- Every weekday 0 to 6 maps to SU, MO, TU, WE, TH, FR, SA.
- Lines end in CRLF; the file has no dose, drug name or time of day.
- No weekday set: button disabled with the message above.
- On a phone the share sheet offers Calendar; on desktop the file downloads.
- Nothing is sent over the network; works offline; existing tests and the build pass.

## Tests
Automatic (Vitest): weekday mapping, next-occurrence date including month and year rollover, CRLF and required fields, text guard `/dose|mg|increase|decrease|raise|lower|skip|escalat|titrat|should|recommend/i` over the strings, report sharing unchanged.
By hand: browser pass (button, disabled state, download on desktop). On the real iPhone after deploy: tap, "Add to Calendar", confirm a weekly all-day event on the right day.

## Risks & open questions
- iPhone may open the shared file in Files or Mail rather than Calendar; "Add to Calendar" or opening the file from Files then works. Needs the real phone.
- Duplicate events if tapped twice (stated in the note).
- Proposed defaults, reply "defaults OK":
  - ~~The button lives on the Backup screen~~ → **Owner change (2026-11-27): the button lives on the Doses screen, directly under the "Next injection" card** (where the injection day is shown).
  - All-day event, title "Injection day (Steady)", no alarm.
  - Starts on the next injection weekday.
- Reply "approve the exact text", or give changes to the wording above.
- Question: Put the button in Settings instead? (default: Backup screen)

## Review checkpoints
- Token Steward: before start (applied: shares 10a's single test run, build, browser pass and code review; no separate "report sharing unchanged" test — existing shareReport coverage is enough)
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
- A button on the Backup screen adds a weekly reminder to your phone's Calendar.
- It creates one repeating all-day event on your injection day, titled "Injection day (Steady)". It has no dose, medicine name or time in it.
- Tapping again adds another copy. Changing your injection day later does not change the event already in your Calendar.
- If no injection day is set, the button is turned off and asks you to choose one in Profile first.
- On a phone, the share sheet should offer Calendar. This is not yet tested on a real iPhone; it may open in Files or Mail instead.

**You need to decide:**
- Whether the button goes on the Backup screen (the default) or in Settings.
- Approve the exact wording.

## Approval
- [x] Approved by owner — date: 2026-11-27 (exact text approved; owner: "this button should not be in back up" — moved to the Doses screen, under the Next injection card)

## Build notes (2026-11-27)
- The button sits on the Doses screen under Next injection (the owner's change at approval). The calendar code is in `src/lib/calendar.ts`, with 3 tests.
- If iPhone needs a second tap to share, the screen says: "Tap the button again to add it to Calendar." The owner approved this text on 2026-11-27.
- Needs a real-iPhone check that the Share sheet offers Calendar for the .ics file.

## Release (2026-11-27)
Merged in PR #13. The owner tested on a real iPhone (connect, back up, restore, Calendar), and all checks passed.
