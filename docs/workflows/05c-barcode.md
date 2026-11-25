# Workflow 05c — Barcode scanning (Open Food Facts lookup)
Status: Draft
Milestone: 5 — Nutrition (PLAN.md §2 item 5; §5 order), part c. Follows workflow 05b (built).

## Ideas considered
Ideas file: `docs/ideas/05c-barcode.md`. Chosen approach: option 1, a full-screen continuous scanner (lazy-loaded), with typed barcode entry as the always-visible fallback. Measured facts: `docs/sources/05c-barcode-test.md`. Reused: the portion picker, warning, credit and pre-ticked "Save to My Foods" in `FoodSheet.tsx`, and the 05b parsing in `offSearch.ts`.

## Goal
Let the owner scan a packaged food's barcode (or type its number) in the Log food sheet and get its nutrition from Open Food Facts (OFF). The camera picture never leaves the phone; only the number is sent.

## In scope
- A "Scan barcode" button under the search box in the Log food sheet.
- Full-screen overlay: rear camera, EAN-13, EAN-8, UPC-A and UPC-E only; stops the camera on close, on decode, and when the page is hidden.
- A "Type the number instead" field in the same overlay (the no-camera path).
- Library: `@zxing/browser` 0.2.1 + `@zxing/library` 0.23.0, exact-pinned (no `^`), loaded only when the scanner opens. Pure JavaScript, 126 KB gzip, no outside downloads. `zxing-wasm` is rejected: its 412 KB `.wasm` would need self-hosting.
- Check-digit validation before any request; UPC-E expanded to UPC-A for the lookup.
- One OFF product lookup by number; results feed the same portion picker, warning, credit and pre-ticked My Foods.
- Messages: camera denied or missing, offline, busy, unavailable, not found, no nutrition listed.
- First-scan privacy notice (its own acknowledgement).

## Out of scope
- Torch toggle (iPhone Safari support is unreliable; not cheap to verify).
- Saving the barcode on foods, scan history, auto-adding to My Foods without a tick, photo-from-library decoding.
- Other barcode types (QR, Code 128), other languages, OFF images.
- Caching OFF replies or any offline lookup (re-logging from My Foods already works offline).
- Any advice or dose-related text.

## Steps
1. `package.json` / lockfile: add the two zxing packages, exact versions.
2. `src/lib/barcode.ts` (new), pure, no `fetch`:
   - `normalizeBarcode(text)`: trims; digits only, length 8, 12 or 13, else `null`.
   - `isValidBarcode(code)`: GTIN mod-10 check digit (EAN-13, UPC-A, EAN-8); an 8-digit code passes if valid as EAN-8 or as UPC-E.
   - `toLookupCode(code)`: expands a UPC-E to its 12-digit UPC-A; others unchanged.
   - `buildBarcodeUrl(code)`: `https://world.openfoodfacts.org/api/v2/product/{code}.json?fields=` the same fields as `buildOffUrl`.
   - `parseBarcodeReply(json)` returns `{ kind: 'found', product } | { kind: 'notFound' } | { kind: 'noNutrition' }`. Not found is `status: 0` (OFF answers HTTP 200). No nutrition means a name, kcal or protein is missing.
3. `src/lib/offSearch.ts`: pull the per-product logic of `parseOffResults` into an exported `parseOffProduct(hit)` (returns a product or `null`), used by both search and barcode. Search behaviour unchanged; its existing tests must still pass. Add barcode message constants beside the others.
4. `src/lib/offClient.ts`: add `offLookup(barcode)`: same `fetch` settings as `searchOnline` (GET, `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, `cache: 'no-store'`, 8 s timeout, same error mapping), then `parseBarcodeReply`.
5. `src/components/BarcodeScanner.tsx` (new, `React.lazy`; zxing is imported inside it so it stays out of the main chunk):
   - full-screen `role="dialog"`, visible Close button, focus kept inside.
   - `getUserMedia` rear camera (`facingMode: environment`), `<video playsinline muted>`; formats limited to the four above.
   - A decoded code that fails the check digit is ignored (a misread); scanning continues.
   - On a valid code: stop all tracks, close, return the number.
   - Status line "Point the camera at the barcode." (announced politely).
   - "Type the number instead" field and "Look up" button, always visible, also shown alone when the camera is denied or missing.
6. `src/components/FoodSheet.tsx`: "Scan barcode" button under the search box; first-scan notice (own key `steady.barcodeNoticeAck`; same blocked-storage rule as 05b); on a number, call `offLookup` and on `found` run the existing `pick(..., true)` (name "Name (Brand)", warning, credit, My Foods ticked). Not found and no nutrition show their message and leave the manual fields open. Same 3 s cooldown between lookups.
7. `vite.config.ts`: add the zxing chunk to Workbox `globIgnores` so it is **not** precached (it loads on first scan; scanning needs a connection anyway). Check the built `sw.js` never mentions `openfoodfacts` or the zxing chunk.
8. `src/lib/barcode.test.ts` and `src/lib/__fixtures__/off-barcode.json` (new): tests below.
9. Run the new tests during build; full suite and build once at the end; compare chunk sizes; one browser pass.

## Exact text (for approval)
- **First-scan notice (own, shown before the camera opens):** "Scan a barcode? The camera picture stays on this phone and is never sent. Only the barcode number is sent to Open Food Facts, a free food database. Like any website, it can see your internet address. Nothing else from this app is sent." Buttons: "Scan" and "Cancel". Cancel sends and opens nothing; it asks again next time. iPhone then shows its own camera permission prompt.
- **Scanner status:** "Point the camera at the barcode."
- **Typed field:** label "Type the number instead", button "Look up".
- **Bad number:** "That number doesn’t look right. Check the digits and try again."
- **Camera denied:** "Camera access is off for this app. In the iPhone Settings app, open Safari, tap Camera, and choose Ask or Allow. Then try again. You can also type the number below."
- **No camera:** "No camera was found on this device. Type the number below."
- **Not found:** "Open Food Facts has no product with this number. Enter the food by hand below."
- **No nutrition:** "This product is listed, but its nutrition isn’t. Enter the values by hand below."
- **Offline, busy, unavailable, timeout:** the 05b messages, unchanged. The "Entered by volunteers. Check against the label." warning and "Food data: Open Food Facts (ODbL)." credit also show on scanned products.

## Acceptance criteria
- Typing or opening the food sheet never starts the camera or contacts OFF. The first "Scan barcode" tap shows the notice; Cancel opens no camera and sends nothing.
- After "Scan", the camera opens full-screen (rear camera). Closing it, or a successful decode, stops every camera track (the iPhone camera indicator goes off).
- Scanning a valid EAN-13/UPC-A/EAN-8/UPC-E sends one request, only to `world.openfoodfacts.org`, containing only the number and the `fields` list, with no cookies and no referrer. No image or frame is ever sent.
- A number with a wrong check digit sends nothing and shows the "doesn’t look right" message; a bad scan is ignored and scanning continues.
- A found product opens the usual portion picker, with warning, credit, and "Save to My Foods" ticked; all fields stay editable.
- `status: 0` shows "not found"; a product with no kcal or protein shows "nutrition isn’t listed" (never 0); both leave manual entry open.
- Camera denied or missing shows its message and the typed field; offline, busy, unavailable and timeout show their messages. The USDA list and manual entry always work.
- The main app chunk holds no zxing code and grows by no more than about 3 KB gzip (button, notice, glue); the zxing code is a separate lazy chunk. The built `sw.js` has no OFF caching. Existing tests and the build pass.

## Tests
Automatic (Vitest, fixture JSON only, never the live API or a camera):
- Check digit: known-good EAN-13, UPC-A, EAN-8 and UPC-E pass; one wrong digit fails; wrong length, letters and spaces are rejected; UPC-E expands to the right UPC-A.
- `buildBarcodeUrl`: exact host, path and fields; nothing else in the URL.
- `parseBarcodeReply` on fixtures: found (fairlife-style, ml serving per 100 ml), `status: 0` not found, listed but no kcal, listed but no protein, 0 kcal kept.

By browser (Playwright, Chromium at 390px, route interception serving fixtures):
- One script: notice then Cancel (nothing sent); typed-number lookup with the request-shape check (only the product URL, no cookies); one decode on the Chromium fake camera fed a generated EAN-13 (scanner closes, camera stops). Offline and cooldown are already covered by 05b and Vitest.
- Screenshots: (1) notice, (2) scanner overlay with the typed field, (3) found product with warning.
- Build check: chunk sizes before and after; `sw.js` has no `openfoodfacts`.

By hand, owner only: real iPhone camera, in the Home Screen app. Check that it focuses on a real package, that the permission prompt appears, that the camera light goes off on close, and that the Settings wording above matches what the iPhone shows.

## Risks & open questions
- Proposed defaults, owner can reply "defaults OK":
  - Privacy: a separate first-scan notice (the 05b notice says "words you typed", which would be wrong for a number and a camera). The ideas file suggested extending one notice; a separate one is clearer and keeps 05b unchanged.
  - Barcode number is not saved with the food and not added to the name or notes (that needs a new stored field). On not found, the owner enters the food by hand.
  - Scanned products: "Save to My Foods" pre-ticked, as for online search.
  - Torch: left out.
  - The zxing chunk is **not** precached: it downloads (about 126 KB) the first time you open the scanner, from the app's own site. Scanning needs a connection for the lookup anyway, and this keeps every app update small.
  - Lookup uses `world.openfoodfacts.org`, the same company and database as 05b.
- Approve the exact text above, or send edits.
- Honest limits: ZXing-js is actively released (library 0.23.0 April 2026, browser 0.2.1 July 2026) — the earlier "maintenance mode" note was wrong. The camera permission may be asked on every launch on some iOS versions, and a backgrounded app can freeze the video; the scanner closes when the page is hidden. Camera behaviour on iPhone cannot be proven here, only on the owner’s phone.
- Volunteer data can be wrong; the warning and editable fields are the only guard. Scanned foods in OFF are also incomplete (about 4 in 10 lack nutrition in search tests).
- The "Settings" path wording is from general iOS knowledge and may differ by iOS version; hand check needed.

## Added by owner: security checks (2026-11-25)
Owner asked to scan ZXing for vulnerabilities, verify dependencies and sanitize outputs. Results: `docs/sources/05c-zxing-security.md` (0 vulnerabilities; 4 packages, all signatures valid, ZXing provenance traced to its GitHub release workflows; no install scripts; no network or eval code in the shipped bundle).
Build adds: `cleanBarcode` (digits only, 8/12/13, check digit, length cap) before any request; `cleanText` for OFF strings (control/invisible characters removed, 120-char cap); the reply's `code` must match the request; OFF text shown only as React text. Install with `--save-exact`; the lockfile keeps the verified hashes. These checks are repeated in the build (npm audit, bundle grep) and the hostile-input cases become Vitest tests.

- Token Steward: before start (applied: zxing chunk not precached, one browser script, duplicate test bullet removed. Partly: 3 screenshots instead of 2, since the owner reviews from screenshots. Not applied: merging the measured-facts file — it already exists and the plan cites it)
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
**What it adds:** In the Log food sheet, a "Scan barcode" button. Point the phone's camera at a packaged food's barcode, or type the number. The app then fills in that food's nutrition from Open Food Facts, a free public food database. Entries there are added by volunteers, so you still see a warning and can edit every field.

**What stays on the phone:** The camera picture never leaves the phone. Only the barcode number is sent to Open Food Facts. Nothing else from the app is sent.

**Cost:** Nothing. The scanner's helper code downloads once, about 126 KB, the first time you open the scanner.

**What could go wrong:**
- The iPhone camera may behave differently from a computer. It must be tested on your own phone, with a real package, before you rely on it.
- Some products are not in the database, or are listed without nutrition. You would then enter the food by hand.

**You need to decide:**
- Reply "defaults OK" to accept the proposed defaults (a separate first-scan notice, the barcode not saved with the food, "Save to My Foods" ticked, no flashlight button).
- Approve the exact wording of the messages, listed under "Exact text" above.

## Approval
- [ ] Approved by owner — date:
