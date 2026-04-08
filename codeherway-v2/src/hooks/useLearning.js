// ═══════════════════════════════════════════════
// USE LEARNING — Hook that provides the Learning Engine
// Wires context data into the engine so components
// just call learn.completeLesson(key) etc.
// ═══════════════════════════════════════════════

import { useMemo } from 'react';
import { useProgress } from '../providers';
import { createLearningEngine } from '../services/learningEngine';

export function useLearning() {
  const {
    toggleLesson, saveQuizScore, awardXP, recordDailyActivity, completedSet,
  } = useProgress();

  const engine = useMemo(() => createLearningEngine({
    toggleLesson, saveQuizScore, awardXP, recordDailyActivity, completedSet,
  }), [toggleLesson, saveQuizScore, awardXP, recordDailyActivity, completedSet]);

  return engine;
}
