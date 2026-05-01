export const REWARD_LEDGER_STORAGE_PREFIX = 'chw-reward-event-ledger:v1';

export const REWARD_LEDGER_STATUSES = Object.freeze({
  SUCCESS: 'success',
  SKIPPED: 'skipped',
  FAILED: 'failed',
});

const LEDGER_VERSION = 1;

function normalizeString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value.trim();
}

function getStorage(storage = globalThis.localStorage) {
  return storage;
}

export function getRewardLedgerStorageKey(learnerKey) {
  return `${REWARD_LEDGER_STORAGE_PREFIX}:${normalizeString(learnerKey, 'learner key')}`;
}

export function createEmptyRewardLedger() {
  return {
    version: LEDGER_VERSION,
    processedKeys: [],
    events: [],
  };
}

function normalizeRewardEvent(event) {
  if (!event || typeof event !== 'object') return null;
  if (typeof event.key !== 'string' || event.key.trim().length === 0) return null;

  return {
    ...event,
    key: event.key.trim(),
  };
}

export function normalizeRewardLedger(value) {
  const empty = createEmptyRewardLedger();
  if (!value || typeof value !== 'object') return empty;

  const normalizedEvents = Array.isArray(value.events)
    ? value.events.map(normalizeRewardEvent).filter(Boolean)
    : [];
  const eventKeys = normalizedEvents.map((event) => event.key);
  const storedKeys = Array.isArray(value.processedKeys)
    ? value.processedKeys
        .filter((key) => typeof key === 'string' && key.trim().length > 0)
        .map((key) => key.trim())
    : [];
  const processedKeys = Array.from(new Set([...storedKeys, ...eventKeys]));
  const seenEventKeys = new Set();
  const events = normalizedEvents.filter((event) => {
    if (seenEventKeys.has(event.key)) return false;
    seenEventKeys.add(event.key);
    return true;
  });

  return {
    version: LEDGER_VERSION,
    processedKeys,
    events,
  };
}

export function readRewardLedger(learnerKey, options = {}) {
  try {
    const storage = getStorage(options.storage);
    const raw = storage?.getItem(getRewardLedgerStorageKey(learnerKey));
    if (!raw) {
      return {
        status: REWARD_LEDGER_STATUSES.SUCCESS,
        ledger: createEmptyRewardLedger(),
      };
    }

    return {
      status: REWARD_LEDGER_STATUSES.SUCCESS,
      ledger: normalizeRewardLedger(JSON.parse(raw)),
    };
  } catch (error) {
    return {
      status: REWARD_LEDGER_STATUSES.FAILED,
      ledger: createEmptyRewardLedger(),
      error,
    };
  }
}

export function hasProcessedRewardEvent(learnerKey, eventKey, options = {}) {
  const normalizedEventKey = normalizeString(eventKey, 'reward event key');
  const result = readRewardLedger(learnerKey, options);
  if (result.status !== REWARD_LEDGER_STATUSES.SUCCESS) return false;

  return result.ledger.processedKeys.includes(normalizedEventKey);
}

export function recordProcessedRewardEvent(learnerKey, event, options = {}) {
  const normalizedEvent = normalizeRewardEvent(event);
  if (!normalizedEvent) {
    return {
      status: REWARD_LEDGER_STATUSES.FAILED,
      error: new Error('reward event must include a non-empty key'),
    };
  }

  const readResult = readRewardLedger(learnerKey, options);
  if (readResult.status !== REWARD_LEDGER_STATUSES.SUCCESS) {
    return readResult;
  }

  if (readResult.ledger.processedKeys.includes(normalizedEvent.key)) {
    return {
      status: REWARD_LEDGER_STATUSES.SKIPPED,
      ledger: readResult.ledger,
      event: normalizedEvent,
    };
  }

  const nextLedger = normalizeRewardLedger({
    ...readResult.ledger,
    processedKeys: [...readResult.ledger.processedKeys, normalizedEvent.key],
    events: [...readResult.ledger.events, normalizedEvent],
  });

  try {
    const storage = getStorage(options.storage);
    storage?.setItem(getRewardLedgerStorageKey(learnerKey), JSON.stringify(nextLedger));

    return {
      status: REWARD_LEDGER_STATUSES.SUCCESS,
      ledger: nextLedger,
      event: normalizedEvent,
    };
  } catch (error) {
    return {
      status: REWARD_LEDGER_STATUSES.FAILED,
      ledger: readResult.ledger,
      event: normalizedEvent,
      error,
    };
  }
}

