// ═══════════════════════════════════════════════
// LEARNING ENGINE — Central learning flow controller
// One brain for: lessons, quizzes, challenges
// Components call this; it orchestrates everything.
// ═══════════════════════════════════════════════

import { XP_VALUES } from '../utils/helpers';
import {
  REWARD_XP,
  formatQuizScore,
  isQuizScoreImprovement,
  rewardKeys,
} from './rewardPolicy';

export function createLearningEngine({
  toggleLesson,
  saveQuizScore,
  quizScores = {},
  awardXP,
  recordDailyActivity,
  completedSet,
  hasRewardBeenAwarded = () => false,
  markRewardAwarded = () => false,
}) {
  // ─── Lesson completion ────────────────────
  function completeLesson(lessonKey, options = {}) {
    const alreadyDone = completedSet.has(lessonKey);
    const rewardKey = rewardKeys.lessonComplete(lessonKey);
    const rewardAlreadyAwarded = hasRewardBeenAwarded(rewardKey);
    toggleLesson(lessonKey, options);

    if (!alreadyDone && !rewardAlreadyAwarded) {
      markRewardAwarded(rewardKey);
      awardXP(REWARD_XP.lessonComplete, 'Lesson completed');
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
    if (isQuizScoreImprovement(quizScores[quizKey], score, total)) {
      saveQuizScore(quizKey, formatQuizScore(score, total));
    }

    const completionRewardKey = rewardKeys.quizComplete(quizKey);
    if (!hasRewardBeenAwarded(completionRewardKey) && markRewardAwarded(completionRewardKey)) {
      awardXP(REWARD_XP.quizComplete, 'Quiz completed');
    }

    if (pct === 100) {
      const perfectRewardKey = rewardKeys.quizPerfect(quizKey);
      if (!hasRewardBeenAwarded(perfectRewardKey) && markRewardAwarded(perfectRewardKey)) {
        awardXP(REWARD_XP.quizPerfect, 'Perfect quiz score!');
      }
    }

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
