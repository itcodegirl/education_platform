import { describe, expect, it, vi } from 'vitest';
import { REWARD_EVENT_TYPES } from './rewardEventTypes';
import { createRewardEvent } from './rewardEvents';
import {
  getRewardLedgerStorageKey,
  hasProcessedRewardEvent,
  recordProcessedRewardEvent,
} from './rewardLedger';
import {
  REWARD_QUEUE_ITEM_STATUSES,
  getRewardQueueStorageKey,
  readRewardQueue,
  upsertRewardQueueItem,
} from './rewardQueue';
import {
  REWARD_QUEUE_CLASSIFICATIONS,
  REWARD_RECONCILIATION_STATUSES,
  classifyRewardQueueItem,
  getRewardQueueRetryCandidates,
  isRewardQueueItemRetryable,
  reconcileRewardQueue,
} from './rewardReconciliation';

const learnerKey = 'learner-123';

function createMemoryStorage(initialEntries = {}, options = {}) {
  const entries = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => (entries.has(key) ? entries.get(key) : null),
    setItem: (key, value) => {
      if (options.failSetItemForKey?.(key)) {
        throw new Error('quota exceeded');
      }
      entries.set(key, String(value));
    },
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

describe('rewardReconciliation', () => {
  it('identifies due retryable queue items', () => {
    const event = createLessonEvent();
    const dueItem = {
      event,
      status: REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
      nextRetryAt: '2026-04-25T12:00:00.000Z',
    };
    const futureItem = {
      event,
      status: REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
      nextRetryAt: '2026-04-25T12:10:00.000Z',
    };

    expect(isRewardQueueItemRetryable(dueItem, {
      now: '2026-04-25T12:05:00.000Z',
    })).toBe(true);
    expect(isRewardQueueItemRetryable(futureItem, {
      now: '2026-04-25T12:05:00.000Z',
    })).toBe(false);
  });

  it('classifies ledger-processed queue items before retrying them', () => {
    const event = createLessonEvent();

    const classification = classifyRewardQueueItem({
      event,
      status: REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
    }, {
      processedKeys: new Set([event.key]),
    });

    expect(classification).toBe(REWARD_QUEUE_CLASSIFICATIONS.LEDGER_PROCESSED);
  });

  it('returns retry candidates without applying rewards', () => {
    const storage = createMemoryStorage();
    const event = createLessonEvent();
    upsertRewardQueueItem(learnerKey, {
      event,
      status: REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
    }, { storage });

    const result = getRewardQueueRetryCandidates(learnerKey, { storage });

    expect(result.status).toBe(REWARD_RECONCILIATION_STATUSES.SUCCESS);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].event.key).toBe(event.key);
  });

  it('marks queue items as reconciled when the ledger already processed them', () => {
    const storage = createMemoryStorage();
    const event = createLessonEvent();
    upsertRewardQueueItem(learnerKey, {
      event,
      status: REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
    }, { storage });
    recordProcessedRewardEvent(learnerKey, event, { storage });

    const result = reconcileRewardQueue(learnerKey, {
      storage,
      now: '2026-04-25T12:05:00.000Z',
    });
    const queue = readRewardQueue(learnerKey, { storage }).queue;

    expect(result.status).toBe(REWARD_RECONCILIATION_STATUSES.SUCCESS);
    expect(result.summary.reconciled).toBe(1);
    expect(queue.items[0].status).toBe(REWARD_QUEUE_ITEM_STATUSES.RECONCILED);
  });

  it('records legacy-awarded events into the ledger without replaying XP', () => {
    const storage = createMemoryStorage();
    const event = createLessonEvent();
    const awardSpy = vi.fn();
    upsertRewardQueueItem(learnerKey, {
      event,
      legacyRewardKey: 'lesson_complete:lesson-01',
      status: REWARD_QUEUE_ITEM_STATUSES.APPLIED_UNRECORDED,
    }, { storage });

    const result = reconcileRewardQueue(learnerKey, {
      storage,
      hasLegacyRewardBeenAwarded: () => true,
      now: '2026-04-25T12:05:00.000Z',
    });

    expect(result.status).toBe(REWARD_RECONCILIATION_STATUSES.SUCCESS);
    expect(result.summary.reconciled).toBe(1);
    expect(hasProcessedRewardEvent(learnerKey, event.key, { storage })).toBe(true);
    expect(awardSpy).not.toHaveBeenCalled();
  });

  it('leaves unapplied pending events retryable instead of recording them', () => {
    const storage = createMemoryStorage();
    const event = createLessonEvent();
    upsertRewardQueueItem(learnerKey, {
      event,
      legacyRewardKey: 'lesson_complete:lesson-01',
      status: REWARD_QUEUE_ITEM_STATUSES.PENDING,
    }, { storage });

    const result = reconcileRewardQueue(learnerKey, {
      storage,
      hasLegacyRewardBeenAwarded: () => false,
    });

    expect(result.status).toBe(REWARD_RECONCILIATION_STATUSES.SUCCESS);
    expect(result.summary.retryable).toBe(1);
    expect(hasProcessedRewardEvent(learnerKey, event.key, { storage })).toBe(false);
  });

  it('keeps legacy-awarded events retryable when the ledger write fails', () => {
    const event = createLessonEvent();
    const queueKey = getRewardQueueStorageKey(learnerKey);
    const ledgerKey = getRewardLedgerStorageKey(learnerKey);
    const storage = createMemoryStorage({
      [queueKey]: JSON.stringify({
        version: 1,
        items: [{
          event,
          legacyRewardKey: 'lesson_complete:lesson-01',
          status: REWARD_QUEUE_ITEM_STATUSES.APPLIED_UNRECORDED,
        }],
      }),
    }, {
      failSetItemForKey: (key) => key === ledgerKey,
    });

    const result = reconcileRewardQueue(learnerKey, {
      storage,
      hasLegacyRewardBeenAwarded: () => true,
      now: '2026-04-25T12:05:00.000Z',
    });
    const queue = readRewardQueue(learnerKey, { storage }).queue;

    expect(result.status).toBe(REWARD_RECONCILIATION_STATUSES.FAILED);
    expect(result.summary.failed).toBe(1);
    expect(queue.items[0].status).toBe(REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE);
    expect(queue.items[0].lastErrorPhase).toBe('ledger-write');
  });
});
