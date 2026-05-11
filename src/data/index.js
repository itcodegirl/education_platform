// DATA INDEX - Public API for course data
//
// The exported COURSES / QUIZ_MAP / QUIZ_VARIANTS containers are
// still mutable for backward compatibility, but direct reads from
// those globals are now legacy-only. Prefer the selector helpers
// below so course loading and quiz lookup stay centralized.

import { COURSE_METADATA } from './metadata';
import { resolveQuizLessonId } from './quizLessonIdResolver';

export { COURSE_METADATA } from './metadata';
export { loadCourse, loadCourseRuntime, COURSE_LOADER_IDS } from './loaders';
export { BADGE_DEFS } from './badges';

// Mutable compatibility shell. CourseContentProvider fills modules
// in as content is loaded. New code should prefer getLoadedCourse()
// over reading this array directly at module init time.
export const COURSES = COURSE_METADATA.map((metadata) => ({
  ...metadata,
  modules: [],
}));

// Mutable compatibility maps. New code should prefer getQuiz(),
// hasQuiz(), and getQuizVariants() rather than touching the maps
// directly from consumers.
export const QUIZ_MAP = new Map();
export const QUIZ_VARIANTS = new Map();

const scopedQuizKeysByCourse = new Map();

export function buildScopedQuizKey(type, courseId, entityId) {
  if (!type || !courseId || !entityId) return '';
  return `${type}:${courseId}:${entityId}`;
}

function collectCourseEntityIds(modules = []) {
  const lessonIds = new Set();
  const moduleIds = new Set();

  modules.forEach((moduleData) => {
    moduleIds.add(moduleData.id);
    (moduleData.lessons || []).forEach((lesson) => {
      lessonIds.add(lesson.id);
    });
  });

  return { lessonIds, moduleIds };
}

function clearCourseQuizIndexes(courseId) {
  const existingKeys = scopedQuizKeysByCourse.get(courseId);
  if (!existingKeys) return;

  existingKeys.forEach((scopedKey) => {
    QUIZ_MAP.delete(scopedKey);
    QUIZ_VARIANTS.delete(scopedKey);
  });

  scopedQuizKeysByCourse.delete(courseId);
}

function registerScopedQuiz({ scopedKey, quiz, nextScopedKeys }) {
  const variant = QUIZ_VARIANTS.get(scopedKey);

  if (!variant) {
    QUIZ_MAP.set(scopedKey, quiz);
    QUIZ_VARIANTS.set(scopedKey, { primary: quiz, bonus: [] });
  } else {
    variant.bonus.push(quiz);
  }

  nextScopedKeys.add(scopedKey);
}

export function hydrateLoadedCourse(courseId, { modules = [], quizzes = [] } = {}) {
  const targetCourse = COURSES.find((course) => course.id === courseId);
  if (!targetCourse) return null;

  const nextModules = Array.isArray(modules) ? modules : [];
  targetCourse.modules = nextModules;

  clearCourseQuizIndexes(courseId);

  const { lessonIds, moduleIds } = collectCourseEntityIds(nextModules);
  const nextScopedKeys = new Set();

  (Array.isArray(quizzes) ? quizzes : []).forEach((quiz) => {
    const lessonResolution = resolveQuizLessonId(courseId, quiz.lessonId, lessonIds);

    if (lessonResolution.resolvedLessonId) {
      registerScopedQuiz({
        scopedKey: buildScopedQuizKey('l', courseId, lessonResolution.resolvedLessonId),
        quiz,
        nextScopedKeys,
      });
    }

    if (quiz.moduleId && moduleIds.has(quiz.moduleId)) {
      registerScopedQuiz({
        scopedKey: buildScopedQuizKey('m', courseId, quiz.moduleId),
        quiz,
        nextScopedKeys,
      });
    }
  });

  scopedQuizKeysByCourse.set(courseId, nextScopedKeys);
  return targetCourse;
}

export function getLoadedCourse(courseId) {
  const course = COURSES.find((entry) => entry.id === courseId);
  if (!course || !Array.isArray(course.modules) || course.modules.length === 0) {
    return null;
  }
  return course;
}

export function getQuiz(courseId, type, entityId) {
  const scopedKey = buildScopedQuizKey(type, courseId, entityId);
  return scopedKey ? QUIZ_MAP.get(scopedKey) : undefined;
}

export function hasQuiz(courseId, type, entityId) {
  const scopedKey = buildScopedQuizKey(type, courseId, entityId);
  return scopedKey ? QUIZ_MAP.has(scopedKey) : false;
}

export function getQuizVariants(courseId, type, entityId) {
  const scopedKey = buildScopedQuizKey(type, courseId, entityId);
  return scopedKey ? (QUIZ_VARIANTS.get(scopedKey) || null) : null;
}
