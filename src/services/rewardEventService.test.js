import { describe, expect, it, vi } from 'vitest';
import { REWARD_EVENT_TYPES } from '../engine/rewards/rewardEventTypes';
import { createRewardEvent } from '../engine/rewards/rewardEvents';
import {
  BACKEND_REWARD_DEBUG_STORAGE_KEY,
  BACKEND_REWARD_DIAGNOSTIC_EVENT,
  BACKEND_REWARD_STATUSES,
  awardBackendRewardEvent,
  createBackendRewardDiagnostic,
  emitBackendRewardDiagnostic,
  isBackendRewardSyncEnabled,
  isRewardSyncDebugLoggingEnabled,
  isSupabaseRewardBackendConfigured,
  normalizeBackendRewardPayload,
} from './rewardEventService';

const event = createRewardEvent({
  type: REWARD_EVENT_TYPES.LESSON_COMPLETE,
  targetId: 'lesson-01',
  learnerKey: 'learner-123',
  createdAt: '2026-04-25T12:00:00.000Z',
  metadata: { rewardKey: 'lesson_complete:lesson-01' },
});

const payload = {
  event,
  xpAmount: 25,
  source: 'test',
};

function createMemoryStorage(initialEntries = {}) {
  const entries = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => (entries.has(key) ? entries.get(key) : null),
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: (key) => entries.delete(key),
  };
}

describe('rewardEventService', () => {
  it('detects missing Supabase browser config', () => {
    expect(isSupabaseRewardBackendConfigured({})).toBe(false);
    expect(isSupabaseRewardBackendConfigured({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon',
    })).toBe(true);
  });

  it('keeps backend reward sync disabled unless explicitly enabled', () => {
    expect(isBackendRewardSyncEnabled({})).toBe(false);
    expect(isBackendRewardSyncEnabled({ VITE_REWARD_BACKEND_SYNC_ENABLED: 'false' })).toBe(false);

    ['true', 'TRUE', ' true '].forEach((flagValue) => {
      expect(isBackendRewardSyncEnabled({
        MODE: 'production',
        VITE_REWARD_BACKEND_SYNC_ENABLED: flagValue,
      })).toBe(true);
    });
  });

  it('normalizes event-shaped backend reward payloads', () => {
    expect(normalizeBackendRewardPayload(payload)).toEqual({
      eventKey: event.key,
      eventType: REWARD_EVENT_TYPES.LESSON_COMPLETE,
      entityId: 'lesson-01',
      xpAmount: 25,
      metadata: { rewardKey: 'lesson_complete:lesson-01' },
      source: 'test',
    });
  });

  it('creates safe diagnostics without reward event keys or learner IDs by default', () => {
    const diagnostic = createBackendRewardDiagnostic({
      phase: 'backend-award-result',
      featureFlagEnabled: true,
      userAuthenticated: true,
      backendAwardAttempted: true,
      resultStatus: BACKEND_REWARD_STATUSES.AWARDED,
      reason: 'ok',
      eventType: REWARD_EVENT_TYPES.LESSON_COMPLETE,
      entityId: 'lesson-01',
      eventKey: event.key,
      learnerKey: 'learner-123',
    });

    expect(diagnostic).toEqual({
      phase: 'backend-award-result',
      featureFlagEnabled: true,
      userAuthenticated: true,
      backendAwardAttempted: true,
      resultStatus: BACKEND_REWARD_STATUSES.AWARDED,
      reason: 'ok',
      eventType: REWARD_EVENT_TYPES.LESSON_COMPLETE,
      entityId: 'lesson-01',
      timestamp: expect.any(String),
    });
    expect(diagnostic.eventKey).toBeUndefined();
    expect(diagnostic.errorMessage).toBeUndefined();
    expect(diagnostic.learnerKey).toBeUndefined();
  });

  it('enables debug console diagnostics only from the local debug flag', () => {
    const storage = createMemoryStorage();
    expect(isRewardSyncDebugLoggingEnabled(storage)).toBe(false);

    storage.setItem(BACKEND_REWARD_DEBUG_STORAGE_KEY, 'true');
    expect(isRewardSyncDebugLoggingEnabled(storage)).toBe(true);

    storage.setItem(BACKEND_REWARD_DEBUG_STORAGE_KEY, 'TRUE');
    expect(isRewardSyncDebugLoggingEnabled(storage)).toBe(false);
  });

  it('emits reward diagnostics as a browser event and debug-gated console payload', () => {
    const listener = vi.fn();
    const logger = { info: vi.fn() };
    const storage = createMemoryStorage({
      [BACKEND_REWARD_DEBUG_STORAGE_KEY]: 'true',
    });
    window.addEventListener(BACKEND_REWARD_DIAGNOSTIC_EVENT, listener);

    const diagnostic = emitBackendRewardDiagnostic({
      phase: 'backend-award-attempt',
      featureFlagEnabled: true,
      userAuthenticated: true,
      backendAwardAttempted: true,
      resultStatus: 'pending',
      eventKey: event.key,
      eventType: REWARD_EVENT_TYPES.LESSON_COMPLETE,
      entityId: 'lesson-01',
      errorMessage: 'database_error',
    }, {
      logger,
      storage,
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual(diagnostic);
    expect(diagnostic).toMatchObject({
      eventKey: event.key,
      errorMessage: 'database_error',
    });
    expect(logger.info).toHaveBeenCalledWith(
      '[CodeHerWay] backend reward sync',
      diagnostic,
    );

    window.removeEventListener(BACKEND_REWARD_DIAGNOSTIC_EVENT, listener);
  });

  it('does not write console diagnostics when the local debug flag is off', () => {
    const logger = { info: vi.fn() };
    const storage = createMemoryStorage();

    const diagnostic = emitBackendRewardDiagnostic({
      phase: 'backend-award-attempt',
      featureFlagEnabled: true,
      userAuthenticated: true,
      backendAwardAttempted: true,
      resultStatus: 'pending',
      eventKey: event.key,
      eventType: REWARD_EVENT_TYPES.LESSON_COMPLETE,
      entityId: 'lesson-01',
    }, {
      logger,
      storage,
    });

    expect(logger.info).not.toHaveBeenCalled();
    expect(diagnostic.eventKey).toBeUndefined();
  });

  it('returns disabled when the backend flag is off', async () => {
    const client = { rpc: vi.fn() };

    const result = await awardBackendRewardEvent(payload, {
      client,
      enabled: false,
    });

    expect(result.status).toBe(BACKEND_REWARD_STATUSES.DISABLED);
    expect(result.reason).toBe('backend_reward_sync_disabled');
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('returns disabled by default when the feature flag is not enabled', async () => {
    const client = { rpc: vi.fn() };

    const result = await awardBackendRewardEvent(payload, {
      client,
      env: {},
    });

    expect(result.status).toBe(BACKEND_REWARD_STATUSES.DISABLED);
    expect(result.reason).toBe('backend_reward_sync_disabled');
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('returns disabled when Supabase config and client are unavailable', async () => {
    const result = await awardBackendRewardEvent(payload, {
      enabled: true,
      env: {},
    });

    expect(result.status).toBe(BACKEND_REWARD_STATUSES.DISABLED);
    expect(result.reason).toBe('missing_supabase_config');
  });

  it('returns disabled when the Supabase client has no authenticated user', async () => {
    const client = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      },
      rpc: vi.fn(),
    };

    const result = await awardBackendRewardEvent(payload, { client, enabled: true });

    expect(result.status).toBe(BACKEND_REWARD_STATUSES.DISABLED);
    expect(result.reason).toBe('missing_authenticated_user');
    expect(result.authUserPresent).toBe(false);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it.each([
    ['awarded', BACKEND_REWARD_STATUSES.AWARDED, 25, 125],
    ['AWARDED', BACKEND_REWARD_STATUSES.AWARDED, 25, 125],
    [' skipped ', BACKEND_REWARD_STATUSES.SKIPPED, 0, 125],
    ['failed', BACKEND_REWARD_STATUSES.FAILED, 0, null],
    ['disabled', BACKEND_REWARD_STATUSES.FAILED, 0, null],
  ])('normalizes RPC status %s to %s', async (
    rpcStatus,
    expectedStatus,
    expectedXp,
    expectedTotal,
  ) => {
    const client = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user-123' } }, error: null })),
      },
      rpc: vi.fn(async () => ({
        data: {
          status: rpcStatus,
          event_key: event.key,
          reason: rpcStatus === 'failed' ? 'not_authenticated' : null,
          xp_awarded: expectedXp,
          total_xp: expectedTotal,
        },
        error: null,
      })),
    };

    const result = await awardBackendRewardEvent(payload, { client, enabled: true });

    expect(result.status).toBe(expectedStatus);
    expect(result.authUserPresent).toBe(true);
    expect(result.xpAwarded).toBe(expectedXp);
    expect(result.totalXp).toBe(expectedTotal);
  });

  it('calls the award_reward_event RPC with normalized awarded payloads', async () => {
    const client = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user-123' } }, error: null })),
      },
      rpc: vi.fn(async () => ({
        data: {
          status: 'awarded',
          event_key: event.key,
          xp_awarded: 25,
          total_xp: 125,
        },
        error: null,
      })),
    };

    await awardBackendRewardEvent(payload, { client, enabled: true });

    expect(client.rpc).toHaveBeenCalledWith('award_reward_event', {
      p_event_key: event.key,
      p_event_type: REWARD_EVENT_TYPES.LESSON_COMPLETE,
      p_entity_id: 'lesson-01',
      p_xp_amount: 25,
      p_metadata: { rewardKey: 'lesson_complete:lesson-01' },
      p_source: 'test',
    });
  });

  it('returns failed for invalid payloads before calling the backend', async () => {
    const client = { rpc: vi.fn() };

    const result = await awardBackendRewardEvent({
      ...payload,
      xpAmount: 0,
    }, { client, enabled: true });

    expect(result.status).toBe(BACKEND_REWARD_STATUSES.FAILED);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('returns failed when the RPC returns an error', async () => {
    const client = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user-123' } }, error: null })),
      },
      rpc: vi.fn(async () => ({
        data: null,
        error: new Error('network unavailable'),
      })),
    };

    const result = await awardBackendRewardEvent(payload, { client, enabled: true });

    expect(result.status).toBe(BACKEND_REWARD_STATUSES.FAILED);
    expect(result.authUserPresent).toBe(true);
    expect(result.errorMessage).toBe('network unavailable');
    expect(result.error.message).toBe('network unavailable');
  });

  it('surfaces failed RPC response reasons and messages for diagnostics', async () => {
    const client = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user-123' } }, error: null })),
      },
      rpc: vi.fn(async () => ({
        data: {
          status: 'failed',
          reason: 'database_error',
          message: 'relation "public.xp" does not exist',
          xp_awarded: 0,
          total_xp: null,
        },
        error: null,
      })),
    };

    const result = await awardBackendRewardEvent(payload, { client, enabled: true });

    expect(result.status).toBe(BACKEND_REWARD_STATUSES.FAILED);
    expect(result.reason).toBe('database_error');
    expect(result.errorMessage).toBe('relation "public.xp" does not exist');
  });
});
