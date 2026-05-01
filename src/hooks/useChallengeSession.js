// ═══════════════════════════════════════════════
// useChallengeSession — owns the editor + grading
// lifecycle of a code challenge. Mirrors the
// useQuizSession pattern: state + derived values +
// imperative actions, with the view doing layout only.
//
// Responsibilities:
//   - learner's code (initial = challenge.starter)
//   - test results (last grading run, or null if untouched)
//   - hint / solution toggles + the "you haven't tried yet"
//     guard before revealing a solution
//   - calling onComplete exactly once when all tests pass
//   - waiting for the iframe to finish loading the latest srcDoc
//     before running tests, so DOM-based test.check(code, iframe)
//     functions don't race against an in-flight load
// ═══════════════════════════════════════════════

import { useCallback, useRef, useState } from 'react';

// How long we'll wait for the iframe to finish loading the latest
// code before running tests anyway. The iframe load event normally
// fires within a few milliseconds of srcDoc assignment; this is a
// safety net so a failed/blocked load doesn't hang Run Tests forever.
const IFRAME_READY_TIMEOUT_MS = 1500;

export function useChallengeSession({ challenge, onComplete }) {
  const [code, setCode] = useState(challenge.starter || '');
  const [results, setResults] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [confirmRevealSolution, setConfirmRevealSolution] = useState(false);
  const [passed, setPassed] = useState(false);

  // Track which code string the iframe last finished loading. When the
  // user edits and clicks Run Tests in quick succession, runTests
  // checks this against the current code and waits for the next load
  // event if they don't match. Source-regex tests don't care, but
  // DOM-based test.check(code, iframe) functions need this guarantee.
  const loadedCodeRef = useRef(challenge.starter || '');
  const pendingLoadResolversRef = useRef([]);

  const handleIframeLoad = useCallback(() => {
    loadedCodeRef.current = code;
    const resolvers = pendingLoadResolversRef.current;
    pendingLoadResolversRef.current = [];
    for (const resolve of resolvers) {
      resolve();
    }
  }, [code]);

  const handleEditorChange = useCallback((value) => {
    setCode(value || '');
    // Once the learner edits, the previous grading result no longer
    // describes the visible code — clear it so the UI doesn't claim
    // tests are passing for code that has since changed.
    setResults(null);
  }, []);

  const reset = useCallback(() => {
    setCode(challenge.starter || '');
    setResults(null);
  }, [challenge.starter]);

  // Wait until the iframe has loaded the current code, or until the
  // safety timeout fires. Resolves with no value either way; runTests
  // proceeds afterwards.
  const waitForIframeReady = useCallback(() => {
    if (loadedCodeRef.current === code) return Promise.resolve();
    return new Promise((resolve) => {
      let settled = false;
      const settleOnce = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      pendingLoadResolversRef.current.push(settleOnce);
      setTimeout(settleOnce, IFRAME_READY_TIMEOUT_MS);
    });
  }, [code]);

  const runTests = useCallback(async (iframeEl) => {
    const tests = challenge.tests || [];
    if (tests.length === 0) return;

    // If we have an iframe and DOM-based tests want to inspect it,
    // make sure it has finished loading the latest srcDoc first.
    // When iframeEl is null (e.g. unit-test callers passing null
    // because they don't care about the DOM), skip the wait so
    // behaviour stays synchronous.
    if (iframeEl) {
      await waitForIframeReady();
    }

    const testResults = tests.map((test) => {
      try {
        const result = test.check(code, iframeEl);
        return { label: test.label, passed: !!result };
      } catch {
        return { label: test.label, passed: false };
      }
    });

    setResults(testResults);

    const allPassed = testResults.every((r) => r.passed);
    if (allPassed && !passed) {
      setPassed(true);
      onComplete?.();
    }
    if (confirmRevealSolution) {
      setConfirmRevealSolution(false);
    }
  }, [challenge.tests, code, passed, onComplete, confirmRevealSolution, waitForIframeReady]);

  const toggleHint = useCallback(() => setShowHint((v) => !v), []);

  // Two-stage solution reveal: if the learner hasn't run tests yet, we
  // show a soft confirmation prompt instead of jumping straight to the
  // solution. Once they've at least tried, the toggle is direct.
  const toggleSolution = useCallback(() => {
    setShowSolution((current) => {
      if (current) return false;
      const hasTriedChallenge = Array.isArray(results);
      if (!hasTriedChallenge) {
        setConfirmRevealSolution(true);
        return false;
      }
      return true;
    });
  }, [results]);

  const cancelRevealSolution = useCallback(() => {
    setConfirmRevealSolution(false);
  }, []);

  const acceptRevealSolution = useCallback(() => {
    setShowSolution(true);
    setConfirmRevealSolution(false);
  }, []);

  // Derived values — small enough to recompute each render.
  const allPassed = results?.every((r) => r.passed) ?? false;
  const passCount = results?.filter((r) => r.passed).length || 0;
  const totalTests = challenge.tests?.length || 0;

  return {
    code,
    results,
    showHint,
    showSolution,
    confirmRevealSolution,
    handleEditorChange,
    reset,
    runTests,
    handleIframeLoad,
    toggleHint,
    toggleSolution,
    cancelRevealSolution,
    acceptRevealSolution,
    allPassed,
    passCount,
    totalTests,
  };
}
