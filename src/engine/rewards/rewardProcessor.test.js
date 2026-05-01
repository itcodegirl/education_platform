import { describe, expect, it, vi } from 'vitest';
import { REWARD_EVENT_TYPES } from './rewardEventTypes';
import { createRewardEvent } from './rewardEvents';
import { getRewardLedgerStorageKey } from './rewardLedger';
import { REWARD_PROCESSOR_STATUSES, processRewardEvent } from './rewardProcessor';

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
    metadata: { xp: 25 },
  });
}

describe('rewardProcessor', () => {
  it('applies and records an unprocessed reward event', async () => {
    const storage = createMemoryStorage();
    const event = createLessonEvent();
    const applyReward = vi.fn().mockResolvedValue({ xpAwarded: 25 });

    const result = await processRewardEvent(learnerKey, event, { storage, applyReward });

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.APPLIED);
    expect(result.rewardApplied).toBe(true);
    expect(result.ledgerRecorded).toBe(true);
    expect(result.rewardResult).toEqual({ xpAwarded: 25 });
    expect(result.ledger.processedKeys).toEqual([event.key]);
    expect(applyReward).toHaveBeenCalledWith(event);
  });

  it('skips a duplicate reward event without applying the reward again', async () => {
    const event = createLessonEvent();
    const storage = createMemoryStorage({
      [getRewardLedgerStorageKey(learnerKey)]: JSON.stringify({
        version: 1,
        processedKeys: [event.key],
        events: [event],
      }),
    });
    const applyReward = vi.fn();

    const result = await processRewardEvent(learnerKey, event, { storage, applyReward });

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.SKIPPED);
    expect(result.rewardApplied).toBe(false);
    expect(result.ledgerRecorded).toBe(true);
    expect(applyReward).not.toHaveBeenCalled();
  });

  it('fails safely when the ledger cannot be read', async () => {
    const event = createLessonEvent();
    const storage = createMemoryStorage({
      [getRewardLedgerStorageKey(learnerKey)]: '{not-json',
    });
    const applyReward = vi.fn();

    const result = await processRewardEvent(learnerKey, event, { storage, applyReward });

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.FAILED);
    expect(result.phase).toBe('ledger-read');
    expect(result.rewardApplied).toBe(false);
    expect(result.ledgerRecorded).toBe(false);
    expect(applyReward).not.toHaveBeenCalled();
  });

  it('fails safely when applying the reward throws', async () => {
    const storage = createMemoryStorage();
    const event = createLessonEvent();
    const applyReward = vi.fn().mockRejectedValue(new Error('xp unavailable'));

    const result = await processRewardEvent(learnerKey, event, { storage, applyReward });

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.FAILED);
    expect(result.phase).toBe('apply-reward');
    expect(result.rewardApplied).toBe(false);
    expect(result.ledgerRecorded).toBe(false);
  });

  it('reports ledger write failure after reward application', async () => {
    const event = createLessonEvent();
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };
    const applyReward = vi.fn().mockResolvedValue({ xpAwarded: 25 });

    const result = await processRewardEvent(learnerKey, event, { storage, applyReward });

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.FAILED);
    expect(result.phase).toBe('ledger-write');
    expect(result.rewardApplied).toBe(true);
    expect(result.ledgerRecorded).toBe(false);
  });
});

