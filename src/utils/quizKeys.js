import { parseQuizScore } from '../services/rewardPolicy';

const VALID_QUIZ_KEY_TYPES = new Set(['l', 'm']);

function normalizePart(value) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
}

export function buildStableQuizKey(type, courseId, entityId) {
  const normalizedType = normalizePart(type);
  const normalizedCourseId = normalizePart(courseId);
  const normalizedEntityId = normalizePart(entityId);

  if (
    !VALID_QUIZ_KEY_TYPES.has(normalizedType) ||
    !normalizedCourseId ||
    !normalizedEntityId
  ) {
    return '';
  }

  return `${normalizedType}:${normalizedCourseId}:${normalizedEntityId}`;
}

export function buildLegacyQuizKey(type, entityId) {
  const normalizedType = normalizePart(type);
  const normalizedEntityId = normalizePart(entityId);

  if (!VALID_QUIZ_KEY_TYPES.has(normalizedType) || !normalizedEntityId) {
    return '';
  }

  return `${normalizedType}:${normalizedEntityId}`;
}

export function parseQuizKey(quizKey) {
  const normalizedQuizKey = normalizePart(quizKey);
  const parts = normalizedQuizKey.split(':');
  const type = parts[0] || '';

  if (!VALID_QUIZ_KEY_TYPES.has(type) || parts.length < 2) {
    return { type: '', courseId: '', entityId: normalizedQuizKey, isStable: false };
  }

  if (parts.length >= 3) {
    return {
      type,
      courseId: parts[1] || '',
      entityId: parts.slice(2).join(':'),
      isStable: true,
    };
  }

  return {
    type,
    courseId: '',
    entityId: parts[1] || '',
    isStable: false,
  };
}

export function getQuizKeyCandidates(primaryQuizKey, legacyQuizKeys = []) {
  return Array.from(
    new Set(
      [primaryQuizKey, ...(Array.isArray(legacyQuizKeys) ? legacyQuizKeys : [])]
        .map(normalizePart)
        .filter(Boolean),
    ),
  );
}

function compareParsedQuizScores(leftScoreValue, rightScoreValue) {
  const left = parseQuizScore(leftScoreValue);
  const right = parseQuizScore(rightScoreValue);

  if (left && right) {
    if (left.pct !== right.pct) return left.pct - right.pct;
    return left.score - right.score;
  }

  if (left && !right) return 1;
  if (!left && right) return -1;
  return String(leftScoreValue || '').localeCompare(String(rightScoreValue || ''));
}

export function getBestQuizScoreValue(quizScores = {}, quizKeys = []) {
  let bestScore = null;

  for (const quizKey of getQuizKeyCandidates('', quizKeys)) {
    const scoreValue = quizScores?.[quizKey];
    if (typeof scoreValue !== 'string' || !scoreValue.trim()) continue;
    if (bestScore === null || compareParsedQuizScores(scoreValue, bestScore) > 0) {
      bestScore = scoreValue;
    }
  }

  return bestScore;
}

