## Opening ideas — 2026-11-27

**Request, restated:** Dependabot should only propose small, safe updates (patch and minor, plus security fixes); big upgrades wait for planned changes.

**Approaches**
1. **npm: ignore major updates** with `ignore` and `update-types: ["version-update:semver-major"]` for `dependency-name: "*"`. Small edit, S. **Recommended** — it does exactly what was asked.
2. **Same for github-actions.** Action majors are usually just a Node version bump and #15 merged cleanly, so they are low risk. Keep majors on for actions (and pin-refresh later, I-67) unless one breaks. S.
3. **Pause the risky packages by name** (React, Vite, TypeScript, recharts, vitest) and leave other majors open. More precise, but a list to maintain. S.

**Security updates:** these are a separate Dependabot feature (repo Settings, Code security). They ignore `ignore` rules and the 7-day cooldown, so a security fix for a major version still arrives. Check the setting is on.

**Traps**
- Ignoring majors hides them forever; a calendar reminder or notepad item is needed.
- The single `npm` group means one failing package blocks all small updates; consider splitting dev and production groups.
- Minor bumps of 0.x packages can still break things; tests must stay required.
- Existing open Dependabot PRs may need closing by hand.

**Fresh ideas**
- A planned "major upgrade pass" every few months, one package family per change (added to the notepad as I-77).
- A short README note listing which majors are deliberately held back.
