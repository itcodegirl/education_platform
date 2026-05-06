import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Keep the warning meaningful while avoiding false-positive noise from
    // intentionally lazy Monaco sub-chunks. The editor/admin surfaces are
    // route- or interaction-gated, so this threshold tracks genuinely
    // problematic eagerly loaded chunks.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        // Function form gives us precise control over which chunks
        // end up in the initial preload list. The object form forces
        // every listed chunk into the initial graph, which defeats
        // the point of lazy-loading (e.g. jspdf was being preloaded
        // on the landing page even though it's only dynamically
        // imported from certificate.js).
        manualChunks(id) {
          // React core — preloaded because the main entry always
          // needs it.
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }

          // Supabase client — preloaded because auth runs before
          // any route renders.
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }

          // jsPDF and html2canvas are only needed when the user
          // downloads a certificate. They are dynamically imported
          // from src/utils/certificate.js — DO NOT assign them to a
          // named chunk here, Vite's natural dynamic-import splitting
          // will give them their own chunk that is NOT preloaded.
          //
          // if (id.includes('node_modules/jspdf')) return 'vendor-jspdf';
          // if (id.includes('node_modules/html2canvas')) return 'vendor-html2canvas';

          // Monaco editor is intentionally lazy (loaded only from the
          // CodePreview / CodeChallenge import chain), but the module
          // graph is still large enough to trigger chunk-size warnings
          // if bundled into a single vendor chunk.
          //
          // Split Monaco into stable sub-chunks so initial app bundles
          // stay lean while editor code remains cacheable between deploys.
          if (id.includes('node_modules/monaco-editor/')) {
            if (id.includes('/basic-languages/')) return 'vendor-monaco-languages';
            if (id.includes('/editor/contrib/')) return 'vendor-monaco-editor-contrib';
            if (id.includes('/editor/browser/')) return 'vendor-monaco-editor-browser';
            if (id.includes('/editor/common/')) return 'vendor-monaco-editor-common';
            if (id.includes('/editor/standalone/')) return 'vendor-monaco-editor-standalone';
            if (id.includes('/editor/')) return 'vendor-monaco-editor';
            if (id.includes('/base/')) return 'vendor-monaco-base';
            if (id.includes('/platform/')) return 'vendor-monaco-platform';
            if (id.includes('/language/')) return 'vendor-monaco-language-core';
            return 'vendor-monaco-core';
          }

          // Per-course content. src/data/loaders.js dynamically
          // imports each course's course.js + quizzes.js + challenges.js,
          // so these chunks are naturally lazy and NOT preloaded.
          // Naming them keeps the build output readable for audit.
          if (id.includes('/src/data/html/')) return 'data-html';
          if (id.includes('/src/data/css/')) return 'data-css';
          if (id.includes('/src/data/js/')) return 'data-js';
          if (id.includes('/src/data/react/')) return 'data-react';
          // NOTE: data-reference is intentionally NOT assigned to a
          // named chunk. Each reference file (cheatsheets, glossary,
          // projects) is imported by exactly one lazy panel chunk,
          // so Vite can inline it into the owning panel and avoid
          // a shared chunk that gets auto-preloaded.

          return undefined; // let Vite decide for everything else
        },
      },
    },
  },
});
