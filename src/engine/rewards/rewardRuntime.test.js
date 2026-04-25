import { describe, expect, it, vi } from 'vitest';
import { REWARD_EVENT_TYPES } from './rewardEventTypes';
import { createRewardEvent } from './rewardEvents';
import { getRewardLedgerStorageKey, readRewardLedger } from './rewardLedger';
import { REWARD_PROCESSOR_STATUSES } from './rewardProcessor';
import {
  REWARD_QUEUE_ITEM_STATUSES,
  getRewardQueueStorageKey,
  readRewardQueue,
} from './rewardQueue';
import { awardRewardOnce } from './rewardRuntime';

const learnerKey = 'learner-123';
const legacyRewardKey = 'lesson_complete:lesson-01';

function createMemoryStorage(initialEntries = {}) {
  const entries = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => (entries.has(key) ? entries.get(key) : null),
    setItem: (key, value) => entries.set(key, String(value)),
  };
}

function createSelectiveFailureStorage({ failSetItemForKey }) {
  const entries = new Map();

  return {
    getItem: (key) => (entries.has(key) ? entries.get(key) : null),
    setItem: (key, value) => {
      if (failSetItemForKey(key)) {
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

function createRewardDeps(overrides = {}) {
  return {
    learnerKey,
    event: createLessonEvent(),
    legacyRewardKey,
    hasRewardBeenAwarded: vi.fn(() => false),
    markRewardAwarded: vi.fn(() => true),
    awardXP: vi.fn(),
    xpAmount: 25,
    reason: 'Lesson completed',
    onRewardApplied: vi.fn(),
    markSyncFailed: vi.fn(),
    storage: createMemoryStorage(),
    ...overrides,
  };
}

describe('awardRewardOnce', () => {
  it('applies a reward and records the event in the local ledger', async () => {
    const deps = createRewardDeps();

    const result = await awardRewardOnce(deps);

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.APPLIED);
    expect(deps.markRewardAwarded).toHaveBeenCalledWith(legacyRewardKey);
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed');
    expect(deps.onRewardApplied).toHaveBeenCalledTimes(1);
    expect(readRewardLedger(learnerKey, { storage: deps.storage }).ledger.processedKeys).toEqual([
      'lesson-complete:lesson-01:learner-123',
    ]);
    expect(readRewardQueue(learnerKey, { storage: deps.storage }).queue.items[0]).toMatchObject({
      event: deps.event,
      legacyRewardKey,
      status: REWARD_QUEUE_ITEM_STATUSES.PROCESSED,
    });
  });

  it('uses legacy reward history as the first dedupe guard', async () => {
    const deps = createRewardDeps({
      hasRewardBeenAwarded: vi.fn(() => true),
    });

    const result = await awardRewardOnce(deps);

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.SKIPPED);
    expect(deps.markRewardAwarded).not.toHaveBeenCalled();
    expect(deps.awardXP).not.toHaveBeenCalled();
    expect(readRewardQueue(learnerKey, { storage: deps.storage }).queue.items[0]).toMatchObject({
      event: deps.event,
      status: REWARD_QUEUE_ITEM_STATUSES.SKIPPED,
    });
  });

  it('falls back to legacy reward history if the ledger cannot be read', async () => {
    const storage = createMemoryStorage({
      [getRewardLedgerStorageKey(learnerKey)]: '{not-json',
    });
    const deps = createRewardDeps({ storage });

    const result = await awardRewardOnce(deps);

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.APPLIED);
    expect(result.source).toBe('legacy-reward-history');
    expect(deps.markSyncFailed).toHaveBeenCalledWith(
      'reward event ledger-read:lesson-complete:lesson-01:learner-123',
    );
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed');
    expect(readRewardQueue(learnerKey, { storage }).queue.items[0]).toMatchObject({
      event: deps.event,
      status: REWARD_QUEUE_ITEM_STATUSES.APPLIED_UNRECORDED,
      lastErrorPhase: 'ledger-read',
    });
  });

  it('keeps awarded events recoverable when the ledger write fails', async () => {
    const event = createLessonEvent();
    const storage = createSelectiveFailureStorage({
      failSetItemForKey: (key) => key === getRewardLedgerStorageKey(learnerKey),
    });
    const deps = createRewardDeps({ event, storage });

    const result = await awardRewardOnce(deps);

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.FAILED);
    expect(result.phase).toBe('ledger-write');
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed');
    expect(deps.markSyncFailed).toHaveBeenCalledWith(
      'reward event ledger-write:lesson-complete:lesson-01:learner-123',
    );
    expect(readRewardQueue(learnerKey, { storage }).queue.items[0]).toMatchObject({
      event,
      status: REWARD_QUEUE_ITEM_STATUSES.APPLIED_UNRECORDED,
      lastErrorPhase: 'ledger-write',
    });
  });

  it('surfaces queue write failures without blocking the reward', async () => {
    const queueKey = getRewardQueueStorageKey(learnerKey);
    const storage = createSelectiveFailureStorage({
      failSetItemForKey: (key) => key === queueKey,
    });
    const deps = createRewardDeps({ storage });

    const result = await awardRewardOnce(deps);

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.APPLIED);
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed');
    expect(deps.markSyncFailed).toHaveBeenCalledWith(
      'reward queue pending:lesson-complete:lesson-01:learner-123',
    );
    expect(readRewardLedger(learnerKey, { storage }).ledger.processedKeys).toEqual([
      'lesson-complete:lesson-01:learner-123',
    ]);
  });
});
