import { buildLearnPath } from '../routes/routePaths';
import { parseQuizScore } from '../services/rewardPolicy';
import {
  findLessonByKey,
  hasLessonCompletion,
} from './lessonKeys';
import { LESSON_MASTERY_THRESHOLD } from './lessonMasteryStatus';
import { resolveSavedPosition } from './savedPosition';

export function getResumeRecommendation({
  courses = [],
  course,
  moduleData,
  lesson,
  courseIndex = 0,
  moduleIndex = 0,
  lessonIndex = 0,
  completedSet,
  hasLessonQuiz = false,
  lessonQuizScore = '',
  dueReviewCount = 0,
  bookmarks = [],
  lastPosition = null,
} = {}) {
  const reviewCount = Number(dueReviewCount) || 0;
  if (reviewCount > 0) {
    return getReviewRecommendation(reviewCount);
  }

  const quizRecommendation = getQuizRecommendation({
    course,
    moduleData,
    lesson,
    completedSet,
    hasLessonQuiz,
    lessonQuizScore,
  });
  if (quizRecommendation) return quizRecommendation;

  const currentPosition = { courseIndex, moduleIndex, lessonIndex };
  const savedRecommendation = getSavedPositionRecommendation({
    courses,
    completedSet,
    lastPosition,
    currentPosition,
  });
  if (savedRecommendation) return savedRecommendation;

  const bookmarkRecommendation = getBookmarkRecommendation({
    courses,
    completedSet,
    bookmarks,
    currentPosition,
  });
  if (bookmarkRecommendation) return bookmarkRecommendation;

  const nextLessonRecommendation = getNextIncompleteLessonRecommendation({
    course,
    courseIndex,
    moduleIndex,
    lessonIndex,
    completedSet,
  });
  if (nextLessonRecommendation) return nextLessonRecommendation;

  return {
    type: 'complete',
    action: 'challenges',
    eyebrow: 'Course clear',
    title: 'This course path is caught up',
    detail: 'Use a challenge to turn the lesson progress into proof you can show.',
    cta: 'Open challenges',
  };
}

function getReviewRecommendation(reviewCount) {
  return {
    type: 'review',
    action: 'review',
    eyebrow: 'Due review',
    title: reviewCount === 1
      ? 'One review card is ready'
      : `${reviewCount} review cards are ready`,
    detail: 'Clear the fragile concept before opening more new material.',
    cta: 'Review now',
  };
}

function getQuizRecommendation({
  course,
  moduleData,
  lesson,
  completedSet,
  hasLessonQuiz,
  lessonQuizScore,
}) {
  if (!hasLessonQuiz || !hasLessonCompletion(completedSet, course, moduleData, lesson)) {
    return null;
  }

  const parsedScore = parseQuizScore(lessonQuizScore);
  if (parsedScore && parsedScore.pct >= LESSON_MASTERY_THRESHOLD) {
    return null;
  }

  const path = buildLearnPath(course, moduleData, lesson, false);
  const hasScore = Boolean(parsedScore);

  return {
    type: 'quiz',
    action: 'quiz',
    eyebrow: 'Mastery check',
    title: hasScore
      ? `Retake the quick check: ${parsedScore.pct}%`
      : 'Take the quick check',
    detail: hasScore
      ? `Aim for ${LESSON_MASTERY_THRESHOLD}% before moving too far ahead.`
      : 'Reading is saved. Add quiz evidence so the platform knows this lesson stuck.',
    cta: 'Jump to quiz',
    courseId: course?.id || '',
    moduleId: moduleData?.id || '',
    lessonId: lesson?.id || '',
    path,
  };
}

function getSavedPositionRecommendation({
  courses,
  completedSet,
  lastPosition,
  currentPosition,
}) {
  const saved = resolveSavedPosition(lastPosition, courses);
  if (!saved || saved.isModuleQuiz || isSamePosition(saved, currentPosition)) {
    return null;
  }

  const target = getTargetFromPosition(courses, saved);
  if (!target || isCompletedTarget(target, completedSet)) return null;

  return makeLessonRecommendation({
    type: 'saved',
    eyebrow: 'Last open lesson',
    title: `Resume ${target.lesson.title}`,
    detail: `${target.course.label} > ${target.moduleData.title}`,
    cta: 'Resume lesson',
    target,
  });
}

function getBookmarkRecommendation({
  courses,
  completedSet,
  bookmarks,
  currentPosition,
}) {
  const orderedBookmarks = orderBookmarksNewestFirst(bookmarks);

  for (const bookmark of orderedBookmarks) {
    const target = findLessonByKey(bookmark?.lesson_key, courses);
    if (!target || isSamePosition(target, currentPosition) || isCompletedTarget(target, completedSet)) {
      continue;
    }

    return makeLessonRecommendation({
      type: 'bookmark',
      eyebrow: 'Saved lesson',
      title: `Return to ${target.lesson.title}`,
      detail: `${target.course.label} > ${target.moduleData.title}`,
      cta: 'Open bookmark',
      target,
    });
  }

  return null;
}

function getNextIncompleteLessonRecommendation({
  course,
  courseIndex,
  moduleIndex,
  lessonIndex,
  completedSet,
}) {
  const targets = flattenCourseLessons(course, courseIndex);
  if (targets.length === 0) return null;

  const startIndex = Math.max(
    targets.findIndex((target) =>
      target.moduleIndex === moduleIndex && target.lessonIndex === lessonIndex,
    ),
    0,
  );
  const orderedTargets = [
    ...targets.slice(startIndex),
    ...targets.slice(0, startIndex),
  ];
  const target = orderedTargets.find((entry) => !isCompletedTarget(entry, completedSet));
  if (!target) return null;

  const isCurrent = target.moduleIndex === moduleIndex && target.lessonIndex === lessonIndex;
  return makeLessonRecommendation({
    type: isCurrent ? 'current' : 'next',
    action: isCurrent ? 'current' : 'lesson',
    eyebrow: isCurrent ? 'Current lesson' : 'Next lesson',
    title: isCurrent ? `Keep going: ${target.lesson.title}` : target.lesson.title,
    detail: isCurrent
      ? 'Finish this lesson before stacking more new material.'
      : `${target.course.label} > ${target.moduleData.title}`,
    cta: isCurrent ? 'Back to lesson' : 'Start lesson',
    target,
  });
}

function makeLessonRecommendation({
  type,
  action = 'lesson',
  eyebrow,
  title,
  detail,
  cta,
  target,
}) {
  return {
    type,
    action,
    eyebrow,
    title,
    detail,
    cta,
    courseId: target.course.id,
    moduleId: target.moduleData.id,
    lessonId: target.lesson.id,
    courseIndex: target.courseIndex,
    moduleIndex: target.moduleIndex,
    lessonIndex: target.lessonIndex,
    path: buildLearnPath(target.course, target.moduleData, target.lesson, false),
  };
}

function getTargetFromPosition(courses, position) {
  const course = courses[position.courseIndex];
  const moduleData = course?.modules?.[position.moduleIndex];
  const lesson = moduleData?.lessons?.[position.lessonIndex];
  if (!course || !moduleData || !lesson) return null;

  return {
    course,
    moduleData,
    lesson,
    courseIndex: position.courseIndex,
    moduleIndex: position.moduleIndex,
    lessonIndex: position.lessonIndex,
  };
}

function flattenCourseLessons(course, courseIndex) {
  if (!course?.modules?.length) return [];

  return course.modules.flatMap((moduleData, moduleIndex) =>
    (moduleData.lessons || []).map((lesson, lessonIndex) => ({
      course,
      moduleData,
      lesson,
      courseIndex,
      moduleIndex,
      lessonIndex,
    })),
  );
}

function isCompletedTarget(target, completedSet) {
  return hasLessonCompletion(
    completedSet,
    target.course,
    target.moduleData,
    target.lesson,
  );
}

function isSamePosition(left, right) {
  return left?.courseIndex === right?.courseIndex
    && left?.moduleIndex === right?.moduleIndex
    && left?.lessonIndex === right?.lessonIndex;
}

function orderBookmarksNewestFirst(bookmarks = []) {
  if (!Array.isArray(bookmarks)) return [];

  return bookmarks
    .map((bookmark, index) => ({
      bookmark,
      index,
      time: Date.parse(bookmark?.created_at || ''),
    }))
    .sort((left, right) => {
      const leftTime = Number.isFinite(left.time) ? left.time : 0;
      const rightTime = Number.isFinite(right.time) ? right.time : 0;
      return rightTime - leftTime || right.index - left.index;
    })
    .map((entry) => entry.bookmark);
}
