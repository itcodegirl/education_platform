import { REWARD_LEDGER_STATUSES, readRewardLedger } from './rewardLedger';
import {
  REWARD_QUEUE_ITEM_STATUSES,
  REWARD_QUEUE_RESULT_STATUSES,
  readRewardQueue,
} from './rewardQueue';

export const REWARD_ENGINE_HEALTH_STATUSES = Object.freeze({
  OK: 'ok',
  NEEDS_ATTENTION: 'needs_attention',
  UNAVAILABLE: 'unavailable',
});

const QUEUE_STATUS_VALUES = Object.values(REWARD_QUEUE_ITEM_STATUSES);

function createQueueStatusCounts() {
  return QUEUE_STATUS_VALUES.reduce((counts, status) => ({
    ...counts,
    [status]: 0,
  }), {});
}

function countQueueStatuses(queue = {}) {
  const counts = createQueueStatusCounts();
  const items = Array.isArray(queue.items) ? queue.items : [];

  items.forEach((item) => {
    if (QUEUE_STATUS_VALUES.includes(item?.status)) {
      counts[item.status] += 1;
    }
  });

  return counts;
}

function buildWarnings({ ledgerResult, queueResult, queueStatusCounts }) {
  const warnings = [];

  if (ledgerResult.status !== REWARD_LEDGER_STATUSES.SUCCESS) {
    warnings.push('ledger_read_failed');
  }

  if (queueResult.status !== REWARD_QUEUE_RESULT_STATUSES.SUCCESS) {
    warnings.push('queue_read_failed');
  }

  if (queueStatusCounts[REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE] > 0) {
    warnings.push('retryable_reward_failures_pending');
  }

  if (queueStatusCounts[REWARD_QUEUE_ITEM_STATUSES.APPLIED_UNRECORDED] > 0) {
    warnings.push('applied_unrecorded_rewards_need_reconciliation');
  }

  if (queueStatusCounts[REWARD_QUEUE_ITEM_STATUSES.FAILED_TERMINAL] > 0) {
    warnings.push('terminal_reward_failures_present');
  }

  return warnings;
}

function getHealthStatus({ ledgerResult, queueResult, warnings }) {
  if (
    ledgerResult.status !== REWARD_LEDGER_STATUSES.SUCCESS ||
    queueResult.status !== REWARD_QUEUE_RESULT_STATUSES.SUCCESS
  ) {
    return REWARD_ENGINE_HEALTH_STATUSES.UNAVAILABLE;
  }

  return warnings.length > 0
    ? REWARD_ENGINE_HEALTH_STATUSES.NEEDS_ATTENTION
    : REWARD_ENGINE_HEALTH_STATUSES.OK;
}

export function summarizeRewardEngineHealth({ ledgerResult, queueResult }) {
  const ledger = ledgerResult?.ledger || {};
  const queue = queueResult?.queue || {};
  const queueStatusCounts = countQueueStatuses(queue);
  const warnings = buildWarnings({
    ledgerResult,
    queueResult,
    queueStatusCounts,
  });

  return {
    status: getHealthStatus({ ledgerResult, queueResult, warnings }),
    warnings,
    backendRewardEventsEnabled: false,
    ledger: {
      readStatus: ledgerResult.status,
      processedKeyCount: Array.isArray(ledger.processedKeys) ? ledger.processedKeys.length : 0,
      eventCount: Array.isArray(ledger.events) ? ledger.events.length : 0,
    },
    queue: {
      readStatus: queueResult.status,
      itemCount: Array.isArray(queue.items) ? queue.items.length : 0,
      statusCounts: queueStatusCounts,
    },
  };
}

export function getRewardEngineDiagnostics(learnerKey, options = {}) {
  const ledgerResult = readRewardLedger(learnerKey, options);
  const queueResult = readRewardQueue(learnerKey, options);

  return summarizeRewardEngineHealth({
    ledgerResult,
    queueResult,
  });
}
