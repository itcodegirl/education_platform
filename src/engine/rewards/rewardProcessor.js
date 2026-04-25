import {
  REWARD_LEDGER_STATUSES,
  readRewardLedger,
  recordProcessedRewardEvent,
} from './rewardLedger';

export const REWARD_PROCESSOR_STATUSES = Object.freeze({
  APPLIED: 'applied',
  SKIPPED: 'skipped',
  FAILED: 'failed',
});

function normalizeRewardEvent(event) {
  if (!event || typeof event !== 'object' || typeof event.key !== 'string' || !event.key.trim()) {
    throw new Error('reward event must include a non-empty key');
  }

  return {
    ...event,
    key: event.key.trim(),
  };
}

export async function processRewardEvent(learnerKey, event, options = {}) {
  const normalizedEvent = normalizeRewardEvent(event);
  const ledgerOptions = { storage: options.storage };
  const ledgerResult = readRewardLedger(learnerKey, ledgerOptions);

  if (ledgerResult.status !== REWARD_LEDGER_STATUSES.SUCCESS) {
    return {
      status: REWARD_PROCESSOR_STATUSES.FAILED,
      phase: 'ledger-read',
      event: normalizedEvent,
      rewardApplied: false,
      ledgerRecorded: false,
      error: ledgerResult.error,
    };
  }

  if (ledgerResult.ledger.processedKeys.includes(normalizedEvent.key)) {
    return {
      status: REWARD_PROCESSOR_STATUSES.SKIPPED,
      phase: 'dedupe',
      event: normalizedEvent,
      ledger: ledgerResult.ledger,
      rewardApplied: false,
      ledgerRecorded: true,
    };
  }

  let rewardResult;
  try {
    rewardResult = await options.applyReward?.(normalizedEvent);
  } catch (error) {
    return {
      status: REWARD_PROCESSOR_STATUSES.FAILED,
      phase: 'apply-reward',
      event: normalizedEvent,
      ledger: ledgerResult.ledger,
      rewardApplied: false,
      ledgerRecorded: false,
      error,
    };
  }

  const recordResult = recordProcessedRewardEvent(learnerKey, normalizedEvent, ledgerOptions);

  if (recordResult.status !== REWARD_LEDGER_STATUSES.SUCCESS) {
    return {
      status: REWARD_PROCESSOR_STATUSES.FAILED,
      phase: 'ledger-write',
      event: normalizedEvent,
      ledger: recordResult.ledger,
      rewardResult,
      rewardApplied: true,
      ledgerRecorded: false,
      error: recordResult.error,
    };
  }

  return {
    status: REWARD_PROCESSOR_STATUSES.APPLIED,
    phase: 'complete',
    event: normalizedEvent,
    ledger: recordResult.ledger,
    rewardResult,
    rewardApplied: true,
    ledgerRecorded: true,
  };
}

