import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMobileKeyboardOpen } from './useMobileKeyboardOpen';

function installVisualViewport(height = 800) {
  const listeners = new Map();
  const viewport = {
    height,
    addEventListener: vi.fn((eventName, handler) => {
      listeners.set(eventName, handler);
    }),
    removeEventListener: vi.fn((eventName) => {
      listeners.delete(eventName);
    }),
    dispatch(eventName) {
      listeners.get(eventName)?.();
    },
  };

  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: viewport,
  });

  return viewport;
}

describe('useMobileKeyboardOpen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
    Reflect.deleteProperty(window, 'visualViewport');
  });

  it('opens only when a text field is focused and the visual viewport shrinks', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback();
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const viewport = installVisualViewport(800);
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);

    const { result } = renderHook(() => useMobileKeyboardOpen(true));
    expect(result.current).toBe(false);

    await act(async () => {
      input.focus();
      viewport.height = 520;
      viewport.dispatch('resize');
    });

    expect(result.current).toBe(true);
  });

  it('stays closed for non-text controls and desktop layouts', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback();
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const viewport = installVisualViewport(800);
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    document.body.appendChild(checkbox);

    const mobile = renderHook(() => useMobileKeyboardOpen(true));
    await act(async () => {
      checkbox.focus();
      viewport.height = 500;
      viewport.dispatch('resize');
    });
    expect(mobile.result.current).toBe(false);

    const desktop = renderHook(() => useMobileKeyboardOpen(false));
    expect(desktop.result.current).toBe(false);
  });

  it('clears delayed orientation and focus timers on unmount', () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    installVisualViewport(800);

    const { unmount } = renderHook(() => useMobileKeyboardOpen(true));

    act(() => {
      window.dispatchEvent(new Event('orientationchange'));
      window.dispatchEvent(new FocusEvent('focusout'));
    });

    expect(vi.getTimerCount()).toBe(2);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
