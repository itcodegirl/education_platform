// ===============================================
// MONACO THEME - CodeHerWay dark editor theme
// Shared by CodePreview and CodeChallenge
// ===============================================

export const MONACO_THEME_NAME = 'CodeHerWay-dark';

export function defineMonacoTheme(monaco) {
  monaco.editor.defineTheme(MONACO_THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5a5a7a', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff6b9d' },
      { token: 'string', foreground: '4ecdc4' },
      { token: 'number', foreground: 'ffa726' },
      { token: 'tag', foreground: 'ff6b9d' },
      { token: 'attribute.name', foreground: 'b388ff' },
      { token: 'attribute.value', foreground: '4ecdc4' },
      { token: 'type', foreground: 'a78bfa' },
      { token: 'function', foreground: 'ff6b9d' },
      { token: 'variable', foreground: 'e0e0ec' },
    ],
    colors: {
      'editor.background': '#0a0a14',
      'editor.foreground': '#e0e0ec',
      'editor.lineHighlightBackground': '#1a1a2e',
      'editorCursor.foreground': '#ff6b9d',
      'editorLineNumber.foreground': '#3a3a5e',
      'editorLineNumber.activeForeground': '#8888a8',
      'editor.selectionBackground': '#ff6b9d30',
      'editor.wordHighlightBackground': '#4ecdc420',
    }
  });
}

export const MONACO_OPTIONS = {
  fontSize: 14,
  fontFamily: "'Space Mono', 'Fira Code', 'Cascadia Code', monospace",
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  tabSize: 2,
  automaticLayout: true,
  padding: { top: 12, bottom: 12 },
  lineNumbers: 'on',
  renderLineHighlight: 'line',
  bracketPairColorization: { enabled: true },
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
};



