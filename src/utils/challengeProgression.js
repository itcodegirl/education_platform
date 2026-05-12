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

function countItems(value) {
  return Array.isArray(value) ? value.length : 0;
}

function getEvidenceLabel(challenge) {
  const requirementCount = countItems(challenge?.requirements);
  const testCount = countItems(challenge?.tests);

  if (requirementCount > 0 && testCount > 0) {
    return `${requirementCount} requirement${requirementCount === 1 ? '' : 's'} backed by ${testCount} check${testCount === 1 ? '' : 's'}`;
  }

  if (testCount > 0) {
    return `${testCount} automated check${testCount === 1 ? '' : 's'}`;
  }

  if (requirementCount > 0) {
    return `${requirementCount} requirement${requirementCount === 1 ? '' : 's'} to inspect manually`;
  }

  return 'Practice prompt needs clearer evidence';
}

function getReadinessReasons({ challenge, targetModuleTitle, targetProgress, isCompleted, ready }) {
  if (isCompleted) {
    return ['Completed in this browser', getEvidenceLabel(challenge)];
  }

  const reasons = [];

  if (targetProgress.complete) {
    reasons.push(`${targetModuleTitle} is complete`);
  } else if (targetProgress.done > 0) {
    reasons.push(`${targetProgress.done}/${targetProgress.total} linked lessons complete`);
  } else if (ready) {
    reasons.push('Good starter practice for this course');
  } else {
    reasons.push(`Start ${targetModuleTitle} before this challenge`);
  }

  reasons.push(getEvidenceLabel(challenge));
  return reasons;
}

function getNextPracticeStep({ ready, isCompleted, targetModuleTitle }) {
  if (isCompleted) {
    return 'Reopen it to refactor, explain your solution, or turn it into a portfolio note.';
  }

  if (ready) {
    return 'Use the tests as feedback, then explain what changed before marking it done.';
  }

  return `Finish or sample ${targetModuleTitle} first so the challenge is practice, not guessing.`;
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
    const targetModuleTitle = targetModule?.title || 'current course practice';

    return {
      ...challenge,
      targetModuleId: targetModule?.id || '',
      targetModuleTitle,
      targetModuleProgress: targetProgress,
      readinessLabel: ready ? 'Ready for practice' : `Best after ${targetModule?.title || 'more lessons'}`,
      isCompleted,
      isReadyForPractice: ready,
      evidenceLabel: getEvidenceLabel(challenge),
      readinessReasons: getReadinessReasons({
        challenge,
        targetModuleTitle,
        targetProgress,
        isCompleted,
        ready,
      }),
      nextPracticeStep: getNextPracticeStep({
        ready,
        isCompleted,
        targetModuleTitle,
      }),
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
