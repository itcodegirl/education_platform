// ═══════════════════════════════════════════════
// COURSE CONTENT PROVIDER — Lazy loader for course modules
//
// Why this exists: the old src/data/index.js static-imported all 5
// courses at module load, so every landing page visit pulled ~900 KB
// of lesson content the user didn't need yet. This provider breaks
// that by:
//
//   1. Keeping COURSES (exported from src/data) as a mutable
//      metadata shell (no modules until loaded)
//   2. Auto-loading the active course on mount and on change
//   3. Mutating COURSES[i].modules + QUIZ_MAP in place when a load
//      completes — then triggering a re-render so components that
//      read from useCourseContent see the new data
//   4. Exposing ensureLoaded(id) and ensureAllLoaded() so cold-path
//      components (admin dashboard, roadmap, search, stats) can
//      pull in the rest of the courses on demand
//
// Consumers that need data for a SPECIFIC non-active course should
// await ensureLoaded(id) and render a skeleton in the meantime.
// Consumers that need ALL courses (admin, roadmap, search, stats)
// should await ensureAllLoaded() and handle the transition.
//
// The active course is gated by AppLayout — if it isn't loaded yet,
// AppLayout renders a skeleton instead of the lesson view, so the
// hot path (useNavigation, Sidebar, LessonView) never sees empty
// modules.
// ═══════════════════════════════════════════════

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { COURSES, QUIZ_MAP, QUIZ_VARIANTS, loadCourse, COURSE_LOADER_IDS } from '../data';

const CourseContentContext = createContext({
  loadedCourseIds: new Set(),
  isCourseLoaded: () => false,
  activeCourseId: 'html',
  setActiveCourseId: () => {},
  isActiveCourseLoaded: false,
  ensureLoaded: async () => {},
  ensureAllLoaded: async () => {},
  allCoursesLoaded: false,
});

// Module-level cache of in-flight loads so concurrent callers share
// one network request and don't double-mutate COURSES/QUIZ_MAP.
const inFlight = new Map();
const scopedQuizKeysByCourse = new Map();

function buildScopedQuizKey(type, courseId, entityId) {
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

  existingKeys.forEach((key) => {
    QUIZ_MAP.delete(key);
    QUIZ_VARIANTS.delete(key);
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

function hydrateCourse(id, { modules, quizzes }) {
  const target = COURSES.find((c) => c.id === id);
  if (target) {
    target.modules = modules;
  }

  clearCourseQuizIndexes(id);

  const { lessonIds, moduleIds } = collectCourseEntityIds(modules);
  const nextScopedKeys = new Set();

  (quizzes || []).forEach((quiz) => {
    if (quiz.lessonId && lessonIds.has(quiz.lessonId)) {
      registerScopedQuiz({
        scopedKey: buildScopedQuizKey('l', id, quiz.lessonId),
        quiz,
        nextScopedKeys,
      });
    }

    if (quiz.moduleId && moduleIds.has(quiz.moduleId)) {
      registerScopedQuiz({
        scopedKey: buildScopedQuizKey('m', id, quiz.moduleId),
        quiz,
        nextScopedKeys,
      });
    }
  });

  scopedQuizKeysByCourse.set(id, nextScopedKeys);
}

export function CourseContentProvider({ children }) {
  // The source of truth for "what's loaded" is a Set of course ids.
  // We could compute this from COURSES.map(c => c.modules.length > 0)
  // but keeping it in state makes the re-render trigger explicit.
  const [loadedCourseIds, setLoadedCourseIds] = useState(() => new Set());
  const [activeCourseId, setActiveCourseId] = useState('html');

  const ensureLoaded = useCallback(async (id) => {
    if (loadedCourseIds.has(id)) return;
    // Shared in-flight promise — if two components both call
    // ensureLoaded('react') concurrently, they get the same fetch.
    let promise = inFlight.get(id);
    if (!promise) {
      promise = loadCourse(id).then((data) => {
        hydrateCourse(id, data);
        setLoadedCourseIds((prev) => {
          if (prev.has(id)) return prev;
          const next = new Set(prev);
          next.add(id);
          return next;
        });
      }).finally(() => {
        inFlight.delete(id);
      });
      inFlight.set(id, promise);
    }
    return promise;
  }, [loadedCourseIds]);

  const ensureAllLoaded = useCallback(async () => {
    await Promise.all(COURSE_LOADER_IDS.map((id) => ensureLoaded(id)));
  }, [ensureLoaded]);

  // Auto-load the active course whenever it changes. Most users will
  // stay on HTML for the first session, so this is usually a one-shot.
  useEffect(() => {
    ensureLoaded(activeCourseId);
  }, [activeCourseId, ensureLoaded]);

  const isCourseLoaded = useCallback(
    (id) => loadedCourseIds.has(id),
    [loadedCourseIds],
  );

  const isActiveCourseLoaded = loadedCourseIds.has(activeCourseId);
  const allCoursesLoaded = COURSE_LOADER_IDS.every((id) => loadedCourseIds.has(id));

  const value = useMemo(
    () => ({
      loadedCourseIds,
      isCourseLoaded,
      activeCourseId,
      setActiveCourseId,
      isActiveCourseLoaded,
      ensureLoaded,
      ensureAllLoaded,
      allCoursesLoaded,
    }),
    [
      loadedCourseIds,
      isCourseLoaded,
      activeCourseId,
      isActiveCourseLoaded,
      ensureLoaded,
      ensureAllLoaded,
      allCoursesLoaded,
    ],
  );

  return (
    <CourseContentContext.Provider value={value}>
      {children}
    </CourseContentContext.Provider>
  );
}

export function useCourseContent() {
  return useContext(CourseContentContext);
}
