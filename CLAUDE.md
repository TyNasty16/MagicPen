# Steady — GLP-1 tracker

Personal GLP-1 (Wegovy, weekly) tracker. Approved plan: `docs/PLAN.md`. Web app first (installable PWA), App Store later.

## Required review process (owner's standing rule)

Every change — milestones, features and small tweaks alike — follows these steps. Do not skip any without the owner's say-so.

0. **ideas** (opening pass) brainstorms approaches and fresh ideas for the owner's request → `docs/ideas/NN-slug.md`. Runs first, before anything else. Words only; mockups only when the owner asks.
1. **workflow-planner** reads the ideas file, picks a direction, and writes `docs/workflows/NN-slug.md` (linking the ideas file under "Ideas considered").
2. **token-steward** reviews that document; apply its trims.
3. **plain-explainer** fills the document's "In plain English" section.
4. Send the document to the owner. **Do not start building until the owner approves** (then mark the document `Status: Approved`).
5. Build.
6. **code-reviewer** reviews the diff before commit; fix what it finds.
7. Commit and push; **plain-explainer** writes the short completion summary for the owner.
8. **ideas** (closing pass) runs last: appends after-build improvements and follow-ups to the same ideas file and updates `docs/ideas/NOTEPAD.md` (suggested / done / skipped), then the main session republishes the owner's pinned notepad page (https://claude.ai/artifact/X4yUw8t1ytboZTBGGV3MUL — publish with that `url` from a new session) so it matches; send them to the owner as suggestions (nothing is built from them without a new request).
9. Ask the owner whether to put the app online (open a pull request to `main`) — owner asked to be checked after every change.

Agent definitions are in `.claude/agents/`.

## Product rules
- The app LOGS doses. It never recommends doses or dose increases.
- Health data stays on the device (IndexedDB). No analytics, no third-party calls except the Open Food Facts food search.
- Style: clinical and calm.
- Keep cost at $0/month. Hosting: GitHub Pages (repo made public for this, owner decision 2026-11-25) at https://tynasty16.github.io/MagicPen/ — deployed automatically by `.github/workflows/deploy-pages.yml` on every push to `main`.
