// ═══════════════════════════════════════════════
// USE LEARNING — Hook that provides the Learning Engine
// Wires context data into the engine so components
// just call learn.completeLesson(key) etc.
// ═══════════════════════════════════════════════

import { useMemo } from 'react';
import { useAuth, useProgressData, useXP } from '../providers';
import { createLearningEngine } from '../services/learningEngine';

export function useLearning() {
  const { user } = useAuth();
  const {
    toggleLesson,
    saveQuizScore,
    quizScores,
    completedSet,
    hasRewardBeenAwarded,
    markRewardAwarded,
    isChallengeCompleted,
    markChallengeCompleted,
    markSyncFailed,
  } = useProgressData();
  const { awardXP, recordDailyActivity } = useXP();

  const engine = useMemo(() => createLearningEngine({
    toggleLesson,
    saveQuizScore,
    quizScores,
    awardXP,
    recordDailyActivity,
    completedSet,
    hasRewardBeenAwarded,
    markRewardAwarded,
    isChallengeCompleted,
    markChallengeCompleted,
    learnerKey: user?.id || '',
    markSyncFailed,
  }), [
    user?.id,
    toggleLesson,
    saveQuizScore,
    quizScores,
    awardXP,
    recordDailyActivity,
    completedSet,
    hasRewardBeenAwarded,
    markRewardAwarded,
    isChallengeCompleted,
    markChallengeCompleted,
    markSyncFailed,
  ]);

  return engine;
}
