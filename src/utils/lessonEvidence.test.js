import { describe, expect, it } from 'vitest';
import { getLessonEvidenceItems, getLessonEvidenceSummary } from './lessonEvidence';

describe('lessonEvidence', () => {
  it('separates reading completion from mastery proof', () => {
    const items = getLessonEvidenceItems({
      lesson: { title: 'Forms' },
      isLessonDone: false,
      masteryStatus: {
        isReady: false,
        detail: 'Take the quick check before moving ahead.',
      },
    });

    expect(items).toMatchObject([
      {
        key: 'reading',
        state: 'Not saved yet',
        detail: expect.stringContaining('reading progress, not mastery'),
      },
      {
        key: 'recall',
        state: 'Needs proof',
        detail: 'Take the quick check before moving ahead.',
      },
      {
        key: 'application',
        state: 'Use the build',
      },
    ]);
  });

  it('uses honest account sync language for saved reading evidence', () => {
    const items = getLessonEvidenceItems({
      isLessonDone: true,
      masteryStatus: { isReady: true, detail: 'Quick check 90%. Continue.' },
      syncStatus: { tone: 'queued' },
      lesson: {
        challenge: {
          mission: 'Build a signup form.',
          requirements: ['Use a label', 'Validate email'],
        },
      },
    });

    expect(items[0]).toMatchObject({
      state: 'Saved',
      detail: 'Saved in this browser and queued for account sync.',
    });
    expect(items[1]).toMatchObject({ state: 'Ready', tone: 'complete' });
    expect(items[2]).toMatchObject({ state: 'Available', tone: 'current' });
  });

  it('summarizes the next evidence gap', () => {
    expect(getLessonEvidenceSummary({ isLessonDone: false })).toMatch(/Completion saves reading progress only/);
    expect(getLessonEvidenceSummary({
      isLessonDone: true,
      masteryStatus: { isReady: false },
    })).toMatch(/Add recall or application evidence/);
    expect(getLessonEvidenceSummary({
      isLessonDone: true,
      masteryStatus: { isReady: true },
    })).toMatch(/strong enough to continue/);
  });
});
