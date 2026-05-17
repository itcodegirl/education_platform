import { describe, expect, it } from 'vitest';
import { REACT_MODULES } from './course';
import {
  REACT_LESSON_QUALITY_FRAME_IDS,
  applyReactLessonQualityFrames,
} from './lessonQualityFrames';

function flattenLessons(modules) {
  return new Map(
    modules.flatMap((moduleData) =>
      (moduleData.lessons || []).map((lesson) => [lesson.id, lesson]),
    ),
  );
}

describe('React lesson quality frames', () => {
  it('adds learner-facing quality scaffolding to every targeted React lesson', () => {
    const lessons = flattenLessons(REACT_MODULES);

    expect(REACT_LESSON_QUALITY_FRAME_IDS).toHaveLength(35);
    REACT_LESSON_QUALITY_FRAME_IDS.forEach((lessonId) => {
      const lesson = lessons.get(lessonId);

      expect(lesson, `${lessonId} should exist in the shipped React course`).toBeTruthy();
      expect(lesson.learningFrame?.learn, `${lessonId} learning target`).toBeTruthy();
      expect(lesson.learningFrame?.check, `${lessonId} recall prompt`).toBeTruthy();
      expect(lesson.learningFrame?.next, `${lessonId} transfer bridge`).toBeTruthy();
      expect(lesson.commonMistakes?.[0], `${lessonId} common mistake`).toMatch(/common mistake/i);
    });
  });

  it('fills gaps without overwriting lesson-authored frame copy', () => {
    const [moduleData] = applyReactLessonQualityFrames([{
      id: 1,
      lessons: [{
        id: 'r1-1',
        title: 'What is React?',
        learningFrame: {
          check: 'Custom recall prompt from the lesson file.',
        },
        commonMistakes: ['Common mistake: Existing lesson-authored warning.'],
      }],
    }]);

    const [lesson] = moduleData.lessons;

    expect(lesson.learningFrame.learn).toMatch(/React/i);
    expect(lesson.learningFrame.check).toBe('Custom recall prompt from the lesson file.');
    expect(lesson.commonMistakes).toContain('Common mistake: Existing lesson-authored warning.');
    expect(lesson.commonMistakes.length).toBeGreaterThan(1);
  });
});
