import { describe, expect, it } from 'vitest';
import {
  getLessonEvidenceItems,
  getLessonEvidenceSummary,
  getLessonLearningContract,
} from './lessonEvidence';

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

  it('derives a lesson learning contract from structured lesson content', () => {
    const contract = getLessonLearningContract({
      lesson: {
        title: 'Accessible Forms',
        prereqs: ['h12-1'],
        hook: {
          accomplishments: ['Build a labeled form field.'],
        },
        do: {
          steps: ['Add a label', 'Connect it to the input'],
          proofRequired: 'a label/input pair that works with a screen reader',
        },
        understand: {
          concepts: [{ name: 'Label association' }],
        },
      },
    });

    expect(contract).toEqual([
      expect.objectContaining({
        key: 'prerequisite',
        detail: expect.stringContaining('1 prerequisite lesson'),
      }),
      expect.objectContaining({
        key: 'outcome',
        detail: 'Build a labeled form field.',
      }),
      expect.objectContaining({
        key: 'practice',
        detail: expect.stringContaining('2 guided steps'),
      }),
      expect.objectContaining({
        key: 'recall',
        detail: expect.stringContaining('Label association'),
      }),
      expect.objectContaining({
        key: 'proof',
        detail: expect.stringContaining('screen reader'),
      }),
    ]);
  });

  it('keeps legacy lessons structured with fallback contract guidance', () => {
    const contract = getLessonLearningContract({
      lesson: {
        title: 'HTML Basics',
        content: 'Read about tags.',
        tasks: ['Create one heading'],
      },
    });

    expect(contract.map((item) => item.key)).toEqual([
      'prerequisite',
      'outcome',
      'practice',
      'recall',
      'proof',
    ]);
    expect(contract[1].detail).toMatch(/Complete HTML Basics/);
    expect(contract[2].detail).toMatch(/1 practice task/);
    expect(contract[3].detail).toMatch(/one sentence/i);
  });
});
