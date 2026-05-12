import { describe, expect, it } from 'vitest';
import { getLessonCompletionActionCopy } from './lessonCompletionCopy';

describe('lessonCompletionCopy', () => {
  it('describes incomplete lessons as saved reading progress', () => {
    const copy = getLessonCompletionActionCopy();
    expect(copy.label).toBe('Complete lesson');
    expect(copy.ariaLabel).toBe('Complete lesson and save reading progress');
    expect(copy.title).toMatch(/saves your place/i);
    expect(copy.title).not.toMatch(/master/i);
  });

  it('keeps completed lesson copy scoped to the lesson reading state', () => {
    const copy = getLessonCompletionActionCopy({ isDone: true });
    expect(copy.label).toBe('Lesson saved');
    expect(copy.ariaLabel).toBe('Mark lesson reading progress as incomplete');
    expect(copy.title).toMatch(/press again to undo/i);
  });

  it('supports the topbar label without changing the trust semantics', () => {
    const copy = getLessonCompletionActionCopy({ isDone: true, surface: 'topbar' });
    expect(copy.label).toBe('Lesson complete');
    expect(copy.ariaLabel).toBe('Mark lesson reading progress as incomplete');
  });
});
