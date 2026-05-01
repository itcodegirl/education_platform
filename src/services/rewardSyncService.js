import { REWARD_QUEUE_ITEM_STATUSES } from '../engine/rewards/rewardQueue';

export const REWARD_SYNC_PLAN_STATUSES = Object.freeze({
  READY: 'ready',
  BLOCKED: 'blocked',
});

export const REWARD_SYNC_ACTIONS = Object.freeze({
  SUBMIT_LEDGER_EVENT: 'submit_ledger_event',
  SUBMIT_PENDING_QUEUE_EVENT: 'submit_pending_queue_event',
  SUBMIT_APPLIED_UNRECORDED_EVENT: 'submit_applied_unrecorded_event',
  SUBMIT_COMPLETED_QUEUE_EVENT: 'submit_completed_queue_event',
  MARK_LOCAL_RECONCILED: 'mark_local_reconciled',
  IGNORE_COMPLETED_LOCAL: 'ignore_completed_local',
});

const SUBMITTABLE_QUEUE_STATUSES = new Set([
  REWARD_QUEUE_ITEM_STATUSES.PENDING,
  REWARD_QUEUE_ITEM_STATUSES.FAILED_RETRYABLE,
]);

const COMPLETED_QUEUE_STATUSES = new Set([
  REWARD_QUEUE_ITEM_STATUSES.PROCESSED,
  REWARD_QUEUE_ITEM_STATUSES.SKIPPED,
  REWARD_QUEUE_ITEM_STATUSES.RECONCILED,
]);

function normalizeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function normalizeEvent(event) {
  if (!event || typeof event !== 'object') return null;
  const key = normalizeString(event.key || event.event_key);
  if (!key) return null;

  return {
    ...event,
    key,
    learnerKey: normalizeString(event.learnerKey || event.learner_key),
  };
}

function normalizeBackendEvents(events = []) {
  return Array.isArray(events)
    ? events.map(normalizeEvent).filter(Boolean)
    : [];
}

function getLocalLedgerEvents(localLedger = {}) {
  return Array.isArray(localLedger.events)
    ? localLedger.events.map(normalizeEvent).filter(Boolean)
    : [];
}

function getLocalQueueItems(localQueue = {}) {
  return Array.isArray(localQueue.items)
    ? localQueue.items.filter((item) => normalizeEvent(item?.event))
    : [];
}

function hasIdentityMismatch(event, learnerKey) {
  return Boolean(event.learnerKey && event.learnerKey !== learnerKey);
}

export function buildRewardSyncPlan({
  learnerKey = '',
  localLedger = {},
  localQueue = {},
  backendEvents = [],
} = {}) {
  const normalizedLearnerKey = normalizeString(learnerKey);
  if (!normalizedLearnerKey) {
    return {
      status: REWARD_SYNC_PLAN_STATUSES.BLOCKED,
      reason: 'missing_learner_key',
      actions: [],
      conflicts: [],
    };
  }

  const serverEvents = normalizeBackendEvents(backendEvents);
  const serverKeys = new Set(serverEvents.map((event) => event.key));
  const ledgerEvents = getLocalLedgerEvents(localLedger);
  const queueItems = getLocalQueueItems(localQueue);
  const plannedKeys = new Set();
  const actions = [];
  const conflicts = [];

  ledgerEvents.forEach((event) => {
    if (hasIdentityMismatch(event, normalizedLearnerKey)) {
      conflicts.push({
        eventKey: event.key,
        reason: 'learner_key_mismatch',
      });
      return;
    }

    plannedKeys.add(event.key);
    actions.push({
      type: serverKeys.has(event.key)
        ? REWARD_SYNC_ACTIONS.MARK_LOCAL_RECONCILED
        : REWARD_SYNC_ACTIONS.SUBMIT_LEDGER_EVENT,
      eventKey: event.key,
      event,
    });
  });

  queueItems.forEach((item) => {
    const event = normalizeEvent(item.event);
    if (!event || plannedKeys.has(event.key)) return;

    if (hasIdentityMismatch(event, normalizedLearnerKey)) {
      conflicts.push({
        eventKey: event.key,
        reason: 'learner_key_mismatch',
      });
      return;
    }

    plannedKeys.add(event.key);

    if (serverKeys.has(event.key)) {
      actions.push({
        type: REWARD_SYNC_ACTIONS.MARK_LOCAL_RECONCILED,
        eventKey: event.key,
        event,
        queueStatus: item.status,
      });
      return;
    }

    if (item.status === REWARD_QUEUE_ITEM_STATUSES.APPLIED_UNRECORDED) {
      actions.push({
        type: REWARD_SYNC_ACTIONS.SUBMIT_APPLIED_UNRECORDED_EVENT,
        eventKey: event.key,
        event,
        queueStatus: item.status,
      });
      return;
    }

    if (SUBMITTABLE_QUEUE_STATUSES.has(item.status)) {
      actions.push({
        type: REWARD_SYNC_ACTIONS.SUBMIT_PENDING_QUEUE_EVENT,
        eventKey: event.key,
        event,
        queueStatus: item.status,
      });
      return;
    }

    if (COMPLETED_QUEUE_STATUSES.has(item.status)) {
      actions.push({
        type: REWARD_SYNC_ACTIONS.SUBMIT_COMPLETED_QUEUE_EVENT,
        eventKey: event.key,
        event,
        queueStatus: item.status,
      });
    }
  });

  return {
    status: conflicts.length > 0
      ? REWARD_SYNC_PLAN_STATUSES.BLOCKED
      : REWARD_SYNC_PLAN_STATUSES.READY,
    reason: conflicts.length > 0 ? 'conflicts_require_review' : null,
    actions,
    conflicts,
    summary: {
      backendEvents: serverEvents.length,
      localLedgerEvents: ledgerEvents.length,
      localQueueItems: queueItems.length,
      actions: actions.length,
      conflicts: conflicts.length,
    },
  };
}
