# Steady — current status (handoff)

_Last updated: 2026-11-25_

**Live:** https://tynasty16.github.io/MagicPen/ (deploys automatically on every merge to `main`).
**Working branch:** `claude/glp1-tracker-planning-egjfyq` (restart from `main` after each merged PR).
**Process:** see `CLAUDE.md` — Ideas → Planner → Token Steward → Explainer → owner approval → build → Code Reviewer → commit → Explainer summary → Ideas (closing) → ask owner about going live (PR).
**Ideas notepad:** `docs/ideas/NOTEPAD.md`, mirrored to the owner's pinned page https://claude.ai/artifact/X4yUw8t1ytboZTBGGV3MUL (republish with that `url` after every closing Ideas pass).

## Done
| Change | Doc | PR |
|---|---|---|
| M1 foundation, safety notice, profile + targets | workflows/01 | #1 |
| Warm Sand dashboard redesign | workflows/01b | #1 |
| M2 injections, site rotation, weight + graph | workflows/02 | #1 |
| Body map (front/back), Doses redesign, injection guidance, weigh-in photos, weekly weigh-in card | workflows/02b | #1 |
| M3 measurements, BMI, waist-to-height, graph range, dose lines | workflows/03 | #2 |
| M4 symptoms, tips, When to get help | workflows/04 | #3 |
| Symptom alerts ("Take a closer look") | workflows/04b | #3 |
| Symptom map + drill-down; polish (7-day only, numbers, darker 5/5, one help entry, 1–5 severity) | workflows/04c, 04d | #4 |
| Settings: reset all data (type RESET) | workflows/04e | #5 |
| M5 food + water log, My Foods, macro + calorie rings, barely-ate marker, built-in USDA search (offline), targets follow latest weigh-in | workflows/05 | #6 |
| 05b Open Food Facts online search (on tap, privacy notice, drinks per 100 ml); built-in search matches plurals | workflows/05b | #7 |
| 05c Barcode scanning (ZXing lazy chunk, security-reviewed, sanitized input/output) | workflows/05c | #8 |
| 07 Ozempic as a second medicine (Dexie v7, per-entry medicine, label-quoted help/tips/guide) | workflows/07 | #9 |
| 08a Appointments + Home ☰ menu + optional name (Dexie v8) | workflows/08a | #10 |
| 08b Doctor report PDF (own PDF writer, preview, switches, limited-data flags, Share menu) | workflows/08b | #10 |
| Fix: ☰ menu items did nothing on iPhone (focus handling) | workflows/08a build notes | #11 |
| 09 Type questions on the report (saved to latest appointment, or a phone draft) | workflows/09 | #12 |
| M7 / 10a Encrypted daily Dropbox backup + restore (☰ → Backup; PKCE, PBKDF2 + AES-GCM, keep 2, no photos; Dexie v9). Owner tested on iPhone | workflows/10a | #13 |
| 10b Weekly injection-day Calendar reminder (.ics) on Doses | workflows/10b | #13 |
| 11 Security Phase 1 (CSP, CI least privilege + PR tests + Dependabot, password rule, restore/OFF limits, Home Screen tip). iPhone-tested except barcode scan | workflows/11 | #14 |

## Next (owner to choose)
- Backup follow-ups: I-56 opt-in photo backup, I-54 "backup is behind" note, I-57 password reminder.
- **M6 workouts + Today dashboard — PAUSED by owner 2026-11-25** ("we can do better"). Draft plan, NHS quotes and the four-NHS-page finding are in workflows/06 and sources/06. Restart with a fresh Ideas pass when the owner is ready.
- Open ideas: see the notepad (up to I-69; owner ideas I-38 to I-42 and I-46), e.g. I-25 calorie-mismatch flag, I-29 dev-tool security upgrade (Vitest, Workbox), I-34/I-35 medicine-switch chart labels.
- Pending owner checks: barcode scan on real iPhone (after the CSP). Phase 2 (App Store) starts with a go/no-go on Apple guideline 4.2.
- Before sharing publicly: trademark check on the name "Steady" (PLAN §4).

## Environment
- Cloud environment "magicpen" (personal) allows fdc.nal.usda.gov (refresh `public/data/usda-foods.json` via `scripts/build-usda-foods.py`), www.nhs.uk / www.cdc.gov (exercise sources; CDC still refuses automated access), world/search.openfoodfacts.org (05b/05c testing), and dailymed.nlm.nih.gov (medicine labels).

## Owner preferences (how to work)
- For bigger ideas the owner likes to be questioned first, one question at a time with a suggested answer ("grill me"); the agreed brief then goes to the Ideas agent (see docs/ideas/08-doctor-report-brief.md).
- Wants mockups/screenshots before approving anything visual; plain-language summaries; asks to confirm understanding before big process changes.
- Medical wording only from cited official sources, shown to the owner for approval; never dose advice.
- Keep cost $0/month; keep token use reasonable (Token Steward trims applied).
