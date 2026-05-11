import { parseQuizScore } from '../services/rewardPolicy';

export const MASTERY_READY_PERCENT = 80;

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeQuizResult(result) {
  if (!result) return null;

  if (Number.isFinite(result.percent)) {
    return {
      ...result,
      percent: toFiniteNumber(result.percent),
    };
  }

  const parsed = parseQuizScore(result.scoreValue);
  if (!parsed) return null;

  return {
    ...result,
    got: parsed.score,
    total: parsed.total,
    percent: parsed.pct,
  };
}

function getCompletedChallengeCount(challengeCompletions = [], challenges = []) {
  const completedIds = new Set(
    (Array.isArray(challengeCompletions) ? challengeCompletions : [])
      .map((challengeId) => String(challengeId || '').trim())
      .filter(Boolean),
  );

  if (Array.isArray(challenges) && challenges.length > 0) {
    return challenges.filter((challenge) => completedIds.has(String(challenge?.id || ''))).length;
  }

  return completedIds.size;
}

function getEvidenceStage({
  lessonCount,
  evidenceCoverage,
  dueReviewCards,
  quizChecksNeedsReview,
  completedChallenges,
}) {
  if (lessonCount === 0) {
    return {
      stage: 'not-started',
      stageLabel: 'No evidence yet',
      nextEvidenceAction: 'Complete one lesson, then add a quick check or saved note as evidence.',
    };
  }

  if (dueReviewCards > 0 || quizChecksNeedsReview > 0) {
    return {
      stage: 'review',
      stageLabel: 'Review evidence due',
      nextEvidenceAction: 'Clear one review card or retry one missed quick check before adding new lessons.',
    };
  }

  if (evidenceCoverage >= 80 && completedChallenges > 0) {
    return {
      stage: 'applied',
      stageLabel: 'Applied evidence',
      nextEvidenceAction: 'Turn one strong challenge into a portfolio note or small project artifact.',
    };
  }

  if (evidenceCoverage >= 50) {
    return {
      stage: 'practicing',
      stageLabel: 'Practice evidence building',
      nextEvidenceAction: 'Add one applied challenge or explain one solved quiz in your own words.',
    };
  }

  return {
    stage: 'introduced',
    stageLabel: 'Introduced, not proven',
    nextEvidenceAction: 'Pair the next completed lesson with a quick check or challenge attempt.',
  };
}

export function summarizeMasteryEvidence({
  quizResults = [],
  completedLessonCount = 0,
  challengeCompletions = [],
  challenges = [],
  srCards = [],
  now = Date.now(),
} = {}) {
  const normalizedQuizResults = (Array.isArray(quizResults) ? quizResults : [])
    .map(normalizeQuizResult)
    .filter(Boolean);
  const quizChecksPassed = normalizedQuizResults.filter(
    (result) => result.percent >= MASTERY_READY_PERCENT,
  ).length;
  const quizChecksNeedsReview = normalizedQuizResults.length - quizChecksPassed;
  const completedChallenges = getCompletedChallengeCount(challengeCompletions, challenges);
  const dueReviewCards = (Array.isArray(srCards) ? srCards : []).filter((card) =>
    toFiniteNumber(card?.nextReview, Number.POSITIVE_INFINITY) <= now,
  ).length;
  const totalReviewCards = Array.isArray(srCards) ? srCards.length : 0;
  const evidenceSignals = quizChecksPassed + completedChallenges;
  const lessonCount = Math.max(0, toFiniteNumber(completedLessonCount));
  const evidenceCoverage = lessonCount > 0
    ? Math.min(100, Math.round((evidenceSignals / lessonCount) * 100))
    : 0;

  let status = 'Start with one lesson, then add a quick check.';
  if (lessonCount > 0 && evidenceCoverage >= 80 && dueReviewCards === 0) {
    status = 'Strong evidence. Keep applying it in challenges.';
  } else if (lessonCount > 0 && evidenceCoverage >= 50) {
    status = 'Building evidence. Review misses before moving too fast.';
  } else if (lessonCount > 0) {
    status = 'Needs more evidence. Add quick checks or a challenge.';
  }
  const evidenceStage = getEvidenceStage({
    lessonCount,
    evidenceCoverage,
    dueReviewCards,
    quizChecksNeedsReview,
    completedChallenges,
  });

  return {
    threshold: MASTERY_READY_PERCENT,
    quizChecksAttempted: normalizedQuizResults.length,
    quizChecksPassed,
    quizChecksNeedsReview,
    completedChallenges,
    totalChallenges: Array.isArray(challenges) ? challenges.length : 0,
    dueReviewCards,
    totalReviewCards,
    evidenceSignals,
    evidenceCoverage,
    ...evidenceStage,
    status,
  };
}
