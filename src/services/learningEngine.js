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
import { REWARD_PROCESSOR_STATUSES, processRewardEvent } from '../engine/rewards/rewardProcessor';

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
}) {
  async function awardRewardOnce({
    event,
    rewardKey,
    xpAmount,
    reason,
    onRewardApplied = () => {},
  }) {
    if (hasRewardBeenAwarded(rewardKey)) {
      return { status: REWARD_PROCESSOR_STATUSES.SKIPPED, source: 'legacy-reward-history' };
    }

    const applyReward = () => {
      if (!markRewardAwarded(rewardKey)) {
        return { xpAwarded: 0, legacySkipped: true };
      }

      awardXP(xpAmount, reason);
      onRewardApplied();
      return { xpAwarded: xpAmount };
    };

    if (!learnerKey) {
      const rewardResult = applyReward();
      return {
        status: rewardResult.xpAwarded > 0
          ? REWARD_PROCESSOR_STATUSES.APPLIED
          : REWARD_PROCESSOR_STATUSES.SKIPPED,
        source: 'legacy-reward-history',
        rewardResult,
      };
    }

    const result = await processRewardEvent(learnerKey, event, {
      storage: rewardEventStorage,
      applyReward,
    });

    if (result.status === REWARD_PROCESSOR_STATUSES.FAILED) {
      markSyncFailed(`reward event ${result.phase}:${event.key}`);

      if (result.phase === 'ledger-read') {
        const rewardResult = applyReward();
        return {
          status: rewardResult.xpAwarded > 0
            ? REWARD_PROCESSOR_STATUSES.APPLIED
            : REWARD_PROCESSOR_STATUSES.SKIPPED,
          source: 'legacy-reward-history',
          rewardResult,
          ledgerError: result.error,
        };
      }
    }

    return result;
  }

  // ─── Lesson completion ────────────────────
  async function completeLesson(lessonKey, options = {}) {
    const alreadyDone = completedSet.has(lessonKey);
    const rewardKey = rewardKeys.lessonComplete(lessonKey);
    toggleLesson(lessonKey, options);

    if (!alreadyDone) {
      await awardRewardOnce({
        event: createRewardEvent({
          type: REWARD_EVENT_TYPES.LESSON_COMPLETE,
          targetId: lessonKey,
          learnerKey: learnerKey || 'legacy-local',
          metadata: { rewardKey },
        }),
        rewardKey,
        xpAmount: REWARD_XP.lessonComplete,
        reason: 'Lesson completed',
        onRewardApplied: recordDailyActivity,
      });
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
