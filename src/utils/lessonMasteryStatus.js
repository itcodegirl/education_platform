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
      label: 'Practice evidence',
      detail: 'This lesson has no quick check. Use the build, notes, or a challenge to prove the skill.',
      isReady: Boolean(isLessonDone),
    };
  }

  if (!isLessonDone) {
    return {
      tone: 'neutral',
      label: 'Reading in progress',
      detail: 'Read the lesson, try the build, then complete it to save reading progress.',
      isReady: false,
    };
  }

  const parsed = parseQuizScore(scoreValue);

  if (!parsed) {
    return {
      tone: 'attention',
      label: 'Evidence needed',
      detail: 'Reading progress is saved. Take the quick check before moving too far ahead.',
      isReady: false,
    };
  }

  if (parsed.pct >= LESSON_MASTERY_THRESHOLD) {
    return {
      tone: 'ready',
      label: 'Ready to continue',
      detail: `Quick check ${parsed.pct}%. Continue, then apply it in practice soon.`,
      isReady: true,
    };
  }

  return {
    tone: 'review',
    label: 'Review needed',
    detail: `Quick check ${parsed.pct}%. Review the missed explanations before continuing.`,
    isReady: false,
  };
}
