# 11 — Security hardening, Phase 1

Source: `docs/security/2026-11-27-app-store-audit.md` (findings 1-3, 5, 6, 8-12).

## Opening ideas — 2026-11-27

**The request, restated:** Close the cheap, website-app security gaps from the audit (CI, CSP, password rule, Home Screen notice, food-value caps, restore checks, Dropbox wording), keep photos out of backups, and give the owner a short account checklist.

**Owner decision recorded:** photos stay out of backups. Finding 7 in the audit and I-56 on the notepad should be marked "decided: not doing; photos are never backed up" (the "never photos" product rule stays).

### 1. CI
- A. Split permissions per job (build: `contents: read`; deploy: `pages: write`, `id-token: write`), add `dependabot.yml` (npm and github-actions, weekly, grouped), bump vitest. **Recommended**, it is the plan and costs nothing.
- B. Also pin actions to commit hashes. More protection, more upkeep; Dependabot can keep hashes fresh later.
- Traps: `actions/configure-pages` and `upload-pages-artifact` must sit where the permissions they need exist (upload needs only read; configure-pages needs `pages: write`, so it may have to move to deploy or stay with a job-level `pages: write`; test on a branch run). Dependabot opens many PRs, so group them and cap the limit. Run the full test suite after the vitest bump; I-29 also lists vite-plugin-pwa/Workbox.

### 2. Content-Security-Policy
- A. Meta tag in `index.html`, always on. Simple, but breaks the Vite dev server (inline refresh script, websocket).
- B. Add the tag only in production builds (small Vite HTML transform), so dev keeps working. **Recommended.**
- C. Add dev allowances (`ws://localhost:*`, `'unsafe-inline'` scripts) in dev only. Same effect as B, more fiddly.
- Policy: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' https://search.openfoodfacts.org https://world.openfoodfacts.org https://api.dropboxapi.com https://content.dropboxapi.com; media-src 'self' blob:; worker-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'`.
- Traps: the camera is a permission, not a CSP item, but the scanner video may use `blob:` (hence `media-src`). zxing is lazy-loaded from our own origin, so `'self'` covers it; if the build ever uses WebAssembly it would need `'wasm-unsafe-eval'` (the current library is plain JS, but test). Keep `data:` images only if photo resizing or icons need it; test by removing it. Meta CSP cannot do `frame-ancestors`, so clickjacking is not covered (low risk here). Dropbox sign-in is a full-page redirect, which CSP does not block, but test the whole round trip. A wrong policy fails silently for users, so test on a real phone: scan, photo, PDF share, backup, restore, and the service-worker update.

### 3. Backup password rule
- A. 16+ characters, reject one repeated character and fewer than ~6 distinct characters, advise "four or more random words", on set/change only. **Recommended.**
- B. Add a small strength hint under the box. Nice, but words like "strength" imply a guarantee we cannot give.
- Traps: restore and unlock must never apply the new rule (existing passwords keep working). Show the reason in plain words, not a bare "invalid". Count by characters, not bytes. A passphrase of four short words can pass 16 characters yet be weak; the advice text carries that part. Wording needs no medical source.

### 4. Home Screen notice and persist()
- A. One-time dismissible card on Home when not standalone, shown after the first few days of use (not on the very first screen), plus `persist()` on startup. **Recommended.**
- B. Notice on first launch. Annoying and before the owner has any data to protect.
- Traps: detect standalone with both `navigator.standalone` and the `display-mode: standalone` media query. Store "dismissed" on the phone. `persist()` often returns false on Safari and is no guarantee; never claim the data is safe. Desktop and Android browsers should not see an iPhone-specific message. Hide it once a recent backup exists, since backup is the real protection. Consider a "how to" line for Share, then Add to Home Screen. Wording: plain and factual, no alarm.

### 5. Open Food Facts caps
- A. Reject or treat as "not usable" any product with per-100 g values outside plausible bounds (for example kcal 0-900, protein/carbs/fat 0-100 g, and macros summing to at most about 100 g). **Recommended**, using the existing "hidden, with a count" path (D-24).
- B. Clamp silently. Hides bad data, so a wrong number looks real. Not recommended.
- Traps: drinks use per-100 ml; keep the same bounds. Do not hide valid high-fat foods (oils reach about 900 kcal).

### 6. Restore checks
- A. Validate every row: `site` in the allowed list, ids as positive integers, required numbers finite and within sane ranges, dates parseable; refuse the whole restore on the first bad row, before anything is changed. **Recommended.**
- B. Skip bad rows and restore the rest. Risks a quiet partial restore.
- Traps: old backups from earlier versions must still pass (test with real v1-v8 files). Check inside the same step that runs before the wipe, so a failure leaves the phone untouched.

### 7. Disconnect wording
- A. One extra line under Disconnect: "You can also remove Steady at dropbox.com under Connected apps." **Recommended.** Trivial. Trap: Dropbox may rename that menu; check the wording against Dropbox's own page.

### 8. Owner checklist (no code)
Turn on GitHub 2FA (an authenticator app or passkey, and save the recovery codes). Set the noreply email and tick "Block pushes that expose my email". Branch protection on `main` (require a pull request; this also stops deploys straight from a stolen token). Keep this account's Pages for Steady only. Trap: branch protection can stop the owner's own direct pushes, which is intended given the PR habit.

### Ideas the owner may not have thought of (optional)
- A short "Security" section in Settings listing in plain words what stays on the phone, what goes to Dropbox, and what Open Food Facts sees (builds trust and prepares the privacy policy for Phase 2).
- A CSP test in the test suite that fails if the policy loses a needed host or gains `unsafe-eval`.
- A "last backed up" reminder when the app runs in a Safari tab, tying the Home Screen notice to the real risk (see I-54).
- A tiny `SECURITY.md` and a `security.txt` style note, so anyone finding a problem knows whom to tell.

### Watch-outs
- Product rules: no new third-party hosts (CSP only narrows). Photos stay out of backups, which keeps the "never photos" rule intact.
- Privacy: the Home Screen notice and CSP add no network calls.
- Medical wording: none needed. The password and Home Screen texts are not medical.
- Cost: all $0. Dependabot is free on public repos.
- Order: do the CSP last, so everything else is in place when testing the camera, PDF and Dropbox end to end.
- This is one change with eight items; the planner may prefer two steps (11a CI + owner checklist, 11b app code).
