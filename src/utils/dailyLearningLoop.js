import { LEARNER_READINESS_STATES } from './learnerReadiness';

export function getDailyLearningLoopSteps({
  isLessonDone = false,
  hasLessonQuiz = false,
  masteryStatus = null,
  dueReviewCount = 0,
} = {}) {
  const reviewCount = Math.max(0, Number.isFinite(Number(dueReviewCount)) ? Number(dueReviewCount) : 0);
  const readinessState = masteryStatus?.state;
  const quizReady = readinessState === LEARNER_READINESS_STATES.READY_TO_CONTINUE;
  const needsQuizReview = readinessState === LEARNER_READINESS_STATES.REVIEW_NEEDED
    || readinessState === LEARNER_READINESS_STATES.EVIDENCE_NEEDED;
  const currentStepKey = getCurrentStepKey({
    isLessonDone,
    hasLessonQuiz,
    quizReady,
    reviewCount,
  });

  return [
    {
      key: 'lesson',
      label: 'Lesson',
      state: isLessonDone ? 'Reading saved' : 'Reading in progress',
      detail: isLessonDone
        ? 'Reading progress is saved.'
        : 'Read, build, and mark complete when the idea clicks.',
      tone: isLessonDone ? 'done' : 'active',
    },
    {
      key: 'quiz',
      label: 'Quick check',
      state: !hasLessonQuiz
        ? 'No quick check'
        : quizReady
          ? 'Ready to continue'
          : readinessState === LEARNER_READINESS_STATES.REVIEW_NEEDED
            ? 'Review needed'
            : readinessState === LEARNER_READINESS_STATES.EVIDENCE_NEEDED
              ? 'Evidence needed'
              : 'Quick check next',
      detail: !hasLessonQuiz
        ? 'Use practice or notes for evidence.'
        : quizReady
          ? 'Score is strong enough to move forward.'
          : needsQuizReview
            ? 'Use explanations before continuing.'
            : 'Add a recall check after the lesson.',
      tone: !hasLessonQuiz ? 'neutral' : quizReady ? 'done' : needsQuizReview ? 'attention' : 'active',
    },
    {
      key: 'review',
      label: 'Review',
      state: reviewCount > 0 ? `${reviewCount} due` : 'Clear',
      detail: reviewCount > 0
        ? 'Clear a short review burst before adding more new material.'
        : 'No review cards need attention right now.',
      tone: reviewCount > 0 ? 'attention' : 'done',
    },
    {
      key: 'apply',
      label: 'Apply',
      state: 'Challenge',
      detail: 'Use one small challenge to prove the skill in code.',
      tone: 'neutral',
    },
  ].map((step) => ({
    ...step,
    isCurrent: step.key === currentStepKey,
  }));
}

function getCurrentStepKey({
  isLessonDone,
  hasLessonQuiz,
  quizReady,
  reviewCount,
}) {
  if (!isLessonDone) return 'lesson';
  if (hasLessonQuiz && !quizReady) return 'quiz';
  if (reviewCount > 0) return 'review';
  return 'apply';
}
