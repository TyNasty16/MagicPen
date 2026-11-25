// Generates placeholder PNG app icons from an inline SVG using the preinstalled Playwright Chromium.
import { createRequire } from 'node:module';
// Uses the machine's preinstalled Playwright (run with NODE_PATH=$(npm root -g)); not a project dependency.
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync } from 'node:fs';

const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <rect width="100" height="100" fill="#a85540"/>
  <g transform="translate(${pad} ${pad}) scale(${(100 - 2 * pad) / 100})">
    <path d="M18 56 C 32 56, 34 40, 50 40 S 68 56, 82 56" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
    <circle cx="50" cy="68" r="5" fill="#fff"/>
  </g></svg>`;

const out = new URL('../public/icons/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad] of [['apple-touch-icon', 180, 0], ['icon-192', 192, 0], ['icon-512', 512, 0], ['icon-maskable-512', 512, 12]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0">${svg(pad)}</body></html>`);
  await page.screenshot({ path: `${out}${name}.png` });
}
await browser.close();
console.log('icons written to', out);
