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
import { REWARD_EVENT_TYPES } from '../engine/rewards/rewardEventTypes';
import { createRewardEvent } from '../engine/rewards/rewardEvents';
import { awardRewardOnce } from '../engine/rewards/rewardRuntime';

function runRewardInBackground(rewardWork, onFailure = () => {}) {
  Promise.resolve()
    .then(rewardWork)
    .catch((error) => {
      onFailure(error);
    });
}

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
  learnerKey = '',
  rewardEventStorage,
  markSyncFailed = () => {},
  backendRewardSyncEnabled = false,
  backendRewardAward,
}) {
  // ─── Lesson completion ────────────────────
  async function completeLesson(lessonKey, options = {}) {
    const alreadyDone = completedSet.has(lessonKey);
    const rewardKey = rewardKeys.lessonComplete(lessonKey);
    toggleLesson(lessonKey, options);

    if (!alreadyDone) {
      const rewardEvent = createRewardEvent({
        type: REWARD_EVENT_TYPES.LESSON_COMPLETE,
        targetId: lessonKey,
        learnerKey: learnerKey || 'legacy-local',
        metadata: { rewardKey },
      });

      runRewardInBackground(
        () => awardRewardOnce({
          learnerKey,
          event: rewardEvent,
          legacyRewardKey: rewardKey,
          hasRewardBeenAwarded,
          markRewardAwarded,
          awardXP,
          xpAmount: REWARD_XP.lessonComplete,
          reason: 'Lesson completed',
          onRewardApplied: recordDailyActivity,
          markSyncFailed,
          storage: rewardEventStorage,
          backendRewardSyncEnabled,
          backendRewardAward,
        }),
        (error) => {
          markSyncFailed(`lesson reward failed:${rewardEvent.key}`);
          if (import.meta.env.DEV) {
            console.warn('[LearningEngine] lesson reward failed:', error);
          }
        },
      );
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
      return uncompleteLesson(lessonKey, options);
    } else {
      return completeLesson(lessonKey, options);
    }
  }

  // ─── Quiz submission ──────────────────────
  async function submitQuiz(
    quizKey,
    score,
    total,
  ) {
    const pct = Math.round((score / total) * 100);
    if (isQuizScoreImprovement(quizScores[quizKey], score, total)) {
      saveQuizScore(quizKey, formatQuizScore(score, total));
    }

    const completionRewardKey = rewardKeys.quizComplete(quizKey);
    await awardRewardOnce({
      learnerKey,
      event: createRewardEvent({
        type: REWARD_EVENT_TYPES.QUIZ_BASE,
        targetId: quizKey,
        learnerKey: learnerKey || 'legacy-local',
        metadata: { rewardKey: completionRewardKey, score, total, pct },
      }),
      legacyRewardKey: completionRewardKey,
      hasRewardBeenAwarded,
      markRewardAwarded,
      awardXP,
      xpAmount: REWARD_XP.quizComplete,
      reason: 'Quiz completed',
      markSyncFailed,
      storage: rewardEventStorage,
      backendRewardSyncEnabled,
      backendRewardAward,
    });

    if (pct === 100) {
      const perfectRewardKey = rewardKeys.quizPerfect(quizKey);
      await awardRewardOnce({
        learnerKey,
        event: createRewardEvent({
          type: REWARD_EVENT_TYPES.QUIZ_PERFECT,
          targetId: quizKey,
          learnerKey: learnerKey || 'legacy-local',
          metadata: { rewardKey: perfectRewardKey, score, total, pct },
        }),
        legacyRewardKey: perfectRewardKey,
        hasRewardBeenAwarded,
        markRewardAwarded,
        awardXP,
        xpAmount: REWARD_XP.quizPerfect,
        reason: 'Perfect quiz score!',
        markSyncFailed,
        storage: rewardEventStorage,
        backendRewardSyncEnabled,
        backendRewardAward,
      });
    }

    recordDailyActivity();
    return { score, total, pct };
  }

  // ─── Challenge completion ─────────────────
  async function completeChallenge(challengeId) {
    const alreadyCompleted = isChallengeCompleted(challengeId);
    const newlyCompleted = !alreadyCompleted && markChallengeCompleted(challengeId);

    if (!newlyCompleted) {
      return { challengeId, completed: true, alreadyCompleted: true };
    }

    const rewardKey = rewardKeys.challengeComplete(challengeId);
    await awardRewardOnce({
      learnerKey,
      event: createRewardEvent({
        type: REWARD_EVENT_TYPES.CHALLENGE_COMPLETE,
        targetId: challengeId,
        learnerKey: learnerKey || 'legacy-local',
        metadata: { rewardKey },
      }),
      legacyRewardKey: rewardKey,
      hasRewardBeenAwarded,
      markRewardAwarded,
      awardXP,
      xpAmount: REWARD_XP.challengeComplete,
      reason: 'Challenge completed',
      markSyncFailed,
      storage: rewardEventStorage,
      backendRewardSyncEnabled,
      backendRewardAward,
    });

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

