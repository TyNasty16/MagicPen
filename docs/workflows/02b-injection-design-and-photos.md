# Workflow 02b — Injection design, body map redesign, weigh-in photos
Status: Awaiting approval
Milestone: Design + feature update between milestones 2 and 3 (owner request)

## Goal
Make the body map and Doses screen look sleek and designed, and let the owner attach an optional progress photo to a weigh-in, viewable from the weight chart. No change to rotation logic or data meaning.

Owner request: "Clean up the body mapping. I want it to look sleek. Yours looks like a robot. And give some design to the injection. Also add the ability to save pictures to the weight chart."

**My interpretation (please confirm):**
1. Body map: a smooth single-outline silhouette instead of blocky rectangles.
2. "Design to the injection": a designed Doses screen (summary card, pill dose picker, timeline history), not just a prettier form.
3. "Pictures on the weight chart": a photo per weigh-in, shown as a camera marker on the chart.

## In scope
- **Body map** (`BodyMap.tsx`): front-view silhouette, soft sand fill, thin line, Warm Sand colors. Zones are soft rounded areas (abdomen either side of the navel, front of thighs, back of upper arms), not dots. Selected zone is filled terracotta with a subtle ring. Suggested zone gets a dashed outline and a small "Suggested" tag. Clear "Your right / Your left" labels. The accessible button grid stays below, restyled as compact chips (still at least 44px tall). Rotation logic (`suggestSite`) is untouched.
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

## Out of scope
- Side-by-side photo compare, a gallery screen (suggested later ideas).
- Photos without a weigh-in.
- Multiple photos per weigh-in.
- Any change to rotation, dose list, next-dose calculation, or dose recommendations (the app only logs doses).
- Backup of photos (milestone 7 must include them; see risks).
- Back-view body map.

## Steps
1. `src/db/db.ts`: add `Photo` type and `db.version(3)` adding `photos: '++id, weightId'`; keep v1 and v2 declared. Add helpers `getPhoto`, `savePhoto`, `deletePhoto`; make weigh-in delete also delete its photo (one transaction).
2. `src/lib/image.ts`: `fitWithin(w, h, max)` (pure sizing) and `resizeToJpeg(file)` (canvas, about 1080px, quality about 0.8). Handles phone orientation via `createImageBitmap` with orientation applied.
3. `src/components/BodyMap.tsx`: new silhouette and zone paths, selected/suggested styling, labels, chip grid. Same props.
4. `src/components/SiteMarker.tsx` (new): small colored site marker and `BodyThumb` mini map, reused by the summary card and timeline.
5. `src/pages/Injections.tsx`: summary card, pill dose row, timeline history, bottom-sheet form.
6. `src/pages/Weight.tsx`: photo picker, preview, replace/remove in `WeightForm`; camera icon on list rows with a photo.
7. `src/components/PhotoViewer.tsx` (new): full-screen view with date, weight, close and remove. Object URLs are released on close.
8. `src/components/WeightChart.tsx`: camera marker on days with a photo (at least 44px tap area), opens the viewer. `src/components/icons.tsx`: add camera icon.
9. Tests, build, check on a 390px-wide screen, then hand-check offline.

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
- Existing 46 tests and `npm run build` pass.

## Tests
- **Automatic:** `fitWithin` sizing (landscape, portrait, already small, exact limit). All 46 existing tests still pass. (The project has no database test setup, so database behaviour is checked by hand rather than adding a test package.)
- **Browser walkthrough (one pass):** photo save/view/remove, delete-with-weigh-in cascade, v2-to-v3 upgrade keeps rows, offline, no network requests.
- **By hand (owner, on the iPhone once hosted):** look and feel of the map and Doses screen at 390px; tap sizes; camera and library picking on a real iPhone; photo orientation; offline save, view and remove; v3 upgrade on a browser that already holds real data; network panel shows nothing sent.

## Risks & open questions
- Photos use device storage (about 150–400 KB each after resizing). iOS can clear site data, so photos are at risk like all other data.
- **Milestone 7 backup must include photos.** JSON export with embedded photos gets large; may need a zip or a separate photos file. To be planned then.
- Silhouette drawing is subjective, so I will show the owner a screenshot before the commit.
- iOS camera/library picker behavior in an installed PWA needs a real-device check.
- Two weigh-ins on one day: the chart marker shows if either has a photo.

**Mockups:** one sheet showing the new body map and the redesigned Doses screen comes with this document, so the look is approved before building.

**Proposed defaults — owner can reply "defaults OK" or change any:**
1. "Design to the injection" means: summary card, pill dose buttons, timeline history, and a bottom-sheet log form (as in the mockups).
2. Photos attach to a weigh-in (no photo without a weight).
3. The log form slides up from the bottom (bottom sheet).
4. Photos join the backup in Milestone 7, not now.

Token Steward trims applied: one combined mockup sheet; questions turned into defaults; test scope settled up front (no new test package); no image library (built-in browser resizing); bottom sheet only; PLAN.md notes that photos moved up from v2.

## Review checkpoints
- Token Steward: before start
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
This update makes the body map and Doses screen look cleaner, and lets you add an optional progress photo to any weigh-in.

- **Body map:** a smooth outline instead of blocky shapes. Your chosen spot shows in terracotta; the suggested spot is dashed and tagged "Suggested." Rotation stays the same.
- **Doses screen:** a summary card (next dose, last dose, last site), dose buttons, and a timeline of past doses. The log form slides up from the bottom.
- **Photos:** choose one from your camera or library. It is shrunk and kept on your device. A camera marker on the weight chart opens it.

Nothing about dosing advice changes. A mockup sheet comes with this document so you can approve the look before building.

**You need to decide**
Reply "defaults OK" or change any:
1. Doses screen: summary card, dose buttons, timeline, bottom-sheet form.
2. Photos attach only to a weigh-in.
3. Log form slides up from the bottom.
4. Photos join the backup in Milestone 7, not now.

## Approval
- [ ] Approved by owner — date:
