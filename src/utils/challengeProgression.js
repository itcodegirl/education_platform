import { hasLessonCompletion } from './lessonKeys';

const DIFFICULTY_TARGET_RATIO = Object.freeze({
  beginner: 0,
  intermediate: 0.45,
  advanced: 0.8,
});

function normalizeCompletedIds(completedIds = []) {
  if (completedIds instanceof Set) return completedIds;
  return new Set(
    (Array.isArray(completedIds) ? completedIds : [])
      .map((id) => String(id || '').trim())
      .filter(Boolean),
  );
}

function getTargetModuleIndex(challenge, course) {
  const modules = course?.modules || [];
  if (modules.length === 0) return -1;

  const explicitIndex = modules.findIndex((module) =>
    String(module.id) === String(challenge?.recommendedModuleId || ''),
  );
  if (explicitIndex >= 0) return explicitIndex;

  const ratio = DIFFICULTY_TARGET_RATIO[challenge?.difficulty] ?? 0;
  return Math.min(modules.length - 1, Math.max(0, Math.floor(ratio * modules.length)));
}

function getModuleProgress(course, module, completedSet) {
  const lessons = Array.isArray(module?.lessons) ? module.lessons : [];
  const done = lessons.filter((lesson) =>
    hasLessonCompletion(completedSet, course, module, lesson),
  ).length;

  return {
    done,
    total: lessons.length,
    complete: lessons.length > 0 && done === lessons.length,
  };
}

export function getChallengeProgressionPlan({
  course,
  challenges = [],
  completedSet = new Set(),
  completedChallengeIds = [],
} = {}) {
  const challengeList = Array.isArray(challenges) ? challenges.filter(Boolean) : [];
  const completedChallenges = normalizeCompletedIds(completedChallengeIds);
  const lessonCompletions = completedSet instanceof Set ? completedSet : new Set(completedSet);

  const enriched = challengeList.map((challenge) => {
    const targetModuleIndex = getTargetModuleIndex(challenge, course);
    const targetModule = course?.modules?.[targetModuleIndex] || null;
    const targetProgress = getModuleProgress(course, targetModule, lessonCompletions);
    const isCompleted = completedChallenges.has(challenge.id);
    const ready = targetProgress.complete || targetProgress.done > 0 || targetModuleIndex <= 0;

    return {
      ...challenge,
      targetModuleId: targetModule?.id || '',
      targetModuleTitle: targetModule?.title || 'current course practice',
      targetModuleProgress: targetProgress,
      readinessLabel: ready ? 'Ready for practice' : `Best after ${targetModule?.title || 'more lessons'}`,
      isCompleted,
      isReadyForPractice: ready,
    };
  });

  const open = enriched.filter((challenge) => !challenge.isCompleted);
  const recommended = open.find((challenge) => challenge.isReadyForPractice) || open[0] || null;

  return {
    challenges: enriched,
    recommended,
    completedCount: enriched.filter((challenge) => challenge.isCompleted).length,
    totalCount: enriched.length,
  };
}
