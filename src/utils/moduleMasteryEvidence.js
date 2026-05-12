import { getChallengeProgressionPlan } from './challengeProgression';
import { hasLessonCompletion, lessonKeyMatchesLesson } from './lessonKeys';
import { parseQuizKey } from './quizKeys';

const MODULE_QUIZ_PASS_PERCENT = 80;

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

export function normalizeReviewCardLearningContext(card = {}) {
  const quizKey = card.quizKey || card.quiz_key || '';
  const parsedQuizKey = parseQuizKey(quizKey);
  const parsedContext = parsedQuizKey.type ? {
    courseId: parsedQuizKey.courseId,
    moduleId: parsedQuizKey.type === 'm' ? parsedQuizKey.entityId : '',
    lessonId: parsedQuizKey.type === 'l' ? parsedQuizKey.entityId : '',
    quizType: parsedQuizKey.type === 'm' ? 'module' : 'lesson',
  } : {};

  return {
    quizKey,
    quizType: card.quizType || card.quiz_type || parsedContext.quizType || '',
    courseId: card.courseId || card.course_id || parsedContext.courseId || '',
    moduleId: card.moduleId || card.module_id || parsedContext.moduleId || '',
    lessonId: card.lessonId || card.lesson_id || parsedContext.lessonId || '',
    lessonKey: card.lessonKey || card.lesson_key || '',
    questionId: card.questionId || card.question_id || '',
  };
}

function reviewCardBelongsToModule(card, course, moduleData) {
  if (!card || !course || !moduleData) return false;
  const context = normalizeReviewCardLearningContext(card);

  if (context.courseId && context.courseId !== course.id) return false;
  if (context.moduleId) return context.moduleId === moduleData.id;
  if (quizBelongsToModule(context.quizKey, course, moduleData)) return true;

  const lessonKey = context.lessonKey;
  if (lessonKey) {
    return (moduleData.lessons || []).some((lesson) =>
      lessonKeyMatchesLesson(lessonKey, course, moduleData, lesson),
    );
  }

  const lessonId = context.lessonId;
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
  challengeTotal,
  reviewDue,
}) {
  const complete = lessonTotal > 0 && lessonDone === lessonTotal;
  const quizReady = quizPassed > 0;
  const challengeReady = challengeTotal === 0 || challengeDone > 0;
  const readyToAdvance = complete && quizReady && challengeReady && reviewDue === 0 && quizNeedsReview === 0;

  if (reviewDue > 0 || quizNeedsReview > 0) {
    return {
      readyToAdvance: false,
      statusLabel: 'Review evidence due',
      statusTone: 'review',
      nextAction: reviewDue > 0
        ? 'Clear review cards or retry a missed check before adding new lessons.'
        : 'Retry the quick check until the module idea feels usable.',
      readinessDetail: reviewDue > 0
        ? 'Review work is due before this module should count as retained.'
        : `Quiz evidence needs ${MODULE_QUIZ_PASS_PERCENT}% or better.`,
    };
  }

  if (complete && !quizReady) {
    return {
      readyToAdvance: false,
      statusLabel: 'Needs quick-check proof',
      statusTone: 'practice',
      nextAction: 'Pass a quick check before treating this module as ready.',
      readinessDetail: `A completed lesson still needs quiz evidence at ${MODULE_QUIZ_PASS_PERCENT}% or better.`,
    };
  }

  if (complete && !challengeReady) {
    return {
      readyToAdvance: false,
      statusLabel: 'Needs applied evidence',
      statusTone: 'practice',
      nextAction: 'Finish one applied challenge before advancing.',
      readinessDetail: 'Applied work shows this module can transfer into a build.',
    };
  }

  if (readyToAdvance) {
    return {
      readyToAdvance: true,
      statusLabel: 'Ready to advance',
      statusTone: 'ready',
      nextAction: 'Use this module as a base for the next build.',
      readinessDetail: 'Lessons, quiz evidence, applied work, and review are aligned.',
    };
  }

  if (complete) {
    return {
      readyToAdvance: false,
      statusLabel: 'Evidence ready',
      statusTone: 'ready',
      nextAction: 'Review this module once more before moving on.',
      readinessDetail: 'Some proof exists, but the full readiness threshold is not met yet.',
    };
  }

  if (lessonDone > 0 || quizAttempted > 0 || challengeDone > 0) {
    return {
      readyToAdvance: false,
      statusLabel: 'Evidence building',
      statusTone: 'building',
      nextAction: 'Finish the remaining lessons, then check understanding.',
      readinessDetail: 'This module is in progress and should not count as ready yet.',
    };
  }

  return {
    readyToAdvance: false,
    statusLabel: 'Not started',
    statusTone: 'empty',
    nextAction: 'Start the first lesson in this module.',
    readinessDetail: 'No learning evidence has been recorded yet.',
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

      const quizPassed = moduleQuizResults.filter((result) =>
        result.percent >= MODULE_QUIZ_PASS_PERCENT,
      ).length;
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
        challengeTotal: moduleChallenges.length,
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
    modulesReadyToAdvance: modules.filter((moduleEvidence) =>
      moduleEvidence.readyToAdvance,
    ).length,
    modulesNeedingReview: modules.filter((moduleEvidence) =>
      moduleEvidence.statusTone === 'review' || moduleEvidence.statusTone === 'practice',
    ).length,
    readinessPolicy: {
      quizPassPercent: MODULE_QUIZ_PASS_PERCENT,
      requiresLessonCompletion: true,
      requiresQuizEvidence: true,
      requiresAppliedEvidenceWhenAvailable: true,
      requiresNoDueReview: true,
    },
  };
}
