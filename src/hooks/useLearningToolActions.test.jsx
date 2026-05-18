/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLearningToolActions } from './useLearningToolActions';

function makePanels() {
  const togglePanel = vi.fn();
  return { panels: { togglePanel }, togglePanel };
}

describe('useLearningToolActions', () => {
  it('returns handleOpenTool, toolbarHandlers, and mobileTools', () => {
    const { panels } = makePanels();
    const { result } = renderHook(() => useLearningToolActions({ panels }));
    expect(typeof result.current.handleOpenTool).toBe('function');
    expect(typeof result.current.toolbarHandlers).toBe('object');
    expect(Array.isArray(result.current.mobileTools)).toBe(true);
  });

  it('handleOpenTool calls togglePanel with the given tool name', () => {
    const { panels, togglePanel } = makePanels();
    const { result } = renderHook(() => useLearningToolActions({ panels }));
    result.current.handleOpenTool('glossary');
    expect(togglePanel).toHaveBeenCalledWith('glossary');
  });

  it('toolbarHandlers.onSearch calls togglePanel with "search"', () => {
    const { panels, togglePanel } = makePanels();
    const { result } = renderHook(() => useLearningToolActions({ panels }));
    result.current.toolbarHandlers.onSearch();
    expect(togglePanel).toHaveBeenCalledWith('search');
  });

  it('toolbarHandlers.onGlossary calls togglePanel with "glossary"', () => {
    const { panels, togglePanel } = makePanels();
    const { result } = renderHook(() => useLearningToolActions({ panels }));
    result.current.toolbarHandlers.onGlossary();
    expect(togglePanel).toHaveBeenCalledWith('glossary');
  });

  it('toolbarHandlers.onBookmarks calls togglePanel with "bookmarks"', () => {
    const { panels, togglePanel } = makePanels();
    const { result } = renderHook(() => useLearningToolActions({ panels }));
    result.current.toolbarHandlers.onBookmarks();
    expect(togglePanel).toHaveBeenCalledWith('bookmarks');
  });

  it('toolbarHandlers.onCheatsheet calls togglePanel with "cheatsheet"', () => {
    const { panels, togglePanel } = makePanels();
    const { result } = renderHook(() => useLearningToolActions({ panels }));
    result.current.toolbarHandlers.onCheatsheet();
    expect(togglePanel).toHaveBeenCalledWith('cheatsheet');
  });

  it('toolbarHandlers has all expected panel keys', () => {
    const { panels } = makePanels();
    const { result } = renderHook(() => useLearningToolActions({ panels }));
    const keys = Object.keys(result.current.toolbarHandlers);
    expect(keys).toContain('onSearch');
    expect(keys).toContain('onCheatsheet');
    expect(keys).toContain('onGlossary');
    expect(keys).toContain('onBookmarks');
    expect(keys).toContain('onSR');
    expect(keys).toContain('onBadges');
    expect(keys).toContain('onChallenges');
  });
});
