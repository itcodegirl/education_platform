import {
  LEARNER_READINESS_STATES,
  getLessonReadiness,
} from './learnerReadiness';

export const LESSON_MASTERY_THRESHOLD = 80;

export function getLessonMasteryStatus({
  hasLessonQuiz = false,
  isLessonDone = false,
  scoreValue = '',
} = {}) {
  const readiness = getLessonReadiness({
    hasLessonQuiz,
    isLessonDone,
    scoreValue,
    masteryThreshold: LESSON_MASTERY_THRESHOLD,
  });

  if (readiness.state === LEARNER_READINESS_STATES.READING_IN_PROGRESS) {
    return {
      state: readiness.state,
      tone: 'neutral',
      label: readiness.label,
      detail: 'Read the lesson, try the build, then complete it to save reading progress.',
      isReady: false,
    };
  }

  if (!hasLessonQuiz) {
    return {
      state: readiness.state,
      tone: 'attention',
      label: readiness.label,
      detail: 'This lesson has no quick check. Use the build, notes, or a challenge to prove the skill.',
      isReady: false,
    };
  }

  if (readiness.state === LEARNER_READINESS_STATES.EVIDENCE_NEEDED) {
    return {
      state: readiness.state,
      tone: 'attention',
      label: readiness.label,
      detail: 'Reading progress is saved. Take the quick check before moving too far ahead.',
      isReady: false,
    };
  }

  if (readiness.state === LEARNER_READINESS_STATES.READY_TO_CONTINUE) {
    return {
      state: readiness.state,
      tone: 'ready',
      label: readiness.label,
      detail: `Quick check ${readiness.parsedScore?.pct}%. Continue, then apply it in practice soon.`,
      isReady: true,
    };
  }

  return {
    state: readiness.state,
    tone: 'review',
    label: readiness.label,
    detail: `Quick check ${readiness.parsedScore?.pct}%. Review the missed explanations before continuing.`,
    isReady: false,
  };
}
