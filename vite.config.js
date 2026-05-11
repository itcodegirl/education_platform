import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const MONACO_CSS_LINK_RE = /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["'][^"']*vendor-monaco-[^"']+\.css["'][^>]*>\s*/gi;

function normalizeModuleId(id) {
  return id.replace(/\\/g, '/');
}

function isMonacoChunk(filename) {
  return /vendor-monaco-.*\.js$/i.test(filename);
}

function getMonacoChunkName(moduleId) {
  if (moduleId.includes('/basic-languages/')) return 'vendor-monaco-languages';
  if (moduleId.includes('/editor/contrib/')) return 'vendor-monaco-editor-contrib';
  if (moduleId.includes('/editor/internal/')) return 'vendor-monaco-editor-internal';
  if (moduleId.includes('/editor/browser/')) return 'vendor-monaco-editor-browser';
  if (moduleId.includes('/editor/common/')) return 'vendor-monaco-editor-common';
  if (moduleId.includes('/editor/standalone/')) return 'vendor-monaco-editor-standalone';
  if (moduleId.includes('/editor/editor.api')) return 'vendor-monaco-editor-api';
  if (moduleId.includes('/editor/editor.all')) return 'vendor-monaco-editor-all';
  if (moduleId.includes('/editor/editor.main')) return 'vendor-monaco-editor-main';
  if (moduleId.includes('/editor/edcore.main')) return 'vendor-monaco-editor-core';
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

  // Monaco is intentionally lazy, but large. Keep it out of the initial
  // graph; scripts/check-bundle-size.mjs guards against accidental
  // modulepreload regressions on the app shell.
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

const fontPackageScopes = ['@fontsource', '@fontsource-variable'];

function getDevServerFsAllowList() {
  const projectRoot = path.resolve(__dirname);
  const dependencyRoots = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(projectRoot, '..', '..', 'node_modules'),
  ];

  // Git worktrees can reuse node_modules from a parent checkout. Keep the
  // dev-server exception narrow to self-hosted font package assets.
  return [
    projectRoot,
    ...dependencyRoots.flatMap((root) => (
      fontPackageScopes.map((scope) => path.join(root, scope))
    )),
  ];
}

function stripInitialMonacoCssLinks() {
  return {
    name: 'strip-initial-monaco-css-links',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const indexAsset = bundle['index.html'];
      if (!indexAsset || indexAsset.type !== 'asset' || typeof indexAsset.source !== 'string') {
        return;
      }

      indexAsset.source = indexAsset.source.replace(MONACO_CSS_LINK_RE, '');
    },
  };
}

export default defineConfig({
  plugins: [react(), stripInitialMonacoCssLinks()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      allow: getDevServerFsAllowList(),
    },
  },
  build: {
    chunkSizeWarningLimit: 1900,
    modulePreload: {
      resolveDependencies(_filename, deps, { hostType }) {
        if (hostType === 'html') {
          return deps.filter((dep) => !isMonacoChunk(dep));
        }

        return deps;
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
