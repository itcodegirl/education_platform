import { parseQuizScore } from '../services/rewardPolicy';

export const LEARNER_READINESS_STATES = Object.freeze({
  NOT_STARTED: 'not_started',
  READING_IN_PROGRESS: 'reading_in_progress',
  EVIDENCE_NEEDED: 'evidence_needed',
  REVIEW_NEEDED: 'review_needed',
  READY_TO_CONTINUE: 'ready_to_continue',
});

export function getLearnerReadinessLabel(state) {
  switch (state) {
    case LEARNER_READINESS_STATES.NOT_STARTED:
      return 'Not started';
    case LEARNER_READINESS_STATES.READING_IN_PROGRESS:
      return 'Reading in progress';
    case LEARNER_READINESS_STATES.EVIDENCE_NEEDED:
      return 'Evidence needed';
    case LEARNER_READINESS_STATES.REVIEW_NEEDED:
      return 'Review needed';
    case LEARNER_READINESS_STATES.READY_TO_CONTINUE:
      return 'Ready to continue';
    default:
      return 'Evidence needed';
  }
}

export function getLessonReadiness({
  hasLessonQuiz = false,
  isLessonDone = false,
  scoreValue = '',
  masteryThreshold = 80,
} = {}) {
  if (!isLessonDone) {
    return {
      state: LEARNER_READINESS_STATES.READING_IN_PROGRESS,
      label: getLearnerReadinessLabel(LEARNER_READINESS_STATES.READING_IN_PROGRESS),
      parsedScore: null,
    };
  }

  if (!hasLessonQuiz) {
    return {
      state: LEARNER_READINESS_STATES.EVIDENCE_NEEDED,
      label: getLearnerReadinessLabel(LEARNER_READINESS_STATES.EVIDENCE_NEEDED),
      parsedScore: null,
    };
  }

  const parsedScore = parseQuizScore(scoreValue);
  if (!parsedScore) {
    return {
      state: LEARNER_READINESS_STATES.EVIDENCE_NEEDED,
      label: getLearnerReadinessLabel(LEARNER_READINESS_STATES.EVIDENCE_NEEDED),
      parsedScore: null,
    };
  }

  const state = parsedScore.pct >= masteryThreshold
    ? LEARNER_READINESS_STATES.READY_TO_CONTINUE
    : LEARNER_READINESS_STATES.REVIEW_NEEDED;

  return {
    state,
    label: getLearnerReadinessLabel(state),
    parsedScore,
  };
}

export function getDashboardReadiness({
  totalDone = 0,
  masteryEvidence = {},
  srDue = 0,
} = {}) {
  const reviewDue = Math.max(0, Number(srDue) || 0);
  const weakChecks = Number(masteryEvidence.quizChecksNeedsReview || 0);
  const passedChecks = Number(masteryEvidence.quizChecksPassed || 0);
  const completedChallenges = Number(masteryEvidence.completedChallenges || 0);

  if (Number(totalDone) <= 0) {
    return {
      state: LEARNER_READINESS_STATES.NOT_STARTED,
      label: getLearnerReadinessLabel(LEARNER_READINESS_STATES.NOT_STARTED),
      detail: 'Complete one lesson to begin a reliable trail.',
      tone: 'quiet',
    };
  }

  if (reviewDue > 0 || weakChecks > 0) {
    return {
      state: LEARNER_READINESS_STATES.REVIEW_NEEDED,
      label: getLearnerReadinessLabel(LEARNER_READINESS_STATES.REVIEW_NEEDED),
      detail: 'Clear one review card or retry a weak quick check before adding much new material.',
      tone: 'attention',
    };
  }

  if (passedChecks > 0 || completedChallenges > 0) {
    return {
      state: LEARNER_READINESS_STATES.READY_TO_CONTINUE,
      label: getLearnerReadinessLabel(LEARNER_READINESS_STATES.READY_TO_CONTINUE),
      detail: 'Progress and evidence are aligned for the next lesson.',
      tone: 'ready',
    };
  }

  return {
    state: LEARNER_READINESS_STATES.EVIDENCE_NEEDED,
    label: getLearnerReadinessLabel(LEARNER_READINESS_STATES.EVIDENCE_NEEDED),
    detail: 'Reading progress is saved. Add a quick check or challenge next.',
    tone: 'quiet',
  };
}
