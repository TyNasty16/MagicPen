# 05c Barcode scanning: ideas

## Opening ideas — 2026-11-25

**The request, restated:** Let the owner point the phone at a packaged food's barcode to fill in its nutrition from Open Food Facts (OFF), without sending anything but the number off the device.

### Approaches

1. **Full-screen scanner, continuous, library `zxing-wasm` or `@zxing/browser` (lazy-loaded).** Tap "Scan barcode" in the food form; a full-screen camera view reads frames until it sees a code, then closes and looks it up. Pros: the familiar phone-scanner feel; fastest for the owner. Cons: the biggest bundle (zxing is roughly 100 KB to a few hundred KB; the WASM build is larger), and it needs more care for battery and heat. Effort M-L. **Recommended**, with a lazy import so it costs nothing until the scanner opens. Take the smallest library that reads EAN-13 and UPC-A; the build step should compare sizes before choosing.
2. **Same view, tap-to-capture still photo.** Owner frames the code and taps a shutter; one image is decoded. Pros: simpler, less battery, easier to test, and also works with a photo picked from the library. Cons: more taps; blurry shots need retakes. Effort S-M. A good fallback inside approach 1.
3. **Inline scanner inside the existing sheet.** Small camera box above the search results. Pros: no new screen. Cons: cramped on a phone, awkward focus, and the on-screen keyboard fights it. Effort M. Not advised.
4. **Type-the-number only (no camera).** A field for 8 to 13 digits. Pros: S effort, no permission, no library. Cons: tedious. Build it regardless as the fallback.

### Ideas the owner may not have thought of (optional)
- **Remember scanned products** in My Foods automatically (with confirm), so a repeat scan works offline.
- **"Not found" shortcut:** offer to enter the food by hand with the barcode kept on it, so the next scan finds it.
- **Torch toggle** for poor light, where the phone supports it.
- **Scan history** (last 5) for the weekly shop.

### Watch-outs
- **Privacy wording:** the existing notice says search words are sent. A scan sends a different thing (the barcode number). Recommend extending the one notice to cover both, with a separate "camera stays on the phone" line. New wording needs owner approval.
- **Only the number leaves the phone:** no image, no frames. Reuse the same fetch settings (no cookies, no referrer, no-store) and keep the OFF host out of the service worker cache.
- **iOS home-screen PWA camera:** getUserMedia works in standalone mode on recent iOS, but some versions ask permission on every launch, and a backgrounded app can freeze the stream. Needs a real-device test; stop all tracks on close; request the rear camera; use `playsinline` and `muted` on the video.
- **Permission denied or no camera:** friendly message with the typed-number field right there. Never a dead end.
- **Fallback cases:** poor light (torch, tap-to-capture), product not found, product with no nutrition (reuse the hidden or "not listed" logic, never show 0), and a bad check digit (catch typos before any network call).
- **Bundle size and the service worker:** lazy chunk only; confirm the offline shell still loads without it.
- **Accessibility:** a visible close button, focus kept in the sheet, and a spoken or visible status ("Looking for a barcode"). Camera use is hard for some owners, so typed entry must be equally prominent.
- **Testing without a camera:** put the decoder behind a small function that takes an image; test it with saved barcode sample images, and mock OFF with saved product responses. Never hit the live API or a real camera in CI.
- **Medical and cost:** no medical text is involved. $0, no key. Remind the owner that OFF data can be wrong, so keep the "check against the label" warning on scanned items too.

## After-build — 2026-11-25

**What landed:** A lazy-loaded full-screen barcode scanner with a typed-number fallback, a separate first-scan privacy notice, input checks before any request, and scanned products saved to My Foods (commit 8cd52d6).

### Follow-ups
1. **Keep the barcode on a saved food** (and on "not found" hand entry), so the next scan finds it offline. Why: repeat shops get faster and work without a connection. Needs a new stored field.
2. **Upgrade the dev-only tools flagged by npm audit** (Vitest major upgrade, vite-plugin-pwa / Workbox). Why: clears the warnings; these are build tools and do not ship to the phone, so it can be its own small change with a full test run.
3. **Revisit torch and "scan another"** once a real iPhone check is possible. Why: poor light is the most common scan failure; torch was left out because iPhone Safari support is unreliable.
