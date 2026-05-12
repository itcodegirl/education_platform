import { describe, expect, it } from 'vitest';
import { buildLearnerTranscriptSummary } from './learnerTranscript';

describe('buildLearnerTranscriptSummary', () => {
  it('keeps a zero-progress transcript honest', () => {
    const transcript = buildLearnerTranscriptSummary({
      completedLessons: 0,
      totalLessons: 10,
      quizChecksPassed: 2,
      completedChallenges: 1,
    });

    expect(transcript.status).toMatchObject({
      tone: 'empty',
      label: 'Transcript not started',
    });
    expect(transcript.proofPercent).toBe(0);
    expect(transcript.items[0]).toMatchObject({
      key: 'reading',
      value: '0/10',
      tone: 'empty',
    });
  });

  it('prioritizes review debt over strong-looking totals', () => {
    const transcript = buildLearnerTranscriptSummary({
      completedLessons: 3,
      totalLessons: 6,
      quizChecksPassed: 3,
      quizChecksAttempted: 4,
      quizChecksNeedsReview: 1,
      completedChallenges: 1,
      totalChallenges: 2,
      dueReviewCards: 2,
      totalReviewCards: 5,
    });

    expect(transcript.status).toMatchObject({
      tone: 'review',
      label: 'Review before adding more',
    });
    expect(transcript.items.find((item) => item.key === 'review')).toMatchObject({
      value: '2/5',
      tone: 'review',
    });
  });

  it('marks strong proof only when recall and application back completed lessons', () => {
    const transcript = buildLearnerTranscriptSummary({
      completedLessons: 2,
      totalLessons: 8,
      quizChecksPassed: 1,
      quizChecksAttempted: 1,
      completedChallenges: 1,
      totalChallenges: 2,
    });

    expect(transcript.proofSignals).toBe(2);
    expect(transcript.proofPercent).toBe(100);
    expect(transcript.status).toMatchObject({
      tone: 'strong',
      label: 'Strong learning proof',
    });
  });
});
