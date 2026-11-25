# Workflow 01 — Foundation: scaffold, PWA, design system, disclaimer, profile + targets
Status: Built — 2026-11-25
Milestone: 1 — Project scaffold, PWA install, design system, disclaimer, profile + target calculator (with tests)

## Goal
Stand up an installable, offline-capable app shell with a calm design system, a first-run disclaimer, and a profile screen that computes daily nutrition targets using tested pure functions.

## In scope
- Vite + React + TypeScript, Tailwind, Dexie, vite-plugin-pwa, Vitest.
- Vite `base` configurable so the build works under GitHub Pages (a sub-path) later.
- PWA manifest, icons, service worker; "Add to Home Screen" works and the shell loads offline.
- Minimal design system: color/type tokens (clinical, calm), a few primitives (Button, Card, Field, Select, Banner), simple app shell with bottom tab/nav placeholder.
- Disclaimer: first-run full-screen acknowledgment (stored on-device) and a Settings page copy. Wording: not medical advice; the app logs doses and never recommends them.
- Dexie database with the `profile` table only (single record, metric internally).
- Profile screen: units (lb/in default, kg/cm), height, starting weight, goal weight, age (stored as birth year), sex, activity level, injection weekday.
- Target calculator (pure functions in `src/lib/targets.ts`) and a targets display on the profile screen with per-value manual override.
- Unit conversion helpers (lb↔kg, in↔cm, oz↔L).

## Out of scope
- Injection, weight, measurement, symptom, food, water, workout tables and screens.
- BMI, waist-to-height, charts, Today dashboard.
- Backup/restore, calendar reminder, GitHub Pages deploy and CI (milestone 7).
- Reminders/notifications, analytics, any network calls.
- Dose logic of any kind.

## Steps
1. Scaffold Vite React-TS project at repo root; add Tailwind, Dexie, vite-plugin-pwa, Vitest (+ Testing Library only if needed). Files: `package.json`, `vite.config.ts`, `tsconfig*.json`, `tailwind.config.*`, `index.html`, `.gitignore`.
2. Set `base` from an env var (default `/`), so the same build can target `/<repo>/`. File: `vite.config.ts`.
3. Configure PWA manifest (name, theme color, standalone display, icons 192/512 + maskable) and service worker precache. Files: `vite.config.ts`, `public/icons/*`.
4. Design tokens and primitives. Files: `src/index.css`, `tailwind.config.*`, `src/components/ui/*`.
5. App shell and minimal routing (hash-based, so it works on static hosting). Files: `src/App.tsx`, `src/main.tsx`, `src/pages/*`.
6. Dexie setup with `profile` table and typed get/save helpers. File: `src/db/db.ts`.
7. Units helpers with tests. Files: `src/lib/units.ts`, `src/lib/units.test.ts`.
8. Target calculator with tests (see rules below). Files: `src/lib/targets.ts`, `src/lib/targets.test.ts`.
9. Disclaimer gate (first run) and Settings disclaimer copy. Files: `src/pages/Disclaimer.tsx`, `src/pages/Settings.tsx`.
10. Profile screen: form, validation, save to Dexie, live targets preview, override fields with "reset to calculated". File: `src/pages/Profile.tsx`.
11. Hand-check: build, preview, install to home screen, go offline, reload.

**Calculator rules (all inputs metric):**
- BMR (Mifflin-St Jeor): 10·kg + 6.25·cm − 5·age + 5 (male) or − 161 (female), using current (starting) weight.
- TDEE = BMR × activity factor (sedentary 1.2, light 1.375, moderate 1.55, active 1.725).
- Calories = TDEE − moderate deficit (20% of TDEE, capped at 750 kcal), never below the floor (1,200 female / 1,500 male).
- Protein = 1.4 g × goal weight kg (user-adjustable 1.2–1.6).
- Fat = 27.5% of calories ÷ 9. Carbs = remaining calories ÷ 4 (never negative).
- Fiber = 28 g. Water = 30 mL per kg of current weight (shown in oz or L by unit setting).

## Acceptance criteria
- `npm run build` and `npm test` pass; app runs with `npm run dev`.
- Building with base `/steady/` produces asset paths under `/steady/`.
- Installed to iPhone home screen, the app opens standalone and loads with airplane mode on.
- First launch shows the disclaimer; the app is unusable until acknowledged; it does not reappear afterward; the text is viewable in Settings.
- Profile persists across reload; switching units converts displayed values without changing stored metric values.
- Example: male, 40, 180 cm, 100 kg, light activity: BMR 1,930, TDEE ≈ 2,654, calories ≈ 2,123 (20% deficit).
- A small/sedentary profile never yields calories under the floor.
- Overriding a target persists; "reset" returns to the calculated value.
- No network requests are made at runtime (check browser dev tools).

## Tests
Automatic (Vitest): unit conversions and round-trips; BMR for both sexes against hand-computed values; each activity factor; deficit cap; calorie floor; macro math (calories from P/C/F sums to target within rounding); carbs never negative; protein from goal weight; water in oz vs L.
By hand: PWA install and offline on iPhone Safari; disclaimer gate; profile form on a phone-width screen; unit toggle; override/reset.

## Risks & open questions
**Proposed defaults — owner can reply "defaults OK" or change any:**
- Deficit: 20% of TDEE, capped at 750 kcal/day.
- Calorie floors: 1,200 (female) / 1,500 (male).
- Sex field: male/female only, because the formula needs it.
- Water: 30 mL per kg of body weight. Fiber: 28 g/day.
- Activity factors: standard values listed above.

Risks:
- Target wording must make clear these are estimates to review with a clinician.
- Placeholder icons (generated by a small script) for now; real artwork later.
- The GitHub Pages path is settled in milestone 7; the env-var `base` in step 2 covers it.

Token Steward trims applied: corrected the worked example; open questions turned into defaults; `npm test` run once after steps 7–8 and once at the end; all hand-checks batched into step 11. (Not applied: running the Explainer only at the end — the owner's process requires it per milestone; it already runs on the cheapest model.)

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
- **What you get:** A phone app you can add to your home screen that opens and works without internet. Before first use, a safety notice says the app is not medical advice and only logs doses, never recommends them.
- **Profile screen:** Enter height, weights, age, sex, activity level and injection day. The app estimates daily targets for calories, protein, fat, carbs, fiber and water. You can override any number and reset it to the estimate.
- **Units:** Switch between pounds/inches and kg/cm. Stored numbers stay the same.
- **Not included yet:** Tracking of injections, weight, food or symptoms; charts; reminders.
- **Risks:** Targets are estimates to review with a clinician. App icons are placeholders for now.

**You need to decide** (proposed defaults):
- Calorie cut: 20% below estimated daily energy use, capped at 750 calories a day.
- Calorie floors: never below 1,200 (female) or 1,500 (male).
- Sex field: male or female only, because the formula needs it.
- Water: 30 mL per kg of body weight. Fiber: 28 g a day.
- Activity levels: standard multipliers.

Reply "defaults OK" or change any of these.

## Approval
- [x] Approved by owner — date: 2026-11-25 (proposed defaults accepted)
