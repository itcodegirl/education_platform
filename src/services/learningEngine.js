// ═══════════════════════════════════════════════
// LEARNING ENGINE — Central learning flow controller
// One brain for: lessons, quizzes, challenges
// Components call this; it orchestrates everything.
// ═══════════════════════════════════════════════

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
  isChallengeCompleted = () => false,
  markChallengeCompleted = () => true,
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
    const alreadyCompleted = isChallengeCompleted(challengeId);
    const newlyCompleted = !alreadyCompleted && markChallengeCompleted(challengeId);

    if (!newlyCompleted) {
      return { challengeId, completed: true, alreadyCompleted: true };
    }

    const rewardKey = rewardKeys.challengeComplete(challengeId);
    if (!hasRewardBeenAwarded(rewardKey) && markRewardAwarded(rewardKey)) {
      awardXP(REWARD_XP.challengeComplete, 'Challenge completed');
    }

    recordDailyActivity();
    return { challengeId, completed: true, alreadyCompleted: false };
  }

  return {
    completeLesson,
    uncompleteLesson,
    toggleLessonDone,
    submitQuiz,
    completeChallenge,
  };
}
