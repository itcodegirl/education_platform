function countItems(value) {
  return Array.isArray(value) ? value.length : 0;
}

function nullableString(value) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

export function getLearningLoopActionPayload({
  action,
  course,
  moduleData,
  lesson,
  dueReviewCount = 0,
  isLessonDone = false,
  hasLessonQuiz = false,
  masteryStatus = null,
} = {}) {
  return {
    action: nullableString(action) || 'unknown',
    courseId: nullableString(course?.id),
    moduleId: nullableString(moduleData?.id),
    lessonId: nullableString(lesson?.id),
    dueReviewCount: Math.max(0, Number(dueReviewCount) || 0),
    isLessonDone: Boolean(isLessonDone),
    hasLessonQuiz: Boolean(hasLessonQuiz),
    masteryTone: nullableString(masteryStatus?.tone),
    masteryReady: Boolean(masteryStatus?.isReady),
  };
}

export function getChallengeAnalyticsPayload({
  challenge,
  courseId,
  source,
  isCompleted = false,
} = {}) {
  return {
    courseId: nullableString(courseId),
    challengeId: nullableString(challenge?.id),
    difficulty: nullableString(challenge?.difficulty) || 'unknown',
    source: nullableString(source) || 'unknown',
    readinessLabel: nullableString(challenge?.readinessLabel),
    targetModuleId: nullableString(challenge?.targetModuleId),
    isCompleted: Boolean(isCompleted),
    requirementCount: countItems(challenge?.requirements),
    testCount: countItems(challenge?.tests),
  };
}
