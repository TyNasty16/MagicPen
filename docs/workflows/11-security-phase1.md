# Workflow 11 — Security hardening, Phase 1
Status: Built
Milestone: Follow-on to 7 — Backup/restore, calendar reminder, deploy (PLAN.md §5). Not a numbered milestone; scope comes from the owner-approved audit plan (see question 1).

## Ideas considered
Ideas file: [docs/ideas/11-security-phase1.md](../ideas/11-security-phase1.md) (opening pass and "Second look"). Audit: [docs/security/2026-11-27-app-store-audit.md](../security/2026-11-27-app-store-audit.md) (findings 1-3, 5, 6, 8-12). Cybersecurity review: [docs/security/2026-11-27-phase1-plan-review.md](../security/2026-11-27-phase1-plan-review.md). Chosen: one document, three groups (A CI and repo, B app, C owner checklist); CSP only in production builds; password rule on set/change only; notice shown after a few days of use; OFF out-of-range products go to the existing hidden count; restore refuses the whole file on the first bad row. Owner decisions 2026-11-27: photos stay out of backups; start Phase 1. Existing code touched: `.github/workflows/deploy-pages.yml`, `src/pages/Backup.tsx`, `src/lib/backup/*`, `src/lib/offSearch.ts`, `index.html`, `vite.config.ts`.

## Changes after second review
Settled between the security review and the user-experience view:
- CSP goes first in `<head>`, starts without `'unsafe-inline'`, adds `object-src 'none'`, drops `data:` and `media-src`.
- No deploy from a branch; `configure-pages` removed; `npm ci --ignore-scripts`; `cancel-in-progress: false`; new pull-request test workflow; Dependabot cooldown.
- Password: stronger rules, NFC, live "12 of 16" counter, messages that say what to do. ("Back up now" after a change stays idea I-64, not in this plan.) No "consider changing" card; one checklist line instead.
- Restore: file-size and decompressed-size caps, iterations max 2M, real calendar dates, more field checks. No string-length caps.
- OFF: serving cap, more invisible characters stripped, missing carbs/fat count as 0.
- Notice: wider iPhone/iPad detection, `persist()` on iOS/iPadOS only.
- Checklist split into "Now" and "When you have time", with new items.
- Deferred: Node pin, commit hash in Settings.

## Goal
Close the cheap website-app security gaps from the audit without changing what the app does or who it talks to.

## In scope
**A. CI and repo**
- `deploy-pages.yml`: delete the `configure-pages` step (its output is unused; the base path is the hard-coded `VITE_BASE`), so the build job has only `contents: read`; deploy keeps `pages: write`, `id-token: write`. Use `npm ci --ignore-scripts` (after confirming the branch build passes). Set `cancel-in-progress: false`.
- New pull-request workflow running tests and build with `contents: read`. Dependabot PRs never trigger the deploy (pushes to `main` only).
- `.github/dependabot.yml`: npm and github-actions, weekly, grouped, small PR limit, cooldown of about 7 days.
- Update vitest; clear the dev-tool `npm audit` findings.
- Limit, stated plainly: splitting permissions protects the deploy token, but it does not stop a poisoned build-time dependency from shipping in the built site.

**B. The app**
- Meta CSP and referrer meta, production build only.
- Password rule for new and changed passwords only (restore and unlock never apply it).
- One-time Home Screen notice; `navigator.storage.persist()` on iOS/iPadOS only.
- Open Food Facts value caps, via the existing hidden-count path.
- Stricter restore checks.
- Disconnect wording.

**C. Owner checklist** (below; no code).

## Out of scope
- Photo backup (owner decision: never). Keychain, Face ID lock, custom domain, native Dropbox sign-in, App Store work, Argon2, Trusted Types, `upgrade-insecure-requests` (Phase 2).
- Node version pin and a commit hash in Settings (deferred); pinning actions to commit hashes; a Settings "Security" section; `SECURITY.md`.
- A "consider changing your password" card (the app cannot check old passwords).
- Rewriting past commits (old email stays in history).
- Any dose advice. The app still only logs doses.

## Steps
1. **CI:** edit `.github/workflows/deploy-pages.yml` as above. The new test workflow (step 2) builds the branch with `--ignore-scripts` on the pull request, so no separate branch run; the deploy is never run from a branch. Confirm the deploy after merge.
2. **Test workflow and Dependabot:** add `.github/workflows/test.yml` (on `pull_request`, `contents: read`; `npm ci --ignore-scripts`, tests, build) and `.github/dependabot.yml`.
3. **vitest:** update in `package.json`/lockfile; run `npm audit`; fix tests only if the update needs it.
4. **Password rule:** new pure function `checkNewPassword(pw)` in `src/lib/backup/passwordRule.ts`. NFC-normalise, then count characters, not bytes. Rules: at least 16; not one repeated character; at least 6 distinct characters; not a piece of 4 characters or fewer repeated to fill the password (`passwordpassword`); no long sequence or keyboard run (6+ steps in a row, e.g. `123456`, `abcdef`, `qwerty`). It returns which rule failed. Use it in `PasswordSetup` in `src/pages/Backup.tsx` (replaces the 12-character check): live "12 of 16" counter under the box, so no rejection first appears after Save. Normalise the new password before it derives the key. Not called from restore or unlock (old passwords, with their original bytes, still work).
5. **OFF caps:** in `src/lib/offSearch.ts`, per 100 g/ml: kcal 0-900; protein, carbs, fat 0-100 g; protein + carbs + fat at most 105 g (missing carbs or fat count as 0); serving amount at most 2000 g/ml. Anything outside is counted as hidden. Add U+061C, U+00AD and U+E0000-E007F to `cleanText` (it already strips control and bidi characters). The barcode path reuses the existing "not found" text. Update `hiddenLine`.
6. **Restore checks:** in `src/lib/backup/`, in the step that runs before anything is wiped: refuse a listed file over about 25 MB before downloading it; cap the decompressed size (proposed 100 MB); iterations 100k-2M (was up to 10M); every row valid (`site` in the allowed list, ids positive integers, required numbers finite and in sane ranges); real calendar dates (`2026-13-45` fails); checks on `measurements`, `dayMarks` and `profile` fields. No string-length caps. First bad row refuses the whole restore.
7. **Home Screen notice and persist:** small component on `src/pages/Home.tsx`; pure condition function. Show only when all hold: iPhone, or iPad (Macintosh user agent plus `maxTouchPoints > 1`), or CriOS/FxiOS; not standalone (`navigator.standalone` and `display-mode: standalone`); 3+ days after first use; no backup in the last 14 days; not dismissed. "Got it" stores dismissal on the phone and hides it for good. `persist()` call at startup in `src/main.tsx`, only on iOS/iPadOS.
8. **Disconnect wording:** one line under Disconnect in `src/pages/Backup.tsx`.
9. **Tests** for steps 4-7, table-driven at the boundaries (see Tests). Make the `Backup.tsx` changes (steps 4 and 8) in one edit. One full run and production build happens once, after step 10.
10. **CSP last:** a Vite `transformIndexHtml` hook in `vite.config.ts` (`injectTo: 'head-prepend'`) adds the CSP meta tag and `<meta name="referrer" content="no-referrer">` to the production build only. Policy, starting strict: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self' https://search.openfoodfacts.org https://world.openfoodfacts.org https://api.dropboxapi.com https://content.dropboxapi.com; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`. Left out on purpose: `frame-ancestors`, `report-uri`, `sandbox` (a meta tag ignores them and warns). If the mocked pass shows a style violation, add `'unsafe-inline'` to `style-src` only, and note it here. The Dropbox sign-in step is a page navigation, so it needs no `connect-src` entry. Then the full tests, build and mocked iPhone pass.
11. Owner works through the checklist (section C).

## Exact text for owner review
- Password intro: "Choose a password of at least 16 characters. Four or more random words work well. The strong password your iPhone suggests also works. If you forget this password, nobody, including us, can open your backups. There is no reset. Write it down and keep it somewhere safe."
- Counter: "12 of 16 characters" (turns to "16 of 16 characters" when enough).
- Too short: "Use at least 16 characters. For example: river lamp tiger chair."
- One repeated character or fewer than 6 different characters: "Too few different characters. Mix in more, for example four unrelated words."
- Repeated piece: "This repeats a short piece, like passwordpassword. Use four unrelated words instead."
- Sequence or keyboard run: "This has a run like 123456 or qwerty. Use four unrelated words instead."
- Hidden OFF line: "3 products hidden: nutrition not listed or not plausible." (1 product: "1 product hidden: nutrition not listed or not plausible.")
- Home Screen notice title: "Keep your entries safe"
- Notice body: "You are using Steady in a browser tab. Your browser may clear its saved data if you do not open it for a week. Open Steady from your Home Screen instead: tap Share, then Add to Home Screen. Backing up to Dropbox also protects your entries."
- Notice button: "Got it"
- Disconnect line: "You can also remove Steady at dropbox.com under Connected apps."

## Acceptance criteria
- CI: the build job has only `contents: read` and no `configure-pages` step; the pull-request test run passes with `--ignore-scripts`; after merge the deploy succeeds and the live site updates. A pull request runs the test workflow. `.github/dependabot.yml` lists npm and github-actions, weekly, grouped, with a cooldown.
- `npm audit` shows no critical findings; all tests pass.
- Setting or changing a password: 15 characters, "aaaaaaaaaaaaaaaaaaaa", "passwordpassword" and "1234567890123456" are each refused with their own message above; "river lamp tiger chair" is accepted. The counter reads "12 of 16 characters" after 12 characters. A backup made with an old 12-character password still restores.
- OFF: a product with 950 kcal, protein 80 + carbs 60 + fat 10 per 100 g, or a 5000 g serving is hidden and counted; olive oil (about 880 kcal, 100 g fat) is still shown. A name containing U+061C, U+00AD or a tag character (U+E0001) is shown without it. A barcode for an implausible product shows the existing "not found" text.
- Restore: a file with an unknown `site`, a negative id, a non-finite number, the date `2026-13-45`, iterations of 3M, or a listed size over 25 MB is refused with nothing changed on the phone; backups made by the current version still restore.
- Notice: shown in a Safari, Chrome or Firefox tab on iPhone, and on iPad, on day 3+ with no recent backup; never shown in the Home Screen app, on desktop or on Android; "Got it" hides it for good. It never says data is safe. `persist()` is not called on desktop or Android.
- The production page has one CSP meta tag, placed before every `<script>` and `<link>`, and a referrer meta; the dev server has none and still works.
- Under the CSP the browser console shows no violation for: scan screen camera start, taking a photo, PDF share, Dropbox round trip (connect, back up, list, restore), OFF text and barcode search.
- No new network hosts. No dose advice anywhere.

## Tests
Automatic (Vitest), boundaries only: password rule (16 vs 15 by characters incl. emoji, NFC, one repeated character, 5 vs 6 distinct, repeated piece, sequence/keyboard run, counter text); OFF caps (boundaries incl. serving 2000/2001, missing carbs, oil kept, invisible characters, hidden line text); restore validator (each bad-row type, invalid calendar date, iterations 2M vs 3M, size caps, plus a backup made by the current code passes); notice conditions as a pure function (one test per boundary: standalone, iPhone/iPad/CriOS/FxiOS vs desktop/Android, 3 days, 14-day backup, dismissed); CSP guard that reads the built `dist/index.html` and fails if the tag is not before every `<script>` and `<link>`, a needed host is missing, or `unsafe-eval` appears.

By hand: one scripted mocked iPhone pass on the production build (`vite preview`, fake camera stream) checking the console for CSP violations during: scan screen camera start, photo capture, PDF share, Dropbox round trip, OFF search. Service-worker update and the Home Screen app are left to the owner's real-phone check.
Real iPhone after deploy (owner): one scan, one photo, one backup and restore, one report share, a password change, and the app still updates from the Home Screen. A wrong CSP fails quietly, so this matters.

## Token Steward trims (applied)
One full test/build run after the CSP step; no text-guard test; notice tests at boundaries only; CSP policy chosen once; one scripted mocked pass (service worker and Home Screen left to the real phone); review checkpoints section removed (CLAUDE.md covers it). Kept the vitest update: `npm audit` is not clean without it. Second round: no separate branch run (the PR test workflow covers it); "Back up now" after a password change moved back to idea I-64; one `Backup.tsx` edit; table-driven boundary tests. Not applied: moving the Home Screen notice out. It was in the agreed audit plan (finding 6, Medium) and is the real fix for Safari's 7-day rule.

## Risks & open questions
- A wrong CSP can break camera, photos or Dropbox with no visible error; mitigated by doing it last, testing on the production build, and the real-phone check. Rollback is removing one tag.
- Workbox or vite-plugin-pwa may inject inline script; the guard and mocked pass will show it. A meta CSP cannot block framing (low risk).
- `--ignore-scripts` could break the build (esbuild runs from its binary package); the pull-request test run checks this before merge.
- Permission split does not stop a poisoned build dependency; Dependabot cooldown, PR tests and review are the mitigation.
- `persist()` often returns false on Safari; the notice makes no safety claim.
- Old backups stay in Dropbox's deleted-file history (30+ days) under the old password.
- Branch protection (C) stops direct pushes to `main` by design; the pull request habit continues.
- vitest bump could change test behaviour; fix tests only, not app code.
- Dropbox may rename "Connected apps" or its console screens; check against Dropbox's own page.
- Questions:
  1. This is not in PLAN.md §5; proceed under the audit plan? (yes/no)
  2. Notice after 3 days of use, hidden if a backup is under 14 days old? (yes/other)
  3. Approve the exact text above? (yes/changes)
  4. Decompressed restore cap of 100 MB? (yes/other number)
  5. Sequence rule at 6 characters in a row (`123456`, `qwerty`)? (yes/other number)
  6. Split into 11a (A and C) and 11b (B)? (default: one document, built in the order above)

## Owner checklist (C) — on github.com and dropbox.com
Tick each box when done.

### Now (about 10 minutes)
- [x] **1. Two-factor sign-in (2FA) on GitHub.** Why: stops anyone with your password from publishing as you. Settings, Password and authentication, Enable two-factor authentication, "Authenticator app", scan the QR code, save the recovery codes somewhere safe, not only on this phone.
- [x] **2. Private commit email.** Why: keeps your email out of public history. Settings, Emails. Tick "Keep my email addresses private" and "Block command line pushes that expose my email". Past commits keep the old address.
- [x] **3. Protect `main`.** Why: nothing reaches the live app without a pull request. Repository, Settings, Rules, Rulesets, New branch ruleset, name "Protect main", Enforcement Active, include default branch, tick "Require a pull request before merging" and "Block force pushes". Create.
- [x] **4. Pages only for Steady.** Why: other sites on your account would share the address. For each other repository, Settings, Pages must say not published. Tell me first if you want a second site.
- [x] **5. Password line.** Why: old backups used a weaker rule and the app cannot check them. If your backup password is under 16 characters, change it in Steady (Backup, Change password), then tap "Back up now". Dropbox keeps deleted backups 30+ days, so the old copy lingers a while.

### When you have time
- [x] **6. Secret scanning, push protection and Dependabot alerts.** Why: warns you if a key is ever pasted into the repo, and flags unsafe libraries. Repository, Settings, Advanced Security (or Code security): turn all three on.
- [x] **7. Actions token read-only.** Why: a hijacked workflow can then change nothing. Settings, Actions, General, Workflow permissions: "Read repository contents" and untick "Allow GitHub Actions to create and approve pull requests". Save.
- [x] **8. github-pages environment allows only `main`.** Why: a branch can never publish the live site. Settings, Environments, github-pages, Deployment branches: "Selected branches", add `main`.
- [x] **9. Ruleset requires the test check.** Why: a pull request cannot merge if tests fail. After the test workflow exists, edit "Protect main": tick "Require status checks to pass" and add the test check.
- [x] **10. Dropbox app console review.** Why: limits what a stolen sign-in could reach. dropbox.com/developers/apps, open Steady: permission type "App folder"; scopes only files.content.read, files.content.write, files.metadata.read; the only redirect URI is `https://tynasty16.github.io/MagicPen/` (remove any localhost entry).
- [x] **11. 2FA on Dropbox and on the email account** behind GitHub and Dropbox. Why: that email can reset both.
- [x] **12. Remove stale connections.** Why: forgotten tokens are open doors. GitHub Settings, Applications (authorised OAuth apps, GitHub Apps), Developer settings (personal access tokens), SSH and GPG keys: remove anything you do not recognise or use. Same for Dropbox, Security, Connected apps.

## In plain English
**What changes**
- **Website publishing:** the automatic publisher gets only the access it needs.
- **Backup passwords:** new ones need 16+ characters. Old backups still open.
- **Browser rules:** the app contacts only the sites it needs. A mistake could quietly break the camera, photos or Dropbox, so it is tested first.
- **Food search:** implausible entries are hidden and counted.
- **Restore:** any bad entry means the whole backup is refused.
- **Dropbox disconnect:** a line says where to remove Steady.
- **Photos:** stay out of backups, as you decided.

**Why:** it closes cheap gaps from the security review without changing what the app does.

**You will notice:** a stronger password rule, and a one-time Home Screen tip after 3 days.

**Your checklist (12 steps):** 5 now (about 10 minutes): GitHub two-step sign-in, private email, a rule blocking direct changes to the live app, unpublishing other GitHub sites, checking your backup password length. 7 later: alerts, tighter access, Dropbox and email security, removing old connections. Then one phone test after release.

**You need to decide**
- Approve the plan, or ask for changes.
- Answer the six questions (see "Risks & open questions").

## Approval
- [x] Approved by owner — date: 2026-11-27 ("Defaults ok, approved exact text": questions 1-6 at their defaults; exact text approved)

## Build notes (2026-11-27)
- Built as planned. The CSP works with `style-src 'self'` (no `'unsafe-inline'` needed).
- **Extra safeguard:** the deploy job now checks the built page and refuses to publish if the CSP is missing or comes after a script or stylesheet.
- **vitest 4.1.12:**
  - The 2 critical `npm audit` findings are gone.
  - 4 moderate findings remain in `workbox-build`'s glob/minimatch. They are build-time only, and clearing them would mean downgrading vite-plugin-pwa.
  - It was installed with `--legacy-peer-deps` because of an npm installer crash. `npm ci` in CI works without that flag.
- **Barcode path:** an implausible product shows the existing "no nutrition" barcode text, the same as a product with no nutrition listed.
- **Passwords:** new passwords are NFC-normalised. Opening a backup tries the password as typed first, then normalised, so old passwords keep working (tested).
- **Code review:** no bugs found. Applied:
  - more invisible characters removed from Open Food Facts names
  - one error code for oversize files
  - tests for the password fallback and for rows shaped like the app's real saves
  - the deploy-time CSP check

  Not applied:
  - SHA-pinning actions (out of scope in this plan)
  - lowering the 100 MB unpack cap. The owner approved 100 MB, and unpacking only runs after the file has passed the password check, so it can only be the owner's own file.
- **Limits:**
  - The CSP is a meta tag. It does not cover `sw.js`, because GitHub Pages can't send headers.
  - The mocked pass used fake Open Food Facts and Dropbox replies. The real-iPhone check confirms the real hosts.
- **Checks:**
  - 318 tests pass, and a clean `npm ci --ignore-scripts` build passes.
  - Mocked iPhone runs on the production build covered the Dropbox round trip, a barcode camera scan, the PDF report, a photo pick and Open Food Facts search. There were no CSP violations and no errors.
  - The dev server has no CSP and works.

## Release (2026-11-27)
- Merged in PR #14. The deploy succeeded, and the deploy-time CSP check passed.
- On a real iPhone, the owner tested a photo pick, backup and restore, report share and the Home Screen update. All passed. The barcode scan is not yet tested (owner will do it later).
- Owner checklist: all 5 "Now" steps are done. In the ruleset, required approvals are set to 0, so the owner can merge their own pull requests.
- 2026-11-27: the owner finished all 12 checklist steps. Steps 7 and 8 were already in place. The ruleset requires the test check, with 0 approvals. The Dropbox console was reviewed. An unused "Netlify Auth" GitHub app was removed.
