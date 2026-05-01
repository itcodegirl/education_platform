// ═══════════════════════════════════════════════
// MONACO LOADER — Tells @monaco-editor/react to use
// a Vite-bundled, minimal Monaco build instead of
// fetching Monaco from cdn.jsdelivr.net at runtime.
//
// The default entry point `monaco-editor` transitively
// imports `editor.main`, which registers every one of
// Monaco's ~70 language modes (abap, clojure, julia,
// perl, powerquery, razor, solidity, …) and pulls in
// the rich language service bundle (~1 MB gzipped
// on its own). This platform only teaches HTML / CSS /
// JavaScript and students only write short snippets,
// so we cut the bundle down to:
//
//   1. The core editor API.
//   2. Basic-language tokenizers for HTML / CSS /
//      JavaScript / XML — just enough for correct
//      syntax highlighting and bracket matching.
//
// We deliberately DO NOT import any `language/<name>/
// monaco.contribution` module. Those register the
// rich language services (hover docs, autocomplete,
// validation) and each pulls in a web worker that
// ships the respective parser. Dropping them saves
// roughly 1.7 MB of raw JS per editor session. The
// trade-off: no IntelliSense in the editor, which is
// acceptable for single-file lesson snippets. The
// iframe preview still validates the code at runtime.
// ═══════════════════════════════════════════════

import { loader } from '@monaco-editor/react';

// Minimal editor API — no languages registered.
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

// Syntax highlighting only (basic-languages). Each module
// is ~2–6 kB and gives us a working `language="html"` /
// `"css"` / `"javascript"` / `"xml"` prop on <MonacoEditor>.
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution';
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution';

// Only the base editor worker is wired up. With no rich
// language services registered, Monaco never asks for
// html/css/extra-language workers, so none of those modules
// end up in the bundle.
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

if (typeof window !== 'undefined') {
  self.MonacoEnvironment = {
    getWorker: () => new EditorWorker(),
  };
}

loader.config({ monaco });

// Exported only so callers have something to import — the
// real work happens at module-load time via loader.config.
export const monacoLoaderInitialized = true;
