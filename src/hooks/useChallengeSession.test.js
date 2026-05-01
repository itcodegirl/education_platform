import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useChallengeSession } from './useChallengeSession';

const baseChallenge = {
  starter: '<h1>Start</h1>',
  hint: 'Use a heading.',
  solution: '<h1>Done</h1>',
  tests: [
    { label: 'has h1', check: (code) => code.includes('<h1') },
    { label: 'has Done', check: (code) => code.includes('Done') },
  ],
};

describe('useChallengeSession', () => {
  it('initializes from challenge.starter and derives totalTests from tests.length', () => {
    const { result } = renderHook(() => useChallengeSession({ challenge: baseChallenge }));

    expect(result.current.code).toBe('<h1>Start</h1>');
    expect(result.current.results).toBeNull();
    expect(result.current.totalTests).toBe(2);
    expect(result.current.allPassed).toBe(false);
    expect(result.current.passCount).toBe(0);
  });

  it('handleEditorChange updates code and clears stale results', async () => {
    const { result } = renderHook(() => useChallengeSession({ challenge: baseChallenge }));

    await act(async () => { await result.current.runTests(null); });
    expect(result.current.results).not.toBeNull();

    act(() => result.current.handleEditorChange('<h1>Done</h1>'));
    expect(result.current.code).toBe('<h1>Done</h1>');
    expect(result.current.results).toBeNull();
  });

  it('runTests grades the current code and surfaces per-check pass/fail', async () => {
    const { result } = renderHook(() => useChallengeSession({ challenge: baseChallenge }));

    act(() => result.current.handleEditorChange('<h1>Done</h1>'));
    await act(async () => { await result.current.runTests(null); });

    expect(result.current.results).toEqual([
      { label: 'has h1', passed: true },
      { label: 'has Done', passed: true },
    ]);
    expect(result.current.allPassed).toBe(true);
    expect(result.current.passCount).toBe(2);
  });

  it('calls onComplete exactly once when all tests pass, even on repeat runs', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useChallengeSession({ challenge: baseChallenge, onComplete }));

    act(() => result.current.handleEditorChange('<h1>Done</h1>'));
    await act(async () => { await result.current.runTests(null); });
    await act(async () => { await result.current.runTests(null); });
    await act(async () => { await result.current.runTests(null); });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('toggleSolution shows the confirmation prompt the first time, not the solution itself', () => {
    const { result } = renderHook(() => useChallengeSession({ challenge: baseChallenge }));

    act(() => result.current.toggleSolution());

    expect(result.current.showSolution).toBe(false);
    expect(result.current.confirmRevealSolution).toBe(true);
  });

  it('toggleSolution reveals the solution directly once tests have been attempted', async () => {
    const { result } = renderHook(() => useChallengeSession({ challenge: baseChallenge }));

    await act(async () => { await result.current.runTests(null); });
    act(() => result.current.toggleSolution());

    expect(result.current.showSolution).toBe(true);
    expect(result.current.confirmRevealSolution).toBe(false);
  });

  it('acceptRevealSolution closes the confirmation prompt and shows the solution', () => {
    const { result } = renderHook(() => useChallengeSession({ challenge: baseChallenge }));

    act(() => result.current.toggleSolution());
    act(() => result.current.acceptRevealSolution());

    expect(result.current.showSolution).toBe(true);
    expect(result.current.confirmRevealSolution).toBe(false);
  });

  it('cancelRevealSolution closes the confirmation prompt without showing the solution', () => {
    const { result } = renderHook(() => useChallengeSession({ challenge: baseChallenge }));

    act(() => result.current.toggleSolution());
    act(() => result.current.cancelRevealSolution());

    expect(result.current.showSolution).toBe(false);
    expect(result.current.confirmRevealSolution).toBe(false);
  });

  it('reset restores the starter code and clears results', async () => {
    const { result } = renderHook(() => useChallengeSession({ challenge: baseChallenge }));

    act(() => result.current.handleEditorChange('<h1>Different</h1>'));
    await act(async () => { await result.current.runTests(null); });
    act(() => result.current.reset());

    expect(result.current.code).toBe('<h1>Start</h1>');
    expect(result.current.results).toBeNull();
  });

  it('reports a failed test when its check function throws', async () => {
    const challenge = {
      ...baseChallenge,
      tests: [{ label: 'throws', check: () => { throw new Error('boom'); } }],
    };
    const { result } = renderHook(() => useChallengeSession({ challenge }));

    await act(async () => { await result.current.runTests(null); });

    expect(result.current.results).toEqual([{ label: 'throws', passed: false }]);
    expect(result.current.allPassed).toBe(false);
  });

  it('clearing the solution-reveal confirmation flag is idempotent on re-runs', async () => {
    const { result } = renderHook(() => useChallengeSession({ challenge: baseChallenge }));

    act(() => result.current.toggleSolution()); // confirm shown
    expect(result.current.confirmRevealSolution).toBe(true);

    await act(async () => { await result.current.runTests(null); }); // running tests should clear it
    expect(result.current.confirmRevealSolution).toBe(false);
  });
});
