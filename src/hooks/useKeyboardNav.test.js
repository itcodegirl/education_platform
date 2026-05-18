/* @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardNav } from './useKeyboardNav';

function makeCallbacks() {
  return {
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onMarkDone: vi.fn(),
    onSearch: vi.fn(),
    onSwitchCourse: vi.fn(),
    onToggleSidebar: vi.fn(),
  };
}

function fire(key, modifiers = {}) {
  document.dispatchEvent(new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    metaKey: modifiers.metaKey || false,
    ctrlKey: modifiers.ctrlKey || false,
    altKey: modifiers.altKey || false,
    shiftKey: modifiers.shiftKey || false,
  }));
}

describe('useKeyboardNav', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('ArrowRight calls onNext', () => {
    const cbs = makeCallbacks();
    renderHook(() => useKeyboardNav(cbs));
    fire('ArrowRight');
    expect(cbs.onNext).toHaveBeenCalled();
  });

  it('ArrowLeft calls onPrev', () => {
    const cbs = makeCallbacks();
    renderHook(() => useKeyboardNav(cbs));
    fire('ArrowLeft');
    expect(cbs.onPrev).toHaveBeenCalled();
  });

  it('"d" calls onMarkDone', () => {
    const cbs = makeCallbacks();
    renderHook(() => useKeyboardNav(cbs));
    fire('d');
    expect(cbs.onMarkDone).toHaveBeenCalled();
  });

  it('"D" also calls onMarkDone', () => {
    const cbs = makeCallbacks();
    renderHook(() => useKeyboardNav(cbs));
    fire('D');
    expect(cbs.onMarkDone).toHaveBeenCalled();
  });

  it('"m" calls onToggleSidebar', () => {
    const cbs = makeCallbacks();
    renderHook(() => useKeyboardNav(cbs));
    fire('m');
    expect(cbs.onToggleSidebar).toHaveBeenCalled();
  });

  it('"/" calls onSearch', () => {
    const cbs = makeCallbacks();
    renderHook(() => useKeyboardNav(cbs));
    fire('/');
    expect(cbs.onSearch).toHaveBeenCalled();
  });

  it('Ctrl+k calls onSearch', () => {
    const cbs = makeCallbacks();
    renderHook(() => useKeyboardNav(cbs));
    fire('k', { ctrlKey: true });
    expect(cbs.onSearch).toHaveBeenCalled();
  });

  it('Meta+k calls onSearch', () => {
    const cbs = makeCallbacks();
    renderHook(() => useKeyboardNav(cbs));
    fire('k', { metaKey: true });
    expect(cbs.onSearch).toHaveBeenCalled();
  });

  it('"1" calls onSwitchCourse with 0', () => {
    const cbs = makeCallbacks();
    renderHook(() => useKeyboardNav(cbs));
    fire('1');
    expect(cbs.onSwitchCourse).toHaveBeenCalledWith(0);
  });

  it('"4" calls onSwitchCourse with 3', () => {
    const cbs = makeCallbacks();
    renderHook(() => useKeyboardNav(cbs));
    fire('4');
    expect(cbs.onSwitchCourse).toHaveBeenCalledWith(3);
  });

  it('does not call callbacks when target is an INPUT', () => {
    const cbs = makeCallbacks();
    renderHook(() => useKeyboardNav(cbs));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    document.body.removeChild(input);
    expect(cbs.onNext).not.toHaveBeenCalled();
  });

  it('does not call navigation when altKey is held', () => {
    const cbs = makeCallbacks();
    renderHook(() => useKeyboardNav(cbs));
    fire('ArrowRight', { altKey: true });
    expect(cbs.onNext).not.toHaveBeenCalled();
  });
});
