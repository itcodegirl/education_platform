import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isNavigationDebugEnabled, logNavigationDiagnostic } from './navigationDiagnostics';

const STORAGE_KEY = 'debug-navigation';

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── isNavigationDebugEnabled ─────────────────────────────────
describe('isNavigationDebugEnabled', () => {
  it('returns false when no value is stored', () => {
    expect(isNavigationDebugEnabled()).toBe(false);
  });

  it('returns true when localStorage contains the string "true"', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    expect(isNavigationDebugEnabled()).toBe(true);
  });

  it('is case-insensitive and trims whitespace', () => {
    localStorage.setItem(STORAGE_KEY, '  TRUE  ');
    expect(isNavigationDebugEnabled()).toBe(true);

    localStorage.setItem(STORAGE_KEY, 'True');
    expect(isNavigationDebugEnabled()).toBe(true);
  });

  it('returns false for any value other than "true"', () => {
    for (const val of ['1', 'yes', 'on', 'enabled', 'false']) {
      localStorage.setItem(STORAGE_KEY, val);
      expect(isNavigationDebugEnabled()).toBe(false);
    }
  });

  it('returns false when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    expect(isNavigationDebugEnabled()).toBe(false);
  });

  it('returns false when window is undefined (SSR guard)', () => {
    const origWindow = globalThis.window;
    try {
      // Temporarily hide window to simulate SSR/Node env
      Object.defineProperty(globalThis, 'window', {
        value: undefined, configurable: true, writable: true,
      });
      expect(isNavigationDebugEnabled()).toBe(false);
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: origWindow, configurable: true, writable: true,
      });
    }
  });
});

// ─── logNavigationDiagnostic ──────────────────────────────────
describe('logNavigationDiagnostic', () => {
  it('does not call console.info when debug mode is off', () => {
    logNavigationDiagnostic('lesson:complete', { lessonId: 'l1' });
    expect(console.info).not.toHaveBeenCalled();
  });

  it('calls console.info with the event name and details when debug is on', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    logNavigationDiagnostic('lesson:complete', { lessonId: 'l1', count: 3 });
    expect(console.info).toHaveBeenCalledTimes(1);
    const [prefix, eventName, details] = console.info.mock.calls[0];
    expect(prefix).toContain('navigation');
    expect(eventName).toBe('lesson:complete');
    expect(details).toEqual({ lessonId: 'l1', count: 3 });
  });

  it('sanitizes object values to strings', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    logNavigationDiagnostic('test', { obj: { nested: true } });
    const [, , details] = console.info.mock.calls[0];
    expect(typeof details.obj).toBe('string');
  });

  it('passes primitives through without conversion', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    logNavigationDiagnostic('test', { str: 'hello', num: 42, bool: false });
    const [, , details] = console.info.mock.calls[0];
    expect(details.str).toBe('hello');
    expect(details.num).toBe(42);
    expect(details.bool).toBe(false);
  });

  it('passes null and undefined values through unchanged', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    logNavigationDiagnostic('test', { a: null, b: undefined });
    const [, , details] = console.info.mock.calls[0];
    expect(details.a).toBeNull();
    expect(details.b).toBeUndefined();
  });

  it('defaults to an empty details object when none is provided', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    logNavigationDiagnostic('bare-event');
    expect(console.info).toHaveBeenCalledTimes(1);
    const [, , details] = console.info.mock.calls[0];
    expect(details).toEqual({});
  });
});
