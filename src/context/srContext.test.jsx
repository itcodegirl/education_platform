/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { SRContext, useSR } from './srContext';

describe('useSR default context values', () => {
  it('returns empty srCards array', () => {
    const { result } = renderHook(() => useSR());
    expect(Array.isArray(result.current.srCards)).toBe(true);
    expect(result.current.srCards).toHaveLength(0);
  });

  it('returns empty bookmarks array', () => {
    const { result } = renderHook(() => useSR());
    expect(Array.isArray(result.current.bookmarks)).toBe(true);
    expect(result.current.bookmarks).toHaveLength(0);
  });

  it('returns empty notes object', () => {
    const { result } = renderHook(() => useSR());
    expect(typeof result.current.notes).toBe('object');
    expect(Object.keys(result.current.notes)).toHaveLength(0);
  });

  it('exposes noop functions for all SR operations', () => {
    const { result } = renderHook(() => useSR());
    expect(typeof result.current.addToSRQueue).toBe('function');
    expect(typeof result.current.updateSRCard).toBe('function');
    expect(typeof result.current.getDueSRCards).toBe('function');
    expect(typeof result.current.toggleBookmark).toBe('function');
    expect(typeof result.current.isBookmarked).toBe('function');
    expect(typeof result.current.saveNote).toBe('function');
    expect(typeof result.current.getNote).toBe('function');
  });

  it('getDueSRCards default returns empty array', () => {
    const { result } = renderHook(() => useSR());
    expect(result.current.getDueSRCards()).toEqual([]);
  });

  it('isBookmarked default returns false', () => {
    const { result } = renderHook(() => useSR());
    expect(result.current.isBookmarked('any-key')).toBe(false);
  });

  it('getNote default returns empty string', () => {
    const { result } = renderHook(() => useSR());
    expect(result.current.getNote('any-key')).toBe('');
  });
});

describe('SRContext shape', () => {
  it('exports a React context object', () => {
    expect(SRContext).toBeTruthy();
    expect(typeof SRContext.Provider).toBe('object');
  });
});
