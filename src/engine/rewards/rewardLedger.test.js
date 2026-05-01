import { describe, expect, it } from 'vitest';
import { REWARD_EVENT_TYPES } from './rewardEventTypes';
import { createRewardEvent } from './rewardEvents';
import {
  REWARD_LEDGER_STATUSES,
  getRewardLedgerStorageKey,
  hasProcessedRewardEvent,
  readRewardLedger,
  recordProcessedRewardEvent,
} from './rewardLedger';

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

describe('rewardLedger', () => {
  it('saves a processed reward event locally', () => {
    const storage = createMemoryStorage();
    const event = createLessonEvent();
    const result = recordProcessedRewardEvent(learnerKey, event, { storage });

    expect(result.status).toBe(REWARD_LEDGER_STATUSES.SUCCESS);
    expect(result.ledger.processedKeys).toEqual([event.key]);
    expect(result.ledger.events).toEqual([event]);
    expect(hasProcessedRewardEvent(learnerKey, event.key, { storage })).toBe(true);
  });

  it('skips duplicate processed event keys', () => {
    const storage = createMemoryStorage();
    const event = createLessonEvent();

    expect(recordProcessedRewardEvent(learnerKey, event, { storage }).status).toBe(
      REWARD_LEDGER_STATUSES.SUCCESS,
    );
    const duplicateResult = recordProcessedRewardEvent(learnerKey, {
      ...event,
      metadata: { duplicateAttempt: true },
    }, { storage });

    expect(duplicateResult.status).toBe(REWARD_LEDGER_STATUSES.SKIPPED);
    expect(duplicateResult.ledger.processedKeys).toEqual([event.key]);
    expect(duplicateResult.ledger.events).toEqual([event]);
  });

  it('normalizes duplicate keys already present in storage', () => {
    const event = createLessonEvent();
    const storage = createMemoryStorage({
      [getRewardLedgerStorageKey(learnerKey)]: JSON.stringify({
        version: 1,
        processedKeys: [event.key, event.key],
        events: [event, event],
      }),
    });

    const result = readRewardLedger(learnerKey, { storage });

    expect(result.status).toBe(REWARD_LEDGER_STATUSES.SUCCESS);
    expect(result.ledger.processedKeys).toEqual([event.key]);
    expect(result.ledger.events).toEqual([event]);
  });

  it('handles corrupted storage safely', () => {
    const storage = createMemoryStorage({
      [getRewardLedgerStorageKey(learnerKey)]: '{not-json',
    });

    const result = readRewardLedger(learnerKey, { storage });

    expect(result.status).toBe(REWARD_LEDGER_STATUSES.FAILED);
    expect(result.ledger.processedKeys).toEqual([]);
    expect(result.ledger.events).toEqual([]);
  });

  it('handles localStorage write failure safely', () => {
    const event = createLessonEvent();
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };

    const result = recordProcessedRewardEvent(learnerKey, event, { storage });

    expect(result.status).toBe(REWARD_LEDGER_STATUSES.FAILED);
    expect(result.event).toEqual(event);
    expect(result.ledger.processedKeys).toEqual([]);
  });
});
