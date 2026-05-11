const SURFACE_LABELS = Object.freeze({
  nav: Object.freeze({
    saving: 'Saving',
    complete: 'Lesson saved',
    incomplete: 'Complete lesson',
  }),
  topbar: Object.freeze({
    saving: 'Saving...',
    complete: 'Lesson complete',
    incomplete: 'Complete lesson',
  }),
});

export function getLessonCompletionActionCopy({
  isDone = false,
  marking = false,
  surface = 'nav',
} = {}) {
  const labels = SURFACE_LABELS[surface] || SURFACE_LABELS.nav;

  if (marking) {
    return {
      label: labels.saving,
      ariaLabel: 'Saving lesson reading progress',
    };
  }

  if (isDone) {
    return {
      label: labels.complete,
      ariaLabel: 'Mark lesson reading progress as incomplete',
    };
  }

  return {
    label: labels.incomplete,
    ariaLabel: 'Complete lesson and save reading progress',
  };
}
