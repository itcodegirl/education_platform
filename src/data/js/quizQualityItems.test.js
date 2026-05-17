import { describe, expect, it } from 'vitest';
import { JS_QUIZZES } from './quizzes';
import {
  JS_QUIZ_QUALITY_ITEM_IDS,
  applyJsQuizQualityItems,
} from './quizQualityItems';
import { getQuizQualityStatus } from '../../utils/contentQualityReport';

describe('JavaScript quiz quality items', () => {
  it('adds scenario debug coverage to every targeted JavaScript quiz', () => {
    expect(JS_QUIZ_QUALITY_ITEM_IDS).toHaveLength(37);

    JS_QUIZ_QUALITY_ITEM_IDS.forEach((lessonId) => {
      const quiz = JS_QUIZZES.find((candidate) => candidate.lessonId === lessonId);

      expect(quiz, `${lessonId} should exist in the shipped JavaScript quizzes`).toBeTruthy();
      expect(quiz.questions).toHaveLength(8);
      expect(getQuizQualityStatus(quiz.questions)).toEqual({
        misconception: true,
        reasoning: true,
        application: true,
      });
    });
  });

  it('does not duplicate a supplemental item if the helper runs again', () => {
    const [quiz] = applyJsQuizQualityItems(JS_QUIZZES.filter(({ lessonId }) => lessonId === 'j1-3'));

    expect(quiz.questions).toHaveLength(8);
    expect(quiz.questions.filter((question) => question.id === 'j1c8')).toHaveLength(1);
  });
});
