import { describe, expect, it } from 'vitest';
import { CSS_QUIZZES } from './quizzes';
import {
  CSS_QUIZ_QUALITY_ITEMS,
  CSS_QUIZ_QUALITY_ITEM_IDS,
  CSS_QUIZ_QUALITY_TARGET_KEYS,
  applyCssQuizQualityItems,
  getCssQuizQualityKey,
} from './quizQualityItems';
import { getQuizQualityStatus } from '../../utils/contentQualityReport';

describe('CSS quiz quality items', () => {
  it('adds scenario debug coverage to every targeted CSS quiz entry', () => {
    expect(CSS_QUIZ_QUALITY_TARGET_KEYS).toHaveLength(30);
    expect(new Set(CSS_QUIZ_QUALITY_ITEM_IDS)).toHaveLength(30);

    CSS_QUIZ_QUALITY_TARGET_KEYS.forEach((targetKey) => {
      const quiz = CSS_QUIZZES.find((candidate) => getCssQuizQualityKey(candidate) === targetKey);
      const qualityItem = CSS_QUIZ_QUALITY_ITEMS[targetKey];

      expect(quiz, `${targetKey} should exist in the shipped CSS quizzes`).toBeTruthy();
      expect(quiz.questions).toHaveLength(8);
      expect(quiz.questions.some((question) => question.id === qualityItem.id)).toBe(true);
      expect(getQuizQualityStatus(quiz.questions)).toEqual({
        misconception: true,
        reasoning: true,
        application: true,
      });
    });
  });

  it('does not duplicate a supplemental item if the helper runs again', () => {
    const [quiz] = applyCssQuizQualityItems(
      CSS_QUIZZES.filter((candidate) => getCssQuizQualityKey(candidate) === 'c2-1:c2a1'),
    );

    expect(quiz.questions).toHaveLength(8);
    expect(quiz.questions.filter((question) => question.id === 'c2a8')).toHaveLength(1);
  });
});
