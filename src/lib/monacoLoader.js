// ═══════════════════════════════════════════════
// MONACO LOADER — Tells @monaco-editor/react to use
// the Vite-bundled monaco-editor package instead of
// fetching Monaco from cdn.jsdelivr.net at runtime.
//
// Why: removing the jsDelivr runtime script load lets
// the CSP drop `https://cdn.jsdelivr.net` from script-src
// (and the whole origin from connect-src / font-src /
// style-src). The only CSP relaxation Monaco still needs
// after this change is `'unsafe-eval'` for its language
// services — that's the next tightening step once someone
// has verified it on a preview deploy.
//
// Workers: Monaco runs its language services in web
// workers. Vite's `?worker` suffix turns each worker
// import into a separate chunk. For the four languages
// this platform teaches (HTML / CSS / JS / TS) we bundle
// only the relevant workers; everything else falls back
// to the base editor worker.
// ═══════════════════════════════════════════════

import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-restricted-globals
  self.MonacoEnvironment = {
    getWorker(_workerId, label) {
      if (label === 'json') return new JsonWorker();
      if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
      if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
      if (label === 'typescript' || label === 'javascript') return new TsWorker();
      return new EditorWorker();
    },
  };
}

loader.config({ monaco });

// Exported only so callers have something to import — the real work
// happens at module-load time via the loader.config call above.
export const monacoLoaderInitialized = true;
