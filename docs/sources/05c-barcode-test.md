# Barcode scanning (05c) — checks before planning (2026-11-25)

## Open Food Facts product lookup
`GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json?fields=code,product_name,brands,nutriments,serving_size,serving_quantity,serving_quantity_unit`
- fairlife shake (81161775): **200** in 0.6 s, 3.4 KB; `access-control-allow-origin: *`; no cookies set. Same nutriment fields as search (`energy-kcal_100g`, `proteins_100g`, …), so the 05b parser applies.
- Unknown / invalid code: HTTP **200** with `{"status": 0, "status_verbose": "no code or invalid code"}` — "not found" must be read from `status`, not the HTTP code.

## Decoder libraries (built with esbuild, minified; EAN-13/EAN-8/UPC-A/UPC-E only)
| Library | Licence | JS (gzip) | Extra files | Notes |
|---|---|---|---|---|
| `@zxing/browser` 0.2.1 + `@zxing/library` 0.23.0 | MIT / Apache-2.0 | 485 KB (**126 KB**) | none | Pure JavaScript; handles camera stream and still images; no outside downloads |
| `zxing-wasm` 3.1.8 (reader) | MIT | 37 KB (13 KB) | `zxing_reader.wasm` 946 KB (**412 KB** gzip) | Faster, but by default downloads the .wasm from a CDN (jsDelivr) — would have to be self-hosted to keep the "no third parties" rule |
| `barcode-detector` 3.2.5 | MIT | small | uses zxing-wasm (same .wasm) | Polyfill for the BarcodeDetector API; same CDN caveat |

Safari (iPhone) has no built-in `BarcodeDetector`, so a library is needed. Either would load only when the scanner opens.
