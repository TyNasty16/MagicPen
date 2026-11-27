# Cybersecurity review of plan 11 (2026-11-27)

A reviewer briefed as an application-security engineer checked plan 11 against the code and the production build (`dist/index.html`, `dist/sw.js`). No source files were changed. These are the plan changes it recommends, in rank order.

1. **(H) CSP meta tag first in `<head>`.** A meta CSP only covers the content that comes after it.
   - Inject it with `transformIndexHtml` using `injectTo: 'head-prepend'`.
   - Add a guard test that the tag comes before every `<script>` and `<link>`.
2. **(M) Don't run the deploy from a branch.** A branch run is either refused by the github-pages environment or publishes branch code live.
   - Test only the build job on the branch, and confirm the deploy after merging.
   - Owner check: Settings → Environments → github-pages allows only `main`.
3. **(M) Add a pull-request test workflow.** It has `contents: read`, so Dependabot PRs are tested before merging. Dependabot PRs never trigger the deploy, which runs only on pushes to `main`.
4. **(M) CI clean-up.**
   - Delete the `configure-pages` step: its output is unused, because the base path is hard-coded as `VITE_BASE`. The build job then needs no Pages permission.
   - Use `npm ci --ignore-scripts`. Only esbuild and fsevents have install scripts, and esbuild works from its optional binary package.
   - Set `cancel-in-progress: false`, as GitHub's Pages template does, so a deployment is never cut off halfway.
   - Be honest about the limit: splitting permissions stops theft of the deploy token, but a poisoned build-time dependency still ships through the artifact.
5. **(M) Owner checklist additions.**
   - Secrets: secret scanning, push protection and Dependabot alerts.
   - Actions settings: "Read repository contents" as the default token permission, and Actions not allowed to create or approve PRs.
   - Dropbox app console: app type is App folder; scopes limited to file read, write and list (metadata); the only redirect URI is `https://tynasty16.github.io/MagicPen/`, with any localhost entries removed.
   - Two-factor sign-in on Dropbox and on the email account behind GitHub and Dropbox.
   - Remove stale OAuth apps, GitHub Apps, personal access tokens and SSH keys.
   - Ruleset: require the new test check to pass.
   - Deployed site check: confirm the deploy run's commit matches `main`. Optionally show the build's commit hash in Settings.
6. **(M) Password rule.**
   - Also reject a password made of one short piece repeated (4 characters or fewer, e.g. `passwordpassword`), and long sequences or keyboard runs (e.g. `1234567890123456`).
   - Apply NFC normalisation to new passwords only, so typing on another device can't lock the owner out.
   - Mention the iPhone's suggested strong password; it passes the rule.
   - Keep PBKDF2-SHA256 at 600k, in line with OWASP. Argon2 needs WASM plus `'wasm-unsafe-eval'` and a format change, so it waits for Phase 2.
   - The app can't check existing passwords, because they are never stored. Owner step: "If your password is under 16 characters, change it." Optionally save a `pwRule` flag and show a one-time "consider changing" card when it is missing.
   - Old backups stay in Dropbox's deleted-file history (30+ days) under the old password.
7. **(L) CSP contents.**
   - Try `style-src 'self'` first, without `'unsafe-inline'`. The build has no inline style or script, and the `style={{}}` props set styles through CSSOM, which CSP does not block.
   - Add `object-src 'none'`.
   - Drop `data:` from `img-src` and drop `media-src`: the camera uses `srcObject`.
   - Leave out `frame-ancestors`, `report-uri` and `sandbox`. A meta tag ignores them and warns in the console.
   - Skip `upgrade-insecure-requests` (everything is already HTTPS) and Trusted Types (React 18 uses innerHTML internally) until Phase 2.
   - Add `<meta name="referrer" content="no-referrer">`.
   - The Dropbox authorize step is a navigation, not a fetch, so it needs no `connect-src` entry.
   - `unsafe-eval` stays out: the only `Function("return this")` is lodash's fallback, which never runs in a browser.
8. **(L) Restore.** The checks already run before anything is wiped and refuse the whole file on any bad row. Add:
   - a cap of about 25 MB from the listed file size, before downloading
   - a cap on the decompressed size
   - an allowed iterations range of 100k–2M (today it is up to 10M)
   - real calendar-date checks (today `2026-13-45` passes)
   - checks on the `measurements`, `dayMarks` and `profile` fields
   - string length caps
   
   `__proto__` is not a real risk, because `JSON.parse` creates it as an ordinary property.
9. **(L) Open Food Facts.** `cleanText` already strips control and direction characters and caps length. Add:
   - a cap on the serving amount (2000 g/ml or less)
   - U+061C, U+00AD and U+E0000–E007F to the characters `cleanText` strips
   - wording for the barcode path when a product is implausible
   - missing carbs or fat counted as 0 in the macro sum
10. **(L–M) `persist()` and platform detection.**
    - Call `persist()` only on iPhone/iPad, because Firefox desktop prompts the user.
    - Detect iPadOS by `Macintosh` plus `maxTouchPoints > 1`.
    - Include `CriOS` and `FxiOS`, which have the same 7-day rule.
11. **(L) Dependabot and Node.** Add a cooldown of about 7 days. Optionally pin Node 22.x in `.nvmrc`.

## Keep as is
- **Service worker:** no `runtimeCaching`, so it never stores health data.
- **No logging:** there are no `console.*` calls.
- **Requests:** sent with no cookies and never cached.
- **No SRI:** it is not needed for files from the app's own address.
- **Pasted Dropbox code:** no clipboard clearing; the code works once and needs the PKCE verifier.
- **CSP:** production build only.
- **Password rule:** applies only to new and changed passwords.
- **Restore:** a bad row refuses the whole file.
