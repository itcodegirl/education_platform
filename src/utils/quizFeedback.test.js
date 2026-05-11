import { describe, expect, it } from 'vitest';
import { getQuizResultFeedback } from './quizFeedback';

describe('quiz feedback guidance', () => {
  it('turns a perfect score into an application-oriented next step', () => {
    const feedback = getQuizResultFeedback({ pct: 100, wrongCount: 0, total: 4 });

    expect(feedback.label).toBe('Ready signal');
    expect(feedback.meaning).toMatch(/strong evidence/i);
    expect(feedback.actions).toContain('Try an applied challenge if one is available for this course.');
  });

  it('treats an 80% score as ready with a review loop', () => {
    const feedback = getQuizResultFeedback({ pct: 80, wrongCount: 1, total: 5 });

    expect(feedback.label).toBe('Mostly ready');
    expect(feedback.meaning).toMatch(/80% confidence line/i);
    expect(feedback.actions.join(' ')).toMatch(/spaced review/i);
  });

  it('slows learners down when the foundation is not stable', () => {
    const feedback = getQuizResultFeedback({ pct: 40, wrongCount: 3, total: 5 });

    expect(feedback.label).toBe('Foundation review');
    expect(feedback.actions[0]).toMatch(/rebuild the lesson example/i);
  });
});
