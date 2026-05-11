import { describe, expect, it } from 'vitest';
import { MASTERY_READY_PERCENT, summarizeMasteryEvidence } from './masteryProgress';

describe('mastery progress helpers', () => {
  it('separates lesson completion from quiz and challenge evidence', () => {
    const summary = summarizeMasteryEvidence({
      completedLessonCount: 4,
      quizResults: [
        { percent: 100 },
        { percent: 80 },
        { percent: 70 },
      ],
      challenges: [{ id: 'challenge-1' }, { id: 'challenge-2' }],
      challengeCompletions: ['challenge-2', 'unknown-challenge'],
      srCards: [
        { nextReview: 100 },
        { nextReview: 300 },
      ],
      now: 200,
    });

    expect(summary.threshold).toBe(MASTERY_READY_PERCENT);
    expect(summary.quizChecksAttempted).toBe(3);
    expect(summary.quizChecksPassed).toBe(2);
    expect(summary.quizChecksNeedsReview).toBe(1);
    expect(summary.completedChallenges).toBe(1);
    expect(summary.totalChallenges).toBe(2);
    expect(summary.dueReviewCards).toBe(1);
    expect(summary.evidenceSignals).toBe(3);
    expect(summary.evidenceCoverage).toBe(75);
  });

  it('accepts stored score strings when a caller does not pre-parse results', () => {
    const summary = summarizeMasteryEvidence({
      completedLessonCount: 2,
      quizResults: [
        { scoreValue: '4/5' },
        { scoreValue: '1/4' },
        { scoreValue: 'not-a-score' },
      ],
    });

    expect(summary.quizChecksAttempted).toBe(2);
    expect(summary.quizChecksPassed).toBe(1);
    expect(summary.quizChecksNeedsReview).toBe(1);
    expect(summary.evidenceCoverage).toBe(50);
  });

  it('keeps zero-progress evidence honest', () => {
    const summary = summarizeMasteryEvidence({
      completedLessonCount: 0,
      quizResults: [{ percent: 100 }],
      challengeCompletions: ['challenge-1'],
    });

    expect(summary.evidenceCoverage).toBe(0);
    expect(summary.status).toMatch(/start with one lesson/i);
  });
});
