import { describe, expect, it } from 'vitest';
import { REWARD_EVENT_TYPES } from './rewardEventTypes';
import { createRewardEvent } from './rewardEvents';
import {
  REWARD_QUEUE_ITEM_STATUSES,
  REWARD_QUEUE_RESULT_STATUSES,
  createRewardQueueItem,
  getRewardQueueStorageKey,
  markRewardQueueItem,
  readRewardQueue,
  upsertRewardQueueItem,
} from './rewardQueue';

const learnerKey = 'learner-123';

function createMemoryStorage(initialEntries = {}) {
  const entries = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => (entries.has(key) ? entries.get(key) : null),
    setItem: (key, value) => entries.set(key, String(value)),
  };
}

function createLessonEvent() {
  return createRewardEvent({
    type: REWARD_EVENT_TYPES.LESSON_COMPLETE,
    targetId: 'lesson-01',
    learnerKey,
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

describe('rewardQueue', () => {
  it('creates normalized pending queue items', () => {
    const event = createLessonEvent();
    const item = createRewardQueueItem({
      event,
      legacyRewardKey: 'lesson_complete:lesson-01',
      now: new Date('2026-04-25T12:01:00.000Z'),
    });

    expect(item).toMatchObject({
      event,
      legacyRewardKey: 'lesson_complete:lesson-01',
      status: REWARD_QUEUE_ITEM_STATUSES.PENDING,
      attemptCount: 0,
      createdAt: '2026-04-25T12:01:00.000Z',
      updatedAt: '2026-04-25T12:01:00.000Z',
    });
  });

  it('saves a pending queue item', () => {
    const storage = createMemoryStorage();
    const event = createLessonEvent();

    const result = upsertRewardQueueItem(learnerKey, {
      event,
      legacyRewardKey: 'lesson_complete:lesson-01',
      createdAt: '2026-04-25T12:01:00.000Z',
      updatedAt: '2026-04-25T12:01:00.000Z',
    }, { storage });

    expect(result.status).toBe(REWARD_QUEUE_RESULT_STATUSES.SUCCESS);
    expect(result.queue.items).toHaveLength(1);
    expect(result.queue.items[0]).toMatchObject({
      event,
      status: REWARD_QUEUE_ITEM_STATUSES.PENDING,
    });
  });

  it('dedupes queue items by reward event key', () => {
    const storage = createMemoryStorage();
    const event = createLessonEvent();

    upsertRewardQueueItem(learnerKey, {
      event,
      status: REWARD_QUEUE_ITEM_STATUSES.PENDING,
      createdAt: '2026-04-25T12:01:00.000Z',
      updatedAt: '2026-04-25T12:01:00.000Z',
    }, { storage });
    const result = upsertRewardQueueItem(learnerKey, {
      event,
      status: REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
      attemptCount: 1,
      updatedAt: '2026-04-25T12:02:00.000Z',
    }, { storage });

    expect(result.queue.items).toHaveLength(1);
    expect(result.item.status).toBe(REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE);
    expect(result.item.attemptCount).toBe(1);
    expect(result.item.createdAt).toBe('2026-04-25T12:01:00.000Z');
  });

  it('marks an existing queue item with failure details', () => {
    const storage = createMemoryStorage();
    const event = createLessonEvent();
    upsertRewardQueueItem(learnerKey, { event }, { storage });

    const result = markRewardQueueItem(learnerKey, event.key, {
      status: REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
      attemptCount: 2,
      lastAttemptAt: '2026-04-25T12:03:00.000Z',
      lastErrorPhase: 'ledger-write',
      lastErrorMessage: 'quota exceeded',
      updatedAt: '2026-04-25T12:03:00.000Z',
    }, { storage });

    expect(result.status).toBe(REWARD_QUEUE_RESULT_STATUSES.SUCCESS);
    expect(result.item).toMatchObject({
      status: REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
      attemptCount: 2,
      lastAttemptAt: '2026-04-25T12:03:00.000Z',
      lastErrorPhase: 'ledger-write',
      lastErrorMessage: 'quota exceeded',
    });
  });

  it('handles corrupted queue storage safely', () => {
    const storage = createMemoryStorage({
      [getRewardQueueStorageKey(learnerKey)]: '{not-json',
    });

    const result = readRewardQueue(learnerKey, { storage });

    expect(result.status).toBe(REWARD_QUEUE_RESULT_STATUSES.FAILED);
    expect(result.queue.items).toEqual([]);
  });

  it('handles queue write failure safely', () => {
    const event = createLessonEvent();
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };

    const result = upsertRewardQueueItem(learnerKey, { event }, { storage });

    expect(result.status).toBe(REWARD_QUEUE_RESULT_STATUSES.FAILED);
    expect(result.item.event.key).toBe(event.key);
  });
});

