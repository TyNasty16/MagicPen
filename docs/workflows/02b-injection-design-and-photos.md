# Workflow 02b — Injection design, body map redesign, weigh-in photos
Status: Awaiting approval
Milestone: Design + feature update between milestones 2 and 3 (owner request)

## Goal
Make the body map and Doses screen look sleek and designed, let the owner attach an optional progress photo to a weigh-in (viewable from the weight chart), and make the weekly weigh-in feel important with a weekly Home card. No change to rotation logic or data meaning.

Owner request: "Clean up the body mapping. I want it to look sleek. Yours looks like a robot. And give some design to the injection. Also add the ability to save pictures to the weight chart."

**Owner decisions (all settled, 2026-11-25):**
1. Body map: **Option B, redrawn** — front and back figures (see mockup `option-b-v2`), after web research on other body maps.
2. Doses screen design: summary card, pill dose buttons, timeline history, slide-up log panel — confirmed.
3. Weigh-ins never need a photo (photos are always optional). Photos attach to a weigh-in.
4. New: a **weekly weigh-in card** on Home, on a 7-day cycle starting from the first logged weigh-in.
5. Photos join the backup in Milestone 7.

## In scope
- **Body map** (`BodyMap.tsx`) — Option B, redrawn:
  - Two neutral figures, **Front** and **Back**: sturdy, friendly proportions with rounded shoulders, arms slightly away from the body ending in soft rounded ends at hip height (no wrists or hands — owner request), defined waist and hips, tapered legs. Thin warm outline, soft sand fill.
  - Sites where the Wegovy guides place them: lower abdomen either side of the navel and front-outer thighs on the Front figure; back of the upper arms on the Back figure.
  - Each site is colored by recency: **used recently** (within 2 weeks, light terracotta) or **rested** (light sage); the selected site is solid terracotta with a soft glow; the suggested site has a dashed ring.
  - "Right"/"Left" labels beside each figure (on the Back figure the person's left is on the viewer's left), plus a legend and a "Selected: …" line. The accessible button list stays below as compact chips (44px tall).
  - Rotation logic (`suggestSite`) is untouched.
- **Doses screen** (`Injections.tsx`):
  - Summary header card: next-injection countdown, last dose, last site, with a mini body-map thumbnail highlighting that site.
  - Dose choice as a polished segmented pill row (same doses as now, plus Other).
  - History as a timeline: date, dose badge, site with a small colored site marker, notes.
  - The log form becomes a bottom sheet (no full-screen fallback is built).
- **Weigh-in photos** (`Weight.tsx`, `WeightChart.tsx`):
  - Optional photo on the weigh-in form, via `<input type="file" accept="image/*">` (camera or photo library).
  - Resized on the device to about 1080px on the long edge, saved as JPEG, before storing.
  - Stored in IndexedDB (Dexie v3).
  - Chart shows a small camera marker on days with a photo. Tapping it, or the weigh-in in the list, opens the photo full-screen with date and weight.
  - Photos can be replaced or removed. Deleting a weigh-in deletes its photo.
- **Storage choice:** a separate `photos` table (`weightId` index, `blob`, `createdAt`), not a blob field on `weights`. Reason: the chart and list read every weigh-in on each render, and a blob field would load every photo each time. A separate table keeps those reads small, and the v3 upgrade only adds a table.

- **Weekly weigh-in card** (`Home.tsx`, `src/lib/weighIn.ts`):
  - The weigh-in cycle starts on the first logged weigh-in date and repeats every 7 days (so the weigh-in day is that same weekday).
  - On weigh-in day a green card appears at the top of Home: "Time for your weekly weigh-in", a short line on why it matters, a streak row (last 5 weeks, ✓ per week with a weigh-in) and "N weeks in a row", and two buttons: **Log weigh-in** and **+ Add photo** (opens the weigh-in form with the photo picker ready).
  - It stays until a weigh-in is logged in the current 7-day window. If the day passes without one, it changes to "Still time this week" for the rest of that window.
  - Before any weigh-in exists, the card invites the first weigh-in ("Start your weekly weigh-ins").
  - Card colors are contrast-checked (white text ≥ 4.5:1 across the gradient).

## Out of scope
- Side-by-side photo compare, a gallery screen (suggested later ideas).
- Photos without a weigh-in.
- Push notifications for weigh-in day (an iPhone home-screen web app can't schedule them; the card on Home is the reminder).
- Multiple photos per weigh-in.
- Any change to rotation, dose list, next-dose calculation, or dose recommendations (the app only logs doses).
- Backup of photos (milestone 7 must include them; see risks).

## Steps
1. `src/db/db.ts`: add `Photo` type and `db.version(3)` adding `photos: '++id, weightId'`; keep v1 and v2 declared. Add helpers `getPhoto`, `savePhoto`, `deletePhoto`; make weigh-in delete also delete its photo (one transaction).
2. `src/lib/image.ts`: `fitWithin(w, h, max)` (pure sizing) and `resizeToJpeg(file)` (canvas, about 1080px, quality about 0.8). Handles phone orientation via `createImageBitmap` with orientation applied.
3. `src/components/BodyMap.tsx`: new silhouette and zone paths, selected/suggested styling, labels, chip grid. Same props.
4. `src/components/SiteMarker.tsx` (new): small colored site marker and `BodyThumb` mini map, reused by the summary card and timeline.
5. `src/pages/Injections.tsx`: summary card, pill dose row, timeline history, bottom-sheet form.
6. `src/pages/Weight.tsx`: photo picker, preview, replace/remove in `WeightForm`; camera icon on list rows with a photo.
7. `src/components/PhotoViewer.tsx` (new): full-screen view with date, weight, close and remove. Object URLs are released on close.
8. `src/components/WeightChart.tsx`: camera marker on days with a photo (at least 44px tap area), opens the viewer. `src/components/icons.tsx`: add camera icon.
9. `src/lib/weighIn.ts` (new, pure): current 7-day window from the first weigh-in date, whether this window has a weigh-in, days into the window, streak count. `src/pages/Home.tsx`: weekly weigh-in card.
10. Tests, build, check on a 390px-wide screen, then hand-check offline.

## Acceptance criteria
- At 390px width nothing overflows or needs sideways scrolling; every tap target is at least 44px.
- The body map shows a smooth outline with no rectangles. The selected zone is terracotta with a ring. The suggested zone is dashed with a "Suggested" tag. Labels read "Your right" / "Your left", with right on the viewer's left.
- Tapping a zone or its chip selects the same site; rotation suggestion is unchanged.
- Doses screen shows the summary card (next date, last dose, last site and thumbnail), pill dose row, and timeline history. With no injections it shows a calm empty state.
- Logging, editing and deleting an injection behave as before.
- Choosing a photo of about 4000px saves a JPEG of 1080px or less on the long edge.
- A weigh-in saved with a photo shows a camera marker on its chart day and a camera icon in the list.
- Tapping the marker opens the photo full-screen with the correct date and weight.
- Removing a photo removes the marker. Deleting a weigh-in deletes its photo.
- Weigh-ins without photos work exactly as before.
- An existing v2 database (injections, weights, profile) opens as v3 with all data intact.
- With the network off, a photo can be saved, viewed and removed.
- No network request is made by any of this (check the network panel).
- First weigh-in on a Sunday → the card appears every Sunday; logging a weigh-in hides it until next Sunday; missing Sunday shows "Still time this week" until Saturday.
- Streak counts consecutive 7-day windows that contain a weigh-in.
- Existing 46 tests and `npm run build` pass.

## Tests
- **Automatic:** `fitWithin` sizing (landscape, portrait, already small, exact limit); weigh-in windows, due/missed states and streaks (gaps, two weigh-ins in one week, first-ever weigh-in, time zones). All 46 existing tests still pass. (The project has no database test setup, so database behaviour is checked by hand rather than adding a test package.)
- **Browser walkthrough (one pass):** photo save/view/remove, delete-with-weigh-in cascade, v2-to-v3 upgrade keeps rows, offline, no network requests.
- **By hand (owner, on the iPhone once hosted):** look and feel of the map and Doses screen at 390px; tap sizes; camera and library picking on a real iPhone; photo orientation; offline save, view and remove; v3 upgrade on a browser that already holds real data; network panel shows nothing sent.

## Risks & open questions
- Photos use device storage (about 150–400 KB each after resizing). iOS can clear site data, so photos are at risk like all other data.
- **Milestone 7 backup must include photos.** JSON export with embedded photos gets large; may need a zip or a separate photos file. To be planned then.
- Silhouette drawing is subjective, so I will show the owner a screenshot before the commit.
- iOS camera/library picker behavior in an installed PWA needs a real-device check.
- Two weigh-ins on one day: the chart marker shows if either has a photo.

**Mockups:** `docs/mockups/02b-body-map-option-b-v2.png` (redrawn body map; its source HTML holds the figure outline the build reuses) and the weekly weigh-in card in `docs/mockups/02b-options-and-weigh-in-card.png`.

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
**What you will see:**
- The body map is redrawn as a smooth front and back figure. Spots are colored by how recently they were used, and the suggested spot is marked.
- The Doses screen gets a summary card (next date, last dose, last spot), easier dose buttons, a timeline of past doses, and a panel that slides up to log a dose.
- You can attach an optional progress photo to any weigh-in and view it from the weight chart. Photos are never required.
- A new weekly weigh-in card appears on Home every 7 days, starting from your first weigh-in. The app cannot send phone alerts, so this card is the reminder.

**What to watch for:**
- Photos take up space on your phone. If iPhone clears the app's data, photos go with it.
- Photos are not included in backups until a later milestone.

Nothing needs your decision except approving this plan.

## Approval
- [ ] Approved by owner — date:
