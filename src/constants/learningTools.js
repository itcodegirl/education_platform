export const LEARNING_TOOL_COPY = Object.freeze({
  search: {
    label: 'Search',
    helper: 'Find wording',
  },
  bookmarks: {
    label: 'Saved lessons',
    shortLabel: 'Saved',
    helper: 'Return later',
    sidebarHint: 'Return to lessons you chose to keep close.',
    bottomTitle: 'Saved lessons',
    bottomAriaLabel: 'Open saved lessons',
  },
  stats: {
    label: 'Progress',
    helper: 'Next step',
    sidebarHint: 'Track your current learning momentum.',
    bottomTitle: 'Your progress',
    bottomAriaLabel: 'Open your progress',
  },
  sr: {
    label: 'Review queue',
    shortLabel: 'Review',
    helper: 'Due practice',
    sidebarHint: 'Practice cards that are due today.',
  },
  glossary: {
    label: 'Glossary',
    helper: 'Plain meanings',
    sidebarHint: 'Look up a term when lesson language gets dense.',
  },
  cheatsheet: {
    label: 'Cheat sheets',
    helper: 'Syntax reminders',
    sidebarHint: 'Quick syntax reminders for the current track.',
  },
  projects: {
    label: 'Build projects',
    shortLabel: 'Projects',
    helper: 'Portfolio practice',
    sidebarHint: 'Use after a few lessons to make portfolio work.',
  },
  challenges: {
    label: 'Challenges',
    helper: 'Stretch practice',
    sidebarHint: 'Hands-on practice when you want a stretch.',
  },
  badges: {
    label: 'Badges',
    helper: 'Progress markers',
    sidebarHint: 'Milestones earned inside CodeHerWay.',
  },
});

export const MOBILE_TOOL_KEYS = Object.freeze([
  'search',
  'bookmarks',
  'stats',
  'sr',
  'challenges',
  'cheatsheet',
  'glossary',
  'projects',
  'badges',
]);

export const FIRST_SESSION_TOOL_KEYS = Object.freeze([
  'search',
  'bookmarks',
  'stats',
  'cheatsheet',
  'glossary',
]);

export const SIDEBAR_RESOURCE_TOOL_KEYS = Object.freeze([
  'bookmarks',
  'sr',
  'glossary',
  'cheatsheet',
  'projects',
  'challenges',
  'badges',
]);

export const BOTTOM_PRIMARY_TOOL_KEYS = Object.freeze(['bookmarks', 'stats']);
export const BOTTOM_SECONDARY_TOOL_KEYS = Object.freeze([
  'sr',
  'badges',
  'challenges',
  'cheatsheet',
  'glossary',
  'projects',
]);

export const LEARNING_TOOL_ICONS = Object.freeze({
  search: 'S',
  bookmarks: '*',
  stats: '%',
  sr: 'R',
  glossary: 'Aa',
  cheatsheet: '{}',
  projects: '<>',
  challenges: 'OK',
  badges: '#',
});

const LEARNING_TOOL_HANDLER_KEYS = Object.freeze({
  search: 'onSearch',
  bookmarks: 'onBookmarks',
  stats: 'onStats',
  sr: 'onSR',
  glossary: 'onGlossary',
  cheatsheet: 'onCheatsheet',
  projects: 'onProjects',
  challenges: 'onChallenges',
  badges: 'onBadges',
});

export function getLearningToolCopy(key) {
  return LEARNING_TOOL_COPY[key] || { label: key, helper: '' };
}

export function isLearningToolAvailable(key, hasCompletedProgress = true) {
  return hasCompletedProgress || FIRST_SESSION_TOOL_KEYS.includes(key);
}

export function getLearningToolHandlerName(key) {
  return LEARNING_TOOL_HANDLER_KEYS[key] || '';
}

export function getSidebarResourceTools(hasCompletedProgress = true) {
  return SIDEBAR_RESOURCE_TOOL_KEYS
    .filter((key) => isLearningToolAvailable(key, hasCompletedProgress))
    .map((key) => {
      const copy = getLearningToolCopy(key);
      return {
        key,
        icon: LEARNING_TOOL_ICONS[key] || '',
        label: copy.label,
        hint: copy.sidebarHint || copy.helper,
      };
    });
}

export function getMobileLearningTools(hasCompletedProgress = true, handlers = {}) {
  return MOBILE_TOOL_KEYS
    .filter((key) => isLearningToolAvailable(key, hasCompletedProgress))
    .map((key) => {
      const copy = getLearningToolCopy(key);
      const handlerName = getLearningToolHandlerName(key);
      return {
        key,
        icon: LEARNING_TOOL_ICONS[key] || '',
        label: copy.shortLabel || copy.label,
        helper: copy.helper,
        onSelect: handlers[handlerName],
      };
    });
}
