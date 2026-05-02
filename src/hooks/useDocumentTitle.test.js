/* @vitest-environment jsdom */

import { describe, it, expect, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from './useDocumentTitle';

const ORIGINAL_TITLE = document.title;

afterEach(() => {
  document.title = ORIGINAL_TITLE;
});

describe('useDocumentTitle', () => {
  it('sets the document title with the default suffix', () => {
    renderHook(() => useDocumentTitle('Lesson 1'));
    expect(document.title).toBe('Lesson 1 - CodeHerWay');
  });

  it('updates the title when the input changes', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'A' },
    });
    expect(document.title).toBe('A - CodeHerWay');
    rerender({ title: 'B' });
    expect(document.title).toBe('B - CodeHerWay');
  });

  it('restores to the configured fallback on unmount', () => {
    const { unmount } = renderHook(() =>
      useDocumentTitle('Profile', { restore: 'CodeHerWay - Learn. Build. Ship.' }),
    );
    expect(document.title).toBe('Profile - CodeHerWay');
    unmount();
    expect(document.title).toBe('CodeHerWay - Learn. Build. Ship.');
  });

  it('skips updating when no title is provided', () => {
    document.title = 'unchanged';
    renderHook(() => useDocumentTitle(''));
    expect(document.title).toBe('unchanged');
  });

  it('omits the suffix when one is explicitly cleared', () => {
    renderHook(() => useDocumentTitle('Standalone', { suffix: '' }));
    expect(document.title).toBe('Standalone');
  });
});
