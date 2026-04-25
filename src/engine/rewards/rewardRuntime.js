import { REWARD_PROCESSOR_STATUSES, processRewardEvent } from './rewardProcessor';
import { REWARD_LEDGER_STATUSES, recordProcessedRewardEvent } from './rewardLedger';
import {
  BACKEND_REWARD_STATUSES,
  awardBackendRewardEvent,
} from '../../services/rewardEventService';

function recordLocalProcessedEvent({ learnerKey, event, storage, markSyncFailed }) {
  const recordResult = recordProcessedRewardEvent(learnerKey, event, { storage });
  if (recordResult.status === REWARD_LEDGER_STATUSES.FAILED) {
    markSyncFailed(`reward event ledger-write:${event.key}`);
  }
  return recordResult;
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
}) {
  if (hasRewardBeenAwarded(legacyRewardKey)) {
    return { status: REWARD_PROCESSOR_STATUSES.SKIPPED, source: 'legacy-reward-history' };
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
    const rewardResult = applyReward();
    return {
      status: rewardResult.xpAwarded > 0
        ? REWARD_PROCESSOR_STATUSES.APPLIED
        : REWARD_PROCESSOR_STATUSES.SKIPPED,
      source: 'legacy-reward-history',
      rewardResult,
    };
  }

  if (backendRewardSyncEnabled && learnerKey) {
    const backendResult = await backendRewardAward({
      event,
      xpAmount,
      source: backendRewardSource,
    });

    if (backendResult.status === BACKEND_REWARD_STATUSES.AWARDED) {
      const rewardResult = applyReward({ skipRemote: true });
      const ledgerResult = recordLocalProcessedEvent({
        learnerKey,
        event,
        storage,
        markSyncFailed,
      });

      return {
        status: rewardResult.xpAwarded > 0
          ? REWARD_PROCESSOR_STATUSES.APPLIED
          : REWARD_PROCESSOR_STATUSES.SKIPPED,
        source: 'backend-reward-event',
        backendResult,
        rewardResult,
        ledgerResult,
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

      return {
        status: REWARD_PROCESSOR_STATUSES.SKIPPED,
        source: 'backend-reward-event',
        backendResult,
        ledgerResult,
      };
    }

    if (backendResult.status === BACKEND_REWARD_STATUSES.FAILED) {
      markSyncFailed(`backend reward failed:${event.key}`);
    }
  }

  const result = await processRewardEvent(learnerKey, event, {
    storage,
    applyReward,
  });

  if (result.status === REWARD_PROCESSOR_STATUSES.FAILED) {
    markSyncFailed(`reward event ${result.phase}:${event.key}`);

    if (result.phase === 'ledger-read') {
      const rewardResult = applyReward();
      return {
        status: rewardResult.xpAwarded > 0
          ? REWARD_PROCESSOR_STATUSES.APPLIED
          : REWARD_PROCESSOR_STATUSES.SKIPPED,
        source: 'legacy-reward-history',
        rewardResult,
        ledgerError: result.error,
      };
    }
  }

  return result;
}

