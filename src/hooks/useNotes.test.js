/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotes } from './useNotes';

function makeHandlers() {
  return {
    user: { id: 'user-1' },
    dbWrite: vi.fn(),
    createProgressWrite: vi.fn((type, payload) => ({ type, payload })),
  };
}

describe('useNotes initial state', () => {
  it('starts with empty notes object', () => {
    const { result } = renderHook(() => useNotes(makeHandlers()));
    expect(result.current.notes).toEqual({});
  });

  it('getNote returns empty string for unknown key', () => {
    const { result } = renderHook(() => useNotes(makeHandlers()));
    expect(result.current.getNote('l:html:lesson-01')).toBe('');
  });
});

describe('replaceNotes', () => {
  it('replaces notes with provided object', () => {
    const { result } = renderHook(() => useNotes(makeHandlers()));
    act(() => { result.current.replaceNotes({ 'l:html:lesson-01': 'My note' }); });
    expect(result.current.notes['l:html:lesson-01']).toBe('My note');
  });

  it('resets to empty object for non-object input', () => {
    const { result } = renderHook(() => useNotes(makeHandlers()));
    act(() => { result.current.replaceNotes(null); });
    expect(result.current.notes).toEqual({});
  });
});

describe('resetNotes', () => {
  it('clears all notes', () => {
    const { result } = renderHook(() => useNotes(makeHandlers()));
    act(() => { result.current.replaceNotes({ key: 'content' }); });
    act(() => { result.current.resetNotes(); });
    expect(result.current.notes).toEqual({});
  });
});

describe('saveNote', () => {
  it('does nothing when user is null', async () => {
    const handlers = { user: null, dbWrite: vi.fn(), createProgressWrite: vi.fn() };
    const { result } = renderHook(() => useNotes(handlers));
    await act(() => result.current.saveNote('l:html:lesson-01', 'content'));
    expect(result.current.notes).toEqual({});
    expect(handlers.dbWrite).not.toHaveBeenCalled();
  });

  it('saves note to state', async () => {
    const { result } = renderHook(() => useNotes(makeHandlers()));
    await act(() => result.current.saveNote('l:html:lesson-01', 'My study note'));
    expect(result.current.getNote('l:html:lesson-01')).toBe('My study note');
  });

  it('calls dbWrite when user is present', async () => {
    const handlers = makeHandlers();
    const { result } = renderHook(() => useNotes(handlers));
    await act(() => result.current.saveNote('l:html:lesson-01', 'content'));
    expect(handlers.dbWrite).toHaveBeenCalled();
  });

  it('overwrites previous note for the same key', async () => {
    const { result } = renderHook(() => useNotes(makeHandlers()));
    await act(() => result.current.saveNote('l:html:lesson-01', 'first'));
    await act(() => result.current.saveNote('l:html:lesson-01', 'second'));
    expect(result.current.getNote('l:html:lesson-01')).toBe('second');
  });
});
