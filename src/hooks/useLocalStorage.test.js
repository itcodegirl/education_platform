/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage, LOCAL_STORAGE_SYNC_ERROR_EVENT } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns initialValue when key is not set', () => {
    const { result } = renderHook(() => useLocalStorage('k', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('reads existing string value from localStorage', () => {
    localStorage.setItem('k', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('k', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('reads existing object value from localStorage', () => {
    localStorage.setItem('obj', JSON.stringify({ a: 1 }));
    const { result } = renderHook(() => useLocalStorage('obj', {}));
    expect(result.current[0]).toEqual({ a: 1 });
  });

  it('setter updates the returned value', () => {
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    act(() => { result.current[1]('updated'); });
    expect(result.current[0]).toBe('updated');
  });

  it('setter persists value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    act(() => { result.current[1]('persisted'); });
    expect(JSON.parse(localStorage.getItem('k'))).toBe('persisted');
  });

  it('setter supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    act(() => { result.current[1]((n) => n + 1); });
    act(() => { result.current[1]((n) => n + 1); });
    expect(result.current[0]).toBe(2);
  });

  it('reads from fallbackKey when primary key is absent', () => {
    localStorage.setItem('legacy', JSON.stringify('fallback-val'));
    const { result } = renderHook(() =>
      useLocalStorage('new-key', 'default', { fallbackKey: 'legacy' }),
    );
    expect(result.current[0]).toBe('fallback-val');
  });

  it('migrates fallback to primary when migrateFallback is true', () => {
    localStorage.setItem('legacy', JSON.stringify('migrated'));
    renderHook(() =>
      useLocalStorage('new-key', 'default', { fallbackKey: 'legacy', migrateFallback: true }),
    );
    expect(JSON.parse(localStorage.getItem('new-key'))).toBe('migrated');
  });

  it('removes fallback after migration when removeFallbackAfterMigration is true', () => {
    localStorage.setItem('legacy', JSON.stringify('to-remove'));
    renderHook(() =>
      useLocalStorage('new-key', 'default', {
        fallbackKey: 'legacy',
        migrateFallback: true,
        removeFallbackAfterMigration: true,
      }),
    );
    expect(localStorage.getItem('legacy')).toBeNull();
  });

  it('storage event from another tab updates value', () => {
    const { result } = renderHook(() => useLocalStorage('tab-key', 'init'));
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'tab-key',
        newValue: JSON.stringify('cross-tab'),
        storageArea: window.localStorage,
      }));
    });
    expect(result.current[0]).toBe('cross-tab');
  });

  it('storage event with null newValue resets to initialValue', () => {
    localStorage.setItem('tab-key', JSON.stringify('old'));
    const { result } = renderHook(() => useLocalStorage('tab-key', 'initial'));
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'tab-key',
        newValue: null,
        storageArea: window.localStorage,
      }));
    });
    expect(result.current[0]).toBe('initial');
  });

  it('ignores storage events for different keys', () => {
    const { result } = renderHook(() => useLocalStorage('my-key', 'init'));
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'other-key',
        newValue: JSON.stringify('ignored'),
        storageArea: window.localStorage,
      }));
    });
    expect(result.current[0]).toBe('init');
  });

  it('exports LOCAL_STORAGE_SYNC_ERROR_EVENT constant', () => {
    expect(typeof LOCAL_STORAGE_SYNC_ERROR_EVENT).toBe('string');
    expect(LOCAL_STORAGE_SYNC_ERROR_EVENT.length).toBeGreaterThan(0);
  });
});
