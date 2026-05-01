import { REWARD_LEDGER_STATUSES, readRewardLedger, recordProcessedRewardEvent } from './rewardLedger';
import { REWARD_PROCESSOR_STATUSES, processRewardEvent } from './rewardProcessor';
import {
  REWARD_QUEUE_ITEM_STATUSES,
  REWARD_QUEUE_RESULT_STATUSES,
  upsertRewardQueueItem,
} from './rewardQueue';
import {
  BACKEND_REWARD_STATUSES,
  awardBackendRewardEvent,
  emitBackendRewardDiagnostic,
} from '../../services/rewardEventService';

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error || 'Unknown reward error');
}

function getBackendResultErrorMessage(backendResult) {
  if (!backendResult) return null;
  if (typeof backendResult.errorMessage === 'string' && backendResult.errorMessage.trim()) {
    return backendResult.errorMessage.trim();
  }
  if (backendResult.error) return getErrorMessage(backendResult.error);
  if (
    (backendResult.status === BACKEND_REWARD_STATUSES.FAILED ||
      backendResult.status === BACKEND_REWARD_STATUSES.DISABLED) &&
    typeof backendResult.reason === 'string'
  ) {
    return backendResult.reason;
  }
  return null;
}

function recordQueueState({
  learnerKey,
  event,
  legacyRewardKey,
  status,
  phase,
  storage,
  markSyncFailed,
  lastErrorPhase = null,
  lastErrorMessage = null,
}) {
  if (!learnerKey || !event?.key) return null;

  const timestamp = new Date().toISOString();
  const result = upsertRewardQueueItem(learnerKey, {
    event,
    legacyRewardKey,
    status,
    attemptCount: status === REWARD_QUEUE_ITEM_STATUSES.PENDING ? 0 : 1,
    lastAttemptAt: status === REWARD_QUEUE_ITEM_STATUSES.PENDING ? null : timestamp,
    lastErrorPhase,
    lastErrorMessage,
    updatedAt: timestamp,
  }, { storage });

  if (result.status === REWARD_QUEUE_RESULT_STATUSES.FAILED) {
    markSyncFailed(`reward queue ${phase}:${event.key}`);
  }

  return result;
}

function readLocalProcessedEvent({ learnerKey, event, storage }) {
  const ledgerResult = readRewardLedger(learnerKey, { storage });
  if (ledgerResult.status !== REWARD_LEDGER_STATUSES.SUCCESS) {
    return {
      status: 'unknown',
      ledgerResult,
    };
  }

  return {
    status: ledgerResult.ledger.processedKeys.includes(event.key) ? 'processed' : 'unprocessed',
    ledgerResult,
  };
}

function recordLocalProcessedEvent({ learnerKey, event, storage, markSyncFailed }) {
  const ledgerResult = recordProcessedRewardEvent(learnerKey, event, { storage });
  if (ledgerResult.status === REWARD_LEDGER_STATUSES.FAILED) {
    markSyncFailed(`reward event ledger-write:${event.key}`);
  }
  return ledgerResult;
}

function isLedgerRecorded(ledgerResult) {
  return ledgerResult?.status === REWARD_LEDGER_STATUSES.SUCCESS ||
    ledgerResult?.status === REWARD_LEDGER_STATUSES.SKIPPED;
}

function withBackendResult(result, backendResult) {
  return backendResult ? { ...result, backendResult } : result;
}

function createBackendDiagnosticEmitter({
  learnerKey,
  event,
  backendRewardSyncEnabled,
  diagnoseBackendRewardSync,
}) {
  return (detail = {}) => {
    try {
      return diagnoseBackendRewardSync({
        phase: detail.phase,
        featureFlagEnabled: Boolean(backendRewardSyncEnabled),
        userAuthenticated: typeof detail.userAuthenticated === 'boolean'
          ? detail.userAuthenticated
          : Boolean(learnerKey),
        backendAwardAttempted: Boolean(detail.backendAwardAttempted),
        resultStatus: detail.resultStatus || null,
        reason: detail.reason || null,
        eventKey: event?.key || null,
        eventType: event?.type || null,
        entityId: event?.targetId || null,
        errorMessage: detail.errorMessage || null,
      });
    } catch {
      return null;
    }
  };
}

export async function awardRewardOnce({
  learnerKey = '',
  event,
  legacyRewardKey,
  hasRewardBeenAwarded = () => false,
  markRewardAwarded = () => false,
  awardXP = () => {},
  xpAmount,
  reason,
  onRewardApplied = () => {},
  markSyncFailed = () => {},
  storage,
  backendRewardSyncEnabled = false,
  backendRewardAward = awardBackendRewardEvent,
  backendRewardSource = 'client',
  diagnoseBackendRewardSync = emitBackendRewardDiagnostic,
}) {
  const diagnoseBackend = createBackendDiagnosticEmitter({
    learnerKey,
    event,
    backendRewardSyncEnabled,
    diagnoseBackendRewardSync,
  });

  diagnoseBackend({
    phase: 'runtime-start',
    backendAwardAttempted: false,
    resultStatus: null,
    reason: backendRewardSyncEnabled ? 'backend_sync_enabled' : 'backend_sync_disabled',
  });

  const legacyRewardAlreadyAwarded = hasRewardBeenAwarded(legacyRewardKey);
  if (legacyRewardAlreadyAwarded) {
    diagnoseBackend({
      phase: 'legacy-dedupe-detected',
      backendAwardAttempted: false,
      resultStatus: BACKEND_REWARD_STATUSES.SKIPPED,
      reason: 'legacy_reward_history',
    });
  }

  const applyReward = ({ skipRemote = false } = {}) => {
    if (!markRewardAwarded(legacyRewardKey)) {
      return { xpAwarded: 0, legacySkipped: true };
    }

    if (skipRemote) {
      awardXP(xpAmount, reason, { skipRemote: true });
    } else {
      awardXP(xpAmount, reason);
    }
    onRewardApplied();
    return { xpAwarded: xpAmount };
  };

  if (!learnerKey) {
    diagnoseBackend({
      phase: 'unauthenticated-local-fallback',
      backendAwardAttempted: false,
      resultStatus: BACKEND_REWARD_STATUSES.DISABLED,
      reason: backendRewardSyncEnabled ? 'missing_learner_key' : 'backend_sync_disabled',
    });

    if (legacyRewardAlreadyAwarded) {
      const queueResult = recordQueueState({
        learnerKey,
        event,
        legacyRewardKey,
        status: REWARD_QUEUE_ITEM_STATUSES.SKIPPED,
        phase: 'legacy-skip',
        storage,
        markSyncFailed,
      });

      return {
        status: REWARD_PROCESSOR_STATUSES.SKIPPED,
        source: 'legacy-reward-history',
        queueResult,
      };
    }

    const rewardResult = applyReward();
    return {
      status: rewardResult.xpAwarded > 0
        ? REWARD_PROCESSOR_STATUSES.APPLIED
        : REWARD_PROCESSOR_STATUSES.SKIPPED,
      source: 'legacy-reward-history',
      rewardResult,
    };
  }

  const pendingQueueResult = recordQueueState({
    learnerKey,
    event,
    legacyRewardKey,
    status: REWARD_QUEUE_ITEM_STATUSES.PENDING,
    phase: 'pending',
    storage,
    markSyncFailed,
  });

  if (backendRewardSyncEnabled) {
    const localProcessedResult = readLocalProcessedEvent({ learnerKey, event, storage });
    const localLedgerAlreadyProcessed = localProcessedResult.status === 'processed';
    if (localLedgerAlreadyProcessed) {
      diagnoseBackend({
        phase: 'local-ledger-dedupe-detected',
        backendAwardAttempted: false,
        resultStatus: BACKEND_REWARD_STATUSES.SKIPPED,
        reason: 'local_ledger_processed',
      });
    }
    const localDedupeSource = legacyRewardAlreadyAwarded
      ? 'legacy-reward-history'
      : localLedgerAlreadyProcessed
        ? 'local-reward-ledger'
        : null;

    diagnoseBackend({
      phase: 'backend-award-attempt',
      backendAwardAttempted: true,
      resultStatus: 'pending',
      reason: null,
    });

    const backendResult = await backendRewardAward({
      event,
      xpAmount,
      source: backendRewardSource,
    }, {
      enabled: true,
    });

    diagnoseBackend({
      phase: 'backend-award-result',
      backendAwardAttempted: true,
      userAuthenticated: typeof backendResult.authUserPresent === 'boolean'
        ? backendResult.authUserPresent
        : undefined,
      resultStatus: backendResult.status,
      reason: backendResult.reason || null,
      errorMessage: getBackendResultErrorMessage(backendResult),
    });

    if (backendResult.status === BACKEND_REWARD_STATUSES.AWARDED) {
      const rewardResult = localDedupeSource
        ? {
            xpAwarded: 0,
            localSkipped: true,
            localDedupeSource,
          }
        : applyReward({ skipRemote: true });
      if (localDedupeSource && !legacyRewardAlreadyAwarded) {
        markRewardAwarded(legacyRewardKey);
      }
      const ledgerResult = recordLocalProcessedEvent({
        learnerKey,
        event,
        storage,
        markSyncFailed,
      });
      const queueResult = recordQueueState({
        learnerKey,
        event,
        legacyRewardKey,
        status: isLedgerRecorded(ledgerResult)
          ? REWARD_QUEUE_ITEM_STATUSES.PROCESSED
          : REWARD_QUEUE_ITEM_STATUSES.APPLIED_UNRECORDED,
        phase: 'backend-awarded',
        storage,
        markSyncFailed,
        lastErrorPhase: isLedgerRecorded(ledgerResult) ? null : 'ledger-write',
        lastErrorMessage: isLedgerRecorded(ledgerResult) ? null : getErrorMessage(ledgerResult.error),
      });

      return {
        status: REWARD_PROCESSOR_STATUSES.APPLIED,
        source: 'backend-reward-event',
        backendResult,
        rewardResult,
        ledgerResult,
        pendingQueueResult,
        queueResult,
      };
    }

    if (backendResult.status === BACKEND_REWARD_STATUSES.SKIPPED) {
      markRewardAwarded(legacyRewardKey);
      const ledgerResult = recordLocalProcessedEvent({
        learnerKey,
        event,
        storage,
        markSyncFailed,
      });
      const queueResult = recordQueueState({
        learnerKey,
        event,
        legacyRewardKey,
        status: isLedgerRecorded(ledgerResult)
          ? REWARD_QUEUE_ITEM_STATUSES.SKIPPED
          : REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
        phase: 'backend-skipped',
        storage,
        markSyncFailed,
        lastErrorPhase: isLedgerRecorded(ledgerResult) ? null : 'ledger-write',
        lastErrorMessage: isLedgerRecorded(ledgerResult) ? null : getErrorMessage(ledgerResult.error),
      });

      return {
        status: REWARD_PROCESSOR_STATUSES.SKIPPED,
        source: 'backend-reward-event',
        backendResult,
        ledgerResult,
        pendingQueueResult,
        queueResult,
      };
    }

    if (backendResult.status === BACKEND_REWARD_STATUSES.FAILED) {
      markSyncFailed(`backend reward failed:${event.key}`);
    }

    if (legacyRewardAlreadyAwarded) {
      const queueResult = recordQueueState({
        learnerKey,
        event,
        legacyRewardKey,
        status: REWARD_QUEUE_ITEM_STATUSES.SKIPPED,
        phase: 'legacy-skip-after-backend-fallback',
        storage,
        markSyncFailed,
      });

      return {
        status: REWARD_PROCESSOR_STATUSES.SKIPPED,
        source: 'legacy-reward-history',
        backendResult,
        pendingQueueResult,
        queueResult,
      };
    }

    const result = await processRewardEvent(learnerKey, event, {
      storage,
      applyReward,
    });

    return handleLocalRewardResult({
      result,
      learnerKey,
      event,
      legacyRewardKey,
      storage,
      markSyncFailed,
      pendingQueueResult,
      backendResult,
      applyReward,
    });
  }

  diagnoseBackend({
    phase: 'feature-flag-local-fallback',
    backendAwardAttempted: false,
    resultStatus: BACKEND_REWARD_STATUSES.DISABLED,
    reason: 'backend_reward_sync_disabled',
  });

  if (legacyRewardAlreadyAwarded) {
    const queueResult = recordQueueState({
      learnerKey,
      event,
      legacyRewardKey,
      status: REWARD_QUEUE_ITEM_STATUSES.SKIPPED,
      phase: 'legacy-skip',
      storage,
      markSyncFailed,
    });

    return {
      status: REWARD_PROCESSOR_STATUSES.SKIPPED,
      source: 'legacy-reward-history',
      pendingQueueResult,
      queueResult,
    };
  }

  const result = await processRewardEvent(learnerKey, event, {
    storage,
    applyReward,
  });

  return handleLocalRewardResult({
    result,
    learnerKey,
    event,
    legacyRewardKey,
    storage,
    markSyncFailed,
    pendingQueueResult,
    applyReward,
  });
}

function handleLocalRewardResult({
  result,
  learnerKey,
  event,
  legacyRewardKey,
  storage,
  markSyncFailed,
  pendingQueueResult,
  backendResult = null,
  applyReward,
}) {
  if (result.status === REWARD_PROCESSOR_STATUSES.APPLIED) {
    const queueResult = recordQueueState({
      learnerKey,
      event,
      legacyRewardKey,
      status: REWARD_QUEUE_ITEM_STATUSES.PROCESSED,
      phase: 'processed',
      storage,
      markSyncFailed,
    });

    return withBackendResult({
      ...result,
      pendingQueueResult,
      queueResult,
    }, backendResult);
  }

  if (result.status === REWARD_PROCESSOR_STATUSES.SKIPPED) {
    const queueResult = recordQueueState({
      learnerKey,
      event,
      legacyRewardKey,
      status: REWARD_QUEUE_ITEM_STATUSES.SKIPPED,
      phase: 'skipped',
      storage,
      markSyncFailed,
    });

    return withBackendResult({
      ...result,
      pendingQueueResult,
      queueResult,
    }, backendResult);
  }

  if (result.status === REWARD_PROCESSOR_STATUSES.FAILED) {
    markSyncFailed(`reward event ${result.phase}:${event.key}`);

    if (result.phase === 'ledger-read') {
      const rewardResult = applyReward();
      const fallbackStatus = rewardResult.xpAwarded > 0
        ? REWARD_QUEUE_ITEM_STATUSES.APPLIED_UNRECORDED
        : REWARD_QUEUE_ITEM_STATUSES.SKIPPED;
      const queueResult = recordQueueState({
        learnerKey,
        event,
        legacyRewardKey,
        status: fallbackStatus,
        phase: 'fallback',
        storage,
        markSyncFailed,
        lastErrorPhase: result.phase,
        lastErrorMessage: getErrorMessage(result.error),
      });

      return withBackendResult({
        status: rewardResult.xpAwarded > 0
          ? REWARD_PROCESSOR_STATUSES.APPLIED
          : REWARD_PROCESSOR_STATUSES.SKIPPED,
        source: 'legacy-reward-history',
        rewardResult,
        ledgerError: result.error,
        pendingQueueResult,
        queueResult,
      }, backendResult);
    }

    const queueStatus = result.rewardApplied
      ? REWARD_QUEUE_ITEM_STATUSES.APPLIED_UNRECORDED
      : REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE;
    const queueResult = recordQueueState({
      learnerKey,
      event,
      legacyRewardKey,
      status: queueStatus,
      phase: 'failed',
      storage,
      markSyncFailed,
      lastErrorPhase: result.phase,
      lastErrorMessage: getErrorMessage(result.error),
    });

    return withBackendResult({
      ...result,
      pendingQueueResult,
      queueResult,
    }, backendResult);
  }

  return withBackendResult({
    ...result,
    pendingQueueResult,
  }, backendResult);
}
