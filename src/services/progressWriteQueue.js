import * as progressService from './progressService';
import { getProgressWriteFailure } from './progressWriteRuntime';

const STORAGE_KEY_PREFIX = 'chw-progress-write-queue:';
const MAX_QUEUE_ITEMS = 100;
const MAX_QUEUE_ITEM_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 10 * 60 * 1000;
const MAX_SHORT_TEXT_LENGTH = 500;
const MAX_NOTE_LENGTH = 20_000;
const MAX_XP_TOTAL = 1_000_000;
const MAX_STREAK_DAYS = 3650;
const MAX_DAILY_COUNT = 500;
const MAX_VARIANT_KEYS = 12;

const PROGRESS_WRITE_HANDLERS = Object.freeze({
  addLesson: {
    dedupeKey: ({ lessonKey }) => `lesson:${lessonKey || ''}`,
    execute: (uid, payload) => progressService.addLesson(uid, payload.lessonKey),
  },
  removeLesson: {
    dedupeKey: ({ lessonKey }) => `lesson:${lessonKey || ''}`,
    execute: (uid, payload) => progressService.removeLesson(uid, payload.lessonKey),
  },
  removeLessonVariants: {
    dedupeKey: ({ dedupeLessonKey, lessonKeys }) =>
      `lesson:${dedupeLessonKey || lessonKeys?.[0] || ''}`,
    execute: (uid, payload) => progressService.removeLessonsByKeys(uid, payload.lessonKeys),
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
  removeBookmarkVariants: {
    dedupeKey: ({ dedupeLessonKey, lessonKeys }) =>
      `bookmark:${dedupeLessonKey || lessonKeys?.[0] || ''}`,
    execute: (uid, payload) => progressService.removeBookmarksByKeys(uid, payload.lessonKeys),
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

function cleanText(value, { maxLength = MAX_SHORT_TEXT_LENGTH, required = true } = {}) {
  if (typeof value !== 'string') return required ? null : '';
  const trimmed = value.trim();
  if (!trimmed) return required ? null : '';
  if (trimmed.length > maxLength) return null;
  return trimmed;
}

function cleanInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || !Number.isInteger(number)) return null;
  if (number < min || number > max) return null;
  return number;
}

function cleanNumber(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  if (number < min || number > max) return null;
  return number;
}

function cleanDate(value) {
  const text = cleanText(value, { maxLength: 10 });
  if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const parsed = Date.parse(`${text}T00:00:00.000Z`);
  return Number.isFinite(parsed) ? text : null;
}

function cleanTimestamp(value) {
  const text = cleanText(value, { maxLength: 40 });
  if (!text) return null;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function cleanStringArray(values, limit = MAX_VARIANT_KEYS) {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .slice(0, limit)
        .map((value) => cleanText(value))
        .filter(Boolean),
    ),
  );
}

function cleanQuizScore(score) {
  if (typeof score === 'number') {
    return cleanNumber(score, { min: 0, max: 100 });
  }

  const text = cleanText(score, { maxLength: 40 });
  if (!text) return null;

  if (/^\d{1,3}\/\d{1,3}$/.test(text)) {
    const [earned, total] = text.split('/').map(Number);
    if (total > 0 && earned >= 0 && earned <= total) return text;
    return null;
  }

  const numeric = Number(text);
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 100 ? text : null;
}

function cleanSRCard(card) {
  if (!card || typeof card !== 'object' || Array.isArray(card)) return null;
  const question = cleanText(card.question);
  if (!question) return null;

  return {
    question,
    code: cleanText(card.code, { maxLength: MAX_NOTE_LENGTH, required: false }) || null,
    options: Array.isArray(card.options) ? card.options.slice(0, 12) : [],
    correct: card.correct,
    explanation: cleanText(card.explanation, { maxLength: MAX_NOTE_LENGTH, required: false }),
    source: cleanText(card.source, { required: false }),
  };
}

function cleanSRUpdates(updates) {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) return null;

  const next = {};
  const nextReview = cleanTimestamp(updates.next_review);
  const intervalDays = cleanInteger(updates.interval_days, { min: 0, max: MAX_STREAK_DAYS });
  const ease = cleanNumber(updates.ease, { min: 1, max: 5 });

  if (nextReview) next.next_review = nextReview;
  if (intervalDays !== null) next.interval_days = intervalDays;
  if (ease !== null) next.ease = ease;

  return Object.keys(next).length > 0 ? next : null;
}

function cleanPosition(position) {
  if (!position || typeof position !== 'object' || Array.isArray(position)) return null;

  const course = cleanInteger(position.course, { min: 0, max: 100 });
  const mod = cleanInteger(position.mod, { min: 0, max: 1000 });
  const les = cleanInteger(position.les, { min: 0, max: 1000 });
  if (course === null || mod === null || les === null) return null;

  return {
    course,
    mod,
    les,
    courseId: cleanText(position.courseId, { required: false }),
    moduleId: cleanText(position.moduleId, { required: false }),
    lessonId: cleanText(position.lessonId, { required: false }),
    isModuleQuiz: Boolean(position.isModuleQuiz),
  };
}

function cleanBookmark(bookmark) {
  if (!bookmark || typeof bookmark !== 'object' || Array.isArray(bookmark)) return null;

  const lessonKey = cleanText(bookmark.lessonKey);
  const courseId = cleanText(bookmark.courseId);
  const lessonTitle = cleanText(bookmark.lessonTitle);
  if (!lessonKey || !courseId || !lessonTitle) return null;

  return { lessonKey, courseId, lessonTitle };
}

function sanitizePayload(operation, payload) {
  switch (operation) {
    case 'addLesson':
    case 'removeLesson': {
      const lessonKey = cleanText(payload.lessonKey);
      return lessonKey ? { lessonKey } : null;
    }
    case 'removeLessonVariants': {
      const lessonKeys = cleanStringArray(payload.lessonKeys);
      if (lessonKeys.length === 0) return null;
      const dedupeLessonKey = cleanText(payload.dedupeLessonKey, { required: false });
      return { lessonKeys, dedupeLessonKey: dedupeLessonKey || lessonKeys[0] };
    }
    case 'saveQuizScore': {
      const quizKey = cleanText(payload.quizKey);
      const score = cleanQuizScore(payload.score);
      return quizKey && score !== null ? { quizKey, score } : null;
    }
    case 'updateXP': {
      const total = cleanInteger(payload.total, { min: 0, max: MAX_XP_TOTAL });
      return total !== null ? { total } : null;
    }
    case 'updateStreak': {
      const days = cleanInteger(payload.days, { min: 0, max: MAX_STREAK_DAYS });
      const lastDate = cleanDate(payload.lastDate);
      return days !== null && lastDate ? { days, lastDate } : null;
    }
    case 'updateDailyGoal': {
      const goalDate = cleanDate(payload.goalDate);
      const count = cleanInteger(payload.count, { min: 0, max: MAX_DAILY_COUNT });
      return goalDate && count !== null ? { goalDate, count } : null;
    }
    case 'awardBadge': {
      const badgeId = cleanText(payload.badgeId);
      return badgeId ? { badgeId } : null;
    }
    case 'addSRCard': {
      const card = cleanSRCard(payload.card);
      return card ? { card } : null;
    }
    case 'updateSRCard': {
      const question = cleanText(payload.question);
      const updates = cleanSRUpdates(payload.updates);
      return question && updates ? { question, updates } : null;
    }
    case 'addBookmark': {
      const bookmark = cleanBookmark(payload.bookmark);
      return bookmark ? { bookmark } : null;
    }
    case 'removeBookmark': {
      const lessonKey = cleanText(payload.lessonKey);
      return lessonKey ? { lessonKey } : null;
    }
    case 'removeBookmarkVariants': {
      const lessonKeys = cleanStringArray(payload.lessonKeys);
      if (lessonKeys.length === 0) return null;
      const dedupeLessonKey = cleanText(payload.dedupeLessonKey, { required: false });
      return { lessonKeys, dedupeLessonKey: dedupeLessonKey || lessonKeys[0] };
    }
    case 'saveNote': {
      const lessonKey = cleanText(payload.lessonKey);
      const content = cleanText(payload.content, { maxLength: MAX_NOTE_LENGTH, required: false });
      return lessonKey ? { lessonKey, content } : null;
    }
    case 'savePosition': {
      const position = cleanPosition(payload.position);
      return position ? { position } : null;
    }
    case 'trackCourseVisit': {
      const courseId = cleanText(payload.courseId);
      return courseId ? { courseId } : null;
    }
    default:
      return null;
  }
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
  const sanitizedPayload = sanitizePayload(item.operation, payload);
  if (!sanitizedPayload) return null;

  const createdAt =
    typeof item.createdAt === 'string' && item.createdAt.trim()
      ? item.createdAt.trim()
      : new Date().toISOString();
  const createdAtMs = Date.parse(createdAt);
  const now = Date.now();
  if (!Number.isFinite(createdAtMs)) return null;
  if (createdAtMs < now - MAX_QUEUE_ITEM_AGE_MS) return null;
  if (createdAtMs > now + MAX_FUTURE_SKEW_MS) return null;

  const dedupeKey = handler.dedupeKey(sanitizedPayload);
  const attemptCount = cleanInteger(item.attemptCount, { min: 0, max: 1000 });

  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : createWriteId(),
    operation: item.operation,
    payload: sanitizedPayload,
    dedupeKey: typeof dedupeKey === 'string' ? dedupeKey : '',
    label:
      typeof item.label === 'string' && item.label.trim()
        ? item.label.trim()
        : item.operation,
    createdAt,
    attemptCount: attemptCount ?? 0,
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
  const sourceItems = Array.isArray(items) ? items : [];

  for (const item of sourceItems.slice(-MAX_QUEUE_ITEMS * 2)) {
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

  return normalized.slice(-MAX_QUEUE_ITEMS);
}

export function getProgressWriteQueueStorageKey(userId) {
  return `${STORAGE_KEY_PREFIX}${userId || ''}`;
}

export function createProgressWrite(operation, payload, options = {}) {
  const handler = getQueueHandler(operation);
  const normalizedPayload = normalizePayload(payload);
  const sanitizedPayload = sanitizePayload(operation, normalizedPayload);
  if (!sanitizedPayload) {
    throw new Error(`Invalid progress write payload for operation: ${operation}`);
  }
  return {
    id: createWriteId(),
    operation,
    payload: sanitizedPayload,
    dedupeKey: handler.dedupeKey(sanitizedPayload),
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

  try {
    storage.setItem(
      getProgressWriteQueueStorageKey(userId),
      JSON.stringify(normalizedItems),
    );
  } catch (err) {
    throw new Error(`Progress write queue storage full: ${err.message}`);
  }
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
