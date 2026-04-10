// ═══════════════════════════════════════════════
// CODE PREVIEW — Read-only view + Monaco editor + Live preview
// 3 tabs: Code (lesson example), Editor (sandbox), Preview (live)
// Features: AI code explanation, custom theme, auto-complete
// ═══════════════════════════════════════════════

import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { IFRAME_STYLES } from '../../utils/iframeStyles';
import { askAI } from '../../utils/ai';
import { useIsMobile } from '../../hooks/useIsMobile';
import { defineMonacoTheme, MONACO_THEME_NAME, MONACO_OPTIONS } from '../../utils/monacoTheme';

// Lazy load Monaco — only downloads when Editor tab is clicked on desktop
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

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
      const text = await askAI({
        system: `You are the CodeHerWay code explainer — a direct, encouraging mentor for women learning web development. Explain the following ${monacoLang.toUpperCase()} code clearly for a beginner. Be concise (3-5 short paragraphs). Explain what each important part does. If there are mistakes, point them out kindly. Use the CodeHerWay voice: no gatekeeping, no jargon without explanation.`,
        messages: [{ role: 'user', content: editorCode }],
        maxTokens: 800,
      });

      setAiExplanation(
        text || 'Could not explain this code. Try modifying it and asking again.'
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
              theme={MONACO_THEME_NAME}
              beforeMount={defineMonacoTheme}
              options={{
                ...MONACO_OPTIONS,
                padding: { top: 16, bottom: 16 },
                fontLigatures: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                formatOnPaste: true,
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
