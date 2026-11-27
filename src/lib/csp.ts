/**
 * Browser safety rule (Content-Security-Policy, workflow 11), used by vite.config.ts at build time: the page may only run its own code and talk to itself, Open Food Facts and Dropbox.
 * Production build only (the dev server injects inline scripts). Put first in <head> so it covers everything after it.
 * Not here on purpose: frame-ancestors, report-uri and sandbox (a meta tag ignores them). The Dropbox sign-in page
 * is a page navigation, not a fetch, so it needs no connect-src entry.
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' blob:",
  "connect-src 'self' https://search.openfoodfacts.org https://world.openfoodfacts.org https://api.dropboxapi.com https://content.dropboxapi.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const attr = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** Adds the CSP and referrer meta tags right after <meta charset> (which must stay first), so before every script and stylesheet. */
export function injectSecurityMeta(html: string): string {
  const charset = '<meta charset="UTF-8" />';
  if (!html.includes(charset)) throw new Error('index.html: <meta charset="UTF-8" /> not found; the CSP could not be added');
  return html.replace(charset, `${charset}\n    <meta http-equiv="Content-Security-Policy" content="${attr(CSP)}" />\n    <meta name="referrer" content="no-referrer" />`);
}
