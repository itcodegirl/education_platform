import { REWARD_EVENT_TYPES } from '../engine/rewards/rewardEventTypes';

export const ATOMIC_REWARD_STATUSES = Object.freeze({
  AWARDED: 'awarded',
  SKIPPED: 'skipped',
  FAILED: 'failed',
});

const SUPPORTED_EVENT_TYPES = new Set(Object.values(REWARD_EVENT_TYPES));

function normalizeString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value.trim();
}

function normalizeXpAmount(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('xp amount must be a non-negative integer');
  }

  return value;
}

function normalizeMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

function normalizeRpcStatus(status) {
  if (status === ATOMIC_REWARD_STATUSES.AWARDED) return ATOMIC_REWARD_STATUSES.AWARDED;
  if (status === ATOMIC_REWARD_STATUSES.SKIPPED) return ATOMIC_REWARD_STATUSES.SKIPPED;
  return ATOMIC_REWARD_STATUSES.FAILED;
}

export function normalizeAtomicRewardPayload(payload = {}) {
  const eventType = normalizeString(payload.eventType, 'reward event type');
  if (!SUPPORTED_EVENT_TYPES.has(eventType)) {
    throw new Error(`Unsupported reward event type: ${eventType}`);
  }

  return {
    eventKey: normalizeString(payload.eventKey, 'reward event key'),
    eventType,
    entityId: normalizeString(payload.entityId, 'reward entity id'),
    xpAmount: normalizeXpAmount(payload.xpAmount),
    metadata: normalizeMetadata(payload.metadata),
    source: typeof payload.source === 'string' && payload.source.trim()
      ? payload.source.trim()
      : 'web',
  };
}

export async function awardRewardEventAtomic(payload, options = {}) {
  let normalizedPayload;
  try {
    normalizedPayload = normalizeAtomicRewardPayload(payload);
  } catch (error) {
    return {
      status: ATOMIC_REWARD_STATUSES.FAILED,
      error,
    };
  }

  const client = options.client;
  if (!client?.rpc) {
    return {
      status: ATOMIC_REWARD_STATUSES.FAILED,
      payload: normalizedPayload,
      error: new Error('Supabase client is required for atomic reward awards'),
    };
  }

  try {
    const { data, error } = await client.rpc('award_reward_event', {
      p_event_key: normalizedPayload.eventKey,
      p_event_type: normalizedPayload.eventType,
      p_entity_id: normalizedPayload.entityId,
      p_xp_amount: normalizedPayload.xpAmount,
      p_metadata: normalizedPayload.metadata,
      p_source: normalizedPayload.source,
    });

    if (error) throw error;

    return {
      status: normalizeRpcStatus(data?.status),
      payload: normalizedPayload,
      data,
    };
  } catch (error) {
    return {
      status: ATOMIC_REWARD_STATUSES.FAILED,
      payload: normalizedPayload,
      error,
    };
  }
}
