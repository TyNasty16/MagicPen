# 09-report-questions

## Opening ideas — 2026-11-26

**The request, restated:** The owner wants to type questions for the doctor directly on the report screen, before making the PDF, instead of hunting for them in Appointments.

### Approaches

1. **Write into the latest appointment's questions (synced).** The report screen gets a "Questions for this visit" box that edits the same field Appointments uses.
   - Owner sees: one place to type, and the same text appears in Appointments.
   - Pros: no new storage, one source of truth, no duplicates. Matches today's `lastAppointmentOnOrBefore` logic.
   - Cons: needs a fallback when there is no appointment yet (create one dated today, or hold a draft). Editing while the period changes can silently edit a different appointment.
   - Effort: S–M.

2. **Separate "questions for my next visit" list, not tied to an appointment.** Stored on the device (profile or a new table). After the visit it moves into that appointment.
   - Pros: works with no appointments; clear "next visit" meaning.
   - Cons: two places hold questions, a "move" step is needed, and more to go wrong. Larger change to the data model.
   - Effort: M–L.

3. **Report-only, not saved.** Typed on the report screen, used in the PDF, then gone.
   - Pros: simplest, no data change.
   - Cons: the owner loses text after making the PDF, or if the page reloads. Likely to frustrate.
   - Effort: S.

**Recommended: Approach 1**, with a small draft fallback when there is no appointment. It keeps one source of truth, and nothing is lost.

### Fresh ideas (optional)
- A small line under the box saying where the questions came from, e.g. "From your appointment on 12 Nov", with a link to Appointments.
- Tick-off per question (see I-44), so answered ones drop off the next report.
- A "Clear questions" button after the visit, so old ones don't linger.

### Watch-outs
- **No advice:** the box is the owner's own words only. No suggested questions or prompts about doses.
- **Cleaning:** run input through `cleanText` (`src/lib/appointments.ts`), and keep `buildReport` pure.
- **Length:** cap the length, as Appointments does, so the PDF doesn't overflow.
- **Period changes:** if the end date moves to a different appointment, show which appointment is being edited. Don't swap the text silently.
- **Wording:** "Questions for this visit" is already approved, so reuse it unchanged.
- **Privacy and cost:** on-device only, nothing new, $0.
