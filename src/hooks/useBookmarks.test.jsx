/* @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBookmarks } from './useBookmarks';

const user = { id: 'learner-a' };
const createProgressWrite = vi.fn((operation, payload) => ({ id: 'env', operation, payload }));

describe('useBookmarks', () => {
  it('adds a new bookmark and writes the cloud envelope', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useBookmarks({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      await result.current.toggleBookmark('lesson-1', 'html', 'First lesson');
    });

    expect(result.current.bookmarks).toHaveLength(1);
    expect(result.current.bookmarks[0]).toMatchObject({
      lesson_key: 'lesson-1',
      course_id: 'html',
      lesson_title: 'First lesson',
    });
    expect(result.current.isBookmarked('lesson-1')).toBe(true);
    expect(dbWrite).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'addBookmark' }),
      'addBookmark',
      { resourceKey: 'bookmark:lesson-1' },
    );
  });

  it('removes the bookmark on second toggle and queues a removeBookmark write', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useBookmarks({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      await result.current.toggleBookmark('lesson-1', 'html', 'First lesson');
    });
    expect(result.current.bookmarks).toHaveLength(1);

    await act(async () => {
      await result.current.toggleBookmark('lesson-1', 'html', 'First lesson');
    });
    expect(result.current.bookmarks).toHaveLength(0);

    const removeCall = dbWrite.mock.calls.find(([, label]) => label === 'removeBookmark');
    expect(removeCall).toBeDefined();
    expect(removeCall[2]).toEqual({ resourceKey: 'bookmark:lesson-1' });
  });

  it('refuses writes when user is null', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useBookmarks({ user: null, dbWrite, createProgressWrite }));

    await act(async () => {
      await result.current.toggleBookmark('lesson-1', 'html', 'First lesson');
    });
    expect(result.current.bookmarks).toEqual([]);
    expect(dbWrite).not.toHaveBeenCalled();
  });

  it('skipRemote suppresses the cloud write but still updates state', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useBookmarks({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      await result.current.toggleBookmark('lesson-1', 'html', 'First', { skipRemote: true });
    });

    expect(result.current.bookmarks).toHaveLength(1);
    expect(dbWrite).not.toHaveBeenCalled();
  });

  it('replaceBookmarks seeds; resetBookmarks clears', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useBookmarks({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      result.current.replaceBookmarks([
        { lesson_key: 'a', course_id: 'html', lesson_title: 'A' },
        { lesson_key: 'b', course_id: 'css', lesson_title: 'B' },
      ]);
    });
    expect(result.current.bookmarks).toHaveLength(2);

    await act(async () => {
      result.current.resetBookmarks();
    });
    expect(result.current.bookmarks).toEqual([]);
  });
});
