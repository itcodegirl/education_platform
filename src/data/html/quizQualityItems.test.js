import { describe, expect, it } from 'vitest';
import { HTML_QUIZZES } from './quizzes';
import {
  HTML_QUIZ_QUALITY_ITEMS,
  HTML_QUIZ_QUALITY_ITEM_IDS,
  HTML_QUIZ_QUALITY_TARGET_KEYS,
  applyHtmlQuizQualityItems,
  getHtmlQuizQualityKey,
} from './quizQualityItems';
import { getQuizQualityStatus } from '../../utils/contentQualityReport';

describe('HTML quiz quality items', () => {
  it('adds scenario debug coverage to every targeted HTML quiz entry', () => {
    expect(HTML_QUIZ_QUALITY_TARGET_KEYS).toHaveLength(31);
    expect(new Set(HTML_QUIZ_QUALITY_ITEM_IDS)).toHaveLength(31);

    HTML_QUIZ_QUALITY_TARGET_KEYS.forEach((targetKey) => {
      const quiz = HTML_QUIZZES.find((candidate) => getHtmlQuizQualityKey(candidate) === targetKey);
      const qualityItem = HTML_QUIZ_QUALITY_ITEMS[targetKey];

      expect(quiz, `${targetKey} should exist in the shipped HTML quizzes`).toBeTruthy();
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
    const [quiz] = applyHtmlQuizQualityItems(
      HTML_QUIZZES.filter((candidate) => getHtmlQuizQualityKey(candidate) === 'h2-1:h3a'),
    );

    expect(quiz.questions).toHaveLength(8);
    expect(quiz.questions.filter((question) => question.id === 'h3h')).toHaveLength(1);
  });
});
