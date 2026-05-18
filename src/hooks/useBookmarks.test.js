/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBookmarks } from './useBookmarks';

function makeHandlers() {
  return {
    user: { id: 'user-1' },
    dbWrite: vi.fn(),
    createProgressWrite: vi.fn((type, payload) => ({ type, payload })),
  };
}

describe('useBookmarks initial state', () => {
  it('starts with empty bookmarks array', () => {
    const { result } = renderHook(() => useBookmarks(makeHandlers()));
    expect(result.current.bookmarks).toEqual([]);
  });

  it('isBookmarked returns false for unknown key', () => {
    const { result } = renderHook(() => useBookmarks(makeHandlers()));
    expect(result.current.isBookmarked('l:html:lesson-01')).toBe(false);
  });
});

describe('replaceBookmarks', () => {
  it('replaces bookmarks with provided list', () => {
    const { result } = renderHook(() => useBookmarks(makeHandlers()));
    const list = [{ lesson_key: 'l:html:lesson-01', course_id: 'html', lesson_title: 'Intro' }];
    act(() => { result.current.replaceBookmarks(list); });
    expect(result.current.bookmarks).toEqual(list);
  });

  it('resets to empty array for non-array input', () => {
    const { result } = renderHook(() => useBookmarks(makeHandlers()));
    act(() => { result.current.replaceBookmarks(null); });
    expect(result.current.bookmarks).toEqual([]);
  });
});

describe('resetBookmarks', () => {
  it('clears bookmarks', () => {
    const { result } = renderHook(() => useBookmarks(makeHandlers()));
    act(() => {
      result.current.replaceBookmarks([{ lesson_key: 'x', course_id: 'html', lesson_title: 'X' }]);
    });
    act(() => { result.current.resetBookmarks(); });
    expect(result.current.bookmarks).toEqual([]);
  });
});

describe('toggleBookmark', () => {
  it('does nothing when user is null', async () => {
    const handlers = { user: null, dbWrite: vi.fn(), createProgressWrite: vi.fn() };
    const { result } = renderHook(() => useBookmarks(handlers));
    await act(() => result.current.toggleBookmark('l:html:lesson-01', 'html', 'Intro'));
    expect(result.current.bookmarks).toEqual([]);
    expect(handlers.dbWrite).not.toHaveBeenCalled();
  });

  it('adds a bookmark for a new lesson key', async () => {
    const { result } = renderHook(() => useBookmarks(makeHandlers()));
    await act(() => result.current.toggleBookmark('l:html:lesson-01', 'html', 'Intro'));
    expect(result.current.bookmarks).toHaveLength(1);
    expect(result.current.bookmarks[0].course_id).toBe('html');
  });

  it('isBookmarked returns true after adding', async () => {
    const { result } = renderHook(() => useBookmarks(makeHandlers()));
    await act(() => result.current.toggleBookmark('l:html:lesson-01', 'html', 'Intro'));
    expect(result.current.isBookmarked('l:html:lesson-01')).toBe(true);
  });

  it('removes bookmark on second toggle', async () => {
    const { result } = renderHook(() => useBookmarks(makeHandlers()));
    await act(() => result.current.toggleBookmark('l:html:lesson-01', 'html', 'Intro'));
    await act(() => result.current.toggleBookmark('l:html:lesson-01', 'html', 'Intro'));
    expect(result.current.bookmarks).toHaveLength(0);
  });

  it('calls dbWrite when skipRemote is false', async () => {
    const handlers = makeHandlers();
    const { result } = renderHook(() => useBookmarks(handlers));
    await act(() => result.current.toggleBookmark('l:html:lesson-01', 'html', 'Intro'));
    expect(handlers.dbWrite).toHaveBeenCalled();
  });

  it('skips dbWrite when skipRemote is true', async () => {
    const handlers = makeHandlers();
    const { result } = renderHook(() => useBookmarks(handlers));
    await act(() =>
      result.current.toggleBookmark('l:html:lesson-01', 'html', 'Intro', { skipRemote: true }),
    );
    expect(handlers.dbWrite).not.toHaveBeenCalled();
  });
});
