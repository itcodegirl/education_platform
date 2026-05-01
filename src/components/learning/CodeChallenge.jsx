// ═══════════════════════════════════════════════
// CodeChallenge — orchestrates the editor + preview +
// grading panel. The session lifecycle (code, results,
// hint/solution toggles, grading) lives in
// useChallengeSession; the AI tutor lives in
// ChallengeAIPanel; the iframe srcDoc is built by
// buildChallengePreview. This file is layout only.
// ═══════════════════════════════════════════════

import { useRef, useState, lazy, Suspense } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useChallengeSession } from '../../hooks/useChallengeSession';
import { buildChallengePreview } from './challenge/buildChallengePreview';
import { ChallengeAIPanel } from './challenge/ChallengeAIPanel';
import { defineMonacoTheme, MONACO_THEME_NAME, MONACO_OPTIONS } from '../../utils/monacoTheme';

// Chain monacoLoader so it runs its side-effects (loader.config,
// MonacoEnvironment) before @monaco-editor/react is evaluated. Both
// end up in the same lazy chunk, keeping Monaco out of the main bundle.
const MonacoEditor = lazy(() =>
  import('../../lib/monacoLoader').then(() => import('@monaco-editor/react'))
);

export function CodeChallenge({ challenge, lang, onComplete }) {
  const isMobile = useIsMobile();
  const iframeRef = useRef(null);
  const [showAiHelp, setShowAiHelp] = useState(false);

  const session = useChallengeSession({ challenge, onComplete });
  const {
    code,
    results,
    showHint,
    showSolution,
    confirmRevealSolution,
    handleEditorChange,
    reset,
    runTests,
    toggleHint,
    toggleSolution,
    cancelRevealSolution,
    acceptRevealSolution,
    allPassed,
    passCount,
    totalTests,
  } = session;

  const monacoLang = lang === 'js' || lang === 'react' ? 'javascript' : lang === 'css' ? 'css' : 'html';

  return (
    <div className="cc-challenge">
      {/* Header */}
      <div className="cc-header">
        <div className="cc-header-left">
          <span className="cc-icon" aria-hidden="true">🏆</span>
          <div>
            <h3 className="cc-title">{challenge.title}</h3>
            <p className="cc-description">{challenge.description}</p>
          </div>
        </div>
        {challenge.difficulty && (
          <span className={`cc-diff cc-diff-${challenge.difficulty}`}>
            {challenge.difficulty}
          </span>
        )}
      </div>

      {/* Requirements */}
      {challenge.requirements && (
        <div className="cc-requirements">
          <div className="cc-req-label">Requirements:</div>
          <ul className="cc-req-list">
            {challenge.requirements.map((req, i) => {
              const testResult = results?.[i];
              const statusClass = testResult ? (testResult.passed ? 'pass' : 'fail') : '';
              return (
                <li key={i} className={`cc-req-item ${statusClass}`}>
                  <span className="cc-req-check">
                    {testResult ? (testResult.passed ? 'OK' : 'X') : '○'}
                  </span>
                  {req}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Editor + Preview split */}
      <div className="cc-workspace">
        <div className="cc-editor-pane">
          <div className="cc-pane-header">
            <span>✏️ Your Code</span>
            <button type="button" className="cc-reset-btn" onClick={reset}>
              Retry Reset
            </button>
          </div>
          {isMobile ? (
            <textarea
              className="code-preview-mobile-editor"
              value={code}
              onChange={(e) => handleEditorChange(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              rows={12}
            />
          ) : (
          <Suspense fallback={
            <div className="cc-editor-loading">Loading editor...</div>
          }>
            <MonacoEditor
              height="280px"
              language={monacoLang}
              value={code}
              onChange={handleEditorChange}
              theme={MONACO_THEME_NAME}
              beforeMount={defineMonacoTheme}
              options={MONACO_OPTIONS}
            />
          </Suspense>
          )}
        </div>

        <div className="cc-preview-pane">
          <div className="cc-pane-header">
            <span>▶ Preview</span>
          </div>
          <iframe
            ref={iframeRef}
            className="cc-preview-iframe"
            srcDoc={buildChallengePreview({
              sourceCode: code,
              lang,
              previewHTML: challenge.previewHTML,
            })}
            title="Challenge Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* Actions bar */}
      <div className="cc-actions">
        <button
          type="button"
          className="cc-run-btn"
          onClick={() => runTests(iframeRef.current)}
          disabled={!code.trim()}
        >
          🧪 Run Tests ({totalTests})
        </button>

        <button
          type="button"
          className={`cc-ai-btn ${showAiHelp ? 'active' : ''}`}
          onClick={() => setShowAiHelp((v) => !v)}
          aria-expanded={showAiHelp}
          aria-controls="challenge-ai-panel"
        >
          🤖 {showAiHelp ? 'Close Tutor' : 'Ask for Help'}
        </button>

        {challenge.hint && (
          <button type="button" className="cc-hint-btn" onClick={toggleHint} aria-expanded={showHint}>
            💡 {showHint ? 'Hide Hint' : 'Show Hint'}
          </button>
        )}

        {challenge.solution && (
          <button type="button" className="cc-solution-btn" onClick={toggleSolution} aria-expanded={showSolution}>
            👁 {showSolution ? 'Hide Solution' : 'Show Solution'}
          </button>
        )}
      </div>

      {confirmRevealSolution && challenge.solution && (
        <div className="cc-solution-warning" role="alert">
          <p className="cc-solution-warning-text">
            You have not run the tests yet. Try first so the solution is more useful.
          </p>
          <div className="cc-solution-warning-actions">
            <button
              type="button"
              className="cc-solution-warning-btn secondary"
              onClick={cancelRevealSolution}
            >
              Keep trying
            </button>
            <button
              type="button"
              className="cc-solution-warning-btn"
              onClick={acceptRevealSolution}
            >
              Reveal anyway
            </button>
          </div>
        </div>
      )}

      <ChallengeAIPanel
        challenge={challenge}
        monacoLang={monacoLang}
        code={code}
        results={results}
        isOpen={showAiHelp}
      />

      {/* Test results */}
      {results && (
        <div className={`cc-results ${allPassed ? 'all-pass' : ''}`}>
          <div className="cc-results-header">
            {allPassed ? (
              <>
                <span className="cc-results-icon" aria-hidden="true">🎉</span>
                <span className="cc-results-text">All tests passed! You nailed it.</span>
              </>
            ) : (
              <>
                <span className="cc-results-icon" aria-hidden="true">🔧</span>
                <span className="cc-results-text">{passCount}/{totalTests} tests passing - keep going!</span>
              </>
            )}
          </div>
          <div className="cc-results-list">
            {results.map((r, i) => (
              <div key={i} className={`cc-result-item ${r.passed ? 'pass' : 'fail'}`}>
                <span className="cc-result-check">{r.passed ? 'OK' : 'X'}</span>
                <span>{r.label}</span>
              </div>
            ))}
          </div>
          {/* Transparency: today's tests look at your source text, not the
              rendered output. That's enough to guide most beginners but
              easy to game. The preview pane is the source of truth for
              what your code actually does — trust it over the checklist. */}
          <p className="cc-results-honest">
            <strong>How tests work:</strong> these checks read your code, not the live preview.
            If a test passes but the preview looks wrong, trust the preview.
          </p>
        </div>
      )}

      {/* Hint */}
      {showHint && challenge.hint && (
        <div className="cc-hint">
          <div className="cc-hint-label">💡 Hint</div>
          <p>{challenge.hint}</p>
        </div>
      )}

      {/* Solution */}
      {showSolution && challenge.solution && (
        <div className="cc-solution">
          <div className="cc-solution-label">👁 Solution</div>
          <pre className="cc-solution-code"><code>{challenge.solution}</code></pre>
        </div>
      )}
    </div>
  );
}
