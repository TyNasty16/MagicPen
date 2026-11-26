# I-37 Doctor report (PDF) — owner brief from the grilling session (2026-11-26)

Decisions the owner made, question by question. These are requirements for the Ideas agent and Workflow Planner, not suggestions.

1. **Reader:** mainly the owner's prescriber at check-ins (main focus); also the owner's own record.
2. **Period:** defaults to "since a date" (last appointment); can switch to a custom start and end date.
3. **Since-date source:** a new **Appointments** list (logged visits). The report's "since" defaults to the last appointment's date.
4. **Appointment entry:** date (required); who/what (optional); notes (optional, free text); questions for next time (optional). Open questions print at the top of the report; past appointment notes are left out by default (switch to include). App stores what the owner writes; never suggests anything.
5. **Contents, in order:**
   1. Header — dates covered, medicine, start date, date made
   2. Questions for this visit
   3. Medicine and doses — current dose, each dose/medicine change with date, injections logged, gaps over 7 days (facts)
   4. Weight — start of period, now, change (lb and %), BMI, change since start, small chart
   5. Side effects — each symptom: days logged, highest severity (1–5); "Take a closer look" alerts that appeared
   6. Food and protein — averages vs targets over logged days, days logged, "barely ate" days
   7. Measurements — start vs now (if any)
   8. Footer — "Made with Steady from the owner's own entries. Not medical advice."
   Off by default (switch on): photos, individual food items, water, past appointment notes.
6. **Name:** optional name in Profile, stored on the phone only, printed on every report, cleared by reset. No date of birth.
7. **Making and sharing:** a real PDF built on the phone with a small, lazy-loaded, security-checked library (vulnerabilities, signatures/provenance, output sanitising — as done for ZXing). A preview screen first, then the iPhone Share menu (Files, AirDrop, Mail, Messages, Print). Preview says that once shared, the PDF is outside the app.
8. **Little or no data:** averages use logged days only and say so ("from 9 of 28 days logged"); "barely ate" days counted separately; a section with nothing logged shows one line rather than vanishing; one weigh-in shows the weight with no change. **Units: pounds only** (follows Profile units; no second unit).
9. **Sections and "limited data":** every section has an on/off switch on the preview. Sections with limited data are flagged (amber, a data gap — never a health concern) and the owner chooses whether to include them. Rules:
   - Weight and measurements: limited unless there is **at least one entry in every week** between appointments.
   - Food and protein: logged on fewer than half the days.
   - Side effects: none logged.
   - Doses: a gap over 7 days between logged injections.
   Default switches for flagged sections: off for food, measurements and weight; on for doses and side effects. An included flagged section carries a neutral line on the PDF ("Logged on 9 of 28 days").
10. **Look and entry point:** **Warm Sand, the same as the app.** The Home gear button becomes a **menu** with **Doctor report** and **Settings** as separate items (more items may come). Assumed (owner may change at plan stage): **Appointments** also lives in that menu, and each appointment has "Make report for this visit".

Product rules still apply: logs only, never dose advice; data stays on the device; $0; no third-party calls added.
