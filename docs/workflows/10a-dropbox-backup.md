# Workflow 10a — Encrypted Dropbox backup and restore
Status: Draft
Milestone: 7 — Backup/restore, calendar reminder, deploy (PLAN.md §5). Part 1 of 2; 10b (calendar reminder) is separate. Deploy to GitHub Pages already exists.

## Ideas considered
Ideas file: [docs/ideas/10-backup.md](../ideas/10-backup.md); owner's fixed decisions: [docs/ideas/10-backup-brief.md](../ideas/10-backup-brief.md) (not re-asked). Chosen approach A: two builds, this one first. Plain `fetch` to Dropbox, no library. Existing code touched: `src/db/db.ts` (new v9 table, `resetAllData`), `GearMenu.tsx` (menu item), `Settings.tsx` (Reset wording, "stored only on this device" line), router.

## Goal
Once a day, Steady saves an encrypted copy of everything except photos into the owner's own Dropbox app folder, keeps the latest 2, and can restore from one, all from a Backup screen in the menu.

## In scope
- Backup item in the ☰ menu and a Backup screen (nothing on Home): connect/disconnect, set or change password, last backup time, evening time, "Back up now", Restore.
- Dropbox sign-in by OAuth PKCE (app key `7sybextdkplxswz`; the App secret is never used or requested) with a code-paste fallback for the iPhone Home Screen app.
- Encryption on the phone before upload; versioned file format.
- Automatic daily backup; keep the latest 2; empty-data guard.
- Restore with full validation, a counts summary and a Reset-style confirmation.
- CLAUDE.md product-rule change and the in-app wording that says "only on this device".

## Out of scope
- Photos in the backup; background backup while the app is closed (not possible for a web app, not promised).
- Dropbox library, other clouds, iCloud, manual "Save to Files" copy, "Check my latest backup" test button, password hint (all candidate follow-ups for the Ideas closing pass).
- Any dose advice; the Backup screen and restore summary show counts and dates only.
- The calendar reminder (10b).

## Design
**Sign-in.** Redirect flow first: authorize URL with `response_type=code`, PKCE `S256`, `token_access_type=offline`, redirect `https://tynasty16.github.io/MagicPen/` (or `http://localhost:4173/` in testing). The verifier and state are saved in `localStorage` (not sessionStorage) before leaving. On return, the app reads `?code=&state=`, removes them from the address bar, and swaps the code at `api.dropboxapi.com/oauth2/token`. Refresh uses the same endpoint. Tokens are never logged or put in a URL.
**iPhone quirk.** A Home Screen app and Safari have separate storage, so the return may land in Safari with no verifier. Then Steady shows: "Sign-in finished in the browser, not in the app. Go back to Steady and choose Connect with a code." Fallback flow (no redirect): the authorize URL is built without `redirect_uri`; Dropbox shows a code; the owner copies it, returns to Steady, pastes it, and Steady swaps it with the verifier saved in the app. Default: the Connect screen shows both buttons, "Connect Dropbox" first and "Connect with a code" under "Sign-in didn't return to the app?". The first real-phone test decides whether the code flow becomes the only visible button.
**Where things live.** New Dexie v9 table `backupState` (single row): refresh token, short-lived access token and expiry, non-extractable CryptoKey, salt, iterations, evening time, last backup time, last backed-up fingerprint and row count, last error. Excluded from backups. `resetAllData` clears it with every other table.
**Encryption.** PBKDF2-SHA-256, 600,000 iterations, random 16-byte salt, then AES-GCM-256 with a fresh random 12-byte IV per file. The key is derived once when the password is set (or entered at restore on another phone), stored as a non-extractable CryptoKey, and the password is never stored or sent. Minimum 12 characters, typed twice, plain strength hint, no breach-list lookup. Honest wording at set-up (below), with a "Write it down" reminder. Changing the password makes a new salt and key; older files keep the old password.
**File.** Name `steady-YYYY-MM-DD-HHmm.steadybackup` (phone local time). Header, readable and used as AES-GCM authenticated data: magic `STEADYBK` (8 bytes), format version (1), app schema version (9), iterations (4 bytes), salt (16), IV (12), then ciphertext. Body: gzip (`CompressionStream`) of JSON `{ format, schemaVersion, appVersion, createdAt, tables, prefs }`. Tables: every table except `photos` and `backupState`; prefs: the `steady.*` screen preferences Reset also clears. Tokens and the key are never included. One upload call (limit 150 MB; expected few hundred KB).
**When.** On app open and on `visibilitychange` to visible, if connected and a key exists: due when the last successful backup is older than the most recent evening time (default 20:00 local, choose 18:00 to 23:00), and the data fingerprint (SHA-256 of the serialized tables) differs from the last backup. So: once per evening; if the evening was missed, the next open backs up. One attempt per open, at least 30 minutes between failed attempts, never a retry loop.
**Rotation.** After a successful upload, list the folder and delete all but the newest 2 matching files. Never delete before the new upload succeeds.
**Empty-data guard.** Automatic backup is skipped if the database has fewer than 5 entry rows (injections, weights, measurements, symptoms, food log, water, appointments) or fewer than half the rows of the last backup. "Back up now" in that case asks first: "This is much smaller than your last backup. Back up anyway? Your older backups stay until a newer one replaces them." Skipped runs say why on the Backup screen.
**Restore.** List files in the folder by date (names only). Choose one; if the stored key's salt and iterations match the file header, use it; otherwise ask for the password. Download, decrypt, gunzip, validate fully (magic, version known, schema not newer than the app, every table an array, field types and key ranges, row-count sanity) before touching anything. Show the summary. Confirm by typing RESTORE (same pattern as Reset). Replace all restorable tables and prefs in one Dexie transaction, so a failure leaves the old data; then reload. Photos on the phone are untouched. Older schema versions pass through one upgrade function per version step.
**Reset (default).** Reset also disconnects Dropbox and forgets the key, because the table is cleared with the rest, and tries once to revoke the token (failure ignored). Files already in Dropbox are untouched; that is the way back. The Reset text is updated (below).
**Errors** (calm, one line each, never wipe local data): offline: skipped quietly, retried at next open. Token revoked or refresh `invalid_grant`/401: "Dropbox sign-in ended. Connect again." and automatic backups stop. Dropbox full (`insufficient_space`): "Your Dropbox is full. Nothing was deleted. Free some space and tap Back up now." Wrong password or damaged ciphertext (AES-GCM cannot tell these apart): "Wrong password, or the file is damaged." Not a Steady file, unknown version, bad gzip/JSON, failed validation: "This backup can't be read. Your data on this phone was not changed." Newer than the app: "This backup was made by a newer Steady. Update Steady first."

## Exact text for owner review
**CLAUDE.md product rule (replaces the "Health data stays on the device" line):**
"Health data is stored on the device (IndexedDB). It leaves the phone only as (1) an encrypted backup, made on the phone with the owner's password and sent to the owner's own Dropbox app folder (never photos, never the password), and (2) files the owner chooses to share, such as the doctor report. The Dropbox App secret is never used. No analytics. No third-party calls except the Open Food Facts food search and Dropbox (sign-in and backup only)."
Steps will also change any PLAN.md line that says the same thing, shown to you in the diff.

**Backup screen top note:** "Steady saves an encrypted copy of your entries (not photos) to your own Dropbox. It is locked on this phone with your password before it leaves. Photos are not included."
**Password set-up:** "Choose a password of at least 12 characters. Three or four random words work well. If you forget this password, nobody, including us, can open your backups. There is no reset. Write it down and keep it somewhere safe." Buttons: "Save password". After a change: "New backups use the new password. Older backups still need the old one."
**Status lines:** "Last backup: [date, time] ([size])"; amber after 3 days: "Last backup: [n] days ago. Open Steady in the evening to back up." Never: "No backup yet."
**Buttons:** "Connect Dropbox"; "Connect with a code"; "Disconnect Dropbox" (note: "Your backups stay in Dropbox."); "Back up now"; "Restore from a backup".
**Code flow:** "Dropbox will show a code. Copy it, come back to Steady, and paste it here." Field label "Code from Dropbox".
**Restore confirm:** "This replaces your entries on this phone with the backup from [date]: [n] injections, [n] weigh-ins, [n] measurements, [n] symptoms, [n] food entries, [n] appointments. Last entry [date]. Photos on this phone are not changed. Type RESTORE to confirm." Button "Replace my data".
**Reset sheet, new last lines (replace "There is no backup, and this cannot be undone."):** "This cannot be undone. It also disconnects Dropbox and forgets your backup password on this phone. Backups already in your Dropbox are not deleted."
**Settings line (replaces "All of your data is stored only on this device."):** "Your data is stored on this device. If you turn on Dropbox backup, an encrypted copy of your entries (not photos) is also saved to your Dropbox."

## Steps
1. After approval, update `CLAUDE.md` product rule with the wording above (and PLAN.md if needed).
2. `src/db/db.ts`: Dexie v9 adds `backupState: 'id'`; type `BackupState`; `resetAllData` already clears all tables, add the best-effort revoke call through the backup module and the new pref keys.
3. `src/lib/backup/format.ts` (pure): header encode/decode, `encryptBackup`, `decryptBackup`, key derive/import, errors as typed codes.
4. `src/lib/backup/serialize.ts` (pure): `buildPayload`, `fingerprint`, `validatePayload`, `summarize`, version upgrade steps.
5. `src/lib/backup/schedule.ts` (pure): `isBackupDue(now, lastBackupAt, eveningTime, changed)`, `shouldSkipAsEmpty`, `pickToDelete` (keep newest 2), file-name make/parse.
6. `src/lib/backup/dropbox.ts`: config constant (app key, redirect rules), PKCE, authorize URL (redirect and no-redirect), token swap/refresh, upload, list, download, delete, revoke; all plain `fetch`; content-host calls use `application/octet-stream`.
7. `src/lib/backup/run.ts`: `runBackup({manual})` and `restoreFrom(file, password?)` tying the above to Dexie; a single in-flight lock; startup and `visibilitychange` hook in `src/App.tsx` (or the existing entry).
8. `src/pages/Backup.tsx` (new) and route `#/backup`; `src/components/GearMenu.tsx` item "Backup"; the redirect return handler on load.
9. `src/pages/Settings.tsx`: Reset and "stored only on this device" wording.
10. Tests (below), full run and build, one browser pass.

## Acceptance criteria
- A backup file begins with `STEADYBK`; decrypting with the right password gives the same tables; a wrong password, a changed header byte and a changed ciphertext byte all fail cleanly.
- The file contains no photos, no tokens, no key, and does not contain the password or readable entries.
- Password shorter than 12 characters or mismatched confirmation is refused.
- Due at 20:05 with no backup since 20:00 and changed data; not due at 19:55 the same day if backed up last evening; not due if already backed up at 20:10; due next morning if yesterday evening was missed; never due with unchanged data.
- Empty database after Reset never auto-uploads; two such runs never delete a good backup. A drop below half of the last backup's rows asks first on "Back up now".
- After a third successful backup only the newest 2 files remain; a failed upload deletes nothing.
- Restore shows counts, needs RESTORE typed, replaces in one transaction, leaves photos alone; a corrupt or newer-version file changes nothing.
- Revoked token shows "Dropbox sign-in ended. Connect again." and stops automatic attempts; offline is silent; Dropbox full shows its message.
- Reset disconnects, clears the key and says Dropbox files are untouched.
- Home has no backup element; nothing is sent to any host except Dropbox, and only after Connect.
- Code-paste connect works with a mocked Dropbox; return without a verifier shows the Safari message.
- Existing tests and the build pass.

## Tests
Automatic (Vitest, Node 22 Web Crypto): format round trip; header fields; tamper cases; wrong password; payload excludes photos and `backupState`; fingerprint stable and changes with data; validation rejections (not arrays, wrong types, newer schema); `isBackupDue` cases; empty guard; rotation picks; file-name parsing; PKCE challenge against the RFC 7636 example.
Automatic (Playwright, route interception of the three Dropbox hosts with an in-memory folder; one pass with iPhone 13 emulation): connect by redirect and by code; first backup; second day backup; rotation; restore into a changed database; 401 revoked; 409 full; offline; return-without-verifier message.
By hand on the real iPhone after deploy (owner checklist): 1) install to Home Screen; 2) Connect Dropbox: does it return to the app? If not, use Connect with a code; 3) set password, Back up now, see the file in Dropbox › Apps; 4) add an entry, reopen after 8 pm, see an automatic backup; 5) restore on the phone; 6) Disconnect, Reconnect; 7) Reset, confirm Dropbox files remain.
Optional live check by the agent: only if the cloud environment allows `www.dropbox.com`, `api.dropboxapi.com`, `content.dropboxapi.com`; sign-in still needs the owner's login, so it cannot be fully automated.

## Risks & open questions
- Dropbox's redirect or CORS behaviour on iOS can only be proven on the real phone; the fallback exists for that.
- The non-extractable key protects against file theft, not against a compromised app.
- A photo's link to its weigh-in is by id: restoring an older backup onto the same phone could pair a photo with a different weigh-in. Default: leave photos untouched, as you decided.
- Two bad automatic backups can still push out good ones; the empty-data guard reduces this, it cannot remove it.
- Dropbox app is in Development status ("Only you"); a scope change later needs a new consent.
- Proposed defaults, reply "defaults OK":
  - No library; plain `fetch`.
  - PBKDF2-SHA-256, 600,000 iterations; AES-GCM-256; password minimum 12 characters.
  - Evening time 20:00, changeable 18:00 to 23:00; a missed evening backs up at next open.
  - Keep 2 backups, newest by name; empty guard: under 5 entries or under half of the last backup.
  - Reset disconnects Dropbox, forgets the key, leaves Dropbox files alone.
  - Both Connect buttons shown, redirect first.
  - Backup state kept in a new `backupState` table, excluded from backups.
- Reply "approve the exact text", or give changes to the wording above, including the CLAUDE.md rule.
- Questions: Keep 12 characters or use 10? Should Reset also try to delete the Dropbox files (default no)? After the phone test, make the code flow the only button if the redirect fails (default yes)?

## Review checkpoints
- Token Steward: before start (applied: error mapping and restore-into-changed-data tested in Vitest with a mocked fetch; Playwright limited to one flow — connect by code, first backup, rotation; no live check by the agent (needs the owner's login); no upgrade chain yet — restore accepts known versions not newer than the app; one full test run, build, browser pass and code review for 10a+10b together)
- Code Reviewer: before commit
- Plain-Language Explainer: summary for owner

## In plain English
- Once a day, after your evening time (default 8 pm), Steady saves a copy of your entries to your own Dropbox. Photos are not included. Only the newest 2 copies are kept.
- Each copy is scrambled on your phone with your password before it leaves, so it cannot be read without that password.
- You find it under Backup in the ☰ menu.

**One-time setup:** connect your Dropbox, then choose a password of at least 12 characters. On iPhone, if sign-in does not bring you back to the app, you copy a code from Dropbox and paste it into Steady.

**What could go wrong:**
- If you forget the password, the backups cannot be opened. There is no reset.
- Backups only run when you open the app.
- Reset (in Settings) disconnects Dropbox. Backups already in Dropbox stay there.

**Cost:** nothing.

**You need to decide:**
- The defaults: 8 pm evening time, keep 2 copies, 12-character minimum password.
- Approve the exact wording on the screens.
- Approve the new privacy rule wording for CLAUDE.md (the project rules file).

## Approval
- [ ] Approved by owner — date:
