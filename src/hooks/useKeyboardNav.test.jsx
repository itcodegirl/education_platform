import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useKeyboardNav } from './useKeyboardNav';

function buildHandlers(overrides = {}) {
  return {
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onMarkDone: vi.fn(),
    onSearch: vi.fn(),
    onSwitchCourse: vi.fn(),
    onToggleSidebar: vi.fn(),
    ...overrides,
  };
}

describe('useKeyboardNav', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps one document listener while using the latest callbacks', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const firstHandlers = buildHandlers();
    const secondHandlers = buildHandlers();

    const { rerender, unmount } = renderHook(
      ({ handlers }) => useKeyboardNav(handlers),
      { initialProps: { handlers: firstHandlers } },
    );

    rerender({ handlers: secondHandlers });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

    expect(addSpy.mock.calls.filter(([eventName]) => eventName === 'keydown')).toHaveLength(1);
    expect(firstHandlers.onNext).not.toHaveBeenCalled();
    expect(secondHandlers.onNext).toHaveBeenCalledTimes(1);

    unmount();
    expect(removeSpy.mock.calls.filter(([eventName]) => eventName === 'keydown')).toHaveLength(1);
  });
});
