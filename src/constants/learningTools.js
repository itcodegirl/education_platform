export const LEARNING_TOOL_COPY = Object.freeze({
  search: {
    label: 'Search',
    helper: 'Find a lesson',
  },
  bookmarks: {
    label: 'Saved lessons',
    shortLabel: 'Saved',
    helper: 'Saved lessons',
    sidebarHint: 'Return to lessons you chose to keep close.',
    bottomTitle: 'Saved lessons',
    bottomAriaLabel: 'Open saved lessons',
  },
  stats: {
    label: 'Progress',
    helper: 'Course status',
    sidebarHint: 'Track your current learning momentum.',
    bottomTitle: 'Your progress',
    bottomAriaLabel: 'Open your progress',
  },
  sr: {
    label: 'Review queue',
    shortLabel: 'Review',
    helper: 'Spaced practice',
    sidebarHint: 'Practice cards that are due today.',
  },
  glossary: {
    label: 'Glossary',
    helper: 'Term lookup',
    sidebarHint: 'Look up a term when lesson language gets dense.',
  },
  cheatsheet: {
    label: 'Cheat sheets',
    helper: 'Quick references',
    sidebarHint: 'Quick syntax reminders for the current track.',
  },
  projects: {
    label: 'Build projects',
    shortLabel: 'Projects',
    helper: 'Build ideas',
    sidebarHint: 'Use after a few lessons to make portfolio work.',
  },
  challenges: {
    label: 'Challenges',
    helper: 'Hands-on builds',
    sidebarHint: 'Hands-on practice when you want a stretch.',
  },
  badges: {
    label: 'Badges',
    helper: 'In-app milestones',
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

export function getLearningToolCopy(key) {
  return LEARNING_TOOL_COPY[key] || { label: key, helper: '' };
}

export function isLearningToolAvailable(key, hasCompletedProgress = true) {
  return hasCompletedProgress || FIRST_SESSION_TOOL_KEYS.includes(key);
}

