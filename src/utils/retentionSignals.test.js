import { describe, expect, it } from 'vitest';
import { buildRetentionSignalSummary } from './retentionSignals';

describe('retention signal summary', () => {
  it('prioritizes due review cards over other retention signals', () => {
    const summary = buildRetentionSignalSummary({
      now: 100,
      srCards: [
        { nextReview: 50 },
        { next_review: new Date(200).toISOString() },
      ],
      quizResults: [{ percent: 40 }],
      reviewFocusModules: [{ moduleId: 'm1' }],
    });

    expect(summary).toMatchObject({
      tone: 'due',
      label: 'Review due now',
    });
    expect(summary.metrics).toEqual([
      { key: 'due', label: 'Due now', value: '1' },
      { key: 'scheduled', label: 'Scheduled later', value: '1' },
      { key: 'weak', label: 'Weak checks', value: '1' },
      { key: 'modules', label: 'Module focus', value: '1' },
    ]);
  });

  it('surfaces weak quiz checks when nothing is due yet', () => {
    const summary = buildRetentionSignalSummary({
      now: 100,
      srCards: [{ nextReview: 200 }],
      quizResults: [{ percent: 79 }, { percent: 80 }],
    });

    expect(summary.tone).toBe('weak');
    expect(summary.detail).toMatch(/Retry 1 weak check/i);
  });

  it('keeps scheduled review visible when recall is currently clear', () => {
    const summary = buildRetentionSignalSummary({
      now: 100,
      srCards: [{ nextReview: 200 }, { nextReview: 300 }],
      quizResults: [{ percent: 100 }],
    });

    expect(summary.tone).toBe('scheduled');
    expect(summary.label).toBe('Spacing is active');
    expect(summary.metrics[1]).toMatchObject({ value: '2' });
  });
});
