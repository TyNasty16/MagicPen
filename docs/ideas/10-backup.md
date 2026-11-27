# 10 — Backup to Dropbox + calendar reminder (Milestone 7)

Requirements are fixed in `docs/ideas/10-backup-brief.md`; not re-asked here.

## Opening ideas — 2026-11-27

**The request, restated:** Automatically save an encrypted copy of everything except photos to the owner's own Dropbox once a day, let them restore it from a Backup screen in the menu, and offer an optional weekly injection reminder for the phone calendar.

### Build approaches
- **A. Two builds (Recommended): 10a backup + restore, then 10b calendar .ics.** Backup is the risky part and deserves its own review and approval; the .ics is small and independent. Effort: L + S.
- **B. Three builds: 10a encrypted file only (export/import by hand, no Dropbox), 10b Dropbox connect + auto-daily, 10c .ics.** Safest: the format, encryption and restore get proven with a plain file before any network is involved. Also a useful fallback if Dropbox ever changes. Effort: M + M + S.
- **C. One build.** Fewest steps for the owner, but a big diff to review, and a bug in restore (which replaces data) is the worst place to hide. Effort: L+.

Reason for A over B: B is the most careful, but a manual file round trip is the same code as 10a's restore. Pick B if the owner wants smaller approvals.

### Dropbox from the browser, no server
- **Sign-in:** OAuth 2 code flow with PKCE (no secret), `token_access_type=offline`. Open `www.dropbox.com/oauth2/authorize` with the app key `7sybextdkplxswz`; Dropbox redirects back to the app URL with `?code=`; the app swaps it at `api.dropboxapi.com/oauth2/token` for a short-lived access token plus a long-lived refresh token. The app refreshes silently with the same endpoint. The PKCE verifier and state must survive the redirect (sessionStorage); on iOS, an installed PWA may open the sign-in in a separate Safari view, so the return trip needs testing on a real phone.
- **Endpoints:** `content.dropboxapi.com/2/files/upload` and `/files/download` (details in a `Dropbox-API-Arg` header), `api.dropboxapi.com/2/files/list_folder` and `/files/delete_v2` (JSON body). App-folder access means paths start at `/`. Use upload mode `overwrite`, filenames like `steady-2026-11-27.steady`.
- **CORS:** Dropbox's API allows browser calls. Gotcha: sending `Content-Type: application/json` on content-host calls can force a failing preflight; use `application/octet-stream` or `text/plain`. Verify once on a real device.
- **Token storage:** IndexedDB on the phone, in a small table kept out of backups. The refresh token is not a password, but it is access to that app folder, so never log it or put it in the URL.
- **Revoked or expired:** a refresh returns `invalid_grant`/401. The app should show one calm line on the Backup screen ("Dropbox sign-in ended. Connect again.") and stop retrying; never wipe local data. Same for offline: skip quietly and try at next open.
- **Library vs fetch:** plain fetch. That is about 5 endpoints and roughly 150 lines. The official `dropbox` npm SDK pulls extra dependencies, covers hundreds of endpoints we don't use, and would need a security review like `docs/sources/05c-zxing-security.md`, for no gain. Recommend no new dependency; if the owner prefers the SDK, the review comes first.

### Encryption (Web Crypto, built into the phone browser)
- PBKDF2-SHA-256 (high iterations, 600,000 is the current OWASP guidance for SHA-256; confirm it is fast enough on an old iPhone) with a random 16-byte salt, then AES-256-GCM with a fresh random 12-byte IV for every backup.
- Argon2 is stronger, but it is not in Web Crypto and would need a library. PBKDF2 is the no-dependency choice.
- **Remembering the password without storing it:** derive the key once, store it as a non-extractable `CryptoKey` in IndexedDB (supported), together with the salt. Daily backups reuse that key with a new IV each time. Nothing readable is stored. Caveat: a script running inside the app could still use the key, so this protects against file theft, not a compromised app.
- **File format (versioned):** small readable header (magic `STEADY1`, format version, KDF name, iterations, salt, IV, app/schema version) then ciphertext. Put the header in GCM's authenticated data so it can't be tampered with. Backups from the same phone share the salt, so a second phone entering the password re-derives from the salt in the file.
- **Password guidance:** minimum 10 characters, suggest 3–4 random words, show a plain strength hint, ask to type it twice. Don't claim to check it against breach lists (that is a third-party call).
- **Honesty about forgetting:** shown at set-up, in plain words: "If you forget this password, nobody, including us, can open your backups. There is no reset." Offer a one-line "write it down" nudge. Changing the password later means re-encrypting the next backup; old files keep the old password, say so.

### Backup contents and restore
- JSON of every table except `photos`, plus the `steady.*` localStorage settings (alerts hidden/seen, notice acknowledgements), the Dexie version, the app version, and a created-at stamp. Include the profile's `name` and draft text; it is all inside the encrypted file.
- **Size:** without photos it is a few hundred KB even after years of food logs; compress (CompressionStream gzip) before encrypting to be safe. Estimate to confirm in the plan. The daily, keep-2 rotation is trivial for Dropbox free quota.
- **Restore:** download, ask password, decrypt (a wrong password fails the GCM check cleanly), then validate before touching anything: header version known, schema version not newer than the app, every table is an array, key fields are the right types, row count sanity. Show a summary ("12 injections, 40 weights, last entry 14 Nov"). Confirm like Reset, then replace in one Dexie transaction so a failure leaves the old data. Photos on the phone: decide in the plan whether restore keeps existing photos or clears them (their weigh-in ids may no longer match; likely clear and say so).
- **Older backup:** because the file stores the schema version, run an upgrade function per version step (e.g. missing `drug` reads as Wegovy, which the app already does). A backup from a newer app than the one installed is refused with a plain message ("update Steady first").

### The once-a-day trigger
- No background work exists for an installed iOS web app, and none should be promised. On app open and on `visibilitychange` to visible: if local time is past the evening time (default 8 pm, owner to confirm) and no backup exists for today, run one. If missed, the first open the next day backs up (that day's evening rule does not delay it). Record "last backup date" in IndexedDB. A failed attempt retries at the next open, not in a loop.
- Honest consequence: if the owner doesn't open the app for a week, nothing is backed up, and the Backup screen should show "Last backup: 3 days ago" in a calm amber, not an alarm.
- After upload, list the folder, sort by name/date, delete all but the newest 2. Never delete before the new upload succeeds.

### The ☰ Backup screen
Connect/Disconnect Dropbox; set or change password; "Last backup" line with date and size; "Back up now"; Restore (list of 2 backups by date, summary, confirm). Plain explanation near the top of what leaves the phone and that photos are not included. Nothing on Home.

### Calendar reminder (.ics)
Generated on the phone as a Blob: `VEVENT` with `RRULE:FREQ=WEEKLY;BYDAY=<injection weekday>`, an all-day event so no time zone trouble, title "Injection day", no dose, drug or medical text. Opened through the share sheet or a download link; iOS offers "Add to Calendar". Hidden/disabled with a short note if no injection weekday is set. Re-tapping creates a duplicate in the calendar; say so on the button's note. If the weekday changes, the old event is not updated; mention that.

### Ideas the owner may not have thought of (optional)
- **Test restore:** "Check my latest backup" downloads and decrypts it without replacing anything, so the owner knows it works before they need it.
- **Backup also as a manual file:** "Save a copy to Files" using the same encrypted format, for people who don't want Dropbox, or as an escape hatch if sign-in breaks.
- **Backup is the move to the App Store version:** same file format and a plain "this is how you move" line in the screen.
- **Recovery hint:** an optional password hint stored in the file header, set by the owner (they must be warned that it is not encrypted).

### Watch-outs
- **CLAUDE.md rule must change first, in the approved plan:** "Health data stays on the device" becomes "leaves the phone only as an encrypted backup in the owner's own Dropbox, plus Open Food Facts". Also the "no third-party calls" line, and any privacy wording in the app (e.g. the Open Food Facts notice, About text).
- **Cloud test environment:** the proxy must allow `www.dropbox.com`, `api.dropboxapi.com`, `content.dropboxapi.com`; even then, the OAuth sign-in needs the owner's login, so it can't be fully tested without them. Plan on mocks (a fake fetch for Dropbox endpoints, in-memory folder, scripted `invalid_grant`) for automated tests, with one real-phone check by the owner at the end. Crypto and format tests need no network.
- **Reset interplay:** `resetAllData` clears every Dexie table. If the token/key sit in a Dexie table, Reset would disconnect Dropbox and delete the key. Decide: Reset also disconnects and forgets the password (cleaner, privacy-friendly, but the Dropbox backups remain; tell the owner and offer to delete them), versus keep them out of Reset. Recommend disconnect plus a clear line saying the existing Dropbox files are untouched. Also never auto-back-up an empty database straight after Reset over a good backup: with keep-2 rotation, two empty backups would wipe the good ones. Guard: skip auto backup when the database has no entries, or don't rotate below N good files.
- **Same trap with a bad restore/update:** an automatic backup of broken data could push out the last good file after two days. Keep-2 is a fixed requirement; the guard above and the test-restore idea soften it.
- **No dose advice:** backup screen, restore summary and .ics show facts only; the restore summary counts rows and dates, never interprets doses. Medical wording is not needed anywhere here.
- **Dropbox "Development" status** caps the app at a limited number of users, which is fine for "Only you"; it may need a one-time re-consent if scopes change later.
