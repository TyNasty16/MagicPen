# ZXing security review (2026-11-25, owner request)

Packages: `@zxing/browser` 0.2.1 (MIT) and `@zxing/library` 0.23.0 (Apache-2.0), installed exact-pinned in a clean folder with `--ignore-scripts`.

## 1. Vulnerability scan
- `npm audit`: **0** vulnerabilities (info/low/moderate/high/critical all 0) across the 4 packages.

## 2. Dependency verification
| Package | Version | Licence | Install scripts | Registry signature | Lockfile = registry hash | Provenance |
|---|---|---|---|---|---|---|
| @zxing/browser | 0.2.1 | MIT | none | valid | yes | yes — built by github.com/zxing-js/browser, `.github/workflows/npmpublish.yml` @ tag v0.2.1 |
| @zxing/library | 0.23.0 | Apache-2.0 | none | valid | yes | yes — built by github.com/zxing-js/library, `.github/workflows/npmpublish.yml` @ tag v0.23.0 |
| @zxing/text-encoding | 0.9.0 | Unlicense OR Apache-2.0 | none | valid | yes | none (older package) |
| ts-custom-error | 3.3.1 | MIT | none | valid | yes | none |

- Signatures checked against npm's published registry keys (ECDSA over `name@version:integrity`); `npm audit signatures` itself could not reach its key mirror from this environment, so the check was done directly.
- `npm ci` re-downloaded every tarball and matched the lockfile hashes.
- Releases: library 0.23.0 on 2026-04-29, browser 0.2.1 on 2026-07-06 — actively released (the plan's "maintenance mode" note is corrected).

## 3. Code scan of what would ship (bundled, EAN/UPC reader only)
`eval`, `new Function`, `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `importScripts`, `document.write`, `innerHTML`, `localStorage`, `indexedDB`, `document.cookie`, `postMessage`: **0** each. Only URL string: `http://www.w3.org/2000/svg` ×4 (SVG namespace label, not a network address).

## 4. Output sanitizing (prototype tested; moves into `src/lib/barcode.ts`)
- **Decoded/typed number → `cleanBarcode`:** spaces/dashes removed; must be ASCII digits only, length 8, 12 or 13, ≤ 32 chars raw, with a valid check digit (EAN-8/UPC-A/EAN-13; 8-digit UPC-E expanded first). Anything else is rejected and nothing is sent. 16/16 hostile and valid cases passed (HTML, path traversal, query injection, URLs, QR text, 5,000-char input, full-width digits, wrong check digit). Real OFF codes 81161775, 38986253, 0031076869635, 0049000551365 accepted.
- **Request:** the number is URL-encoded into the path; the only query parameter is `fields`.
- **Reply → `cleanText` + type checks:** strings only; control and invisible direction characters removed (e.g. a right-to-left override that could disguise a name); whitespace collapsed; names capped at 120 characters; numbers must be finite and ≥ 0 (05b parser). The reply's `code` must match the number requested, or it is ignored.
- **Display:** all OFF text is shown as plain React text (escaped), never as HTML, so a name like `<script>` shows as those characters and cannot run.
