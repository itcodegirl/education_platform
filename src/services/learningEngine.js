// ═══════════════════════════════════════════════
// LEARNING ENGINE — Central learning flow controller
// One brain for: lessons, quizzes, challenges
// Components call this; it orchestrates everything.
// ═══════════════════════════════════════════════

import { XP_VALUES } from '../utils/helpers';

export function createLearningEngine({
  toggleLesson,
  saveQuizScore,
  awardXP,
  recordDailyActivity,
  completedSet,
}) {
  // ─── Lesson completion ────────────────────
  function completeLesson(lessonKey, options = {}) {
    const alreadyDone = completedSet.has(lessonKey);
    toggleLesson(lessonKey, options);

    if (!alreadyDone) {
      awardXP(XP_VALUES.lesson, 'Lesson completed');
      recordDailyActivity();
    }
  }

  // ─── Undo lesson completion ───────────────
  function uncompleteLesson(lessonKey, options = {}) {
    if (completedSet.has(lessonKey)) {
      toggleLesson(lessonKey, options);
    }
  }

  // ─── Toggle (mark/unmark) ─────────────────
  function toggleLessonDone(lessonKey, options = {}) {
    if (completedSet.has(lessonKey)) {
      uncompleteLesson(lessonKey, options);
    } else {
      completeLesson(lessonKey, options);
    }
  }

  // ─── Quiz submission ──────────────────────
  function submitQuiz(
    quizKey,
    score,
    total,
  ) {
    const pct = Math.round((score / total) * 100);
    saveQuizScore(quizKey, `${score}/${total}`);
    awardXP(XP_VALUES.quiz, 'Quiz completed');
    recordDailyActivity();
    return { score, total, pct };
  }

  // ─── Challenge completion ─────────────────
  function completeChallenge(challengeId) {
    awardXP(XP_VALUES.challenge || 25, 'Challenge completed');
    recordDailyActivity();
    return { challengeId, completed: true };
  }

  return {
    completeLesson,
    uncompleteLesson,
    toggleLessonDone,
    submitQuiz,
    completeChallenge,
  };
}
