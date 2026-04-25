import { REWARD_PROCESSOR_STATUSES, processRewardEvent } from './rewardProcessor';
import {
  REWARD_QUEUE_ITEM_STATUSES,
  REWARD_QUEUE_RESULT_STATUSES,
  upsertRewardQueueItem,
} from './rewardQueue';

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error || 'Unknown reward error');
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
}) {
  if (hasRewardBeenAwarded(legacyRewardKey)) {
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

  const applyReward = () => {
    if (!markRewardAwarded(legacyRewardKey)) {
      return { xpAwarded: 0, legacySkipped: true };
    }

    awardXP(xpAmount, reason);
    onRewardApplied();
    return { xpAwarded: xpAmount };
  };

  if (!learnerKey) {
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

  const result = await processRewardEvent(learnerKey, event, {
    storage,
    applyReward,
  });

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

    return {
      ...result,
      pendingQueueResult,
      queueResult,
    };
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

    return {
      ...result,
      pendingQueueResult,
      queueResult,
    };
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

      return {
        status: rewardResult.xpAwarded > 0
          ? REWARD_PROCESSOR_STATUSES.APPLIED
          : REWARD_PROCESSOR_STATUSES.SKIPPED,
        source: 'legacy-reward-history',
        rewardResult,
        ledgerError: result.error,
        pendingQueueResult,
        queueResult,
      };
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

    return {
      ...result,
      pendingQueueResult,
      queueResult,
    };
  }

  return {
    ...result,
    pendingQueueResult,
  };
}
