import * as progressService from './progressService';
import { getProgressWriteFailure } from './progressWriteRuntime';

const STORAGE_KEY_PREFIX = 'chw-progress-write-queue:';

const PROGRESS_WRITE_HANDLERS = Object.freeze({
  addLesson: {
    dedupeKey: ({ lessonKey }) => `lesson:${lessonKey || ''}`,
    execute: (uid, payload) => progressService.addLesson(uid, payload.lessonKey),
  },
  removeLesson: {
    dedupeKey: ({ lessonKey }) => `lesson:${lessonKey || ''}`,
    execute: (uid, payload) => progressService.removeLesson(uid, payload.lessonKey),
  },
  saveQuizScore: {
    dedupeKey: ({ quizKey }) => `quiz:${quizKey || ''}`,
    execute: (uid, payload) => progressService.saveQuizScore(uid, payload.quizKey, payload.score),
  },
  updateXP: {
    dedupeKey: () => 'xp',
    execute: (uid, payload) => progressService.updateXP(uid, payload.total),
  },
  updateStreak: {
    dedupeKey: () => 'streak',
    execute: (uid, payload) => progressService.updateStreak(uid, payload.days, payload.lastDate),
  },
  updateDailyGoal: {
    dedupeKey: ({ goalDate }) => `daily-goal:${goalDate || ''}`,
    execute: (uid, payload) => progressService.updateDailyGoal(uid, payload.goalDate, payload.count),
  },
  awardBadge: {
    dedupeKey: ({ badgeId }) => `badge:${badgeId || ''}`,
    execute: (uid, payload) => progressService.awardBadge(uid, payload.badgeId),
  },
  addSRCard: {
    dedupeKey: ({ card }) => `sr-add:${card?.question || ''}`,
    execute: (uid, payload) => progressService.addSRCard(uid, payload.card),
  },
  updateSRCard: {
    dedupeKey: ({ question }) => `sr-update:${question || ''}`,
    execute: (uid, payload) => progressService.updateSRCard(uid, payload.question, payload.updates),
  },
  addBookmark: {
    dedupeKey: ({ bookmark }) => `bookmark:${bookmark?.lessonKey || ''}`,
    execute: (uid, payload) => progressService.addBookmark(uid, payload.bookmark),
  },
  removeBookmark: {
    dedupeKey: ({ lessonKey }) => `bookmark:${lessonKey || ''}`,
    execute: (uid, payload) => progressService.removeBookmark(uid, payload.lessonKey),
  },
  saveNote: {
    dedupeKey: ({ lessonKey }) => `note:${lessonKey || ''}`,
    execute: (uid, payload) => progressService.saveNote(uid, payload.lessonKey, payload.content),
  },
  savePosition: {
    dedupeKey: () => 'position',
    execute: (uid, payload) => progressService.savePosition(uid, payload.position),
  },
  trackCourseVisit: {
    dedupeKey: ({ courseId }) => `course-visit:${courseId || ''}`,
    execute: (uid, payload) => progressService.trackCourseVisit(uid, payload.courseId),
  },
});

function getStorage(storage = globalThis.localStorage) {
  return storage || null;
}

function createWriteId() {
  return `pw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getQueueHandler(operation) {
  const handler = PROGRESS_WRITE_HANDLERS[operation];
  if (!handler) {
    throw new Error(`Unsupported progress write operation: ${operation}`);
  }
  return handler;
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }
  return payload;
}

function getErrorMessage(error) {
  if (!error) return 'Unknown progress write failure';
  if (typeof error.message === 'string' && error.message.trim()) return error.message.trim();
  return 'Unknown progress write failure';
}

function normalizeQueueItem(item) {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.operation !== 'string' || !item.operation.trim()) return null;

  let handler;
  try {
    handler = getQueueHandler(item.operation);
  } catch {
    return null;
  }

  const payload = normalizePayload(item.payload);
  const dedupeKey = handler.dedupeKey(payload);

  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : createWriteId(),
    operation: item.operation,
    payload,
    dedupeKey: typeof dedupeKey === 'string' ? dedupeKey : '',
    label:
      typeof item.label === 'string' && item.label.trim()
        ? item.label.trim()
        : item.operation,
    createdAt:
      typeof item.createdAt === 'string' && item.createdAt.trim()
        ? item.createdAt
        : new Date().toISOString(),
    attemptCount: Number.isFinite(item.attemptCount) ? Number(item.attemptCount) : 0,
    lastAttemptAt:
      typeof item.lastAttemptAt === 'string' && item.lastAttemptAt.trim()
        ? item.lastAttemptAt
        : '',
    lastError:
      typeof item.lastError === 'string' && item.lastError.trim()
        ? item.lastError
        : '',
  };
}

function compactProgressWriteQueue(items) {
  const normalized = [];
  const dedupeIndexByKey = new Map();

  for (const item of items) {
    const normalizedItem = normalizeQueueItem(item);
    if (!normalizedItem) continue;

    const key = normalizedItem.dedupeKey;
    if (key && dedupeIndexByKey.has(key)) {
      const index = dedupeIndexByKey.get(key);
      const previous = normalized[index];
      normalized[index] = {
        ...normalizedItem,
        createdAt: previous.createdAt,
      };
      continue;
    }

    if (key) {
      dedupeIndexByKey.set(key, normalized.length);
    }
    normalized.push(normalizedItem);
  }

  return normalized;
}

export function getProgressWriteQueueStorageKey(userId) {
  return `${STORAGE_KEY_PREFIX}${userId || ''}`;
}

export function createProgressWrite(operation, payload, options = {}) {
  const handler = getQueueHandler(operation);
  const normalizedPayload = normalizePayload(payload);
  return {
    id: createWriteId(),
    operation,
    payload: normalizedPayload,
    dedupeKey: handler.dedupeKey(normalizedPayload),
    label:
      typeof options.label === 'string' && options.label.trim()
        ? options.label.trim()
        : operation,
    createdAt: new Date().toISOString(),
    attemptCount: 0,
    lastAttemptAt: '',
    lastError: '',
  };
}

export function readProgressWriteQueue(userId, options = {}) {
  if (!userId) return [];

  const storage = getStorage(options.storage);
  if (!storage) return [];

  try {
    const raw = storage.getItem(getProgressWriteQueueStorageKey(userId));
    if (!raw) return [];
    return compactProgressWriteQueue(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeProgressWriteQueue(userId, items, options = {}) {
  if (!userId) return [];

  const normalizedItems = compactProgressWriteQueue(Array.isArray(items) ? items : []);
  const storage = getStorage(options.storage);
  if (!storage) return normalizedItems;

  if (normalizedItems.length === 0) {
    storage.removeItem(getProgressWriteQueueStorageKey(userId));
    return [];
  }

  storage.setItem(
    getProgressWriteQueueStorageKey(userId),
    JSON.stringify(normalizedItems),
  );
  return normalizedItems;
}

export function enqueueProgressWrite(userId, item, options = {}) {
  const queue = readProgressWriteQueue(userId, options);
  return writeProgressWriteQueue(userId, [...queue, item], options);
}

export function clearProgressWriteQueue(userId, options = {}) {
  return writeProgressWriteQueue(userId, [], options);
}

export async function executeProgressWrite(userId, item) {
  const normalizedItem = normalizeQueueItem(item);
  if (!normalizedItem) {
    throw new Error('Cannot execute an invalid progress write item');
  }

  const handler = getQueueHandler(normalizedItem.operation);
  const result = await handler.execute(userId, normalizedItem.payload);
  const failure = getProgressWriteFailure(result);
  if (failure) throw failure;
  return result;
}

export async function replayProgressWriteQueue(userId, options = {}) {
  const queue = readProgressWriteQueue(userId, options);
  if (queue.length === 0) {
    return {
      processed: 0,
      remaining: 0,
      queue: [],
      failedItem: null,
      error: null,
    };
  }

  const remaining = [...queue];
  let processed = 0;

  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];

    try {
      await executeProgressWrite(userId, item);
      processed += 1;
      remaining.shift();
      writeProgressWriteQueue(userId, remaining, options);
    } catch (error) {
      const failedItem = {
        ...item,
        attemptCount: item.attemptCount + 1,
        lastAttemptAt: new Date().toISOString(),
        lastError: getErrorMessage(error),
      };
      remaining[0] = failedItem;
      writeProgressWriteQueue(userId, remaining, options);
      return {
        processed,
        remaining: remaining.length,
        queue: remaining,
        failedItem,
        error,
      };
    }
  }

  return {
    processed,
    remaining: 0,
    queue: [],
    failedItem: null,
    error: null,
  };
}
