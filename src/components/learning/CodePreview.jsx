import { useState, useRef, useCallback, lazy, Suspense, useEffect, useMemo, memo, useId } from 'react';
import { IFRAME_STYLES } from '../../utils/iframeStyles';
import { useIsMobile } from '../../hooks/useIsMobile';
import { usePrefersReducedData } from '../../hooks/usePrefersReducedData';
import { defineMonacoTheme, MONACO_THEME_NAME, MONACO_OPTIONS } from '../../utils/monacoTheme';
import { AI_ERROR_CODES, explainCode as explainCodeRequest } from '../../services/aiService';
import { buildCodePreviewConsoleScript } from './codePreviewConsoleScript';

// Chain monacoLoader so it runs its side-effects (loader.config,
// MonacoEnvironment) before @monaco-editor/react is evaluated. Both
// end up in the same lazy chunk, keeping Monaco out of the main bundle.
const MonacoEditor = lazy(() =>
  import('../../lib/monacoLoader').then(() => import('@monaco-editor/react'))
);

const SCAFFOLDING = {
  full:         { icon: '📝', label: 'Complete Example',    hint: 'Study this code, then try modifying it in the Editor tab.' },
  partial:      { icon: '🔧', label: 'Partial Template',    hint: 'Some parts are marked TODO - fill them in using the Editor tab.' },
  starter:      { icon: '🚀', label: 'Starter Code',        hint: 'A starting skeleton. Switch to the Editor tab and build on it.' },
  requirements: { icon: '📋', label: 'Requirements Only',   hint: 'No code given! Open the Editor tab and write it from scratch.' },
};

const COPY_FEEDBACK_MS = 2000;
const PREVIEW_SYNC_DELAY_MS = 180;

// Memoized — CodePreview takes only primitive props (code, lang,
// scaffolding) so it can safely skip re-renders that come from
// unrelated lesson-chain state (showNotes, checkedTasks, AI tutor
// open/close). Without memo, every keystroke in the lesson notes
// textarea re-rendered Monaco / its iframe sibling.
export const CodePreview = memo(function CodePreview({ code, lang, scaffolding = 'full' }) {
  const isMobile = useIsMobile();
  const prefersReducedData = usePrefersReducedData();
  const previewId = useId();
  const level = SCAFFOLDING[scaffolding] || SCAFFOLDING.full;
  const defaultTab = scaffolding === 'starter' || scaffolding === 'requirements' ? 'editor' : 'code';

  const [tab, setTab] = useState(defaultTab);
  const [copied, setCopied] = useState(false);
  const [editorCode, setEditorCode] = useState(code);
  const [previewCode, setPreviewCode] = useState(code);
  const [aiExplaining, setAiExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  // When Data Saver is on, default to the textarea fallback so we
  // never download the Monaco chunks. The learner can opt back into
  // the full editor with a single click via the "Load full editor"
  // button rendered next to the textarea.
  const [forceFullEditor, setForceFullEditor] = useState(false);
  const useTextareaEditor = isMobile || (prefersReducedData && !forceFullEditor);
  const editorRef = useRef(null);
  const copyTimerRef = useRef(null);
  const aiRequestControllerRef = useRef(null);
  const previousTabRef = useRef(defaultTab);
  const tabBaseId = useId();

  const isCSS = lang === 'css';
  const isJS = lang === 'js' || lang === 'react';
  const monacoLang = isJS ? 'javascript' : isCSS ? 'css' : 'html';

  useEffect(() => {
    setEditorCode(code);
    setPreviewCode(code);
    setAiExplanation('');
    setShowExplanation(false);
    setTab(scaffolding === 'starter' || scaffolding === 'requirements' ? 'editor' : 'code');
  }, [code, scaffolding]);

  useEffect(() => {
    const previousTab = previousTabRef.current;
    previousTabRef.current = tab;

    if (tab !== 'preview') return undefined;

    if (previousTab !== 'preview') {
      setPreviewCode(editorCode);
      return undefined;
    }

    const previewTimer = window.setTimeout(() => {
      setPreviewCode(editorCode);
    }, PREVIEW_SYNC_DELAY_MS);

    return () => window.clearTimeout(previewTimer);
  }, [editorCode, tab]);

  useEffect(() => () => {
    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
    }

    aiRequestControllerRef.current?.abort();
  }, []);

  const handleCopy = async () => {
    const textToCopy = tab === 'editor' ? editorCode : code;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);

      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }

      copyTimerRef.current = window.setTimeout(() => {
        copyTimerRef.current = null;
        setCopied(false);
      }, COPY_FEEDBACK_MS);
    }
  };

  const handleReset = () => {
    setEditorCode(code);
    setPreviewCode(code);
    setAiExplanation('');
    setShowExplanation(false);
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange = useCallback((value) => {
    setEditorCode(value || '');
  }, []);

  const buildPreview = useCallback((sourceCode) => {
    if (isJS) {
      const consoleScript = buildCodePreviewConsoleScript(sourceCode);
      return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES} .console-line{font-family:monospace;font-size:13px;padding:3px 0;border-bottom:1px solid #1a1a2e;color:#e0e0e0}.prefix{color:#5a5a7a;margin-right:8px}pre.output{background:#0a0a14;padding:16px;border-radius:8px;margin:0;overflow:auto}</style></head><body><pre class="output" id="out"></pre><script>${consoleScript}<\/script></body></html>`;
    }

    if (isCSS) {
      return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES}\n${sourceCode}</style></head><body><h1>Styled Heading</h1><p class="lead">Lead paragraph with <strong>bold</strong> and <em>italic</em>.</p><p>Body text. <a href="#">A link</a>.</p><div class="card" style="margin-top:16px;padding:20px"><h3>Card Title</h3><p>Content.</p></div><button style="margin-top:12px;padding:10px 24px;cursor:pointer">Button</button></body></html>`;
    }

    return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES}</style></head><body>${sourceCode}</body></html>`;
  }, [isCSS, isJS]);

  async function explainCode() {
    if (aiExplaining) return;

    const requestController = new AbortController();
    aiRequestControllerRef.current = requestController;
    setAiExplaining(true);
    setShowExplanation(true);
    setAiExplanation('');

    try {
      const explanation = await explainCodeRequest({
        system: `You are the CodeHerWay code explainer - a direct, encouraging mentor for women learning web development. Explain the following ${monacoLang.toUpperCase()} code clearly for a beginner. Be concise (3-5 short paragraphs). Explain what each important part does. If there are mistakes, point them out kindly. Use the CodeHerWay voice: no gatekeeping, no jargon without explanation.`,
        code: editorCode,
        signal: requestController.signal,
      });

      if (requestController.signal.aborted) return;
      setAiExplanation(explanation || 'Could not explain this code. Try modifying it and asking again.');
    } catch (error) {
      if (error?.code === AI_ERROR_CODES.ABORTED || error?.name === 'AbortError') {
        return;
      }

      setAiExplanation('Connection issue - check your internet and try again.');
    } finally {
      if (aiRequestControllerRef.current === requestController) {
        aiRequestControllerRef.current = null;
        setAiExplaining(false);
      }
    }
  }

  const previewDocument = useMemo(() => buildPreview(previewCode), [buildPreview, previewCode]);
  const tabIcon = isJS ? 'f' : isCSS ? '{ }' : '<>';
  const previewLabel = isJS ? 'Run' : 'Preview';
  const visibleTabs = [
    ...(scaffolding !== 'requirements'
      ? [{ id: 'code', label: `${tabIcon} Code` }]
      : []),
    {
      id: 'editor',
      label: scaffolding === 'requirements' ? '✏️ Write Code' : 'Editor',
    },
    { id: 'preview', label: previewLabel },
  ];
  const getTabId = (tabId) => `${tabBaseId}-${tabId}-tab`;
  const getPanelId = (tabId) => `${tabBaseId}-${tabId}-panel`;

  const guidanceCopy =
    scaffolding === 'requirements'
      ? 'Start with one small piece, run it, then add the next requirement.'
      : tab === 'preview'
        ? 'Check what changed. If it feels off, return to the editor and adjust one thing.'
        : tab === 'editor'
          ? `Change one small detail, then ${previewLabel.toLowerCase()} the result before moving on.`
          : 'Read the sample first, then try one small change in the editor.';

  const handleTabKeyDown = (event) => {
    const currentIndex = visibleTabs.findIndex((item) => item.id === tab);
    if (currentIndex < 0) return;

    const lastIndex = visibleTabs.length - 1;
    const keyActions = {
      ArrowRight: currentIndex === lastIndex ? 0 : currentIndex + 1,
      ArrowDown: currentIndex === lastIndex ? 0 : currentIndex + 1,
      ArrowLeft: currentIndex === 0 ? lastIndex : currentIndex - 1,
      ArrowUp: currentIndex === 0 ? lastIndex : currentIndex - 1,
      Home: 0,
      End: lastIndex,
    };

    if (!(event.key in keyActions)) return;
    event.preventDefault();

    const nextTab = visibleTabs[keyActions[event.key]].id;
    setTab(nextTab);
    event.currentTarget
      .parentElement
      ?.querySelector(`[data-code-preview-tab="${nextTab}"]`)
      ?.focus();
  };

  return (
    <div className="code-preview">
      {/* Scaffolding badge */}
      {scaffolding !== 'full' && (
        <div className={`code-preview-scaffolding code-preview-scaffolding-${scaffolding}`}>
          <span className="code-preview-scaffolding-icon" aria-hidden="true">{level.icon}</span>
          <span className="code-preview-scaffolding-label">{level.label}</span>
          <span className="code-preview-scaffolding-hint">{level.hint}</span>
        </div>
      )}

      <div className="code-preview-guidance" id={`${previewId}-guidance`} role="note">
        <span className="code-preview-guidance-label">Next step</span>
        <span>{guidanceCopy}</span>
      </div>


      <div className="code-preview-tabs">
        <div
          className="code-preview-tablist"
          role="tablist"
          aria-label="Code practice views"
          aria-describedby={`${previewId}-guidance`}
        >          {visibleTabs.map((item) => (
            <button
              key={item.id}
              id={getTabId(item.id)}
              type="button"
              role="tab"
              className={`code-preview-tab ${tab === item.id ? 'on' : ''}`}
              aria-selected={tab === item.id}
              aria-controls={getPanelId(item.id)}
              tabIndex={tab === item.id ? 0 : -1}
              data-code-preview-tab={item.id}
              onClick={() => setTab(item.id)}
              onKeyDown={handleTabKeyDown}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="code-preview-actions">
          {tab === 'editor' && editorCode !== code && (
            <button type="button" className="code-preview-reset" onClick={handleReset} aria-label="Reset code to original" title="Reset to original">
              Reset
            </button>
          )}
          {tab === 'editor' && (
            <button
              type="button"
              className={`code-preview-explain ${aiExplaining ? 'loading' : ''}`}
              onClick={explainCode}
              disabled={aiExplaining}
              aria-label={aiExplaining ? 'AI is analyzing your code' : 'AI explains your code'}
              aria-busy={aiExplaining}
            >
              {aiExplaining ? '⏳ Thinking...' : '🤖 Explain'}
            </button>
          )}
          <button type="button" className="code-preview-copy" onClick={handleCopy} aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {tab === 'code' && (
        <pre
          id={getPanelId('code')}
          className="code-preview-code"
          role="tabpanel"
          aria-labelledby={getTabId('code')}
          tabIndex={0}
          aria-label={`${monacoLang.toUpperCase()} code sample`}
        >
          <code>{code}</code>
        </pre>
      )}

      {tab === 'editor' && (
        <div
          id={getPanelId('editor')}
          className="code-preview-editor-wrap"
          role="tabpanel"
          aria-labelledby={getTabId('editor')}
        >
          {useTextareaEditor ? (
            <>
              <textarea
                className="code-preview-mobile-editor"
                value={editorCode}
                onChange={(event) => handleEditorChange(event.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                rows={14}
                aria-label="Code editor"
                placeholder={scaffolding === 'requirements' ? 'Write your code here...' : undefined}
              />
              {/* On desktop with Data Saver on, surface a one-click
                  override so the learner can opt into the full
                  editor when they need autocomplete / linting. */}
              {!isMobile && prefersReducedData && (
                <button
                  type="button"
                  className="code-preview-load-full"
                  onClick={() => setForceFullEditor(true)}
                >
                  Load full editor (downloads ~2 MB)
                </button>
              )}
            </>

          ) : (
            <Suspense fallback={<div className="code-preview-editor-loading"><span className="code-preview-loading-spinner"></span>Opening editor...</div>}>
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
            <div className="code-preview-explanation">
              <div className="code-preview-explanation-head">
                <span>Code Explanation</span>
                <button type="button" className="code-preview-explanation-close" onClick={() => setShowExplanation(false)}>Close</button>
              </div>
              <div className="code-preview-explanation-body">
                {aiExplaining ? (
                  <div className="code-preview-explanation-loading">
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
        <div
          id={getPanelId('preview')}
          role="tabpanel"
          aria-labelledby={getTabId('preview')}
        >
          <iframe
            className="code-preview-iframe"
            srcDoc={previewDocument}
            title={isJS ? 'Code output' : isCSS ? 'CSS preview' : 'HTML preview'}
            sandbox="allow-scripts"
          />
        </div>
      )}
    </div>
  );
});
