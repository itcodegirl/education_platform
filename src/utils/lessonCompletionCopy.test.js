import { describe, expect, it } from 'vitest';
import { getLessonCompletionActionCopy } from './lessonCompletionCopy';

describe('lessonCompletionCopy', () => {
  it('describes incomplete lessons as saved reading progress', () => {
    expect(getLessonCompletionActionCopy()).toEqual({
      label: 'Complete lesson',
      ariaLabel: 'Complete lesson and save reading progress',
    });
  });

  it('keeps completed lesson copy scoped to the lesson reading state', () => {
    expect(getLessonCompletionActionCopy({ isDone: true })).toEqual({
      label: 'Lesson saved',
      ariaLabel: 'Mark lesson reading progress as incomplete',
    });
  });

  it('supports the topbar label without changing the trust semantics', () => {
    expect(getLessonCompletionActionCopy({ isDone: true, surface: 'topbar' })).toEqual({
      label: 'Lesson complete',
      ariaLabel: 'Mark lesson reading progress as incomplete',
    });
  });
});
