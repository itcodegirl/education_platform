import { describe, expect, it } from 'vitest';
import { REWARD_EVENT_TYPES } from './rewardEventTypes';
import { createRewardEvent } from './rewardEvents';
import {
  REWARD_ENGINE_HEALTH_STATUSES,
  getRewardEngineDiagnostics,
} from './rewardDiagnostics';
import { getRewardLedgerStorageKey, recordProcessedRewardEvent } from './rewardLedger';
import {
  REWARD_QUEUE_ITEM_STATUSES,
  getRewardQueueStorageKey,
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

describe('rewardDiagnostics', () => {
  it('reports an empty local engine as healthy', () => {
    const result = getRewardEngineDiagnostics(learnerKey, {
      storage: createMemoryStorage(),
    });

    expect(result.status).toBe(REWARD_ENGINE_HEALTH_STATUSES.OK);
    expect(result.backendRewardEventsEnabled).toBe(false);
    expect(result.ledger.processedKeyCount).toBe(0);
    expect(result.queue.itemCount).toBe(0);
  });

  it('counts processed ledger events and queue statuses', () => {
    const storage = createMemoryStorage();
    const event = createLessonEvent();
    recordProcessedRewardEvent(learnerKey, event, { storage });
    upsertRewardQueueItem(learnerKey, {
      event,
      status: REWARD_QUEUE_ITEM_STATUSES.PROCESSED,
    }, { storage });

    const result = getRewardEngineDiagnostics(learnerKey, { storage });

    expect(result.status).toBe(REWARD_ENGINE_HEALTH_STATUSES.OK);
    expect(result.ledger.processedKeyCount).toBe(1);
    expect(result.queue.statusCounts[REWARD_QUEUE_ITEM_STATUSES.PROCESSED]).toBe(1);
  });

  it('flags retryable and applied-unrecorded queue events for attention', () => {
    const storage = createMemoryStorage();
    const event = createLessonEvent();
    upsertRewardQueueItem(learnerKey, {
      event,
      status: REWARD_QUEUE_ITEM_STATUSES.APPLIED_UNRECORDED,
    }, { storage });

    const result = getRewardEngineDiagnostics(learnerKey, { storage });

    expect(result.status).toBe(REWARD_ENGINE_HEALTH_STATUSES.NEEDS_ATTENTION);
    expect(result.warnings).toContain('applied_unrecorded_rewards_need_reconciliation');
  });

  it('reports unavailable when ledger or queue storage cannot be parsed', () => {
    const storage = createMemoryStorage({
      [getRewardLedgerStorageKey(learnerKey)]: '{not-json',
      [getRewardQueueStorageKey(learnerKey)]: '{not-json',
    });

    const result = getRewardEngineDiagnostics(learnerKey, { storage });

    expect(result.status).toBe(REWARD_ENGINE_HEALTH_STATUSES.UNAVAILABLE);
    expect(result.warnings).toEqual([
      'ledger_read_failed',
      'queue_read_failed',
    ]);
  });
});
