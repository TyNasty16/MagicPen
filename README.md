# Steady

A personal GLP-1 (weekly Wegovy) tracker. Installable web app; all data stays on your device.

- Plan: [`docs/PLAN.md`](docs/PLAN.md) · Workflows: [`docs/workflows/`](docs/workflows/)

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # calculation tests
npm run build    # production build into dist/ (VITE_BASE=/sub-path/ for GitHub Pages)
npm run icons    # regenerate placeholder icons (uses preinstalled Playwright)
```

Not medical advice. Steady logs doses; it never recommends them.
