# Workflow 08a — Appointments and the Home menu
Status: Built — 2026-11-26
Milestone: Part 1 of 2 of the doctor report (I-37); pulls "PDF summary for doctor visits" (PLAN.md §2, v2) forward. Follows milestone 7 (§5).

## Ideas considered
Ideas files: [docs/ideas/08-doctor-report.md](../ideas/08-doctor-report.md) and the owner's decisions in [docs/ideas/08-doctor-report-brief.md](../ideas/08-doctor-report-brief.md). Chosen approach: the Ideas agent's recommendation, two steps. 08a (this document) adds Appointments and the Home menu; 08b adds the report. Existing code touched: `db.ts` (v8), Home gear button, Profile, Reset all data.

## Goal
Give the owner a place to log doctor visits (with notes and questions for next time) and turn the Home gear into a menu, so 08b can use the last visit as the report's start date.

## In scope
- Dexie v8: new `appointments` table (`++id, date`); older stores unchanged.
- Appointment fields: date (required), who/what, notes, questions for next time (all optional free text). Add, edit, delete (with a confirm).
- Appointments page: list, newest first; each row shows date, who/what, and a "questions open" marker if any.
- Home gear becomes a menu: **Doctor report**, **Appointments**, **Settings**. Doctor report opens a "Coming next" screen until 08b.
- Optional "Your name" field in Profile (stored on the phone only; no date of birth).
- Reset all data also clears appointments and the name.
- Backup/restore does not exist yet (Milestone 7); when it is built it must include appointments and the name.

## Out of scope
- The report, PDF, preview and sharing (08b).
- "Make report for this visit" button (08b, once the report exists).
- Reminders or a Home card before a visit.
- Any suggestions about what to ask or discuss; the app stores only what the owner writes.
- New network calls.

## Exact text for owner review
- Menu items: "Doctor report", "Appointments", "Settings".
- Doctor report placeholder: "Coming next. This will make a summary of your entries to share with your prescriber."
- Appointments empty state: "No appointments yet. Add a visit to keep notes and questions for next time."
- Form labels: "Date", "Who or what (optional)", "Notes (optional)", "Questions for next time (optional)".
- Delete confirm: "Delete this appointment? This can't be undone."
- Profile field: "Your name (optional)", helper: "Printed on reports. Stays on this phone."

## Steps
1. `src/db/db.ts`: add `Appointment` type (`id?, date, who?, notes?, questions?`) and `db.version(8)` with the v7 stores plus `appointments: '++id, date'`.
2. `src/lib/appointments.ts` (new): pure helpers `sortAppointments`, `lastAppointmentOnOrBefore(date, list)`, `cleanText` (trims, strips control characters, length cap).
3. `src/pages/Appointments.tsx` (new) and form sheet: list, add, edit, delete; route added in the app router.
4. Home gear menu: `src/pages/Home.tsx` (and a small `src/components/GearMenu.tsx`); `src/pages/DoctorReport.tsx` placeholder.
5. `src/pages/Profile.tsx` and `Profile` type: optional `name`.
6. Reset: `resetAllData` already clears every table (so `appointments`) and the profile row (so `name`); confirm in the browser pass. There is no backup code yet.
7. Tests, one full run and build, one browser pass.

## Acceptance criteria
- Tapping the Home gear opens a menu with Doctor report, Appointments, Settings; each opens the right screen; Doctor report shows "Coming next".
- An appointment cannot be saved without a date; the other fields may be empty.
- Add, edit and delete work and survive a reload; list is newest first.
- A name saved in Profile is shown after reload; cleared when empty.
- Reset all data removes every appointment and the name.
- A v7 database upgrades to v8 with profile, injections, weights, symptoms, photos and measurements intact.
- Works offline; no new network calls; existing tests and the build pass.

## Tests
Automatic (Vitest): sorting; last-appointment lookup (none, one, same day, future-dated ignored); `cleanText` (control characters, trimming, length cap); reset covered in the browser pass (fake-indexeddb is not installed).
By hand (one browser pass, screenshots): v7 to v8 upgrade with real data; menu; add/edit/delete; name in Profile; reset; no outside requests; no sideways scroll.

## Risks & open questions
- Proposed defaults, reply "defaults OK":
  - Appointments sit in the gear menu, not on the bottom tab bar.
  - Future-dated appointments are allowed (for questions ahead of a visit); 08b only uses past ones as "since".
  - Notes and questions are plain text, capped at 2,000 characters each.
  - Delete asks once to confirm.
  - Name is not required and has no format rules.
- Reply "approve the exact text" or give changes to the wording above.
- Menu order: Doctor report, Appointments, Settings. Different order?

## Build notes (2026-11-26)
- Built as planned: Dexie v8 `appointments`; `Profile.name` (cleaned on save, cleared by reset); `src/lib/appointments.ts` with tests; Home gear → menu (Doctor report, Appointments, Settings); Appointments list and form; Doctor report placeholder.
- Browser pass: v7 → v8 upgrade kept data; menu items 48 px, Escape and tapping outside close it; add / edit / delete; list newest first with a "Questions open" marker; name cleaned ("Alex Sample"); reset emptied appointments and the profile; no outside requests; no sideways scroll.
- Code review fixes: rows show the "Questions open" marker as planned (the note preview was removed); the menu is a plain disclosure (no menu-role announcement) and closes when focus tabs out; the date error clears when a date is picked.
- Owner change after the build (2026-11-26): the menu button shows a standard three-line menu icon instead of the gear.
- Not changed: the delete message uses the app's usual curly apostrophe (can’t), as in all other messages; the Settings link has no "back to Home" (Settings has no back button today).

- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
**What it adds:** A place to log doctor visits. For each visit you record the date, who or what it was for, notes, and questions for next time. The Home gear button becomes a menu: Doctor report, Appointments, Settings. Doctor report shows "Coming next" for now. You can also add an optional name in Profile, kept only on this phone.

**Cost:** Nothing.

**What could go wrong:** Entries live only on this phone, and there is no backup yet, so a lost or reset phone loses them. Deleting an appointment cannot be undone.

**You need to decide:**
- Reply "defaults OK" to accept: Appointments in the gear menu (not the bottom bar); future visits allowed; notes and questions up to 2,000 characters each; one confirm before delete; name optional with no format rules.
- Menu order: Doctor report, Appointments, Settings. Keep it, or change it?
- Approve the exact wording, or ask for changes.

## Approval
- [x] Approved by owner — date: 2026-11-26 (defaults OK; exact text approved)
