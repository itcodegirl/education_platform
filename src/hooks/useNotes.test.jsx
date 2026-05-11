/* @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useNotes } from './useNotes';

const user = { id: 'learner-a' };
const createProgressWrite = vi.fn((operation, payload) => ({ id: 'env', operation, payload }));

describe('useNotes', () => {
  it('saves a note and writes a per-lesson serialized envelope', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useNotes({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      await result.current.saveNote('lesson-1', 'first version');
    });
    expect(result.current.getNote('lesson-1')).toBe('first version');
    expect(dbWrite).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'saveNote' }),
      'saveNote',
      { resourceKey: 'note:lesson-1' },
    );

    await act(async () => {
      await result.current.saveNote('lesson-1', 'second version');
    });
    expect(result.current.getNote('lesson-1')).toBe('second version');
    expect(dbWrite).toHaveBeenCalledTimes(2);
  });

  it('refuses writes when user is null', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useNotes({ user: null, dbWrite, createProgressWrite }));

    await act(async () => {
      await result.current.saveNote('lesson-1', 'hi');
    });
    expect(dbWrite).not.toHaveBeenCalled();
  });

  it('replaceNotes seeds the map; resetNotes clears', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useNotes({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      result.current.replaceNotes({ a: 'one', b: 'two' });
    });
    expect(result.current.getNote('a')).toBe('one');
    expect(result.current.getNote('b')).toBe('two');

    await act(async () => {
      result.current.resetNotes();
    });
    expect(result.current.getNote('a')).toBe('');
  });

  it('returns empty string for an unknown lesson key', () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useNotes({ user, dbWrite, createProgressWrite }));

    expect(result.current.getNote('nope')).toBe('');
  });
});
