// ═══════════════════════════════════════════════
// CODE CHALLENGE — Interactive coding challenges
// Monaco editor + auto-grading via DOM validation
// Checks actual output against requirements
// ═══════════════════════════════════════════════

import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { IFRAME_STYLES } from '../../utils/iframeStyles';
import { askChallengeTutor } from '../../services/aiService';
import { useIsMobile } from '../../hooks/useIsMobile';
import { defineMonacoTheme, MONACO_THEME_NAME, MONACO_OPTIONS } from '../../utils/monacoTheme';

// Chain monacoLoader so it runs its side-effects (loader.config,
// MonacoEnvironment) before @monaco-editor/react is evaluated. Both
// end up in the same lazy chunk, keeping Monaco out of the main bundle.
const MonacoEditor = lazy(() =>
  import('../../lib/monacoLoader').then(() => import('@monaco-editor/react'))
);

export function CodeChallenge({ challenge, lang, onComplete }) {
  const isMobile = useIsMobile();
  const [code, setCode] = useState(challenge.starter || '');
  const [results, setResults] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [confirmRevealSolution, setConfirmRevealSolution] = useState(false);
  const [passed, setPassed] = useState(false);
  const [aiHelp, setAiHelp] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const iframeRef = useRef(null);

  const isCSS = lang === 'css';
  const isJS = lang === 'js' || lang === 'react';
  const monacoLang = isJS ? 'javascript' : isCSS ? 'css' : 'html';

  const handleEditorChange = useCallback((value) => {
    setCode(value || '');
    setResults(null); // clear results when code changes
  }, []);

  // Build preview HTML for the iframe
  function buildPreview(sourceCode) {
    if (isJS) {
      const consoleCapture = `
        const _results = [];
        const _origLog = console.log;
        console.log = (...a) => { _results.push(a.map(String).join(' ')); _origLog(...a); };
        try { ${sourceCode.replace(/<\/script>/g, '<\\/script>')} } catch(e) { console.log('Error: ' + e.message); }
        window._challengeResults = _results;
        window._challengeCode = ${JSON.stringify(sourceCode)};
      `;
      return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES}</style></head><body><pre id="out"></pre><script>${consoleCapture}<\/script></body></html>`;
    } else if (isCSS) {
      const html = challenge.previewHTML || '<h1>Styled Heading</h1><p>Body text</p><div class="card"><h3>Card</h3></div>';
      return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES}\n${sourceCode}</style></head><body>${html}</body></html>`;
    } else {
      return `<!DOCTYPE html><html><head><style>${IFRAME_STYLES}</style></head><body>${sourceCode}</body></html>`;
    }
  }

  // Run the grading tests
  function runTests() {
    const tests = challenge.tests || [];
    if (tests.length === 0) return;

    const testResults = tests.map(test => {
      try {
        const result = test.check(code, iframeRef.current);
        return { label: test.label, passed: !!result };
      } catch {
        return { label: test.label, passed: false };
      }
    });

    setResults(testResults);

    const allPassed = testResults.every(r => r.passed);
    if (allPassed && !passed) {
      setPassed(true);
      onComplete?.();
    }
    if (confirmRevealSolution) {
      setConfirmRevealSolution(false);
    }
  }

  function handleSolutionToggle() {
    if (showSolution) {
      setShowSolution(false);
      return;
    }
    const hasTriedChallenge = Array.isArray(results);
    if (!hasTriedChallenge) {
      setConfirmRevealSolution(true);
      return;
    }
    setShowSolution(true);
  }

  // AI Help for challenges
  async function askAiHelp(question) {
    if (aiLoading) return;
    setAiLoading(true);
    setShowAiHelp(true);

    // Build failing tests context
    const failingTests = results
      ? results.filter(r => !r.passed).map(r => r.label).join(', ')
      : 'not yet run';

    try {
      const aiText = await askChallengeTutor({
        system: `You are the CodeHerWay AI Tutor helping a student with a coding challenge.

Challenge: ${challenge.title}
Description: ${challenge.description}
Language: ${monacoLang}
Requirements: ${challenge.requirements?.join(', ')}
Failing tests: ${failingTests}

The student's current code:
${code}

Rules:
- NEVER give the full solution. Guide them toward it.
- Point out what they're missing or doing wrong.
- Give small, specific hints — one step at a time.
- Be encouraging and direct. No gatekeeping.
- Keep answers to 2-3 short paragraphs max.
- If they ask for the answer directly, nudge them to try the hint first.`,
        question,
      });

      setAiHelp(aiText || 'Could not process that. Try rephrasing!');
    } catch {
      setAiHelp('Connection issue — check your internet and try again.');
    } finally {
      setAiLoading(false);
    }
  }

  const allPassed = results?.every(r => r.passed);
  const passCount = results?.filter(r => r.passed).length || 0;
  const totalTests = challenge.tests?.length || 0;

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
                    {testResult ? (testResult.passed ? '✓' : '✗') : '○'}
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
            <button type="button" className="cc-reset-btn" onClick={() => setCode(challenge.starter || '')}>
              ↺ Reset
            </button>
          </div>
          {isMobile ? (
            <textarea
              className="cpv-mobile-editor"
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
            srcDoc={buildPreview(code)}
            title="Challenge Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* Actions bar */}
      <div className="cc-actions">
        <button type="button" className="cc-run-btn" onClick={runTests} disabled={!code.trim()}>
          🧪 Run Tests ({totalTests})
        </button>

        <button
          type="button"
          className={`cc-ai-btn ${showAiHelp ? 'active' : ''}`}
          onClick={() => setShowAiHelp(!showAiHelp)}
          aria-expanded={showAiHelp}
          aria-controls="challenge-ai-panel"
        >
          🤖 {showAiHelp ? 'Close Tutor' : 'Ask for Help'}
        </button>

        {challenge.hint && (
          <button type="button" className="cc-hint-btn" onClick={() => setShowHint(!showHint)} aria-expanded={showHint}>
            💡 {showHint ? 'Hide Hint' : 'Show Hint'}
          </button>
        )}

        {challenge.solution && (
          <button type="button" className="cc-solution-btn" onClick={handleSolutionToggle} aria-expanded={showSolution}>
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
              onClick={() => setConfirmRevealSolution(false)}
            >
              Keep trying
            </button>
            <button
              type="button"
              className="cc-solution-warning-btn"
              onClick={() => {
                setShowSolution(true);
                setConfirmRevealSolution(false);
              }}
            >
              Reveal anyway
            </button>
          </div>
        </div>
      )}

      {/* AI Help panel */}
      {showAiHelp && (
        <div id="challenge-ai-panel" className="cc-ai-panel">
          <div className="cc-ai-header">
            <span>🤖 AI Tutor — Challenge Help</span>
          </div>

          {aiHelp && (
            <div className="cc-ai-response">
              {aiHelp.split('\n').filter(Boolean).map((line, i) => {
                if (line.startsWith('```')) return null;
                if (line.trim().startsWith('`') && line.trim().endsWith('`')) {
                  return <code key={i} className="cc-ai-inline-code">{line.trim().replace(/`/g, '')}</code>;
                }
                return <p key={i}>{line}</p>;
              })}
            </div>
          )}

          <div className="cc-ai-input-row">
            <div className="cc-ai-suggestions">
              {!aiHelp && [
                'What am I doing wrong?',
                'Explain the requirements',
                'Give me a hint (not the answer)',
                'Help me understand the error',
              ].map((s, i) => (
                <button key={i} type="button" className="cc-ai-suggestion" onClick={() => askAiHelp(s)}>
                  {s}
                </button>
              ))}
            </div>
            <div className="cc-ai-custom">
              <input
                className="cc-ai-input"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && aiInput.trim()) { askAiHelp(aiInput); setAiInput(''); } }}
                placeholder="Ask about this challenge..."
                disabled={aiLoading}
              />
              <button
                type="button"
                className="cc-ai-send"
                onClick={() => { if (aiInput.trim()) { askAiHelp(aiInput); setAiInput(''); } }}
                disabled={!aiInput.trim() || aiLoading}
                aria-label="Send challenge help request"
              >
                {aiLoading ? '⏳' : '↑'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <span className="cc-results-text">{passCount}/{totalTests} tests passing — keep going!</span>
              </>
            )}
          </div>
          <div className="cc-results-list">
            {results.map((r, i) => (
              <div key={i} className={`cc-result-item ${r.passed ? 'pass' : 'fail'}`}>
                <span className="cc-result-check">{r.passed ? '✓' : '✗'}</span>
                <span>{r.label}</span>
              </div>
            ))}
          </div>
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
