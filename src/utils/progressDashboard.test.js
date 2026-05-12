import { describe, expect, it } from 'vitest';
import { getProgressSnapshotItems } from './progressDashboard';

describe('progress dashboard summary', () => {
  it('keeps a brand-new dashboard calm and action oriented', () => {
    const items = getProgressSnapshotItems({ totalDone: 0, totalLessons: 12 });

    expect(items).toEqual([
      expect.objectContaining({
        key: 'lessons',
        value: '0/12',
        detail: 'Complete one lesson to start the trail.',
        tone: 'quiet',
      }),
      expect.objectContaining({
        key: 'readiness',
        value: 'Not started',
        detail: 'Complete one lesson to begin a reliable trail.',
      }),
      expect.objectContaining({
        key: 'review',
        value: 'Clear',
        tone: 'ready',
      }),
    ]);
  });

  it('separates mastery evidence and review urgency from motivational progress', () => {
    const items = getProgressSnapshotItems({
      totalDone: 4,
      totalLessons: 10,
      quizzesTaken: 3,
      masteryEvidence: {
        quizChecksPassed: 2,
        quizChecksAttempted: 3,
      },
      srDue: 2,
    });

    expect(items.find((item) => item.key === 'lessons')).toMatchObject({
      value: '4/10',
      tone: 'ready',
    });
    expect(items.find((item) => item.key === 'readiness')).toMatchObject({
      value: 'Review needed',
      detail: 'Clear one review card or retry a weak quick check before adding much new material.',
      tone: 'attention',
    });
    expect(items.find((item) => item.key === 'review')).toMatchObject({
      value: '2',
      tone: 'attention',
    });
  });
});
