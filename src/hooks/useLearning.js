// ═══════════════════════════════════════════════
// USE LEARNING — Hook that provides the Learning Engine
// Wires context data into the engine so components
// just call learn.completeLesson(key) etc.
// ═══════════════════════════════════════════════

import { useMemo } from 'react';
import { useProgressData, useXP } from '../providers';
import { createLearningEngine } from '../services/learningEngine';

export function useLearning() {
  const {
    toggleLesson,
    saveQuizScore,
    quizScores,
    completedSet,
    hasRewardBeenAwarded,
    markRewardAwarded,
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
  }), [
    toggleLesson,
    saveQuizScore,
    quizScores,
    awardXP,
    recordDailyActivity,
    completedSet,
    hasRewardBeenAwarded,
    markRewardAwarded,
  ]);

  return engine;
}
