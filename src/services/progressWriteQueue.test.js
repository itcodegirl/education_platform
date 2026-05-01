import { beforeEach, describe, expect, it, vi } from 'vitest';

const progressServiceMocks = vi.hoisted(() => ({
  addLesson: vi.fn(),
  removeLesson: vi.fn(),
  removeLessonsByKeys: vi.fn(),
  saveQuizScore: vi.fn(),
  updateXP: vi.fn(),
  updateStreak: vi.fn(),
  updateDailyGoal: vi.fn(),
  awardBadge: vi.fn(),
  addSRCard: vi.fn(),
  updateSRCard: vi.fn(),
  addBookmark: vi.fn(),
  removeBookmark: vi.fn(),
  removeBookmarksByKeys: vi.fn(),
  saveNote: vi.fn(),
  savePosition: vi.fn(),
  trackCourseVisit: vi.fn(),
}));

vi.mock('./progressService', () => progressServiceMocks);

import {
  clearProgressWriteQueue,
  createProgressWrite,
  enqueueProgressWrite,
  readProgressWriteQueue,
  replayProgressWriteQueue,
} from './progressWriteQueue';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

describe('progressWriteQueue', () => {
  const userId = 'user-123';
  let storage;

  beforeEach(() => {
    storage = createMemoryStorage();
    Object.values(progressServiceMocks).forEach((mockFn) => {
      mockFn.mockReset();
      mockFn.mockResolvedValue({ error: null });
    });
  });

  it('dedupes last-write-wins operations by resource key', () => {
    enqueueProgressWrite(
      userId,
      createProgressWrite('updateXP', { total: 100 }),
      { storage },
    );
    enqueueProgressWrite(
      userId,
      createProgressWrite('updateXP', { total: 125 }),
      { storage },
    );

    const queue = readProgressWriteQueue(userId, { storage });

    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      operation: 'updateXP',
      payload: { total: 125 },
      dedupeKey: 'xp',
    });
  });

  it('keeps distinct operations that must both replay for the same card', () => {
    enqueueProgressWrite(
      userId,
      createProgressWrite('addSRCard', {
        card: { question: 'What is flex?', options: [], correct: 0 },
      }),
      { storage },
    );
    enqueueProgressWrite(
      userId,
      createProgressWrite('updateSRCard', {
        question: 'What is flex?',
        updates: { interval_days: 3, ease: 2.4 },
      }),
      { storage },
    );

    const queue = readProgressWriteQueue(userId, { storage });

    expect(queue).toHaveLength(2);
    expect(queue.map((item) => item.dedupeKey)).toEqual([
      'sr-add:What is flex?',
      'sr-update:What is flex?',
    ]);
  });

  it('replays queued writes in order and clears the queue on success', async () => {
    enqueueProgressWrite(
      userId,
      createProgressWrite('addLesson', { lessonKey: 'html|intro' }),
      { storage },
    );
    enqueueProgressWrite(
      userId,
      createProgressWrite('saveNote', {
        lessonKey: 'html|intro',
        content: 'Remember semantic structure',
      }),
      { storage },
    );

    const result = await replayProgressWriteQueue(userId, { storage });

    expect(progressServiceMocks.addLesson).toHaveBeenCalledWith(userId, 'html|intro');
    expect(progressServiceMocks.saveNote).toHaveBeenCalledWith(
      userId,
      'html|intro',
      'Remember semantic structure',
    );
    expect(result).toMatchObject({
      processed: 2,
      remaining: 0,
      failedItem: null,
      error: null,
    });
    expect(readProgressWriteQueue(userId, { storage })).toEqual([]);
  });

  it('stops on the first failed replay and preserves the remaining queue', async () => {
    progressServiceMocks.addLesson.mockResolvedValueOnce({
      data: null,
      error: { message: 'network timeout' },
    });

    enqueueProgressWrite(
      userId,
      createProgressWrite('addLesson', { lessonKey: 'html|intro' }),
      { storage },
    );
    enqueueProgressWrite(
      userId,
      createProgressWrite('saveNote', {
        lessonKey: 'html|intro',
        content: 'This should still be queued',
      }),
      { storage },
    );

    const result = await replayProgressWriteQueue(userId, { storage });
    const remaining = readProgressWriteQueue(userId, { storage });

    expect(result.processed).toBe(0);
    expect(result.remaining).toBe(2);
    expect(result.failedItem).toMatchObject({
      operation: 'addLesson',
      attemptCount: 1,
      lastError: 'network timeout',
    });
    expect(progressServiceMocks.saveNote).not.toHaveBeenCalled();
    expect(remaining).toHaveLength(2);
    expect(remaining[0]).toMatchObject({
      operation: 'addLesson',
      attemptCount: 1,
      lastError: 'network timeout',
    });
  });

  it('replays variant-safe bookmark removals through the multi-key delete helper', async () => {
    enqueueProgressWrite(
      userId,
      createProgressWrite('removeBookmarkVariants', {
        lessonKeys: ['c:html|m:m-basics|l:l-intro', 'HTML|Basics|Intro'],
        dedupeLessonKey: 'c:html|m:m-basics|l:l-intro',
      }),
      { storage },
    );

    const result = await replayProgressWriteQueue(userId, { storage });

    expect(progressServiceMocks.removeBookmarksByKeys).toHaveBeenCalledWith(
      userId,
      ['c:html|m:m-basics|l:l-intro', 'HTML|Basics|Intro'],
    );
    expect(result.remaining).toBe(0);
  });

  it('clears all queued writes for a user', () => {
    enqueueProgressWrite(
      userId,
      createProgressWrite('trackCourseVisit', { courseId: 'html-basics' }),
      { storage },
    );

    clearProgressWriteQueue(userId, { storage });

    expect(readProgressWriteQueue(userId, { storage })).toEqual([]);
  });
});
