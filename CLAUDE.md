# Steady — GLP-1 tracker

Personal GLP-1 (Wegovy, weekly) tracker. Approved plan: `docs/PLAN.md`. Web app first (installable PWA), App Store later.

## Required review process (owner's standing rule)

Every milestone or significant change follows these steps. Do not skip any without the owner's say-so.

1. **workflow-planner** writes `docs/workflows/NN-slug.md`.
2. **token-steward** reviews that document; apply its trims.
3. **plain-explainer** fills the document's "In plain English" section.
4. Send the document to the owner. **Do not start building until the owner approves** (then mark the document `Status: Approved`).
5. Build.
6. **code-reviewer** reviews the diff before commit; fix what it finds.
7. Commit and push; **plain-explainer** writes the short completion summary for the owner.
8. Ask the owner whether to put the app online (GitHub Pages) yet — owner asked to be checked after every milestone.

Agent definitions are in `.claude/agents/`.

## Product rules
- The app LOGS doses. It never recommends doses or dose increases.
- Health data stays on the device (IndexedDB). No analytics, no third-party calls except the Open Food Facts food search.
- Style: clinical and calm.
- Keep cost at $0/month (GitHub Pages hosting).
