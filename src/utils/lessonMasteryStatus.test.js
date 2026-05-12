import { describe, expect, it } from 'vitest';
import { getLessonMasteryStatus } from './lessonMasteryStatus';

describe('lesson mastery status', () => {
  it('keeps incomplete lessons in first-pass mode', () => {
    const status = getLessonMasteryStatus({
      hasLessonQuiz: true,
      isLessonDone: false,
    });

    expect(status.label).toBe('Reading in progress');
    expect(status.isReady).toBe(false);
  });

  it('prompts for evidence after reading is saved but no quiz is attempted', () => {
    const status = getLessonMasteryStatus({
      hasLessonQuiz: true,
      isLessonDone: true,
    });

    expect(status.label).toBe('Evidence needed');
    expect(status.tone).toBe('attention');
  });

  it('marks 80 percent and higher as ready to continue', () => {
    const status = getLessonMasteryStatus({
      hasLessonQuiz: true,
      isLessonDone: true,
      scoreValue: '4/5',
    });

    expect(status.label).toBe('Ready to continue');
    expect(status.isReady).toBe(true);
  });

  it('keeps lower scores in a review loop', () => {
    const status = getLessonMasteryStatus({
      hasLessonQuiz: true,
      isLessonDone: true,
      scoreValue: '2/5',
    });

    expect(status.label).toBe('Review needed');
    expect(status.detail).toMatch(/Review the missed explanations/i);
  });
});
