// ═══════════════════════════════════════════════
// SEARCH INDEX — Cross-course search with concept indexing
// Indexes: lesson titles, module titles, concepts, code, tasks
// ═══════════════════════════════════════════════

import { COURSES, getQuizVariants } from '../index';
import { GLOSSARY } from './glossary';

function collectSearchText(value, parts = []) {
  if (value === null || value === undefined) return parts;

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    parts.push(String(value));
    return parts;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectSearchText(item, parts));
    return parts;
  }

  if (typeof value === 'object') {
    Object.values(value).forEach((item) => collectSearchText(item, parts));
  }

  return parts;
}

function normalizeKeywords(parts) {
  return parts
    .join(' ')
    .toLowerCase()
    .replace(/[<>{}()[\]/\\;:'"`,=+\-*&|!?#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);
}

function getCourseGlossaryText(courseId, glossary) {
  return glossary
    .filter((entry) => entry.course === courseId)
    .flatMap((entry) => [entry.term, entry.def])
    .join(' ');
}

function getQuizSearchText(quizVariants) {
  if (!quizVariants) return [];
  const quizzes = [
    quizVariants.primary,
    ...(Array.isArray(quizVariants.bonus) ? quizVariants.bonus : []),
  ].filter(Boolean);

  return quizzes.flatMap((quiz) => collectSearchText(quiz));
}

export function buildSearchIndexFromCourses(courses, glossary = GLOSSARY, options = {}) {
  const entries = [];
  const resolveQuizVariants = options.getQuizVariants || (() => null);

  courses.forEach((course, ci) => {
    const glossaryText = getCourseGlossaryText(course.id, glossary);

    course.modules.forEach((mod, mi) => {
      mod.lessons.forEach((les, li) => {
        const lessonQuizText = getQuizSearchText(resolveQuizVariants(course.id, 'l', les.id));
        const moduleQuizText = getQuizSearchText(resolveQuizVariants(course.id, 'm', mod.id));
        const keywords = normalizeKeywords([
          ...collectSearchText(les),
          ...lessonQuizText,
          ...moduleQuizText,
          mod.title,
          course.label,
          glossaryText,
        ]);

        entries.push({
          title: les.title,
          module: mod.title,
          course: course.label,
          icon: course.icon,
          keywords,
          courseIdx: ci,
          modIdx: mi,
          lesIdx: li,
        });
      });
    });
  });

  return entries;
}

export function buildSearchIndex() {
  return buildSearchIndexFromCourses(COURSES, GLOSSARY, { getQuizVariants });
}
