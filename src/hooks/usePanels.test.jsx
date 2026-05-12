import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePanels } from './usePanels';

describe('usePanels history sync', () => {
  let storageValues;
  let localStorageMock;

  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    storageValues = new Map([
      ['chw-onboarded:guest', 'true'],
      ['chw-onboarded:learner-a', 'true'],
    ]);
    localStorageMock = {
      getItem: vi.fn((key) => (storageValues.has(key) ? storageValues.get(key) : null)),
      setItem: vi.fn((key, value) => storageValues.set(key, String(value))),
      removeItem: vi.fn((key) => storageValues.delete(key)),
      clear: vi.fn(() => storageValues.clear()),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true,
    });
  });

  it('pushes a panel history state when opening a panel', () => {
    const { result } = renderHook(() =>
      usePanels({
        dataLoaded: true,
        user: true,
        lastPosition: null,
      }),
    );

    act(() => {
      result.current.togglePanel('search');
    });

    expect(result.current.panel).toBe('search');
    expect(window.history.state?.chwPanel).toBe('search');
    expect(window.history.state?.cinovaPanel).toBeUndefined();
  });

  it('closes via browser back when closing an opened panel', () => {
    const historyBackSpy = vi.spyOn(window.history, 'back');
    const { result } = renderHook(() =>
      usePanels({
        dataLoaded: true,
        user: true,
        lastPosition: null,
      }),
    );

    act(() => {
      result.current.togglePanel('search');
    });
    act(() => {
      result.current.closePanel();
    });

    expect(historyBackSpy).toHaveBeenCalled();
    historyBackSpy.mockRestore();
  });

  it('syncs panel state from popstate events', () => {
    const { result } = renderHook(() =>
      usePanels({
        dataLoaded: true,
        user: true,
        lastPosition: null,
      }),
    );

    act(() => {
      window.history.pushState({ cinovaPanel: 'glossary' }, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate', { state: { cinovaPanel: 'glossary' } }));
    });

    expect(result.current.panel).toBe('glossary');

    act(() => {
      window.history.replaceState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    });

    expect(result.current.panel).toBe(null);
  });

  it('syncs the renamed CodeHerWay panel history key', () => {
    const { result } = renderHook(() =>
      usePanels({
        dataLoaded: true,
        user: true,
        lastPosition: null,
      }),
    );

    act(() => {
      window.history.pushState({ chwPanel: 'badges' }, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate', { state: { chwPanel: 'badges' } }));
    });

    expect(result.current.panel).toBe('badges');
  });

  it('does not treat a scoped false onboarding flag as completed', () => {
    storageValues.set('chw-onboarded:learner-a', 'false');

    const { result } = renderHook(() =>
      usePanels({
        dataLoaded: true,
        user: { id: 'learner-a' },
        lastPosition: null,
      }),
    );

    expect(result.current.showOnboarding).toBe(true);
  });

  it('migrates legacy onboarded flags without treating false as true', () => {
    storageValues.delete('chw-onboarded:learner-a');
    storageValues.set('chw-onboarded', JSON.stringify(false));

    const { result } = renderHook(() =>
      usePanels({
        dataLoaded: true,
        user: { id: 'learner-a' },
        lastPosition: null,
      }),
    );

    expect(result.current.showOnboarding).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('chw-onboarded:learner-a', 'false');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('chw-onboarded');
  });

  it('clears pending confetti timers on unmount', () => {
    vi.useFakeTimers();

    const { result, unmount } = renderHook(() =>
      usePanels({
        dataLoaded: true,
        user: { id: 'learner-a' },
        lastPosition: null,
      }),
    );

    act(() => {
      result.current.checkMilestone(1);
      result.current.checkMilestone(5);
    });

    expect(result.current.confetti).toBe(true);

    unmount();

    expect(() => {
      act(() => {
        vi.runOnlyPendingTimers();
      });
    }).not.toThrow();

    vi.useRealTimers();
  });

  it('keeps panel action identities stable across parent rerenders', () => {
    const { result, rerender } = renderHook(() =>
      usePanels({
        dataLoaded: true,
        user: { id: 'learner-a' },
        lastPosition: null,
      }),
    );
    const initialActions = {
      closePanel: result.current.closePanel,
      togglePanel: result.current.togglePanel,
      checkMilestone: result.current.checkMilestone,
      triggerCourseComplete: result.current.triggerCourseComplete,
    };

    rerender();

    expect(result.current.closePanel).toBe(initialActions.closePanel);
    expect(result.current.togglePanel).toBe(initialActions.togglePanel);
    expect(result.current.checkMilestone).toBe(initialActions.checkMilestone);
    expect(result.current.triggerCourseComplete).toBe(initialActions.triggerCourseComplete);
  });
});
