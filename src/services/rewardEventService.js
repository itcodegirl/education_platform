import { REWARD_EVENT_TYPES } from '../engine/rewards/rewardEventTypes';

export const BACKEND_REWARD_STATUSES = Object.freeze({
  AWARDED: 'awarded',
  SKIPPED: 'skipped',
  FAILED: 'failed',
  DISABLED: 'disabled',
});

export const BACKEND_REWARD_DIAGNOSTIC_EVENT = 'codeherway:backend-reward-sync';
export const BACKEND_REWARD_DEBUG_STORAGE_KEY = 'debug-reward-sync';

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
  const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : '';
  if (normalizedStatus === BACKEND_REWARD_STATUSES.AWARDED) {
    return BACKEND_REWARD_STATUSES.AWARDED;
  }
  if (normalizedStatus === BACKEND_REWARD_STATUSES.SKIPPED) {
    return BACKEND_REWARD_STATUSES.SKIPPED;
  }
  return BACKEND_REWARD_STATUSES.FAILED;
}

function getImportMetaEnv() {
  return typeof import.meta !== 'undefined' ? import.meta.env || {} : {};
}

function normalizeBooleanFlag(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

function normalizeDiagnosticString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeDiagnosticBoolean(value) {
  if (value === true) return true;
  if (value === false) return false;
  return null;
}

function getSafeErrorMessage(error) {
  if (!error) return null;
  if (typeof error === 'string') return normalizeDiagnosticString(error);
  if (typeof error.message === 'string') return normalizeDiagnosticString(error.message);
  return 'Unknown backend reward error';
}

function getRpcFailureMessage(data) {
  if (!data || typeof data !== 'object') return null;
  return normalizeDiagnosticString(data.message) || normalizeDiagnosticString(data.reason);
}

export function isRewardSyncDebugLoggingEnabled(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(BACKEND_REWARD_DEBUG_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
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
  return Boolean(env?.VITE_SUPABASE_URL && env?.VITE_SUPABASE_ANON_KEY);
}

export function isBackendRewardSyncEnabled(env = getImportMetaEnv()) {
  return normalizeBooleanFlag(env?.VITE_REWARD_BACKEND_SYNC_ENABLED);
}

export function createBackendRewardDiagnostic(detail = {}, options = {}) {
  const diagnostic = {
    phase: normalizeDiagnosticString(detail.phase) || 'unknown',
    featureFlagEnabled: Boolean(detail.featureFlagEnabled),
    userAuthenticated: normalizeDiagnosticBoolean(detail.userAuthenticated),
    backendAwardAttempted: Boolean(detail.backendAwardAttempted),
    resultStatus: normalizeDiagnosticString(detail.resultStatus),
    reason: normalizeDiagnosticString(detail.reason),
    eventType: normalizeDiagnosticString(detail.eventType),
    entityId: normalizeDiagnosticString(detail.entityId),
    timestamp: new Date().toISOString(),
  };

  if (options.includeDebugDetails) {
    diagnostic.eventKey = normalizeDiagnosticString(detail.eventKey);
    diagnostic.errorMessage = normalizeDiagnosticString(detail.errorMessage);
    diagnostic.supabaseConfigured = normalizeDiagnosticBoolean(detail.supabaseConfigured);
  }

  return diagnostic;
}

export function emitBackendRewardDiagnostic(detail = {}, options = {}) {
  const debugEnabled = options.debugEnabled ?? isRewardSyncDebugLoggingEnabled(options.storage);
  const diagnostic = createBackendRewardDiagnostic(detail, {
    includeDebugDetails: debugEnabled,
  });

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent(BACKEND_REWARD_DIAGNOSTIC_EVENT, {
        detail: diagnostic,
      }));
    } catch {
      // Diagnostics should never break reward fallback behavior.
    }
  }

  const shouldLogToConsole = debugEnabled && (options.logToConsole ?? true);
  const logger = options.logger || console;
  if (shouldLogToConsole && logger?.info) {
    logger.info('[CodeHerWay] backend reward sync', diagnostic);
  }

  return diagnostic;
}

function shouldAttemptBackendRewardSync(options = {}) {
  if (options.enabled === true) return true;
  if (options.enabled === false) return false;
  return isBackendRewardSyncEnabled(options.env);
}

async function resolveSupabaseClient(options = {}) {
  if (options.client) return { client: options.client };

  if (!isSupabaseRewardBackendConfigured(options.env)) {
    return {
      disabledReason: 'missing_supabase_config',
    };
  }

  try {
    const module = await import('../lib/lazySupabaseClient');
    return { client: module.getLazySupabaseClient(options.env) };
  } catch (error) {
    return {
      disabledReason: 'supabase_client_unavailable',
      error,
    };
  }
}

async function resolveAuthenticatedUser(client) {
  if (!client?.auth?.getUser) {
    return {
      checked: false,
      authUserPresent: null,
    };
  }

  try {
    const { data, error } = await client.auth.getUser();
    if (error) {
      return {
        checked: true,
        authUserPresent: false,
        disabledReason: 'missing_authenticated_user',
        error,
      };
    }

    return {
      checked: true,
      authUserPresent: Boolean(data?.user?.id),
      disabledReason: data?.user?.id ? null : 'missing_authenticated_user',
    };
  } catch (error) {
    return {
      checked: true,
      authUserPresent: false,
      disabledReason: 'auth_check_failed',
      error,
    };
  }
}

export async function awardBackendRewardEvent(payload, options = {}) {
  if (!shouldAttemptBackendRewardSync(options)) {
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
      errorMessage: getSafeErrorMessage(error),
      error,
    };
  }

  const { client, disabledReason, error: clientError } = await resolveSupabaseClient(options);
  if (!client?.rpc) {
    return {
      status: BACKEND_REWARD_STATUSES.DISABLED,
      reason: disabledReason || 'supabase_client_unavailable',
      payload: normalizedPayload,
      authUserPresent: null,
      errorMessage: getSafeErrorMessage(clientError),
      error: clientError,
    };
  }

  const authResult = await resolveAuthenticatedUser(client);
  if (authResult.checked && !authResult.authUserPresent) {
    return {
      status: BACKEND_REWARD_STATUSES.DISABLED,
      reason: authResult.disabledReason || 'missing_authenticated_user',
      payload: normalizedPayload,
      authUserPresent: false,
      errorMessage: getSafeErrorMessage(authResult.error) || authResult.disabledReason,
      error: authResult.error,
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
        authUserPresent: authResult.authUserPresent,
        errorMessage: getSafeErrorMessage(error),
        error,
      };
    }

    const status = normalizeRpcStatus(data?.status);
    return {
      status,
      reason: typeof data?.reason === 'string' ? data.reason : null,
      payload: normalizedPayload,
      data,
      authUserPresent: authResult.authUserPresent,
      errorMessage: status === BACKEND_REWARD_STATUSES.FAILED
        ? getRpcFailureMessage(data)
        : null,
      xpAwarded: Number.isInteger(data?.xp_awarded) ? data.xp_awarded : 0,
      totalXp: Number.isInteger(data?.total_xp) ? data.total_xp : null,
    };
  } catch (error) {
    return {
      status: BACKEND_REWARD_STATUSES.FAILED,
      payload: normalizedPayload,
      authUserPresent: authResult.authUserPresent,
      errorMessage: getSafeErrorMessage(error),
      error,
    };
  }
}
