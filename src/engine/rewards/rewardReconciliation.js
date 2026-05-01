import {
  REWARD_LEDGER_STATUSES,
  readRewardLedger,
  recordProcessedRewardEvent,
} from './rewardLedger';
import {
  REWARD_QUEUE_ITEM_STATUSES,
  REWARD_QUEUE_RESULT_STATUSES,
  markRewardQueueItem,
  readRewardQueue,
} from './rewardQueue';

export const REWARD_RECONCILIATION_STATUSES = Object.freeze({
  SUCCESS: 'success',
  FAILED: 'failed',
});

export const REWARD_QUEUE_CLASSIFICATIONS = Object.freeze({
  LEDGER_PROCESSED: 'ledger_processed',
  LEGACY_AWARDED: 'legacy_awarded',
  RETRYABLE: 'retryable',
  WAITING: 'waiting',
  TERMINAL: 'terminal',
  COMPLETED: 'completed',
  INVALID: 'invalid',
});

const RETRYABLE_STATUSES = new Set([
  REWARD_QUEUE_ITEM_STATUSES.PENDING,
  REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
]);

const COMPLETED_STATUSES = new Set([
  REWARD_QUEUE_ITEM_STATUSES.PROCESSED,
  REWARD_QUEUE_ITEM_STATUSES.SKIPPED,
  REWARD_QUEUE_ITEM_STATUSES.RECONCILED,
]);

function getTimestamp(now = new Date()) {
  return now instanceof Date ? now.toISOString() : new Date(now).toISOString();
}

function toDateMs(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error || 'Unknown reward error');
}

function hasProcessedKey(processedKeys, eventKey) {
  if (processedKeys instanceof Set) return processedKeys.has(eventKey);
  if (Array.isArray(processedKeys)) return processedKeys.includes(eventKey);
  return false;
}

function normalizeLegacyCheckResult(value) {
  return value === true;
}

export function isRewardQueueItemRetryable(item, options = {}) {
  if (!item || !RETRYABLE_STATUSES.has(item.status)) return false;

  const nowMs = toDateMs(options.now || new Date());
  const nextRetryMs = toDateMs(item.nextRetryAt);
  if (!nextRetryMs) return true;

  return nowMs >= nextRetryMs;
}

export function classifyRewardQueueItem(item, options = {}) {
  const eventKey = item?.event?.key;
  if (!eventKey) return REWARD_QUEUE_CLASSIFICATIONS.INVALID;

  if (hasProcessedKey(options.processedKeys, eventKey)) {
    return REWARD_QUEUE_CLASSIFICATIONS.LEDGER_PROCESSED;
  }

  if (
    item.legacyRewardKey &&
    normalizeLegacyCheckResult(options.hasLegacyRewardBeenAwarded?.(item.legacyRewardKey, item))
  ) {
    return REWARD_QUEUE_CLASSIFICATIONS.LEGACY_AWARDED;
  }

  if (item.status === REWARD_QUEUE_ITEM_STATUSES.FAILED_TERMINAL) {
    return REWARD_QUEUE_CLASSIFICATIONS.TERMINAL;
  }

  if (COMPLETED_STATUSES.has(item.status)) {
    return REWARD_QUEUE_CLASSIFICATIONS.COMPLETED;
  }

  if (isRewardQueueItemRetryable(item, options)) {
    return REWARD_QUEUE_CLASSIFICATIONS.RETRYABLE;
  }

  return REWARD_QUEUE_CLASSIFICATIONS.WAITING;
}

export function getRewardQueueRetryCandidates(learnerKey, options = {}) {
  const queueResult = readRewardQueue(learnerKey, options);
  if (queueResult.status !== REWARD_QUEUE_RESULT_STATUSES.SUCCESS) {
    return {
      status: REWARD_RECONCILIATION_STATUSES.FAILED,
      candidates: [],
      error: queueResult.error,
    };
  }

  return {
    status: REWARD_RECONCILIATION_STATUSES.SUCCESS,
    candidates: queueResult.queue.items.filter((item) =>
      isRewardQueueItemRetryable(item, options),
    ),
    queue: queueResult.queue,
  };
}

export function reconcileRewardQueue(learnerKey, options = {}) {
  const timestamp = getTimestamp(options.now);
  const queueResult = readRewardQueue(learnerKey, options);
  if (queueResult.status !== REWARD_QUEUE_RESULT_STATUSES.SUCCESS) {
    return {
      status: REWARD_RECONCILIATION_STATUSES.FAILED,
      phase: 'queue-read',
      summary: createReconciliationSummary(),
      error: queueResult.error,
    };
  }

  const ledgerResult = readRewardLedger(learnerKey, options);
  if (ledgerResult.status !== REWARD_LEDGER_STATUSES.SUCCESS) {
    return {
      status: REWARD_RECONCILIATION_STATUSES.FAILED,
      phase: 'ledger-read',
      summary: createReconciliationSummary(queueResult.queue.items.length),
      queue: queueResult.queue,
      error: ledgerResult.error,
    };
  }

  const summary = createReconciliationSummary(queueResult.queue.items.length);
  const results = [];
  const processedKeys = new Set(ledgerResult.ledger.processedKeys);

  for (const item of queueResult.queue.items) {
    const classification = classifyRewardQueueItem(item, {
      processedKeys,
      hasLegacyRewardBeenAwarded: options.hasLegacyRewardBeenAwarded || (() => false),
      now: options.now,
    });

    if (classification === REWARD_QUEUE_CLASSIFICATIONS.LEDGER_PROCESSED) {
      const markResult = markRewardQueueItem(learnerKey, item.event.key, {
        status: REWARD_QUEUE_ITEM_STATUSES.RECONCILED,
        lastAttemptAt: timestamp,
        lastErrorPhase: null,
        lastErrorMessage: null,
        updatedAt: timestamp,
      }, options);
      const handled = handleQueueWriteResult(markResult, summary, item, classification);
      results.push(handled);
      continue;
    }

    if (classification === REWARD_QUEUE_CLASSIFICATIONS.LEGACY_AWARDED) {
      const recordResult = recordProcessedRewardEvent(learnerKey, item.event, options);
      if (
        recordResult.status === REWARD_LEDGER_STATUSES.SUCCESS ||
        recordResult.status === REWARD_LEDGER_STATUSES.SKIPPED
      ) {
        processedKeys.add(item.event.key);
        const markResult = markRewardQueueItem(learnerKey, item.event.key, {
          status: REWARD_QUEUE_ITEM_STATUSES.RECONCILED,
          lastAttemptAt: timestamp,
          lastErrorPhase: null,
          lastErrorMessage: null,
          updatedAt: timestamp,
        }, options);
        const handled = handleQueueWriteResult(markResult, summary, item, classification);
        results.push(handled);
        continue;
      }

      const markResult = markRewardQueueItem(learnerKey, item.event.key, {
        status: REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
        lastAttemptAt: timestamp,
        lastErrorPhase: 'ledger-write',
        lastErrorMessage: getErrorMessage(recordResult.error),
        updatedAt: timestamp,
      }, options);
      summary.failed += 1;
      results.push({
        eventKey: item.event.key,
        classification,
        status: REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
        error: recordResult.error,
        queueWriteFailed: markResult.status === REWARD_QUEUE_RESULT_STATUSES.FAILED,
      });
      continue;
    }

    if (classification === REWARD_QUEUE_CLASSIFICATIONS.RETRYABLE) summary.retryable += 1;
    if (classification === REWARD_QUEUE_CLASSIFICATIONS.WAITING) summary.waiting += 1;
    if (classification === REWARD_QUEUE_CLASSIFICATIONS.TERMINAL) summary.terminal += 1;
    if (classification === REWARD_QUEUE_CLASSIFICATIONS.COMPLETED) summary.completed += 1;
    if (classification === REWARD_QUEUE_CLASSIFICATIONS.INVALID) summary.failed += 1;

    results.push({
      eventKey: item.event?.key || null,
      classification,
      status: item.status,
    });
  }

  return {
    status: summary.failed > 0
      ? REWARD_RECONCILIATION_STATUSES.FAILED
      : REWARD_RECONCILIATION_STATUSES.SUCCESS,
    phase: 'complete',
    summary,
    results,
  };
}

function createReconciliationSummary(total = 0) {
  return {
    total,
    reconciled: 0,
    retryable: 0,
    waiting: 0,
    completed: 0,
    terminal: 0,
    failed: 0,
  };
}

function handleQueueWriteResult(markResult, summary, item, classification) {
  if (markResult.status !== REWARD_QUEUE_RESULT_STATUSES.SUCCESS) {
    summary.failed += 1;
    return {
      eventKey: item.event.key,
      classification,
      status: item.status,
      queueWriteFailed: true,
      error: markResult.error,
    };
  }

  summary.reconciled += 1;
  return {
    eventKey: item.event.key,
    classification,
    status: REWARD_QUEUE_ITEM_STATUSES.RECONCILED,
  };
}
