import { describe, expect, it, vi } from 'vitest';
import { REWARD_EVENT_TYPES } from '../engine/rewards/rewardEventTypes';
import {
  ATOMIC_REWARD_STATUSES,
  awardRewardEventAtomic,
  normalizeAtomicRewardPayload,
} from './rewardEventService';

const validPayload = {
  eventKey: 'lesson-complete:lesson-01:learner-123',
  eventType: REWARD_EVENT_TYPES.LESSON_COMPLETE,
  entityId: 'lesson-01',
  xpAmount: 25,
  metadata: { courseId: 'html' },
  source: 'web-local-ledger',
};

describe('rewardEventService', () => {
  it('normalizes an atomic reward payload', () => {
    expect(normalizeAtomicRewardPayload({
      ...validPayload,
      eventKey: ' lesson-complete:lesson-01:learner-123 ',
    })).toEqual(validPayload);
  });

  it('rejects unsupported event types before calling the backend', async () => {
    const client = { rpc: vi.fn() };

    const result = await awardRewardEventAtomic({
      ...validPayload,
      eventType: 'BAD_EVENT',
    }, { client });

    expect(result.status).toBe(ATOMIC_REWARD_STATUSES.FAILED);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('calls the future atomic award RPC with normalized parameters', async () => {
    const client = {
      rpc: vi.fn(async () => ({
        data: {
          status: 'awarded',
          xp_awarded: 25,
        },
        error: null,
      })),
    };

    const result = await awardRewardEventAtomic(validPayload, { client });

    expect(result.status).toBe(ATOMIC_REWARD_STATUSES.AWARDED);
    expect(client.rpc).toHaveBeenCalledWith('award_reward_event', {
      p_event_key: validPayload.eventKey,
      p_event_type: validPayload.eventType,
      p_entity_id: validPayload.entityId,
      p_xp_amount: validPayload.xpAmount,
      p_metadata: validPayload.metadata,
      p_source: validPayload.source,
    });
  });

  it('maps duplicate backend events to skipped', async () => {
    const client = {
      rpc: vi.fn(async () => ({
        data: {
          status: 'skipped',
          xp_awarded: 0,
        },
        error: null,
      })),
    };

    const result = await awardRewardEventAtomic(validPayload, { client });

    expect(result.status).toBe(ATOMIC_REWARD_STATUSES.SKIPPED);
  });

  it('returns failed when no client is provided', async () => {
    const result = await awardRewardEventAtomic(validPayload);

    expect(result.status).toBe(ATOMIC_REWARD_STATUSES.FAILED);
    expect(result.error.message).toMatch(/Supabase client is required/);
  });

  it('returns failed when the RPC errors', async () => {
    const client = {
      rpc: vi.fn(async () => ({
        data: null,
        error: new Error('network unavailable'),
      })),
    };

    const result = await awardRewardEventAtomic(validPayload, { client });

    expect(result.status).toBe(ATOMIC_REWARD_STATUSES.FAILED);
    expect(result.error.message).toBe('network unavailable');
  });
});
