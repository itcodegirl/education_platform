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
      title: 'Saving your place in this lesson…',
    };
  }

  if (isDone) {
    return {
      label: labels.complete,
      ariaLabel: 'Mark lesson reading progress as incomplete',
      title: 'This lesson is marked done and your place is saved. Press again to undo.',
    };
  }

  return {
    label: labels.incomplete,
    ariaLabel: 'Complete lesson and save reading progress',
    title: 'Marks this lesson done and saves your place. It tracks reading progress — quizzes and challenges stay separate.',
  };
}
