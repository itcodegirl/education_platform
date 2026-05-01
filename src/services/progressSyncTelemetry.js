import { trackEvent } from '../lib/analytics';

const MAX_SAFE_LABEL_CHARS = 80;

function normalizeCount(value) {
  return Number.isFinite(value) && value >= 0 ? Number(value) : 0;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().slice(0, MAX_SAFE_LABEL_CHARS) : '';
}

function getErrorName(error) {
  if (!error || typeof error !== 'object') return '';
  return normalizeText(error.name || error.constructor?.name || '');
}

function getFailedItemSummary(item) {
  if (!item || typeof item !== 'object') return {};

  return {
    failedOperation: normalizeText(item.operation),
    failedLabel: normalizeText(item.label),
    failedAttemptCount: normalizeCount(item.attemptCount),
  };
}

export function trackProgressSyncQueued({ operation = '', label = '', queueSize = 0 } = {}) {
  trackEvent('progress_sync_queued', {
    operation: normalizeText(operation),
    label: normalizeText(label),
    queueSize: normalizeCount(queueSize),
  });
}

export function trackProgressSyncReplay({
  trigger = 'manual',
  processed = 0,
  remaining = 0,
  failedItem = null,
  error = null,
} = {}) {
  const safeRemaining = normalizeCount(remaining);
  const failedSummary = getFailedItemSummary(failedItem);
  const status = error || safeRemaining > 0 ? 'failed' : 'completed';

  trackEvent('progress_sync_replay', {
    trigger: normalizeText(trigger) || 'manual',
    status,
    processed: normalizeCount(processed),
    remaining: safeRemaining,
    errorName: getErrorName(error),
    ...failedSummary,
  });
}
