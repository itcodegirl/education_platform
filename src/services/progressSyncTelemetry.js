import { trackEvent } from '../lib/analytics';

const MAX_SAFE_LABEL_CHARS = 80;

function normalizeCount(value) {
  return Number.isFinite(value) && value >= 0 ? Number(value) : 0;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().slice(0, MAX_SAFE_LABEL_CHARS) : '';
}

function classifyFailureSource(label) {
  const normalizedLabel = normalizeText(label).toLowerCase();
  if (!normalizedLabel) return 'unknown';
  if (normalizedLabel.includes('local-storage') || normalizedLabel.includes('localstorage')) {
    return 'local_storage';
  }
  if (normalizedLabel.includes('retry')) return 'retry';
  if (normalizedLabel.includes('reward queue')) return 'reward_queue';
  if (normalizedLabel.includes('reward event')) return 'reward_event';
  if (normalizedLabel.includes('backend reward')) return 'backend_reward';
  if (normalizedLabel.includes('reward-history')) return 'reward_history';
  if (normalizedLabel.includes('challenge')) return 'challenge_completion';
  if (normalizedLabel.includes('bookmark')) return 'bookmark';
  if (normalizedLabel.includes('note')) return 'note';
  if (normalizedLabel.includes('lesson')) return 'lesson_progress';
  if (normalizedLabel.includes('position')) return 'last_position';
  if (normalizedLabel.includes('quiz')) return 'quiz_score';
  if (normalizedLabel.includes('xp')) return 'xp';
  if (normalizedLabel.includes('streak') || normalizedLabel.includes('daily')) return 'activity';
  return 'progress_write';
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

export function trackProgressSyncFailure({ label = '', pendingCount = 0 } = {}) {
  trackEvent('progress_sync_failure_visible', {
    source: classifyFailureSource(label),
    pendingCount: normalizeCount(pendingCount),
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
