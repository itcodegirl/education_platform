import { parseQuizKey } from './quizKeys';

const LEGACY_QUIZ_COURSE_PREFIXES = Object.freeze({
  html: ['h', 'lesson-'],
  css: ['c', 'css-'],
  js: ['j', 'js-'],
  react: ['r'],
});

export function courseContainsQuizEntity(course, parsedQuizKey) {
  const entityId = String(parsedQuizKey?.entityId || '');
  if (!entityId) return false;

  for (const module of course?.modules || []) {
    if (parsedQuizKey.type === 'm' && String(module.id) === entityId) return true;
    if (
      parsedQuizKey.type === 'l' &&
      (module.lessons || []).some((lesson) => lesson.id === entityId)
    ) {
      return true;
    }
  }

  return false;
}

export function quizKeyBelongsToCourse(quizKey, course) {
  const parsed = parseQuizKey(quizKey);

  if (parsed.courseId) return parsed.courseId === course?.id;
  if (courseContainsQuizEntity(course, parsed)) return true;

  const prefixes = LEGACY_QUIZ_COURSE_PREFIXES[course?.id] || [];
  return prefixes.some((prefix) => parsed.entityId.startsWith(prefix));
}

export function findQuizEntityTitle(quizKey, courses = []) {
  const parsed = parseQuizKey(quizKey);

  for (const course of courses) {
    if (parsed.courseId && parsed.courseId !== course.id) continue;

    for (const module of course.modules || []) {
      if (parsed.type === 'm' && String(module.id) === parsed.entityId) {
        return `${module.title} (Quiz)`;
      }

      const lesson = (module.lessons || []).find((entry) => entry.id === parsed.entityId);
      if (lesson) return lesson.title;
    }
  }

  return quizKey;
}
