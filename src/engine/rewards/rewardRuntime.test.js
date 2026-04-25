import { describe, expect, it, vi } from 'vitest';
import { REWARD_EVENT_TYPES } from './rewardEventTypes';
import { createRewardEvent } from './rewardEvents';
import { getRewardLedgerStorageKey, readRewardLedger } from './rewardLedger';
import { REWARD_PROCESSOR_STATUSES } from './rewardProcessor';
import { awardRewardOnce } from './rewardRuntime';
import { BACKEND_REWARD_STATUSES } from '../../services/rewardEventService';

const learnerKey = 'learner-123';
const legacyRewardKey = 'lesson_complete:lesson-01';

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
  });

  it('uses local rewards when backend sync is disabled', async () => {
    const backendRewardAward = vi.fn();
    const deps = createRewardDeps({
      backendRewardSyncEnabled: false,
      backendRewardAward,
    });

    const result = await awardRewardOnce(deps);

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.APPLIED);
    expect(result.source).not.toBe('backend-reward-event');
    expect(backendRewardAward).not.toHaveBeenCalled();
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed');
  });

  it('uses local rewards when no authenticated learner key exists', async () => {
    const backendRewardAward = vi.fn();
    const deps = createRewardDeps({
      learnerKey: '',
      backendRewardSyncEnabled: true,
      backendRewardAward,
    });

    const result = await awardRewardOnce(deps);

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.APPLIED);
    expect(result.source).toBe('legacy-reward-history');
    expect(backendRewardAward).not.toHaveBeenCalled();
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed');
  });

  it('uses backend awarded results without writing XP through the legacy remote path', async () => {
    const backendRewardAward = vi.fn(async () => ({
      status: BACKEND_REWARD_STATUSES.AWARDED,
      totalXp: 125,
      xpAwarded: 25,
    }));
    const deps = createRewardDeps({
      backendRewardSyncEnabled: true,
      backendRewardAward,
    });

    const result = await awardRewardOnce(deps);

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.APPLIED);
    expect(result.source).toBe('backend-reward-event');
    expect(backendRewardAward).toHaveBeenCalledWith({
      event: deps.event,
      xpAmount: 25,
      source: 'client',
    });
    expect(deps.markRewardAwarded).toHaveBeenCalledWith(legacyRewardKey);
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed', { skipRemote: true });
    expect(deps.onRewardApplied).toHaveBeenCalledTimes(1);
    expect(readRewardLedger(learnerKey, { storage: deps.storage }).ledger.processedKeys).toEqual([
      'lesson-complete:lesson-01:learner-123',
    ]);
  });

  it('treats backend duplicate rewards as skipped and records local dedupe state', async () => {
    const backendRewardAward = vi.fn(async () => ({
      status: BACKEND_REWARD_STATUSES.SKIPPED,
      totalXp: 125,
      xpAwarded: 0,
    }));
    const deps = createRewardDeps({
      backendRewardSyncEnabled: true,
      backendRewardAward,
    });

    const result = await awardRewardOnce(deps);

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.SKIPPED);
    expect(result.source).toBe('backend-reward-event');
    expect(deps.markRewardAwarded).toHaveBeenCalledWith(legacyRewardKey);
    expect(deps.awardXP).not.toHaveBeenCalled();
    expect(deps.onRewardApplied).not.toHaveBeenCalled();
    expect(readRewardLedger(learnerKey, { storage: deps.storage }).ledger.processedKeys).toEqual([
      'lesson-complete:lesson-01:learner-123',
    ]);
  });

  it('falls back to local rewards when backend sync fails', async () => {
    const backendRewardAward = vi.fn(async () => ({
      status: BACKEND_REWARD_STATUSES.FAILED,
      error: new Error('network unavailable'),
    }));
    const deps = createRewardDeps({
      backendRewardSyncEnabled: true,
      backendRewardAward,
    });

    const result = await awardRewardOnce(deps);

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.APPLIED);
    expect(result.source).not.toBe('backend-reward-event');
    expect(deps.markSyncFailed).toHaveBeenCalledWith(
      'backend reward failed:lesson-complete:lesson-01:learner-123',
    );
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed');
  });

  it('uses legacy reward history as the first dedupe guard', async () => {
    const deps = createRewardDeps({
      hasRewardBeenAwarded: vi.fn(() => true),
    });

    const result = await awardRewardOnce(deps);

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.SKIPPED);
    expect(deps.markRewardAwarded).not.toHaveBeenCalled();
    expect(deps.awardXP).not.toHaveBeenCalled();
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
  });
});

