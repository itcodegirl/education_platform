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
// ═══════════════════════════════════════════════

import { useCallback, useState } from 'react';

export function useChallengeSession({ challenge, onComplete }) {
  const [code, setCode] = useState(challenge.starter || '');
  const [results, setResults] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [confirmRevealSolution, setConfirmRevealSolution] = useState(false);
  const [passed, setPassed] = useState(false);

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

  const runTests = useCallback((iframeEl) => {
    const tests = challenge.tests || [];
    if (tests.length === 0) return;

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
  }, [challenge.tests, code, passed, onComplete, confirmRevealSolution]);

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
    toggleHint,
    toggleSolution,
    cancelRevealSolution,
    acceptRevealSolution,
    allPassed,
    passCount,
    totalTests,
  };
}
