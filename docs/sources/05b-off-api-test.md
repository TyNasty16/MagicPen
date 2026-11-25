# Open Food Facts — live API test (2026-11-25)

Tested from the build environment with `Origin: https://tynasty16.github.io`.

| Endpoint | Result |
|---|---|
| `https://world.openfoodfacts.org/cgi/search.pl?search_terms=…&json=1` (legacy full-text search) | **503** "Page temporarily unavailable" — not reliable |
| `https://search.openfoodfacts.org/search?q=…&page_size=…&langs=en&fields=code,product_name,brands,nutriments,serving_size,serving_quantity` (Search-a-licious) | **200**, ~0.4–1.0 s; CORS allows our GitHub Pages origin; no cookies set |

Sample queries:
- "starbucks chocolate chip muffin" → **0 results** (restaurant/coffee-shop items are mostly absent).
- "chocolate chip muffin" → 448 results; of the first 20, **12** had kcal and protein per 100 g; the rest had no nutrients.
- "fairlife protein shake" → 13 results, mixed quality: one entry lists **150 kcal and 30 g protein per 100 g** for a 340 g bottle (per-serving values typed into per-100 g fields — wrong by ~3×). Another lists 44 kcal / 8.8 g per 100 g (plausible).
- "greek yogurt" → 5,495 results, many from other countries (Lithuanian, Swiss) despite `langs=en`.

Fields: `nutriments.energy-kcal_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`, `fiber_100g` (any may be missing); `serving_size` text (e.g. "1 muffin (99 g)", "340 ml") and `serving_quantity` (number, g or ml).

Implications: show only results with kcal + protein per 100 g (or clearly mark the rest); always show values before saving and let the owner edit; label the source; expect some wrong entries.
