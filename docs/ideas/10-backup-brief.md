# Milestone 7 — Backup (owner brief from the Q&A, 2026-11-26/27)

Decisions the owner made. Requirements for the Ideas agent and Workflow Planner, not suggestions.

1. **Why:** data lives only on the phone; losing the app, Safari data, the phone, or a bad update loses everything; a backup is also how history moves to the future App Store version.
2. **Option B — automatic backup to the owner's own Dropbox.** (Rejected: A reminder + one tap; C iCloud web $99/yr; D App Store version — later.) This changes the CLAUDE.md product rule: health data leaves the phone only as an **encrypted** backup in the owner's own Dropbox, plus the existing Open Food Facts search.
3. **Dropbox app (created by the owner):** Scoped access, **App folder** only ("Apps › <app name>"), Development status, "Only you"; redirect URIs `https://tynasty16.github.io/MagicPen/` and `http://localhost:4173/`; public clients (PKCE) allowed; scopes `files.metadata.read`, `files.content.write`, `files.content.read`. **App key: `7sybextdkplxswz`** (public by design). The App secret is NOT used and must never be requested or stored.
4. **Not an MCP:** the backup runs in the app on the phone, without Claude.
5. **Encryption: yes.** Encrypted on the phone before upload with a password the owner sets once; remembered on the phone; typed again only to restore on another phone. Forgotten password = backup cannot be opened by anyone.
6. **Contents:** everything **except photos** (profile incl. name and drafts, injections, weights, measurements, symptoms, food log, My Foods, water, day marks, appointments, settings).
7. **When:** automatically **once a day at the end of the day**. A web app can't run while closed, so: the first time Steady is open after an evening time (default 8 pm, to be confirmed in the plan) and at most once per day; if not opened that evening, at the next open. Plus a "Back up now" button.
8. **Keep only the latest 2 backups** in the Dropbox folder; older ones deleted.
9. **Restore:** Menu → Backup → Restore: pick a backup by date, see what's in it, confirm; replaces what's on the phone (asks first, like Reset).
10. **Where it lives:** a **Backup** item in the ☰ menu. **Nothing on the Home screen.**
11. **Calendar reminder (rest of Milestone 7): OK** — an "Add weekly injection reminder to Calendar" button (.ics), off unless tapped.

Product rules still apply: never dose advice; $0; owner approves exact wording.
