import { getChallengeProgressionPlan } from './challengeProgression';
import { hasLessonCompletion, lessonKeyMatchesLesson } from './lessonKeys';
import { parseQuizKey } from './quizKeys';

function toSet(values = []) {
  if (values instanceof Set) return values;
  return new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  );
}

function quizBelongsToModule(quizKey, course, moduleData) {
  const parsed = parseQuizKey(quizKey);
  if (!parsed.type || (parsed.courseId && parsed.courseId !== course?.id)) return false;

  if (parsed.type === 'm') {
    return parsed.entityId === moduleData?.id;
  }

  if (parsed.type === 'l') {
    return (moduleData?.lessons || []).some((lesson) => lesson.id === parsed.entityId);
  }

  return false;
}

function reviewCardBelongsToModule(card, course, moduleData) {
  if (!card || !course || !moduleData) return false;

  if (quizBelongsToModule(card.quizKey, course, moduleData)) return true;

  const lessonKey = card.lessonKey || card.lesson_key || '';
  if (lessonKey) {
    return (moduleData.lessons || []).some((lesson) =>
      lessonKeyMatchesLesson(lessonKey, course, moduleData, lesson),
    );
  }

  const lessonId = card.lessonId || card.lesson_id || '';
  if (lessonId) {
    return (moduleData.lessons || []).some((lesson) => lesson.id === lessonId);
  }

  return false;
}

function getModuleStatus({
  lessonDone,
  lessonTotal,
  quizPassed,
  quizAttempted,
  quizNeedsReview,
  challengeDone,
  reviewDue,
}) {
  const hasEvidence = quizPassed + challengeDone > 0;
  const complete = lessonTotal > 0 && lessonDone === lessonTotal;

  if (reviewDue > 0 || quizNeedsReview > 0) {
    return {
      statusLabel: 'Review evidence due',
      statusTone: 'review',
      nextAction: reviewDue > 0
        ? 'Clear review cards or retry a missed check before adding new lessons.'
        : 'Retry the quick check until the module idea feels usable.',
    };
  }

  if (complete && !hasEvidence) {
    return {
      statusLabel: 'Needs applied evidence',
      statusTone: 'practice',
      nextAction: 'Add proof with a quiz check or one applied challenge.',
    };
  }

  if (complete && hasEvidence) {
    return {
      statusLabel: 'Evidence ready',
      statusTone: 'ready',
      nextAction: 'Use this module as a base for the next build.',
    };
  }

  if (lessonDone > 0 || quizAttempted > 0 || challengeDone > 0) {
    return {
      statusLabel: 'Evidence building',
      statusTone: 'building',
      nextAction: 'Finish the remaining lessons, then check understanding.',
    };
  }

  return {
    statusLabel: 'Not started',
    statusTone: 'empty',
    nextAction: 'Start the first lesson in this module.',
  };
}

function focusRank(moduleEvidence) {
  const rankByTone = {
    review: 0,
    practice: 1,
    building: 2,
    ready: 3,
    empty: 4,
  };

  return rankByTone[moduleEvidence.statusTone] ?? 5;
}

export function summarizeModuleMasteryEvidence({
  courses = [],
  completedSet = new Set(),
  quizResults = [],
  challengeCompletions = [],
  getChallengesForCourse = () => [],
  srCards = [],
  now = Date.now(),
} = {}) {
  const completions = completedSet instanceof Set ? completedSet : new Set(completedSet);
  const completedChallenges = toSet(challengeCompletions);
  const dueReviewCards = (Array.isArray(srCards) ? srCards : []).filter((card) =>
    Number(card?.nextReview ?? Number.POSITIVE_INFINITY) <= now,
  );

  const modules = [];

  for (const course of Array.isArray(courses) ? courses : []) {
    const challengePlan = getChallengeProgressionPlan({
      course,
      challenges: getChallengesForCourse(course.id),
      completedSet: completions,
      completedChallengeIds: completedChallenges,
    });

    for (const moduleData of course?.modules || []) {
      const lessons = Array.isArray(moduleData.lessons) ? moduleData.lessons : [];
      const lessonDone = lessons.filter((lesson) =>
        hasLessonCompletion(completions, course, moduleData, lesson),
      ).length;
      const moduleQuizResults = (Array.isArray(quizResults) ? quizResults : []).filter((result) =>
        quizBelongsToModule(result?.key, course, moduleData),
      );
      const moduleChallenges = challengePlan.challenges.filter((challenge) =>
        challenge.targetModuleId === moduleData.id,
      );
      const reviewDue = dueReviewCards.filter((card) =>
        reviewCardBelongsToModule(card, course, moduleData),
      ).length;

      const quizPassed = moduleQuizResults.filter((result) => result.percent >= 80).length;
      const challengeDone = moduleChallenges.filter((challenge) => challenge.isCompleted).length;
      const lessonTotal = lessons.length;
      const lessonPercent = lessonTotal > 0 ? Math.round((lessonDone / lessonTotal) * 100) : 0;
      const status = getModuleStatus({
        lessonDone,
        lessonTotal,
        quizPassed,
        quizAttempted: moduleQuizResults.length,
        quizNeedsReview: moduleQuizResults.length - quizPassed,
        challengeDone,
        reviewDue,
      });

      modules.push({
        courseId: course.id,
        courseLabel: course.label,
        moduleId: moduleData.id,
        moduleTitle: moduleData.title,
        accent: course.accent,
        lessonDone,
        lessonTotal,
        lessonPercent,
        quizAttempted: moduleQuizResults.length,
        quizPassed,
        quizNeedsReview: moduleQuizResults.length - quizPassed,
        challengeDone,
        challengeTotal: moduleChallenges.length,
        reviewDue,
        ...status,
      });
    }
  }

  const activeModules = modules.filter((moduleEvidence) =>
    moduleEvidence.statusTone !== 'empty',
  );
  const focusModules = [...(activeModules.length > 0 ? activeModules : modules)]
    .sort((left, right) => {
      const rankDelta = focusRank(left) - focusRank(right);
      if (rankDelta !== 0) return rankDelta;
      return right.lessonPercent - left.lessonPercent;
    })
    .slice(0, 4);

  return {
    modules,
    focusModules,
    modulesWithEvidence: modules.filter((moduleEvidence) =>
      moduleEvidence.quizPassed + moduleEvidence.challengeDone > 0,
    ).length,
    modulesNeedingReview: modules.filter((moduleEvidence) =>
      moduleEvidence.statusTone === 'review' || moduleEvidence.statusTone === 'practice',
    ).length,
  };
}
