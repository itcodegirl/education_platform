import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const MONACO_CHUNK_BUDGET_BYTES = 1100 * 1024;

function normalizeModuleId(id) {
  return id.replace(/\\/g, '/');
}

function getMonacoChunkName(moduleId) {
  if (moduleId.includes('/basic-languages/')) return 'vendor-monaco-languages';
  if (moduleId.includes('/editor/contrib/')) return 'vendor-monaco-editor-contrib';
  if (moduleId.includes('/editor/browser/')) return 'vendor-monaco-editor-browser';
  if (moduleId.includes('/editor/common/')) return 'vendor-monaco-editor-common';
  if (moduleId.includes('/editor/standalone/')) return 'vendor-monaco-editor-standalone';
  if (moduleId.includes('/editor/')) return 'vendor-monaco-editor';
  if (moduleId.includes('/base/')) return 'vendor-monaco-base';
  if (moduleId.includes('/platform/')) return 'vendor-monaco-platform';
  if (moduleId.includes('/language/')) return 'vendor-monaco-language-core';
  return 'vendor-monaco-core';
}

function getManualChunkName(id) {
  const moduleId = normalizeModuleId(id);

  // React core is preloaded because the main entry always needs it.
  if (
    moduleId.includes('node_modules/react/') ||
    moduleId.includes('node_modules/react-dom/') ||
    moduleId.includes('node_modules/scheduler/')
  ) {
    return 'vendor-react';
  }

  // Supabase auth runs before route rendering, so keep the client cacheable.
  if (moduleId.includes('node_modules/@supabase')) {
    return 'vendor-supabase';
  }

  // Monaco is intentionally lazy, but large. Vite 8 uses Rolldown's
  // codeSplitting path; the Rollup-compatible fallback below keeps older
  // installs on the same chunk names.
  if (moduleId.includes('node_modules/monaco-editor/')) {
    return getMonacoChunkName(moduleId);
  }

  // Course content is dynamically imported through src/data/loaders.js.
  if (moduleId.includes('/src/data/html/')) return 'data-html';
  if (moduleId.includes('/src/data/css/')) return 'data-css';
  if (moduleId.includes('/src/data/js/')) return 'data-js';
  if (moduleId.includes('/src/data/react/')) return 'data-react';

  return null;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1100,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: getManualChunkName,
              maxSize: MONACO_CHUNK_BUDGET_BYTES,
            },
          ],
        },
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          return getManualChunkName(id) ?? undefined;
        },
      },
    },
  },
});
