# Workflow 13 — Dependabot: small npm updates only
Status: Draft
Milestone: None (maintenance change after milestone 7, outside PLAN.md §5; owner request "close 16 and set it up")

## Ideas considered
Ideas file: [docs/ideas/13-dependabot-minor-only.md](../ideas/13-dependabot-minor-only.md). Chosen: approach 1, ignore npm major updates. Approaches 2 (also actions) and 3 (named packages) are not taken. Existing file: `.github/dependabot.yml`.

## Goal
Dependabot proposes only patch and minor npm updates, plus security fixes. Major versions wait for planned changes (I-77).

## In scope
- Add `ignore: [{ dependency-name: '*', update-types: ['version-update:semver-major'] }]` to the `npm` entry in `.github/dependabot.yml`.
- Update the comment at the top of the file to say majors are skipped.
- Owner checklist (step 3).

## Out of scope
- The `github-actions` entry (unchanged; action majors stay on).
- Splitting the npm group, a README list of held-back majors, a reminder for major upgrades (all in the ideas file).
- PR #16 (already closed) and any other open Dependabot PRs.
- Any app code or app text.

## Steps
1. Edit `.github/dependabot.yml`: add the `ignore` block under the `npm` entry and adjust the comment.
2. Parse the YAML and check the structure (see Tests).
3. Owner checklist (by hand, on GitHub): Settings, Code security (Advanced Security), Dependabot, "Dependabot security updates" set to Enabled.

## Acceptance criteria
- `.github/dependabot.yml` parses as valid YAML and the `npm` entry has the `ignore` rule above.
- The `github-actions` entry is identical to before.

## Tests
Automatic: a YAML parse check of the file (no app code changes, so no full run).
By hand: the owner checks the settings line (step 3); the next weekly Dependabot npm PR has no major bumps; a security fix still arrives as its own PR.

## Risks & open questions
- Ignored majors are hidden for good until someone plans them; I-77 is the only reminder.
- Minor bumps of 0.x packages can still break things; tests stay required before merge.
- The single `npm` group means one failing package blocks all small updates.
- Dependabot may need a few days to re-run; no way to test the rule before then.

## Token Steward trims (applied)
YAML parse check only (no app code, so no full run); post-merge checks moved to by-hand tests; the Actions question dropped (decided in scope); the settings check stated once.

## In plain English

Dependabot is a GitHub helper that suggests updates to the code libraries this app uses. After this change it suggests only small updates and security fixes, and skips big "major" versions, which often need real rework. Cost: nothing. You need to turn on one GitHub setting by hand (checklist step 3). Risks: skipped big updates stay hidden until someone plans them, and small updates can still break things, so tests must pass before merging. One failing update can hold up the rest.

## Approval
- [ ] Approved by owner — date:
