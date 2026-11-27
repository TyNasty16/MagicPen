# Security review for an App Store release (2026-11-27)

**How this was done:** the main session audited the code, config, CI and git history. A second reviewer agent then checked each finding, disagreed where it saw fit, and agreed the plan below in a second round.

**Status:** findings only. Nothing here has been built. Each fix goes through the normal process (ideas, plan, owner approval) before any work starts.

## Already solid
- **Photos:** re-encoded on the phone, which strips location (EXIF/GPS).
- **Dropbox sign-in:** PKCE (S256) with the state checked, and no App secret.
- **Network requests:** sent with no cookies and no referrer.
- **Backups:** AES-GCM with a fresh IV per file and the header authenticated. The key is non-extractable and the password is never stored.
- **Web-page attack points:** none found. There is no innerHTML or eval.
- **PDF report:** strings are escaped. The file has no scripts or links.
- **Barcode input:** must be digits only.
- **Shipped code:** has 0 npm audit findings.
- **Repo history:** no secrets. The Dropbox App key is public by design.

## Findings
"Today" means the website app. "iOS" means an App Store build (a Capacitor/WKWebView wrapper). H/M/L means high/medium/low risk.

| # | Finding | Today | iOS | Fix |
|---|---|---|---|---|
| 1 | **Shared web address.** Every GitHub Pages site under this account shares the `tynasty16.github.io` storage. Another Pages site there could read the data and the Dropbox token, and use the backup key. | M, only if another Pages site is published | L | Publish no other Pages sites. Move to a custom domain or the iOS build. |
| 2 | **Deploy chain.** Anyone who controls the GitHub account or `main` ships code to every user silently (the service worker auto-updates). The CI build job holds deploy permission while it runs `npm ci` and `npm test`. | M | L | Split CI permissions. Add Dependabot. Turn on 2FA. Protect `main`. |
| 3 | **No Content-Security-Policy.** | L–M | M | Add a meta CSP that allows only the app, Open Food Facts and Dropbox hosts. |
| 4 | **Data is not encrypted inside the app.** It relies on the iPhone's own encryption and has no in-app lock. | L | L–M | Pair with the CSP. Keychain storage and a Face ID lock are optional. |
| 5 | **Weak backup passwords are accepted** (for example 12 × "a"). Dropbox keeps deleted versions, so old backups stay around. | M | M | Require 16+ characters and reject repeated or low-variety passwords. Advise four or more random words. |
| 6 | **Safari's 7-day rule.** If Steady is used in a Safari tab, not the Home Screen app, Safari can wipe its data after 7 days without a visit. Photos are not backed up. | M | – | Show a one-time "Add to Home Screen" notice. Call `navigator.storage.persist()`. |
| 7 | **Photos have no backup.** They are lost for good if storage is wiped. | M | M | Opt-in encrypted photo backup (I-56). This needs a product-rule change. |
| 8 | **Personal email in public commits.** Thirteen merge commits show the owner's personal Gmail address. | L–M | L–M | Set a GitHub noreply commit email. Past commits stay as they are. |
| 9 | **Dev-tool vulnerabilities.** vitest/tinypool have 2 critical issues, in dev tools only. | L | L | Update vitest. |
| 10 | **Open Food Facts values are not capped** (calories, protein). | L | L | Cap them to plausible amounts. |
| 11 | **Restore row checks are loose.** The file is authenticated, so only the owner's own backups get this far. | L | L | Check `site`, ids and required numbers. |
| 12 | **Disconnect is best effort.** If the phone is offline, the Dropbox sign-in stays valid. | L | L | Add to the text: "You can also remove Steady at dropbox.com → Connected apps." |
| 13 | **Dropbox sign-in would break inside an app wrapper.** | – | H (doesn't work) | Use native sign-in (ASWebAuthenticationSession and a custom scheme). |
| 14 | **App Store review.** Guideline 4.2 can reject a wrapped website. The release also needs a privacy policy, the App Privacy label, a camera-use string and Dropbox production approval (needed beyond 50 users). | – | H | A go/no-go decision first. Add real native features (notifications, Apple Health). |

**Accepted risks:**
- Open Food Facts sees search words and barcodes. This is disclosed in the app.
- Someone with write access to the owner's Dropbox could put back an older genuine backup. Restore shows the backup's date and counts before the typed confirmation.
- Shared report files leave the app's control once shared. The owner chooses to share them.

## Plan
**Phase 1: now, for the website app. All cheap.**
- Split the CI permissions, add Dependabot and update vitest.
- Add the meta CSP, then test the camera, photos and Dropbox.
- Strengthen the password check and wording.
- Add the Home Screen notice and `persist()`.
- Cap Open Food Facts values.
- Tighten the restore checks.
- Add the Dropbox "Connected apps" line.
- Opt-in photo backup, if the owner changes the "never photos" rule.
- Owner actions:
  - turn on 2FA
  - set a noreply commit email
  - add branch protection on `main`
  - keep this account's Pages to Steady only

**Phase 2: before any App Store submission.**
- Go/no-go gate on guideline 4.2, and decide on the native features.
- Capacitor build with bundled files and no service worker.
- Native Dropbox sign-in.
- Review the CSP for the app scheme.
- Native wording in place of Safari/Home Screen wording.
- Privacy policy, App Privacy label and camera-use string.
- Dropbox production approval.
- Optional: Keychain storage and a Face ID lock.
