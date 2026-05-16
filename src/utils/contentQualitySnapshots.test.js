import { describe, expect, it } from 'vitest';
import {
  CONTENT_QUALITY_SNAPSHOT_KEY,
  buildContentQualitySnapshot,
  compareContentQualitySnapshots,
  loadContentQualitySnapshots,
  saveContentQualitySnapshot,
} from './contentQualitySnapshots';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
}

function createReport(overrides = {}) {
  return {
    warningCount: 8,
    quizGapCount: 5,
    lessonGapCount: 3,
    missingSignals: [{ name: 'reasoning', count: 5 }],
    warningsByCourse: [
      { name: 'react', count: 6 },
      { name: 'html', count: 2 },
    ],
    ...overrides,
  };
}

describe('content quality snapshots', () => {
  it('builds stable snapshots from report summaries', () => {
    const snapshot = buildContentQualitySnapshot(
      createReport(),
      '2026-05-16T12:00:00.000Z',
    );

    expect(snapshot).toMatchObject({
      generatedAt: '2026-05-16T12:00:00.000Z',
      warningCount: 8,
      quizGapCount: 5,
      lessonGapCount: 3,
      topMissingSignal: 'reasoning',
      courseCounts: {
        html: 2,
        react: 6,
      },
    });
    expect(snapshot.signature).toContain('8:5:3:reasoning');
  });

  it('saves, loads, and compares progress without duplicate report signatures', () => {
    const storage = createMemoryStorage();
    const first = saveContentQualitySnapshot(
      createReport(),
      storage,
      '2026-05-16T12:00:00.000Z',
    );
    const duplicate = saveContentQualitySnapshot(
      createReport(),
      storage,
      '2026-05-16T12:05:00.000Z',
    );
    const improved = saveContentQualitySnapshot(
      createReport({
        warningCount: 6,
        quizGapCount: 4,
        lessonGapCount: 2,
        warningsByCourse: [{ name: 'react', count: 6 }],
      }),
      storage,
      '2026-05-16T12:10:00.000Z',
    );

    expect(first).toHaveLength(1);
    expect(duplicate).toHaveLength(1);
    expect(improved).toHaveLength(2);
    expect(storage.getItem(CONTENT_QUALITY_SNAPSHOT_KEY)).toContain('2026-05-16T12:10:00.000Z');

    const loaded = loadContentQualitySnapshots(storage);
    expect(compareContentQualitySnapshots(loaded[0], loaded[1])).toMatchObject({
      hasPrevious: true,
      warningDelta: -2,
      quizGapDelta: -1,
      lessonGapDelta: -1,
    });
  });

  it('handles missing or invalid local storage data safely', () => {
    expect(loadContentQualitySnapshots(null)).toEqual([]);
    expect(loadContentQualitySnapshots({
      getItem: () => 'not json',
    })).toEqual([]);
    expect(compareContentQualitySnapshots(buildContentQualitySnapshot(createReport()), null))
      .toMatchObject({ hasPrevious: false });
  });
});
