import { useCallback, useMemo } from 'react';
import { getMobileLearningTools } from '../constants/learningTools';

export function useLearningToolActions({ panels, hasCompletedProgress = true }) {
  const handleOpenTool = useCallback(
    (tool) => panels.togglePanel(tool),
    [panels],
  );

  const toolbarHandlers = useMemo(
    () => ({
      onSearch: () => panels.togglePanel('search'),
      onCheatsheet: () => panels.togglePanel('cheatsheet'),
      onGlossary: () => panels.togglePanel('glossary'),
      onProjects: () => panels.togglePanel('projects'),
      onBadges: () => panels.togglePanel('badges'),
      onSR: () => panels.togglePanel('sr'),
      onBookmarks: () => panels.togglePanel('bookmarks'),
      onChallenges: () => panels.togglePanel('challenges'),
      onStats: () => panels.togglePanel('stats'),
    }),
    [panels],
  );

  const mobileTools = useMemo(
    () => getMobileLearningTools(hasCompletedProgress, toolbarHandlers),
    [hasCompletedProgress, toolbarHandlers],
  );

  return { handleOpenTool, toolbarHandlers, mobileTools };
}
