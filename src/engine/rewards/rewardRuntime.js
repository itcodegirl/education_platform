import { REWARD_PROCESSOR_STATUSES, processRewardEvent } from './rewardProcessor';

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
    return { status: REWARD_PROCESSOR_STATUSES.SKIPPED, source: 'legacy-reward-history' };
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

