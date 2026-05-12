import { useCallback, useMemo } from 'react';
import { getMobileLearningTools } from '../constants/learningTools';

export function useLearningToolActions({ panels, hasCompletedProgress = true }) {
  const { togglePanel } = panels;

  const handleOpenTool = useCallback(
    (tool) => togglePanel(tool),
    [togglePanel],
  );

  const toolbarHandlers = useMemo(
    () => ({
      onSearch: () => togglePanel('search'),
      onCheatsheet: () => togglePanel('cheatsheet'),
      onGlossary: () => togglePanel('glossary'),
      onProjects: () => togglePanel('projects'),
      onBadges: () => togglePanel('badges'),
      onSR: () => togglePanel('sr'),
      onBookmarks: () => togglePanel('bookmarks'),
      onChallenges: () => togglePanel('challenges'),
      onStats: () => togglePanel('stats'),
    }),
    [togglePanel],
  );

  const mobileTools = useMemo(
    () => getMobileLearningTools(hasCompletedProgress, toolbarHandlers),
    [hasCompletedProgress, toolbarHandlers],
  );

  return { handleOpenTool, toolbarHandlers, mobileTools };
}
