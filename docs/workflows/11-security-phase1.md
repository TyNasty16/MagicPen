# Workflow 11 — Security hardening, Phase 1
Status: Draft
Milestone: Follow-on to 7 — Backup/restore, calendar reminder, deploy (PLAN.md §5). Not a numbered milestone; scope comes from the owner-approved audit plan (see question 1).

## Ideas considered
Ideas file: [docs/ideas/11-security-phase1.md](../ideas/11-security-phase1.md). Audit: [docs/security/2026-11-27-app-store-audit.md](../security/2026-11-27-app-store-audit.md) (findings 1-3, 5, 6, 8-12). Chosen: one document, three groups (A CI and repo, B app, C owner checklist); CSP only in production builds (idea 2B); password rule on set/change only (3A); notice shown after a few days of use (4A); OFF out-of-range products go to the existing hidden count (5A); restore refuses the whole file on the first bad row (6A). Owner decisions 2026-11-27: photos stay out of backups (no photo backup); start Phase 1. Existing code touched: `.github/workflows/deploy-pages.yml`, `src/pages/Backup.tsx`, `src/lib/backup/*`, `src/lib/offSearch.ts`, `index.html`, `vite.config.ts`.

## Goal
Close the cheap website-app security gaps from the audit without changing what the app does or who it talks to.

## In scope
**A. CI and repo**
- Split `deploy-pages.yml` permissions per job: build `contents: read`; deploy `pages: write`, `id-token: write`. Verify whether `actions/configure-pages` needs `pages: write` (if so, move it to deploy or give only that job the permission).
- `.github/dependabot.yml`: npm and github-actions, weekly, grouped, small PR limit.
- Update vitest; clear the dev-tool `npm audit` findings.

**B. The app**
- Meta CSP, production build only.
- Password rule for new and changed passwords only: 16+ characters; reject one repeated character and fewer than 6 distinct characters. Restore and unlock never apply it.
- One-time Home Screen notice plus `navigator.storage.persist()`.
- Open Food Facts value caps, via the existing hidden-count path.
- Stricter restore row checks.
- Disconnect wording.

**C. Owner checklist** (below; no code).

## Out of scope
- Photo backup (owner decision: never). Keychain, Face ID lock, custom domain, native Dropbox sign-in, App Store work (Phase 2).
- Pinning actions to commit hashes; a Settings "Security" section; `SECURITY.md`.
- Rewriting past commits (old email stays in history).
- Any dose advice. The app still only logs doses.

## Steps
1. **CI:** edit `.github/workflows/deploy-pages.yml` (per-job permissions; check configure-pages). Run on a branch with `workflow_dispatch` and confirm build and deploy both pass before merging.
2. **Dependabot:** add `.github/dependabot.yml`.
3. **vitest:** update in `package.json`/lockfile; run `npm audit`; fix tests only if the update needs it.
4. **Password rule:** new pure function `checkNewPassword(pw)` in `src/lib/backup/passwordRule.ts` (count characters, not bytes); use it in `PasswordSetup` in `src/pages/Backup.tsx` (replaces the 12-character check and note). Not called from restore or unlock.
5. **OFF caps:** in `src/lib/offSearch.ts`, per 100 g/ml: kcal 0-900; protein, carbs, fat 0-100 g; protein + carbs + fat at most 105 g (allowance for rounding). Anything outside is counted as hidden. Update `hiddenLine` text.
6. **Restore checks:** in `src/lib/backup/` validate every row (`site` in the allowed list, ids positive integers, required numbers finite and in sane ranges, dates parseable) in the step that runs before anything is wiped. Refuse the whole restore on the first bad row.
7. **Home Screen notice and persist:** small component on `src/pages/Home.tsx`; `persist()` call at startup (`src/main.tsx`). Show only when not standalone (`navigator.standalone` and `display-mode: standalone`), on an iPhone/iPad browser, 3+ days after first use, no backup in the last 14 days, and not dismissed. "Dismissed" is stored on the phone.
8. **Disconnect wording:** add one line under Disconnect in `src/pages/Backup.tsx`.
9. **Tests** for steps 4-7 (one full run and production build happens once, after step 10).
10. **CSP last:** small Vite HTML transform in `vite.config.ts` adds the meta tag to the production build only. Policy: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' https://search.openfoodfacts.org https://world.openfoodfacts.org https://api.dropboxapi.com https://content.dropboxapi.com; media-src 'self' blob:; worker-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'`.. Then the full tests, build and mocked iPhone pass (Tests).
11. Owner works through the checklist (section C).

## Exact text for owner review
- Password intro (replaces "at least 12 characters…"): "Choose a password of at least 16 characters. Four or more random words work well. If you forget this password, nobody, including us, can open your backups. There is no reset. Write it down and keep it somewhere safe."
- Too short: "Use at least 16 characters."
- Repeated or low variety: "That password repeats too much. Use four or more unrelated words."
- Hidden OFF line: "3 products hidden: nutrition not listed or not plausible." (1 product: "1 product hidden: nutrition not listed or not plausible.")
- Home Screen notice title: "Keep your entries safe"
- Notice body: "You are using Steady in a browser tab. Safari may clear its saved data if you do not open it for a week. Open Steady from your Home Screen instead: tap Share, then Add to Home Screen. Backing up to Dropbox also protects your entries."
- Notice button: "Got it"
- Disconnect line: "You can also remove Steady at dropbox.com under Connected apps."

## Acceptance criteria
- CI: the build job has only `contents: read`; deploy still succeeds and the live site updates. `.github/dependabot.yml` lists npm and github-actions, weekly.
- `npm audit` shows no critical findings; all tests pass.
- Setting or changing a password: "aaaaaaaaaaaaaaaaaaaa" and 15 characters are refused with the messages above; "river lamp tiger chair" is accepted. A backup made with an old 12-character password still restores.
- OFF: a product with 950 kcal, or protein 80 + carbs 60 + fat 10 per 100 g, is hidden and counted; olive oil (about 880 kcal, 100 g fat) is still shown.
- Restore: a file with an unknown `site`, a negative id, or a non-finite number is refused with nothing changed on the phone; backups made by the current version still restore.
- Notice: shown in a Safari tab on day 3+ with no recent backup; never shown in the Home Screen app, on desktop or on Android; "Got it" hides it for good. It never says data is safe.
- The production page has one CSP meta tag; the dev server has none and still works.
- Under the CSP the browser console shows no violation for: scan screen camera start, taking a photo, PDF share, Dropbox round trip (connect, back up, list, restore), OFF text and barcode search.
- No new network hosts. No dose advice anywhere.

## Tests
Automatic (Vitest): password rule (length by characters incl. emoji, repeated, distinct count, boundary 16); OFF caps (boundaries, oil kept, hidden count and line text); restore validator (each bad-row type, plus a backup made by the current code passes); notice conditions as a pure function (one test per boundary: standalone, platform, 3 days, 14-day backup, dismissed); CSP guard that reads the built `dist/index.html` and fails if a needed host is missing or `unsafe-eval` appears.

By hand: one scripted mocked iPhone pass on the production build (`vite preview`, fake camera stream) checking the console for CSP violations during: scan screen camera start, photo capture, PDF share, Dropbox round trip, OFF search. Service-worker update and the Home Screen app are left to the owner's real-phone check.
Real iPhone after deploy (owner): one scan, one photo, one backup and restore, one report share, and the app still updates from the Home Screen. A wrong CSP fails quietly, so this matters.

## Token Steward trims (applied)
One full test/build run after the CSP step; no text-guard test; notice tests at boundaries only; CSP policy chosen once; one scripted mocked pass (service worker and Home Screen left to the real phone); review checkpoints section removed (CLAUDE.md covers it). Kept the vitest update: `npm audit` is not clean without it.

## Risks & open questions
- A wrong CSP can break camera, photos or Dropbox with no visible error; mitigated by doing it last, testing on the production build, and the real-phone check. Rollback is removing one tag.
- Workbox or vite-plugin-pwa may inject inline script; the test will show it. Meta CSP cannot block framing (low risk).
- `persist()` often returns false on Safari; the notice makes no safety claim.
- Branch protection (C) stops direct pushes to `main` by design; the pull request habit continues.
- vitest bump could change test behaviour; fix tests only, not app code.
- Dropbox may rename "Connected apps"; check against Dropbox's own page.
- Questions:
  1. This is not in PLAN.md §5; proceed under the audit plan? (yes/no)
  2. Notice after 3 days of use, hidden if a backup is under 14 days old? (yes/other)
  3. Approve the exact text above? (yes/changes)
  4. Split into 11a (A and C) and 11b (B)? (default: one document, built in the order above)

## Owner checklist (C) — on github.com, step by step
1. **Two-factor sign-in (2FA).** Open github.com, click your picture (top right), Settings, Password and authentication, Enable two-factor authentication. Choose "Authenticator app" (for example Apple Passwords or Google Authenticator) and scan the QR code. Download the recovery codes and save them somewhere safe, not only on this phone. Optionally add a passkey on the same page.
2. **Private commit email.** Settings, Emails. Tick "Keep my email addresses private" and "Block command line pushes that expose my email". From then on, merges you do on github.com use a private `@users.noreply.github.com` address. Past commits keep the old address.
3. **Protect `main`.** Open the MagicPen repository, Settings, Rules, Rulesets, New ruleset, New branch ruleset. Name it "Protect main". Set Enforcement to Active. Under Target branches, Add target, Include default branch. Tick "Require a pull request before merging" and "Block force pushes". Click Create. After this, changes reach `main` only through a pull request.
4. **Pages only for Steady.** Your profile, Repositories. For each other repository, open Settings, Pages. It must say Pages is not published (source "None"). Do not publish any other site from this account. If you want a second site, tell me first.

## In plain English
**What changes**
- **Website publishing:** the robot that publishes the app gets only the access it needs. Update checks run weekly.
- **Backup passwords:** new ones need 16+ characters. Old backups still open.
- **Browser rules:** the app contacts only the sites it needs. A mistake could quietly break the camera, photos or Dropbox, so it is tested before release.
- **Food search:** implausible entries are hidden and counted.
- **Restore:** a backup with any bad entry is refused whole.
- **Dropbox disconnect:** a line points you to where to remove Steady.
- **Photos:** stay out of backups, as you decided.

**Why:** it closes cheap gaps found in the security audit without changing what the app does.

**You will notice:** a stronger password rule, and a one-time Safari tip after 3 days to add Steady to your Home Screen.

**You need to do:** four github.com steps (section C), then a phone test after release: one scan, one photo, one backup and restore, one report share.

**You need to decide**
- Approve the plan, or ask for changes.
- Answer the four questions.

## Approval
- [ ] Approved by owner — date:
