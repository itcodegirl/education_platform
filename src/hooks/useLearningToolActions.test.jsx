import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLearningToolActions } from './useLearningToolActions';

describe('useLearningToolActions', () => {
  it('routes desktop and mobile tool actions through panel state', () => {
    const panels = { togglePanel: vi.fn() };

    const { result } = renderHook(() =>
      useLearningToolActions({ panels, hasCompletedProgress: true }),
    );

    result.current.toolbarHandlers.onSearch();
    result.current.handleOpenTool('badges');
    result.current.mobileTools.find((tool) => tool.key === 'challenges')?.onSelect();

    expect(panels.togglePanel).toHaveBeenCalledWith('search');
    expect(panels.togglePanel).toHaveBeenCalledWith('badges');
    expect(panels.togglePanel).toHaveBeenCalledWith('challenges');
  });

  it('keeps first-session mobile tools focused before lesson progress exists', () => {
    const panels = { togglePanel: vi.fn() };

    const { result } = renderHook(() =>
      useLearningToolActions({ panels, hasCompletedProgress: false }),
    );

    expect(result.current.mobileTools.map((tool) => tool.key)).toEqual([
      'search',
      'bookmarks',
      'stats',
      'cheatsheet',
      'glossary',
    ]);
  });
});
