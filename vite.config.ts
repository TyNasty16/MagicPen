/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// VITE_BASE lets the same build run under a GitHub Pages sub-path, e.g. VITE_BASE=/MagicPen/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      // Precache the built-in USDA food list too, so food search works offline.
      // Precache only: no runtimeCaching, so Open Food Facts replies are never stored (workflow 05b).
      // The barcode reader (zxing chunk) is not precached: it loads on first scan, which needs a connection anyway (05c).
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest,json}'], globIgnores: ['**/zxing-*.js'] },
      manifest: {
        name: 'Steady',
        short_name: 'Steady',
        description: 'Personal GLP-1 tracker',
        theme_color: '#f7f1ea',
        background_color: '#f7f1ea',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      // Keep the barcode reader in its own lazy chunk (named so the service worker can skip it).
      output: { manualChunks: (id) => (id.includes('node_modules/@zxing/') ? 'zxing' : undefined) },
    },
  },
  test: { environment: 'node' },
});
