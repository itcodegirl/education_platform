import { parseQuizScore } from '../services/rewardPolicy';

export const LESSON_MASTERY_THRESHOLD = 80;

export function getLessonMasteryStatus({
  hasLessonQuiz = false,
  isLessonDone = false,
  scoreValue = '',
} = {}) {
  if (!hasLessonQuiz) {
    return {
      tone: 'neutral',
      label: 'Practice signal',
      detail: 'This lesson has no quick check. Use the build, notes, or a challenge as your evidence.',
      isReady: Boolean(isLessonDone),
    };
  }

  if (!isLessonDone) {
    return {
      tone: 'neutral',
      label: 'First pass',
      detail: 'Read the lesson and try the build before using the quick check as evidence.',
      isReady: false,
    };
  }

  const parsed = parseQuizScore(scoreValue);

  if (!parsed) {
    return {
      tone: 'attention',
      label: 'Evidence next',
      detail: 'Reading progress is saved. Take the quick check before moving too far ahead.',
      isReady: false,
    };
  }

  if (parsed.pct >= LESSON_MASTERY_THRESHOLD) {
    return {
      tone: 'ready',
      label: 'Ready signal',
      detail: `Quick check ${parsed.pct}%. Continue, then apply it in practice soon.`,
      isReady: true,
    };
  }

  return {
    tone: 'review',
    label: 'Review loop',
    detail: `Quick check ${parsed.pct}%. Review the missed explanations before continuing.`,
    isReady: false,
  };
}
