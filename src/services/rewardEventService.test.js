import { describe, expect, it, vi } from 'vitest';
import { REWARD_EVENT_TYPES } from '../engine/rewards/rewardEventTypes';
import { createRewardEvent } from '../engine/rewards/rewardEvents';
import {
  BACKEND_REWARD_STATUSES,
  awardBackendRewardEvent,
  isBackendRewardSyncEnabled,
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
    expect(isBackendRewardSyncEnabled({ VITE_REWARD_BACKEND_SYNC_ENABLED: 'true' })).toBe(true);
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

  it('returns disabled when Supabase config and client are unavailable', async () => {
    const result = await awardBackendRewardEvent(payload, {
      env: {},
    });

    expect(result.status).toBe(BACKEND_REWARD_STATUSES.DISABLED);
    expect(result.reason).toBe('missing_supabase_config');
  });

  it('calls the award_reward_event RPC and normalizes awarded results', async () => {
    const client = {
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

    const result = await awardBackendRewardEvent(payload, { client });

    expect(result.status).toBe(BACKEND_REWARD_STATUSES.AWARDED);
    expect(result.xpAwarded).toBe(25);
    expect(result.totalXp).toBe(125);
    expect(client.rpc).toHaveBeenCalledWith('award_reward_event', {
      p_event_key: event.key,
      p_event_type: REWARD_EVENT_TYPES.LESSON_COMPLETE,
      p_entity_id: 'lesson-01',
      p_xp_amount: 25,
      p_metadata: { rewardKey: 'lesson_complete:lesson-01' },
      p_source: 'test',
    });
  });

  it('normalizes duplicate backend events to skipped', async () => {
    const client = {
      rpc: vi.fn(async () => ({
        data: {
          status: 'skipped',
          xp_awarded: 0,
          total_xp: 125,
        },
        error: null,
      })),
    };

    const result = await awardBackendRewardEvent(payload, { client });

    expect(result.status).toBe(BACKEND_REWARD_STATUSES.SKIPPED);
    expect(result.xpAwarded).toBe(0);
    expect(result.totalXp).toBe(125);
  });

  it('returns failed for invalid payloads before calling the backend', async () => {
    const client = { rpc: vi.fn() };

    const result = await awardBackendRewardEvent({
      ...payload,
      xpAmount: 0,
    }, { client });

    expect(result.status).toBe(BACKEND_REWARD_STATUSES.FAILED);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('returns failed when the RPC returns an error', async () => {
    const client = {
      rpc: vi.fn(async () => ({
        data: null,
        error: new Error('network unavailable'),
      })),
    };

    const result = await awardBackendRewardEvent(payload, { client });

    expect(result.status).toBe(BACKEND_REWARD_STATUSES.FAILED);
    expect(result.error.message).toBe('network unavailable');
  });
});
