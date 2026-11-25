# 05b Open Food Facts search: ideas

## Opening ideas — 2026-11-25

**The request, restated:** Add online search of packaged and branded foods (Open Food Facts) to the food form, alongside the built-in USDA list, without weakening the privacy rules.

### Approaches

1. **One search box, two sources; "Search online" button.** Typing searches the built-in USDA list as now. Under the results, a "Search online for packaged foods" button sends the term to OFF only when tapped. Pros: nothing leaves the device unless the owner chooses; offline behaviour unchanged; one familiar box. Cons: one extra tap. Effort M. **Recommended** because privacy is by design and the offline list stays first.
2. **Source toggle (Built-in / Online).** Owner picks a tab before searching. Pros: clear which source is shown. Cons: easy to leave on Online and type into it; more UI. Effort M.
3. **Auto-search online as you type (debounced).** Pros: feels fast. Cons: sends partial words to a third party, hits the ~10 searches/minute limit, and breaks the "only on tap" privacy story. Effort M. Not advised.
4. **Barcode scan later (separate step).** Camera lookup of one product by code. Pros: most accurate for packaged food. Cons: camera permission, and it sends the barcode. Park as 05c.

### Ideas you may not have thought of (optional)
- **"Saved on this device" marker:** picking an online product saves it to My Foods automatically (with confirm), so a repeat needs no network.
- **Per-result completeness hint:** grey "no protein listed" so gaps are seen before saving.
- **Recent online picks** shown first when offline.
- **Attribution line** in the results footer and on the About page.

### Watch-outs
- **Privacy notice on first use:** one line ("Your search words are sent to Open Food Facts. Nothing else is.") with Continue/Cancel; remember the choice on device.
- **Only the search term is sent:** no ID, no log data, no cookies (`credentials: 'omit'`, no referrer). Identify with a generic app name in a param only, never owner details.
- **Rate limits:** explicit button plus a short cooldown; friendly message on 429.
- **Offline:** clear message, USDA list stays usable. Service worker must exclude the OFF host from caching.
- **Incomplete products:** some lack kcal or protein; show as "not listed", never as 0.
- **Serving size parsing:** values are per 100 g, sometimes per serving. Free-text serving strings ("2 biscuits (30 g)") need careful parsing; fall back to 100 g if unclear. Millilitre drinks need their own label. Round only for display.
- **Licence:** ODbL attribution required. Needs sourced wording from OFF's terms.
- **Testing:** mock fetch with saved sample responses; never call the live API in tests or CI. Test offline, 429, empty and partial products.
- **Cost:** free, no key; stays at $0.

## After-build — 2026-11-25

**What landed:** A "Search online" button under the built-in results, a first-use privacy notice, hidden no-nutrition products with a count, a "check against the label" warning, source credit, and "Save to My Foods" ticked for online picks.

**Follow-ups**
- **Sanity check on numbers (I-25):** testing found a shake about 3x off. Comparing calories with protein/carbs/fat is plain arithmetic and would flag likely typos before they are logged.
- **Barcode scan (I-24, 05c):** most accurate for packaged food and avoids bad name matches. Needs its own privacy notice, since the barcode is sent.
- **Café and restaurant items (I-27):** online search mostly misses them, so a small sourced built-in list would fill the gap offline.
- **Drinks in ml (was I-26):** already built — drinks scale per 100 ml with no ml-to-g guess (moved to Done as D-25).

**Felt off**
- About 4 in 10 results are hidden for having no nutrition. That is honest, but a search can end with an empty list, so the wording for that case matters.
- A plural-matching bug in the built-in search ("muffins") only showed up in browser testing. Worth a few saved test words for future search changes.
