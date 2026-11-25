# Workflow 01b — Dashboard & Warm Sand Design Refresh
Status: Built — 2026-11-25
Milestone: Design refresh between milestones 1 and 2

## Goal
Restyle the app in the owner-chosen "Warm Sand" look and turn the Today list into a Home dashboard of tappable tiles with intuitive navigation. No new data or features.

## In scope
- Design tokens (cream #f7f1ea, cards #fffaf5, ink #3a2a22, muted #86705f, terracotta #b8634a, hero gradient #c8735a to #e3a07f, sage #8fa37a, gold #d8a750), ~22px card radius, soft shadow, serif headings (Georgia / iOS "New York"), system sans body. Light mode only; dark-mode CSS removed.
- Restyled primitives (Button, Card, Field, Banner) and a small inline SVG icon set (no icon library).
- Home dashboard (renamed from Today): greeting + date header with settings gear; hero "Next dose" tile; nutrition tile (calorie ring plus protein/carbs/fat bars, 0 eaten of target); weight tile (start to goal, lb/kg); water tile (target); quick-actions row.
- "Next dose" shows the injection weekday as a schedule: day name plus "today" or "in N days". No dose amount, no advice.
- Tiles for unbuilt features show a calm "Coming soon" state and are not tappable. Incomplete profile: one "Set up your profile" hero tile replaces the tiles.
- Navigation: bottom tab bar with icons (Home, Profile; future tabs added only when their milestone ships); gear opens Settings; tapping a tile opens its screen with a back button in the header; weight and nutrition tiles open Profile. Hash routing kept.
- Restyle Profile, Settings, Disclaimer (no logic changes).

## Out of scope
- New data, logging, or features; dark mode; animations beyond simple CSS transitions.
- Real eaten/weight/water values (shown as 0 or target-only until those milestones).
- Dose amounts, dose advice, or escalation logic.

## Steps
1. One pass on the design system: `src/index.css` (new colors, fonts, radius, shadow; dark-mode block deleted), `src/components/icons.tsx` (home, user, gear, back, syringe, flame, scale, droplet, plus), `src/components/ui.tsx` (restyled Button, Card, Field, Banner; new Tile, CalorieRing, MacroBar, ScreenHeader).
2. Pure helper `src/lib/nextDose.ts` (weekday + today → label and day count) with tests in `src/lib/nextDose.test.ts`.
3. Screens and navigation in one pass: `src/pages/Home.tsx` replaces `Today.tsx`; `src/App.tsx` gets the icon tab bar, gear, back-button header, tile routes, unknown hash → Home; Profile, Settings and Disclaimer restyled (class/markup only).
4. Run tests and build once; one by-hand pass at 390px (layout, tap sizes, focus order, visuals).

## Acceptance criteria
- Home at 390px wide has no horizontal scroll, and the main tiles are visible with little scrolling.
- Injection weekday Thursday viewed on Tuesday shows "Thursday" and "in 2 days"; on Thursday shows "today".
- Hero tile shows no dose amount or advice.
- Complete profile: nutrition tile shows 0 of the target kcal and 0 g of each macro target; weight tile shows start to goal in the profile's unit; water tile shows the target.
- Incomplete profile: only the "Set up your profile" tile appears, and tapping it opens Profile.
- "Coming soon" tiles are not focusable or tappable.
- Gear opens Settings; tile drill-in shows a back button that returns to Home; the tab bar highlights the current tab.
- All tap targets are at least 44x44px.
- Body text contrast is at least 4.5:1 on its background (see risk below).
- No dark styling when the device is in dark mode.
- Existing 22 tests plus new nextDose tests pass; `npm run build` succeeds.

## Tests
- Automated: existing 22 tests; new nextDose tests (same day, next day, wrap past Saturday, all seven weekdays).
- By hand: one combined pass at 390px — layout, tap-target sizes, focus order, Home/Profile/Settings/Disclaimer visuals.

## Risks & open questions
**Contrast (measured):** muted #86705f on cream = 4.16:1 and white on terracotta #b8634a = 4.27:1 — both just under the 4.5:1 readability standard for small text. The darker variants pass: muted #6f5b4c = 5.71:1, terracotta #a85540 = 5.2:1 (with white text). They look nearly identical.

**Proposed defaults — owner can reply "defaults OK" or change any:**
- Use the darker variants for small text and buttons; keep the original colors for large text, gradients and decoration.
- Quick-action buttons for unbuilt features show as "Coming soon" (disabled) until their milestone ships.
- The main tab is named "Home".
- Fonts come from the device (no downloads, keeps it free and offline); the look varies slightly between devices.

Risks:
- Until logging milestones ship, several tiles show targets only or "Coming soon".

Token Steward trims applied: steps batched into one design-system pass and one screens pass; tests/build and by-hand checks run once; questions asked together as defaults; contrast measured instead of estimated; one Home mockup only before building.

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
This redesigns the app's look (cream and terracotta colors, classic serif headings) and turns the "Today" list into a Home screen of tappable tiles.

**What you will see:**
- A "Next dose" tile showing your injection day, such as "Thursday" or "in 2 days." No dose amount or advice.
- Nutrition, weight, and water tiles showing your targets only. Real tracking arrives in later milestones.
- Features not built yet show "Coming soon" and can't be tapped.
- A bottom bar (Home, Profile) and a settings gear.
- If your profile isn't complete, Home shows only a "Set up your profile" tile.

**Cost:** $0. No new data or features are added.

**What could go wrong:** A few text colors were too light to read easily, so darker shades are proposed. Fonts come from your phone, so they look slightly different between devices.

A screenshot of the new Home screen comes with this document.

**You need to decide:** reply "defaults OK," or change any of these:
- Darker shades for small text and buttons (they look nearly the same).
- "Coming soon" buttons for unbuilt features.
- The main tab named "Home."
- Phone-supplied fonts (free, works offline).

## Approval
- [x] Approved by owner — date: 2026-11-25 (defaults OK)
