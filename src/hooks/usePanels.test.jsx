import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePanels } from './usePanels';

describe('usePanels history sync', () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    localStorageMock.getItem.mockReturnValue('1');
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
    expect(window.history.state?.cinovaPanel).toBe('search');
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
});
