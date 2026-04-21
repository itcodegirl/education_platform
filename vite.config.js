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
    // Bump the warning threshold — the course data chunks legitimately
    // cross 500KB uncompressed and we're already splitting them per
    // course. Lowering this would just fire spurious warnings on every
    // build.
    chunkSizeWarningLimit: 700,
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

          // Monaco editor — large (~250 kB gzipped). Keeping it in its
          // own named chunk gives it a stable cache key independent of
          // app code changes. It only loads when a lesson with a code
          // editor is first rendered (via the lazy import chain in
          // CodePreview / CodeChallenge).
          if (id.includes('node_modules/monaco-editor/')) return 'vendor-monaco';

          // Per-course content. src/data/loaders.js dynamically
          // imports each course's course.js + quizzes.js + challenges.js,
          // so these chunks are naturally lazy and NOT preloaded.
          // Naming them keeps the build output readable for audit.
          if (id.includes('/src/data/html/')) return 'data-html';
          if (id.includes('/src/data/css/')) return 'data-css';
          if (id.includes('/src/data/js/')) return 'data-js';
          if (id.includes('/src/data/react/')) return 'data-react';
          if (id.includes('/src/data/python/')) return 'data-python';
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
