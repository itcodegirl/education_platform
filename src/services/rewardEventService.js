import { REWARD_EVENT_TYPES } from '../engine/rewards/rewardEventTypes';

export const BACKEND_REWARD_STATUSES = Object.freeze({
  AWARDED: 'awarded',
  SKIPPED: 'skipped',
  FAILED: 'failed',
  DISABLED: 'disabled',
});

const SUPPORTED_EVENT_TYPES = new Set(Object.values(REWARD_EVENT_TYPES));

function normalizeString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value.trim();
}

function normalizeXpAmount(value) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('xp amount must be a positive integer');
  }

  return value;
}

function normalizeMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

function normalizeRpcStatus(status) {
  if (status === BACKEND_REWARD_STATUSES.AWARDED) return BACKEND_REWARD_STATUSES.AWARDED;
  if (status === BACKEND_REWARD_STATUSES.SKIPPED) return BACKEND_REWARD_STATUSES.SKIPPED;
  return BACKEND_REWARD_STATUSES.FAILED;
}

function getImportMetaEnv() {
  return typeof import.meta !== 'undefined' ? import.meta.env || {} : {};
}

export function normalizeBackendRewardPayload(payload = {}) {
  const event = payload.event || {};
  const eventKey = payload.eventKey ?? event.key;
  const eventType = payload.eventType ?? event.type;
  const entityId = payload.entityId ?? event.targetId;
  const metadata = payload.metadata ?? event.metadata;

  const normalizedEventType = normalizeString(eventType, 'reward event type');
  if (!SUPPORTED_EVENT_TYPES.has(normalizedEventType)) {
    throw new Error(`Unsupported reward event type: ${normalizedEventType}`);
  }

  return {
    eventKey: normalizeString(eventKey, 'reward event key'),
    eventType: normalizedEventType,
    entityId: normalizeString(entityId, 'reward entity id'),
    xpAmount: normalizeXpAmount(payload.xpAmount),
    metadata: normalizeMetadata(metadata),
    source: typeof payload.source === 'string' && payload.source.trim()
      ? payload.source.trim()
      : 'client',
  };
}

export function isSupabaseRewardBackendConfigured(env = getImportMetaEnv()) {
  return Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);
}

async function resolveSupabaseClient(options = {}) {
  if (options.client) return { client: options.client };

  if (!isSupabaseRewardBackendConfigured(options.env)) {
    return {
      disabledReason: 'missing_supabase_config',
    };
  }

  try {
    const module = await import('../lib/supabaseClient');
    return { client: module.supabase };
  } catch (error) {
    return {
      disabledReason: 'supabase_client_unavailable',
      error,
    };
  }
}

export async function awardBackendRewardEvent(payload, options = {}) {
  if (options.enabled === false) {
    return {
      status: BACKEND_REWARD_STATUSES.DISABLED,
      reason: 'backend_reward_sync_disabled',
    };
  }

  let normalizedPayload;
  try {
    normalizedPayload = normalizeBackendRewardPayload(payload);
  } catch (error) {
    return {
      status: BACKEND_REWARD_STATUSES.FAILED,
      error,
    };
  }

  const { client, disabledReason, error: clientError } = await resolveSupabaseClient(options);
  if (!client?.rpc) {
    return {
      status: BACKEND_REWARD_STATUSES.DISABLED,
      reason: disabledReason || 'supabase_client_unavailable',
      payload: normalizedPayload,
      error: clientError,
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

    if (error) {
      return {
        status: BACKEND_REWARD_STATUSES.FAILED,
        payload: normalizedPayload,
        error,
      };
    }

    return {
      status: normalizeRpcStatus(data?.status),
      payload: normalizedPayload,
      data,
      xpAwarded: Number.isInteger(data?.xp_awarded) ? data.xp_awarded : 0,
      totalXp: Number.isInteger(data?.total_xp) ? data.total_xp : null,
    };
  } catch (error) {
    return {
      status: BACKEND_REWARD_STATUSES.FAILED,
      payload: normalizedPayload,
      error,
    };
  }
}
