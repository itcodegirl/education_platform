// =================================================
// MONACO LOADER - Configures @monaco-editor/react
// without pulling Monaco into the public entry path.
//
// Monaco imports stay inside initializeMonacoLoader()
// so Vite can keep the editor CSS/JS off the initial
// HTML and only fetch them when an editor actually opens.
// =================================================

import { loader } from '@monaco-editor/react';

let monacoLoaderPromise = null;

export function initializeMonacoLoader() {
  if (!monacoLoaderPromise) {
    monacoLoaderPromise = Promise.all([
      import('monaco-editor/esm/vs/editor/editor.api'),
      import('monaco-editor/esm/vs/basic-languages/html/html.contribution'),
      import('monaco-editor/esm/vs/basic-languages/css/css.contribution'),
      import('monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'),
      import('monaco-editor/esm/vs/basic-languages/xml/xml.contribution'),
      import('monaco-editor/esm/vs/editor/editor.worker?worker'),
    ])
      .then(([monacoModule, _html, _css, _javascript, _xml, editorWorkerModule]) => {
        const monaco = monacoModule;
        const EditorWorker = editorWorkerModule.default;

        if (typeof window !== 'undefined') {
          window.MonacoEnvironment = {
            getWorker: () => new EditorWorker(),
          };
        }

        loader.config({ monaco });
        return monaco;
      })
      .catch((error) => {
        monacoLoaderPromise = null;
        throw error;
      });
  }

  return monacoLoaderPromise;
}
