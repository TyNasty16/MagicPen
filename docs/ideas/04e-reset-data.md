# 04e Reset data

## Opening ideas — 2026-11-25

**The request, restated:** Add a Settings button that wipes everything the owner has entered in the app.

**What exists today:** Data is in Dexie (profile, injections, weights, photos, measurements, symptoms). The disclaimer acknowledgment lives in the profile row (`disclaimerAcceptedAt`), so wiping the profile also brings the disclaimer back. localStorage holds three UI keys (help shown, alerts hidden, alerts seen). There is no backup yet (Milestone 7), so a wipe cannot be undone.

### Approaches

1. **Simple confirm dialog, wipe data only.** One "Reset all data" button, then an "Are you sure?" dialog.
   - Owner sees: a button and a Yes/Cancel prompt.
   - Pros: fast, familiar. Cons: easy to tap through by accident, and the wipe is permanent. Effort: S.
2. **Type-to-confirm, full wipe, then reload (Recommended).** The owner types "RESET" to enable the final button. It clears every table and the three localStorage keys, then reloads to the disclaimer and first-run setup.
   - Owner sees: a clearly separate "Danger zone" card, a short plain warning, then a clean fresh start.
   - Pros: protects against accidents given there is no backup, and the app really starts clean. Cons: slightly more friction. Effort: S–M.
   - Why recommended: the wipe is irreversible, so one deliberate extra step is worth it.
3. **Two-step: choose what to reset.** Checkboxes such as weights, photos, injections, or everything.
   - Pros: flexible. Cons: more screens, and the owner asked for "all". Effort: M.
4. **Reset only after "Download a copy first".** This waits for Milestone 7's export.
   - Pros: safest. Cons: blocks the request on a later milestone. Effort: L.

### Ideas the owner may not have thought of (optional)
- Show a count first ("This will delete 14 injections, 22 weights, 6 photos") so the owner sees what is lost.
- Re-show the disclaimer after a reset (comes free with approach 2).
- When export lands, add a "Save a copy first" link right inside the reset card.
- Say plainly that photos are deleted too.

### Watch-outs
- **Irreversible, no backup:** the wording must say so. This is our own wording, not medical text.
- **Partial failure:** clear everything in one Dexie transaction. If it fails, show an error and do not reload, so the app is not left half-wiped.
- **Disclaimer and preferences:** decide explicitly. The recommendation is to reset them too, since "all user inputs" and a clean state matter more than keeping them.
- **Service worker / PWA cache:** this holds app files, not health data. Leave it alone, or a reload could break offline use. Do not unregister it.
- **Privacy and cost:** fully on-device, with no network calls and $0.
- **Product rules:** nothing here recommends doses. Keep the calm Warm Sand style, with a muted danger color rather than a loud red.
