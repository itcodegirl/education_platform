import { describe, expect, it } from 'vitest';
import { REACT_QUIZZES } from './quizzes';
import {
  REACT_QUIZ_QUALITY_ITEMS,
  REACT_QUIZ_QUALITY_ITEM_IDS,
  REACT_QUIZ_QUALITY_TARGET_KEYS,
  applyReactQuizQualityItems,
  getReactQuizQualityKey,
} from './quizQualityItems';
import { getQuizQualityStatus } from '../../utils/contentQualityReport';

describe('React quiz quality items', () => {
  it('adds scenario debug coverage to every targeted React quiz entry', () => {
    expect(REACT_QUIZ_QUALITY_TARGET_KEYS).toHaveLength(34);
    expect(new Set(REACT_QUIZ_QUALITY_ITEM_IDS)).toHaveLength(34);

    REACT_QUIZ_QUALITY_TARGET_KEYS.forEach((targetKey) => {
      const quiz = REACT_QUIZZES.find((candidate) => getReactQuizQualityKey(candidate) === targetKey);
      const qualityItem = REACT_QUIZ_QUALITY_ITEMS[targetKey];

      expect(quiz, `${targetKey} should exist in the shipped React quizzes`).toBeTruthy();
      expect(quiz.questions.some((question) => question.id === qualityItem.id)).toBe(true);
      expect(getQuizQualityStatus(quiz.questions)).toEqual({
        misconception: true,
        reasoning: true,
        application: true,
      });
    });
  });

  it('does not duplicate a supplemental item if the helper runs again', () => {
    const [quiz] = applyReactQuizQualityItems(
      REACT_QUIZZES.filter((candidate) => getReactQuizQualityKey(candidate) === 'r2-4:r2d1'),
    );

    expect(quiz.questions.filter((question) => question.id === 'r2d8')).toHaveLength(1);
  });
});
