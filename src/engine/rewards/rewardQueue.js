export const REWARD_QUEUE_STORAGE_PREFIX = 'chw-reward-event-queue:v1';

export const REWARD_QUEUE_ITEM_STATUSES = Object.freeze({
  PENDING: 'pending',
  PROCESSED: 'processed',
  SKIPPED: 'skipped',
  FAILED_RETRYABLE: 'failed_retryable',
  FAILED_TERMINAL: 'failed_terminal',
  APPLIED_UNRECORDED: 'applied_unrecorded',
  RECONCILED: 'reconciled',
});

export const REWARD_QUEUE_RESULT_STATUSES = Object.freeze({
  SUCCESS: 'success',
  SKIPPED: 'skipped',
  FAILED: 'failed',
});

const QUEUE_VERSION = 1;

function normalizeString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value.trim();
}

function getStorage(storage = globalThis.localStorage) {
  return storage;
}

function getTimestamp(now = new Date()) {
  return now instanceof Date ? now.toISOString() : new Date(now).toISOString();
}

function isQueueItemStatus(status) {
  return Object.values(REWARD_QUEUE_ITEM_STATUSES).includes(status);
}

function normalizeRewardEvent(event) {
  if (!event || typeof event !== 'object') return null;
  if (typeof event.key !== 'string' || event.key.trim().length === 0) return null;

  return {
    ...event,
    key: event.key.trim(),
  };
}

export function getRewardQueueStorageKey(learnerKey) {
  return `${REWARD_QUEUE_STORAGE_PREFIX}:${normalizeString(learnerKey, 'learner key')}`;
}

export function createEmptyRewardQueue() {
  return {
    version: QUEUE_VERSION,
    items: [],
  };
}

export function createRewardQueueItem({
  event,
  legacyRewardKey,
  status = REWARD_QUEUE_ITEM_STATUSES.PENDING,
  attemptCount = 0,
  lastAttemptAt = null,
  nextRetryAt = null,
  lastErrorPhase = null,
  lastErrorMessage = null,
  createdAt,
  updatedAt,
  now,
}) {
  const normalizedEvent = normalizeRewardEvent(event);
  if (!normalizedEvent) {
    throw new Error('reward queue item event must include a non-empty key');
  }

  const timestamp = getTimestamp(now);
  return {
    event: normalizedEvent,
    legacyRewardKey: typeof legacyRewardKey === 'string' ? legacyRewardKey.trim() : '',
    status: isQueueItemStatus(status) ? status : REWARD_QUEUE_ITEM_STATUSES.PENDING,
    attemptCount: Number.isInteger(attemptCount) && attemptCount >= 0 ? attemptCount : 0,
    lastAttemptAt: typeof lastAttemptAt === 'string' && lastAttemptAt.trim() ? lastAttemptAt : null,
    nextRetryAt: typeof nextRetryAt === 'string' && nextRetryAt.trim() ? nextRetryAt : null,
    lastErrorPhase: typeof lastErrorPhase === 'string' && lastErrorPhase.trim() ? lastErrorPhase : null,
    lastErrorMessage: typeof lastErrorMessage === 'string' && lastErrorMessage.trim() ? lastErrorMessage : null,
    createdAt: typeof createdAt === 'string' && createdAt.trim() ? createdAt : timestamp,
    updatedAt: typeof updatedAt === 'string' && updatedAt.trim() ? updatedAt : timestamp,
  };
}

export function normalizeRewardQueue(value) {
  if (!value || typeof value !== 'object') return createEmptyRewardQueue();

  const items = Array.isArray(value.items)
    ? value.items
        .map((item) => {
          try {
            return createRewardQueueItem(item);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    : [];

  const byEventKey = new Map();
  items.forEach((item) => {
    byEventKey.set(item.event.key, item);
  });

  return {
    version: QUEUE_VERSION,
    items: Array.from(byEventKey.values()),
  };
}

export function readRewardQueue(learnerKey, options = {}) {
  try {
    const storage = getStorage(options.storage);
    const raw = storage?.getItem(getRewardQueueStorageKey(learnerKey));
    if (!raw) {
      return {
        status: REWARD_QUEUE_RESULT_STATUSES.SUCCESS,
        queue: createEmptyRewardQueue(),
      };
    }

    return {
      status: REWARD_QUEUE_RESULT_STATUSES.SUCCESS,
      queue: normalizeRewardQueue(JSON.parse(raw)),
    };
  } catch (error) {
    return {
      status: REWARD_QUEUE_RESULT_STATUSES.FAILED,
      queue: createEmptyRewardQueue(),
      error,
    };
  }
}

export function writeRewardQueue(learnerKey, queue, options = {}) {
  const normalizedQueue = normalizeRewardQueue(queue);

  try {
    const storage = getStorage(options.storage);
    storage?.setItem(getRewardQueueStorageKey(learnerKey), JSON.stringify(normalizedQueue));

    return {
      status: REWARD_QUEUE_RESULT_STATUSES.SUCCESS,
      queue: normalizedQueue,
    };
  } catch (error) {
    return {
      status: REWARD_QUEUE_RESULT_STATUSES.FAILED,
      queue: normalizedQueue,
      error,
    };
  }
}

export function upsertRewardQueueItem(learnerKey, item, options = {}) {
  let normalizedItem;
  try {
    normalizedItem = createRewardQueueItem(item);
  } catch (error) {
    return {
      status: REWARD_QUEUE_RESULT_STATUSES.FAILED,
      error,
    };
  }

  const readResult = readRewardQueue(learnerKey, options);
  if (readResult.status !== REWARD_QUEUE_RESULT_STATUSES.SUCCESS) return readResult;

  const existing = readResult.queue.items.find((queueItem) =>
    queueItem.event.key === normalizedItem.event.key,
  );
  const nextItem = existing
    ? createRewardQueueItem({
        ...existing,
        ...normalizedItem,
        createdAt: existing.createdAt,
      })
    : normalizedItem;
  const nextItems = [
    ...readResult.queue.items.filter((queueItem) => queueItem.event.key !== nextItem.event.key),
    nextItem,
  ];

  const writeResult = writeRewardQueue(learnerKey, {
    ...readResult.queue,
    items: nextItems,
  }, options);

  return {
    ...writeResult,
    item: nextItem,
  };
}

export function markRewardQueueItem(learnerKey, eventKey, updates, options = {}) {
  const normalizedEventKey = normalizeString(eventKey, 'reward event key');
  const readResult = readRewardQueue(learnerKey, options);
  if (readResult.status !== REWARD_QUEUE_RESULT_STATUSES.SUCCESS) return readResult;

  const existing = readResult.queue.items.find((item) => item.event.key === normalizedEventKey);
  if (!existing) {
    return {
      status: REWARD_QUEUE_RESULT_STATUSES.SKIPPED,
      queue: readResult.queue,
    };
  }

  const nextItem = createRewardQueueItem({
    ...existing,
    ...updates,
    event: existing.event,
    legacyRewardKey: updates?.legacyRewardKey ?? existing.legacyRewardKey,
    createdAt: existing.createdAt,
    updatedAt: updates?.updatedAt,
  });
  const writeResult = writeRewardQueue(learnerKey, {
    ...readResult.queue,
    items: readResult.queue.items.map((item) =>
      item.event.key === normalizedEventKey ? nextItem : item,
    ),
  }, options);

  return {
    ...writeResult,
    item: nextItem,
  };
}

