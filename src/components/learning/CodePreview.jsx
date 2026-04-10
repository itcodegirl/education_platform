import { useState, useRef, useCallback, lazy, Suspense, useEffect } from 'react';
import { IFRAME_STYLES } from '../../utils/iframeStyles';
import { useIsMobile } from '../../hooks/useIsMobile';
import { defineMonacoTheme, MONACO_THEME_NAME, MONACO_OPTIONS } from '../../utils/monacoTheme';
import { explainCode as explainCodeRequest } from '../../services/aiService';

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
  const COPY_FEEDBACK_MS = 2000;

  useEffect(() => {
    setEditorCode(code);
    setAiExplanation('');
    setShowExplanation(false);
  }, [code]);

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

  function buildPreview(sourceCode) {
    if (isJS) {
      const consoleScript = `const _out=document.getElementById("out");const _log=(p,c,...a)=>{const d=document.createElement("div");d.className="console-line";d.innerHTML='<span class="prefix" style="color:'+c+'">'+p+'</span>'+a.map(x=>{try{if(typeof x==="object")return JSON.stringify(x,null,2);return String(x)}catch(e){return String(x)}}).join(" ");_out.appendChild(d)};const console={log:(...a)=>_log("->","#4ecdc4",...a),error:(...a)=>_log("x","#ff6b6b",...a),warn:(...a)=>_log("!","#ffa726",...a),table:(a)=>_log("[]","#4ecdc4",a),group:()=>{},groupEnd:()=>{},time:()=>{},timeEnd:(l)=>_log("t","#8888a8",l+": ~1ms")};try{${sourceCode.replace(/<\/script>/g, '<\\/script>')}}catch(e){console.error(e.message)}`;
      return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES} .console-line{font-family:monospace;font-size:13px;padding:3px 0;border-bottom:1px solid #1a1a2e;color:#e0e0e0}.prefix{color:#5a5a7a;margin-right:8px}pre.output{background:#0a0a14;padding:16px;border-radius:8px;margin:0;overflow:auto}</style></head><body><pre class="output" id="out"></pre><script>${consoleScript}<\/script></body></html>`;
    }

    if (isCSS) {
      return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES}\n${sourceCode}</style></head><body><h1>Styled Heading</h1><p class="lead">Lead paragraph with <strong>bold</strong> and <em>italic</em>.</p><p>Body text. <a href="#">A link</a>.</p><div class="card" style="margin-top:16px;padding:20px"><h3>Card Title</h3><p>Content.</p></div><button style="margin-top:12px;padding:10px 24px;cursor:pointer">Button</button></body></html>`;
    }

    return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES}</style></head><body>${sourceCode}</body></html>`;
  }

  async function explainCode() {
    if (aiExplaining) return;
    setAiExplaining(true);
    setShowExplanation(true);
    setAiExplanation('');

    try {
      const explanation = await explainCodeRequest({
        system: `You are the CodeHerWay code explainer - a direct, encouraging mentor for women learning web development. Explain the following ${monacoLang.toUpperCase()} code clearly for a beginner. Be concise (3-5 short paragraphs). Explain what each important part does. If there are mistakes, point them out kindly. Use the CodeHerWay voice: no gatekeeping, no jargon without explanation.`,
        code: editorCode,
      });

      setAiExplanation(explanation || 'Could not explain this code. Try modifying it and asking again.');
    } catch {
      setAiExplanation('Connection issue - check your internet and try again.');
    } finally {
      setAiExplaining(false);
    }
  }

  const tabIcon = isJS ? 'f' : isCSS ? '{ }' : '<>';
  const previewLabel = isJS ? 'Run' : 'Preview';
  const previewSource = tab === 'code' ? code : editorCode;

  return (
    <div className="cpv">
      <div className="cpv-tabs">
        <button type="button" className={`cpv-tab ${tab === 'code' ? 'on' : ''}`} onClick={() => setTab('code')}>
          {tabIcon} Code
        </button>
        <button type="button" className={`cpv-tab ${tab === 'editor' ? 'on' : ''}`} onClick={() => setTab('editor')}>
          Editor
        </button>
        <button type="button" className={`cpv-tab ${tab === 'preview' ? 'on' : ''}`} onClick={() => setTab('preview')}>
          {previewLabel}
        </button>

        <div className="cpv-actions">
          {tab === 'editor' && editorCode !== code && (
            <button type="button" className="cpv-reset" onClick={handleReset} title="Reset to original">
              Reset
            </button>
          )}
          {tab === 'editor' && (
            <button
              type="button"
              className={`cpv-explain ${aiExplaining ? 'loading' : ''}`}
              onClick={explainCode}
              disabled={aiExplaining}
              title="AI explains your code"
            >
              {aiExplaining ? '⏳ Thinking...' : '🤖 Explain'}
            </button>
          )}
          <button type="button" className="cpv-copy" onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {tab === 'code' && (
        <pre className="cpv-code"><code>{code}</code></pre>
      )}

      {tab === 'editor' && (
        <div className="cpv-editor-wrap">
          {isMobile ? (
            <textarea
              className="cpv-mobile-editor"
              value={editorCode}
              onChange={(event) => handleEditorChange(event.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              rows={14}
            />
          ) : (
            <Suspense fallback={<div className="cpv-editor-loading"><span className="cpv-loading-spinner"></span>Loading editor...</div>}>
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

          {showExplanation && (
            <div className="cpv-explanation">
              <div className="cpv-explanation-head">
                <span>Code Explanation</span>
                <button type="button" className="cpv-explanation-close" onClick={() => setShowExplanation(false)}>Close</button>
              </div>
              <div className="cpv-explanation-body">
                {aiExplaining ? (
                  <div className="cpv-explanation-loading">
                    <div className="ai-typing"><span></span><span></span><span></span></div>
                    Analyzing your code...
                  </div>
                ) : (
                  aiExplanation.split('\n').filter(Boolean).map((line, index) => (
                    <p key={index}>{line}</p>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
