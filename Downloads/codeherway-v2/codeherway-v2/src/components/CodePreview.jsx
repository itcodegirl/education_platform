// ═══════════════════════════════════════════════
// CODE PREVIEW — Read-only view + Monaco editor + Live preview
// 3 tabs: Code (lesson example), Editor (sandbox), Preview (live)
// Features: AI code explanation, custom theme, auto-complete
// ═══════════════════════════════════════════════

import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { IFRAME_STYLES } from '../utils/iframeStyles';
import { AI_MODEL } from '../utils/helpers';

// Lazy load Monaco — only downloads when Editor tab is clicked on desktop
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// Mobile detection — avoids loading Monaco on phones
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < breakpoint
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

export function CodePreview({ code, lang }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState('code');
  const [copied, setCopied] = useState(false);
  const [editorCode, setEditorCode] = useState(code);
  const [aiExplaining, setAiExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const editorRef = useRef(null);

  const isCSS = lang === 'css';
  const isJS = lang === 'js' || lang === 'react';
  const monacoLang = isJS ? 'javascript' : isCSS ? 'css' : 'html';

  // Reset editor when lesson code changes
  const prevCode = useRef(code);
  if (code !== prevCode.current) {
    prevCode.current = code;
    setEditorCode(code);
    setAiExplanation('');
    setShowExplanation(false);
  }

  const COPY_FEEDBACK_MS = 2000;

  const handleCopy = () => {
    const textToCopy = tab === 'editor' ? editorCode : code;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  const handleReset = () => {
    setEditorCode(code);
    setAiExplanation('');
    setShowExplanation(false);
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange = useCallback((value) => {
    setEditorCode(value || '');
  }, []);

  // Build preview HTML
  function buildPreview(sourceCode) {
    if (isJS) {
      const consoleScript = `const _out=document.getElementById("out");const _log=(p,c,...a)=>{const d=document.createElement("div");d.className="console-line";d.innerHTML='<span class="prefix" style="color:'+c+'">'+p+'</span>'+a.map(x=>{try{if(typeof x==="object")return JSON.stringify(x,null,2);return String(x)}catch(e){return String(x)}}).join(" ");_out.appendChild(d)};const console={log:(...a)=>_log("→","#4ecdc4",...a),error:(...a)=>_log("✕","#ff6b6b",...a),warn:(...a)=>_log("⚠","#ffa726",...a),table:(a)=>_log("◫","#4ecdc4",a),group:()=>{},groupEnd:()=>{},time:()=>{},timeEnd:(l)=>_log("⏱","#8888a8",l+": ~1ms")};try{${sourceCode.replace(/<\/script>/g, '<\\/script>')}}catch(e){console.error(e.message)}`;
      return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES} .console-line{font-family:monospace;font-size:13px;padding:3px 0;border-bottom:1px solid #1a1a2e;color:#e0e0e0}.prefix{color:#5a5a7a;margin-right:8px}pre.output{background:#0a0a14;padding:16px;border-radius:8px;margin:0;overflow:auto}</style></head><body><pre class="output" id="out"></pre><script>${consoleScript}<\/script></body></html>`;
    } else if (isCSS) {
      return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES}\n${sourceCode}</style></head><body><h1>Styled Heading</h1><p class="lead">Lead paragraph with <strong>bold</strong> and <em>italic</em>.</p><p>Body text. <a href="#">A link</a>.</p><div class="card" style="margin-top:16px;padding:20px"><h3>Card Title</h3><p>Content.</p></div><button style="margin-top:12px;padding:10px 24px;cursor:pointer">Button</button></body></html>`;
    } else {
      return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES}</style></head><body>${sourceCode}</body></html>`;
    }
  }

  // AI Explain
  async function explainCode() {
    if (aiExplaining) return;
    setAiExplaining(true);
    setShowExplanation(true);
    setAiExplanation('');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: 800,
          system: `You are the CodeHerWay code explainer — a direct, encouraging mentor for women learning web development. Explain the following ${monacoLang.toUpperCase()} code clearly for a beginner. Be concise (3-5 short paragraphs). Explain what each important part does. If there are mistakes, point them out kindly. Use the CodeHerWay voice: no gatekeeping, no jargon without explanation.`,
          messages: [{ role: 'user', content: editorCode }]
        })
      });

      const data = await response.json();
      setAiExplanation(
        data.content?.[0]?.text || 'Could not explain this code. Try modifying it and asking again.'
      );
    } catch (err) {
      setAiExplanation('Connection issue — check your internet and try again.');
    } finally {
      setAiExplaining(false);
    }
  }

  const tabIcon = isJS ? 'ƒ' : isCSS ? '{ }' : '<>';
  const previewLabel = isJS ? '▶ Run' : '▶ Preview';
  const previewSource = tab === 'code' ? code : editorCode;

  // Define custom Monaco theme
  function defineTheme(monaco) {
    monaco.editor.defineTheme('codeherway-dark', {
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
        { token: 'delimiter', foreground: '8888a8' },
        { token: 'type', foreground: 'ffa726' },
        { token: 'variable', foreground: 'e0e0ec' },
        { token: 'function', foreground: 'b388ff' },
      ],
      colors: {
        'editor.background': '#0a0a14',
        'editor.foreground': '#e0e0ec',
        'editor.lineHighlightBackground': '#1a1a2e',
        'editor.selectionBackground': '#ff6b9d30',
        'editor.inactiveSelectionBackground': '#ff6b9d15',
        'editorCursor.foreground': '#ff6b9d',
        'editorLineNumber.foreground': '#3a3a5e',
        'editorLineNumber.activeForeground': '#ff6b9d',
        'editorIndentGuide.background': '#1a1a2e',
        'editorIndentGuide.activeBackground': '#2a2a3e',
        'editorWidget.background': '#0f0f1a',
        'editorWidget.border': '#2a2a3e',
        'editorSuggestWidget.background': '#0f0f1a',
        'editorSuggestWidget.border': '#2a2a3e',
        'editorSuggestWidget.selectedBackground': '#1a1a2e',
        'scrollbarSlider.background': '#2a2a3e80',
        'scrollbarSlider.hoverBackground': '#3a3a5e80',
      }
    });
  }

  return (
    <div className="cpv">
      {/* ─── Tab Bar ─── */}
      <div className="cpv-tabs">
        <button className={`cpv-tab ${tab === 'code' ? 'on' : ''}`} onClick={() => setTab('code')}>
          {tabIcon} Code
        </button>
        <button className={`cpv-tab ${tab === 'editor' ? 'on' : ''}`} onClick={() => setTab('editor')}>
          ✏️ Editor
        </button>
        <button className={`cpv-tab ${tab === 'preview' ? 'on' : ''}`} onClick={() => setTab('preview')}>
          {previewLabel}
        </button>

        <div className="cpv-actions">
          {tab === 'editor' && editorCode !== code && (
            <button className="cpv-reset" onClick={handleReset} title="Reset to original">
              ↺ Reset
            </button>
          )}
          {tab === 'editor' && (
            <button
              className={`cpv-explain ${aiExplaining ? 'loading' : ''}`}
              onClick={explainCode}
              disabled={aiExplaining}
              title="AI explains your code"
            >
              {aiExplaining ? '⏳ Thinking...' : '🤖 Explain'}
            </button>
          )}
          <button className="cpv-copy" onClick={handleCopy}>
            {copied ? '✓ Copied' : '⎘ Copy'}
          </button>
        </div>
      </div>

      {/* ─── Code Tab (read-only) ─── */}
      {tab === 'code' && (
        <pre className="cpv-code"><code>{code}</code></pre>
      )}

      {/* ─── Editor Tab (Monaco on desktop, textarea on mobile) ─── */}
      {tab === 'editor' && (
        <div className="cpv-editor-wrap">
          {isMobile ? (
            <textarea
              className="cpv-mobile-editor"
              value={editorCode}
              onChange={(e) => handleEditorChange(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              rows={14}
            />
          ) : (
          <Suspense fallback={
            <div className="cpv-editor-loading">
              <span className="cpv-loading-spinner"></span>
              Loading editor...
            </div>
          }>
            <MonacoEditor
              height="320px"
              language={monacoLang}
              value={editorCode}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              theme="codeherway-dark"
              beforeMount={defineTheme}
              options={{
                fontSize: 14,
                fontFamily: "'Space Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 2,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                bracketPairColorization: { enabled: true },
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                formatOnPaste: true,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
              }}
            />
          </Suspense>
          )}

          {/* AI Explanation panel */}
          {showExplanation && (
            <div className="cpv-explanation">
              <div className="cpv-explanation-head">
                <span>🤖 Code Explanation</span>
                <button className="cpv-explanation-close" onClick={() => setShowExplanation(false)}>✕</button>
              </div>
              <div className="cpv-explanation-body">
                {aiExplaining ? (
                  <div className="cpv-explanation-loading">
                    <span className="cpv-loading-spinner"></span>
                    Analyzing your code...
                  </div>
                ) : (
                  aiExplanation.split('\n').filter(Boolean).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Preview Tab (live render) ─── */}
      {tab === 'preview' && (
        <iframe
          className="cpv-iframe"
          srcDoc={buildPreview(previewSource)}
          title="Preview"
          sandbox="allow-scripts"
        />
      )}
    </div>
  );
}
