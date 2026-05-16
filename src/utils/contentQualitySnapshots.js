export const CONTENT_QUALITY_SNAPSHOT_KEY = 'codeherway.contentQualitySnapshots.v1';

const MAX_SNAPSHOTS = 12;

function toCount(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function normalizeCounts(entries = []) {
  return Object.fromEntries(
    entries
      .filter((entry) => entry?.name)
      .map((entry) => [entry.name, toCount(entry.count)])
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function buildSignature(snapshot) {
  const courseCounts = Object.entries(snapshot.courseCounts || {})
    .map(([name, count]) => `${name}:${count}`)
    .join('|');
  return [
    snapshot.warningCount,
    snapshot.quizGapCount,
    snapshot.lessonGapCount,
    snapshot.topMissingSignal,
    courseCounts,
  ].join(':');
}

function getDefaultStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
}

function normalizeSnapshot(value) {
  if (!value || typeof value !== 'object') return null;
  const snapshot = {
    generatedAt: String(value.generatedAt || ''),
    warningCount: toCount(value.warningCount),
    quizGapCount: toCount(value.quizGapCount),
    lessonGapCount: toCount(value.lessonGapCount),
    topMissingSignal: String(value.topMissingSignal || ''),
    courseCounts: normalizeCounts(
      Object.entries(value.courseCounts || {}).map(([name, count]) => ({ name, count })),
    ),
  };
  snapshot.signature = value.signature || buildSignature(snapshot);
  return snapshot;
}

export function buildContentQualitySnapshot(report = {}, generatedAt = new Date().toISOString()) {
  const snapshot = {
    generatedAt,
    warningCount: toCount(report.warningCount),
    quizGapCount: toCount(report.quizGapCount),
    lessonGapCount: toCount(report.lessonGapCount),
    topMissingSignal: String(report.missingSignals?.[0]?.name || ''),
    courseCounts: normalizeCounts(report.warningsByCourse || []),
  };
  snapshot.signature = buildSignature(snapshot);
  return snapshot;
}

export function compareContentQualitySnapshots(current, previous) {
  if (!current || !previous) {
    return {
      hasPrevious: false,
      warningDelta: 0,
      quizGapDelta: 0,
      lessonGapDelta: 0,
    };
  }

  return {
    hasPrevious: true,
    warningDelta: toCount(current.warningCount) - toCount(previous.warningCount),
    quizGapDelta: toCount(current.quizGapCount) - toCount(previous.quizGapCount),
    lessonGapDelta: toCount(current.lessonGapCount) - toCount(previous.lessonGapCount),
  };
}

export function loadContentQualitySnapshots(storage = getDefaultStorage()) {
  if (!storage) return [];

  try {
    const parsed = JSON.parse(storage.getItem(CONTENT_QUALITY_SNAPSHOT_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeSnapshot)
      .filter(Boolean)
      .slice(0, MAX_SNAPSHOTS);
  } catch {
    return [];
  }
}

export function saveContentQualitySnapshot(
  report = {},
  storage = getDefaultStorage(),
  generatedAt = new Date().toISOString(),
) {
  const current = buildContentQualitySnapshot(report, generatedAt);
  if (!storage) return [current];

  const existing = loadContentQualitySnapshots(storage);
  if (existing[0]?.signature === current.signature) {
    return existing;
  }

  const next = [
    current,
    ...existing.filter((snapshot) => snapshot.signature !== current.signature),
  ].slice(0, MAX_SNAPSHOTS);

  try {
    storage.setItem(CONTENT_QUALITY_SNAPSHOT_KEY, JSON.stringify(next));
  } catch {
    return existing.length > 0 ? existing : [current];
  }

  return next;
}
