# GLP-1 Tracker — Product & Technical Plan (v1)

Status: **Draft — awaiting owner approval**
Owner decisions captured: 2026-11-25

## 1. Decisions from the owner

| # | Topic | Decision |
|---|-------|----------|
| 1 | Audience | Personal use only for now; may expand later |
| 2 | Platform | Installable web app (PWA) first, App Store app later |
| 3 | Data | Stored on the device only; cloud sync maybe later |
| 4 | Medication | Wegovy injections only (see note below) |
| 5 | Dosing | Log what was taken. No escalation planning — doses are the prescriber's call |
| 6 | Side effects | Logging plus mitigation tips |
| 7 | Workouts | As basic as possible, no gym (bodyweight + walking) |
| 8 | Nutrition | Calorie and macro targets plus daily totals |
| 9 | Integrations | None for v1; PDF summary export later |
| 10 | Budget / style | As cheap as possible; clinical and calm look; no name yet |

> **Note on #4:** Wegovy injections are taken **weekly**, not monthly. The plan assumes weekly dosing. To be confirmed by the owner.

## 2. Scope

### v1 (MVP)
1. **Profile & targets** — height, starting weight, goal weight, age, sex, activity level, injection weekday. Units: lb/in by default, kg/cm available.
2. **Injection log**
   - Date/time, dose (Wegovy pen strengths 0.25 / 0.5 / 1 / 1.7 / 2.4 mg, plus "other" free entry), site, notes.
   - Body-map site picker with rotation: L/R abdomen, L/R thigh, L/R upper arm. Suggests the site used longest ago.
   - "Next dose due" card. Shows the label's missed-dose guidance (from the Wegovy prescribing information) as text, never a recommendation.
   - Dose history shown as a step line under the weight chart.
3. **Weight & measurements**
   - Weight entries, 7-day moving average, total lost (lb and %), BMI, progress to goal.
   - Tape measurements: waist, hips, chest, neck, upper arm, thigh; waist-to-height ratio.
   - Optional body-fat %. (Progress photos deferred to v2 — they use a lot of device storage.)
4. **Side effects & tips**
   - Quick log: nausea, vomiting, diarrhea, constipation, reflux/heartburn, burping, fatigue, headache, dizziness, low appetite, hair shedding, injection-site reaction, other. Severity 0–5.
   - Chart of symptoms by "days since last dose" to show patterns.
   - Tip card for each symptom (plain-language, conservative, sourced from label/patient guidance).
   - **Red-flag box** that is always visible on side-effect screens: severe abdominal pain (possible pancreatitis), right-upper pain / yellow skin (gallbladder), unable to keep fluids down, neck lump / trouble swallowing, vision changes, signs of allergic reaction → "Contact your doctor / seek urgent care."
5. **Nutrition**
   - Targets calculated, editable:
     - Calories: Mifflin-St Jeor BMR × activity factor − a moderate deficit, with a floor (no target below a safe minimum).
     - Protein: ~1.2–1.6 g per kg of goal body weight (default 1.4), to protect muscle.
     - Fat: ~25–30% of calories. Carbs: the remainder. Fiber: 25–30 g. Water: target in oz/L.
   - Food log: manual entry (name, calories, P/C/F), **"My Foods" favorites** for one-tap re-logging, and **free food search via Open Food Facts** (no API key, no cost).
   - Daily rings/bars: calories and macros, target vs. total. Low-appetite warning when protein is consistently under target.
6. **Workouts (basic, no equipment)**
   - One beginner bodyweight routine, 3×/week, ~20 min: chair squats, wall/incline push-ups, glute bridges, bird-dogs, step-ups (stairs), plank. Simple progressions (reps → harder variation).
   - Daily step/walk goal (manual entry).
   - Workout log: done / not done + optional notes. "Take it easy" hint for the 1–2 days after an injection if fatigue is logged.
7. **Today dashboard** — next dose, today's macros, water, workout, quick-log buttons.
8. **Backup** — export/import all data as a JSON file. Required because data lives only on the device.
9. **Disclaimer** — first-run screen and in Settings: not medical advice, does not recommend doses.

### v2 (later)
- PDF summary for doctor visits (weight, doses, symptoms, measurements).
- Barcode scanning for food.
- Progress photos.
- Reminders (see §4 caveat).

### v3 (later)
- App Store build (Capacitor wrapper around the same code) → native local notifications, Apple Health.
- Optional cloud sync and accounts.
- Other medications (Zepbound/Mounjaro, oral pills, compounded vials with mg ↔ mL ↔ units).

### Out of scope
- Dose escalation planning or dose advice.
- Paid food databases.

## 3. Technical design

| Concern | Choice | Why |
|---|---|---|
| Framework | Vite + React + TypeScript | Fast, standard, easy to wrap with Capacitor for the App Store later |
| Styling | Tailwind CSS | Quick, consistent, calm design system |
| Storage | IndexedDB via Dexie | On-device, structured, handles years of entries |
| Charts | Recharts | Simple, good enough for trend lines |
| Offline / install | vite-plugin-pwa (service worker + manifest) | "Add to Home Screen" on iPhone, works offline |
| Food search | Open Food Facts public API | Free, no key |
| Hosting | GitHub Pages | Free; static site only |
| Tests | Vitest for calculations (targets, BMI, rotation, due dates) | The parts where a bug actually hurts |

**Cost: $0/month.** Domain optional (~$12/yr). The Apple Developer account ($99/yr) is needed only when the App Store phase starts.

### Data model (IndexedDB tables)
- `profile` — single record: units, height, sex, birth year, activity, goal weight, injection weekday, targets (overridable).
- `injections` — id, datetime, doseMg, site, notes.
- `weights` — id, date, weight, bodyFatPct?
- `measurements` — id, date, waist, hips, chest, neck, arm, thigh.
- `symptoms` — id, datetime, type, severity, notes.
- `foods` — id, name, servingDesc, kcal, protein, carbs, fat, fiber? (the "My Foods" library)
- `foodLog` — id, date, meal, foodId or inline values, servings.
- `water` — id, date, amount.
- `workouts` — id, date, routineId, completed, steps?, notes.

All stored in metric internally; converted at display time.

## 4. Known limitations & risks
- **Reminders on iPhone PWAs:** iOS web apps cannot schedule local notifications without a push server (which costs money and adds complexity). v1 workaround: an **"Add weekly reminder to Calendar"** button (.ics file). Real notifications arrive with the App Store build.
- **On-device storage:** iOS keeps data for installed home-screen apps, but deleting the app or clearing Safari data wipes it. → Regular JSON backups (with a "last backup" reminder in-app).
- **Medical content:** tips and red flags will be conservative and cite the Wegovy label / patient guidance. The owner should review the wording.
- **Name:** check trademarks before any public release.

## 5. Build order (milestones)
1. Project scaffold, PWA install, design system, disclaimer, profile + target calculator (with tests).
2. Injection log + site rotation + next-dose card.
3. Weight & measurements + charts.
4. Side-effect log + tips + red flags.
5. Nutrition: targets, manual log, My Foods, Open Food Facts search.
6. Workouts + Today dashboard.
7. Backup/restore, calendar reminder, deploy to GitHub Pages.
