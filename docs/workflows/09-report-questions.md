# Workflow 09 — Add questions on the report screen
Status: Built — 2026-11-26
Milestone: Follow-up to the doctor report (08a/08b, PLAN.md §2 "PDF summary for doctor visits"); owner request 2026-11-26.

## Ideas considered
Ideas file: [docs/ideas/09-report-questions.md](../ideas/09-report-questions.md). Chosen approach: (a), write into the questions of the appointment the report already uses, with a small draft on the profile when there is no appointment. Existing code touched: `DoctorReport.tsx`, `report.ts` (questions section), `appointments.ts`, `db.ts`, the appointment form.

## Goal
Let the owner type questions for the doctor on the report screen, before making the PDF, without opening Appointments first.

## In scope
- In the "Questions for this visit" preview card: an editable box. It writes to the `questions` field of the appointment the report uses (the latest one on or before the period end).
- Saved automatically about 1 second after typing stops; also saved when leaving the screen or tapping "Make PDF and share". The preview and PDF show the saved text.
- A source line under the box saying where the text is stored.
- No appointment on or before the period end: the text is kept as `questionsDraft` on the profile and printed instead. No new table, no database version change.
- When the owner adds an appointment, the draft fills that form's "Questions for next time" box and is cleared once the appointment is saved.
- `cleanText` and the 2,000-character cap (`TEXT_MAX`) apply on save. Reset all data already clears the profile and appointments, so the draft goes too.

## Out of scope
- Creating an appointment from the report (it would move "since last appointment" to today and empty the report).
- Suggested questions, prompts or tick-off per question (I-44).
- Editing notes, date or "who" on the report screen.
- Any advice or dose wording; the app stores only the owner's words.
- New network calls.

## Exact text for owner review
- Box label: "Your questions for this visit"; hint inside the box: "One question per line".
- Source line, appointment found: "Saved to your appointment on Nov 12, 2026." (the real date, in the report's date style)
- Source line, no appointment: "Saved on this phone. It will be added when you add your next appointment."
- Status next to the box: "Saved", or on failure "Couldn’t save. Please try again." (no "Saving…" state).
- The existing card title "Questions for this visit" and "No questions saved." are unchanged.

## Steps
1. `src/db/db.ts`: add optional `questionsDraft?: string` to `Profile` (no new Dexie version; profile is keyed by id only). Add `saveReportQuestions(target, text)`: cleans with `cleanText`, then puts the appointment's `questions`, or the profile's `questionsDraft`; empty clears it.
2. `src/lib/report.ts`: the questions section uses the appointment's text, or `profile.questionsDraft` when no appointment is on or before the period end. Add a small pure helper `questionsTarget(end, appointments)` returning the appointment or none. `buildReport` stays pure.
3. `src/pages/DoctorReport.tsx`: add the box and the source line, with one `flush()` helper used by every save trigger (1 s after typing stops, before "Make PDF", on leaving, on a period change). When the period change selects a different appointment, save the old text to the old appointment first, then load the new one; the source line shows which date is being edited.
4. `src/pages/Appointments.tsx` form: when adding and a draft exists, prefill "Questions for next time"; on save, clear the draft in the same transaction.
5. Tests, one full run and build, one browser pass.

## Acceptance criteria
- With an appointment on 12 Nov and a period ending today, typing "Ask about nausea" and pausing shows "Saved" and the preview lists it. Appointments shows the same text on that visit.
- Changing the custom end date to before a different appointment shows that appointment's date and its text; the first one keeps what was typed.
- With no appointment, typed text appears in the preview and PDF, shows the "Saved on this phone" line, and survives a reload. No appointment is created.
- Adding an appointment afterwards shows the draft in its questions box; after saving, the draft is gone and the report reads it from the appointment.
- Text over 2,000 characters is cut at 2,000; control characters are removed; clearing the box clears the saved text.
- Reset all data removes the draft. Works offline; no new network calls; existing tests and the build pass.

## Tests
Automatic (Vitest): saving goes to the right appointment (latest on or before the end; future-dated ignored); no appointment uses the draft path and the report reads it; a period change follows the right appointment; `saveReportQuestions` applies `cleanText` (already tested in 08a) and empty clears. `buildReport` questions section for appointment, draft, and neither.
By hand (one browser pass, Playwright `devices['iPhone 13']` with `tap()`): two screenshots (no appointment; appointment with a period switch); checks that the text saves, the preview updates, Make PDF includes it, and no outside requests.

## Risks & open questions
- Proposed defaults, reply "defaults OK":
  - Auto-save after a 1-second pause (no Save button), with the "Saved" status shown.
  - No appointment: a draft on the profile; it prefills the next appointment's questions and is then cleared.
  - Only appointments on or before the period end are written to; future-dated ones are not touched.
  - Plain text, 2,000-character cap.
- Reply "approve the exact text" or give changes to the wording above.
- Editing here changes the appointment's questions everywhere, including old visits when a custom period is chosen. Fine, or ask first? (yes / no)

## Build notes (2026-11-26)
- Built as planned: "Your questions for this visit" box on the report (only for "Since last appointment"); saves automatically about 1 s after typing stops, on leaving the box, before Make PDF, on leaving the screen and when switching to custom dates — all through one `flush()`. With no appointment, the text is kept as `questionsDraft` on the phone and prints; a new appointment dated today or earlier takes it (the draft is then cleared). The preview and PDF use the box's text straight away.
- iPhone-emulation pass (tap): draft saved and printed in the PDF; new appointment prefilled and draft cleared; the report then edits that appointment ("Saved to your appointment on …", "Saved"); custom dates hide the box but still show the questions; no outside requests.
- Code review fixes: a future-dated first appointment no longer swallows the draft (it moves only into a visit dated today or earlier); typing isn't lost if the appointment list changes while the screen is open (saved to the old visit first); text typed into a new appointment before the draft loads is kept and joined; no double save on Make PDF; "Saved" is announced to screen readers and the box is linked to its source line; a save error stays visible after switching to custom dates.

- Token Steward: before start (applied: one flush() helper; "Saving…" state dropped; two screenshots; cleanText not re-tested. Not applied: dropping the failure message — a silent failed save could lose the owner's questions)
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
**What it adds:** A box on the doctor report screen for typing questions for the visit.

**Where it's saved:**
- If an appointment falls on or before the report's end date, the questions go into it.
- Otherwise they stay on this phone until your next appointment is added.

**Cost:** Nothing. It works offline and sends nothing new anywhere.

**What could go wrong:**
- If a save fails, you'll see "Couldn't save. Please try again."
- If you choose an older custom date range, edits change that older visit's questions too.

**You need to decide:**
- Are the proposed defaults OK? (auto-save after a pause, phone-only draft, future visits untouched, plain text, 2,000-character limit)
- Should report edits change older visits when a custom date range is chosen? (yes / no)
- Do you approve the exact wording, or do you want changes?

## Approval
- [x] Approved by owner — date: 2026-11-26 (defaults OK; exact text approved; answer "No": the box appears only for "Since last appointment", never with custom dates)
