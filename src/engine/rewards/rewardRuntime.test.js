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
    }, {
      enabled: true,
    });
    expect(deps.markRewardAwarded).toHaveBeenCalledWith(legacyRewardKey);
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed', { skipRemote: true });
    expect(deps.onRewardApplied).toHaveBeenCalledTimes(1);
    expect(readRewardLedger(learnerKey, { storage: deps.storage }).ledger.processedKeys).toEqual([
      'lesson-complete:lesson-01:learner-123',
    ]);
    expect(readRewardQueue(learnerKey, { storage: deps.storage }).queue.items[0]).toMatchObject({
      event: deps.event,
      status: REWARD_QUEUE_ITEM_STATUSES.PROCESSED,
    });
  });

  it('emits safe diagnostics and attempts backend sync when enabled with a learner key', async () => {
    const backendRewardAward = vi.fn(async () => ({
      status: BACKEND_REWARD_STATUSES.AWARDED,
      totalXp: 125,
      xpAwarded: 25,
    }));
    const diagnoseBackendRewardSync = vi.fn();
    const deps = createRewardDeps({
      backendRewardSyncEnabled: true,
      backendRewardAward,
      diagnoseBackendRewardSync,
    });

    const result = await awardRewardOnce(deps);

    expect(result.source).toBe('backend-reward-event');
    expect(backendRewardAward).toHaveBeenCalledTimes(1);
    expect(diagnoseBackendRewardSync).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'runtime-start',
      featureFlagEnabled: true,
      userAuthenticated: true,
      backendAwardAttempted: false,
      reason: 'backend_sync_enabled',
      eventType: REWARD_EVENT_TYPES.LESSON_COMPLETE,
      entityId: 'lesson-01',
    }));
    expect(diagnoseBackendRewardSync).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'backend-award-attempt',
      featureFlagEnabled: true,
      userAuthenticated: true,
      backendAwardAttempted: true,
      resultStatus: 'pending',
      eventType: REWARD_EVENT_TYPES.LESSON_COMPLETE,
      entityId: 'lesson-01',
    }));
    expect(diagnoseBackendRewardSync).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'backend-award-result',
      featureFlagEnabled: true,
      userAuthenticated: true,
      backendAwardAttempted: true,
      resultStatus: BACKEND_REWARD_STATUSES.AWARDED,
      eventType: REWARD_EVENT_TYPES.LESSON_COMPLETE,
      entityId: 'lesson-01',
    }));
    const diagnosticPayloads = JSON.stringify(diagnoseBackendRewardSync.mock.calls);
    expect(diagnosticPayloads).not.toContain(deps.event.key);
    expect(diagnosticPayloads).not.toContain(learnerKey);
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
    expect(readRewardQueue(learnerKey, { storage: deps.storage }).queue.items[0]).toMatchObject({
      event: deps.event,
      status: REWARD_QUEUE_ITEM_STATUSES.SKIPPED,
    });
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
    expect(readRewardQueue(learnerKey, { storage: deps.storage }).queue.items[0]).toMatchObject({
      event: deps.event,
      status: REWARD_QUEUE_ITEM_STATUSES.PROCESSED,
    });
  });

  it('falls back to local rewards when the backend wrapper is disabled', async () => {
    const backendRewardAward = vi.fn(async () => ({
      status: BACKEND_REWARD_STATUSES.DISABLED,
      reason: 'missing_supabase_config',
    }));
    const deps = createRewardDeps({
      backendRewardSyncEnabled: true,
      backendRewardAward,
    });

    const result = await awardRewardOnce(deps);

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.APPLIED);
    expect(result.source).not.toBe('backend-reward-event');
    expect(result.backendResult.status).toBe(BACKEND_REWARD_STATUSES.DISABLED);
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed');
    expect(readRewardQueue(learnerKey, { storage: deps.storage }).queue.items[0]).toMatchObject({
      event: deps.event,
      status: REWARD_QUEUE_ITEM_STATUSES.PROCESSED,
    });
  });

  it('does not call the backend when the local ledger already processed the event', async () => {
    const storage = createMemoryStorage();
    await awardRewardOnce(createRewardDeps({ storage }));
    const backendRewardAward = vi.fn(async () => ({
      status: BACKEND_REWARD_STATUSES.AWARDED,
      totalXp: 150,
      xpAwarded: 25,
    }));
    const deps = createRewardDeps({
      storage,
      backendRewardSyncEnabled: true,
      backendRewardAward,
    });

    const result = await awardRewardOnce(deps);

    expect(result.status).toBe(REWARD_PROCESSOR_STATUSES.SKIPPED);
    expect(result.source).toBe('local-reward-ledger');
    expect(backendRewardAward).not.toHaveBeenCalled();
    expect(deps.awardXP).not.toHaveBeenCalled();
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
