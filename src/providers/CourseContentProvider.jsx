// COURSE CONTENT PROVIDER - Lazy loader for course modules
//
// Mutation now stays inside src/data/index.js through
// hydrateLoadedCourse(), getLoadedCourse(), and quiz selectors.
// Consumers should prefer the context helpers instead of reading the
// mutable globals directly.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  COURSES,
  COURSE_LOADER_IDS,
  getLoadedCourse,
  getQuiz,
  getQuizVariants,
  hydrateLoadedCourse,
  loadCourse,
} from '../data';

const CourseContentContext = createContext({
  courses: COURSES,
  loadedCourseIds: new Set(),
  isCourseLoaded: () => false,
  activeCourseId: 'html',
  setActiveCourseId: () => {},
  isActiveCourseLoaded: false,
  getLoadedCourse: () => null,
  getQuiz: () => undefined,
  getQuizVariants: () => null,
  ensureLoaded: async () => {},
  ensureCourseLoaded: async () => {},
  ensureAllLoaded: async () => {},
  allCoursesLoaded: false,
});

// Module-level cache of in-flight loads so concurrent callers share
// one request and one hydration pass.
const inFlight = new Map();

function getInitialLoadedCourseIds() {
  return new Set(
    COURSES
      .filter((course) => Array.isArray(course.modules) && course.modules.length > 0)
      .map((course) => course.id),
  );
}

export function CourseContentProvider({ children }) {
  const [loadedCourseIds, setLoadedCourseIds] = useState(getInitialLoadedCourseIds);
  const [activeCourseId, setActiveCourseId] = useState('html');

  const ensureLoaded = useCallback(async (courseId) => {
    const existingCourse = getLoadedCourse(courseId);
    if (existingCourse) {
      setLoadedCourseIds((prev) => {
        if (prev.has(courseId)) return prev;
        const next = new Set(prev);
        next.add(courseId);
        return next;
      });
      return existingCourse;
    }

    let promise = inFlight.get(courseId);
    if (!promise) {
      promise = loadCourse(courseId)
        .then((data) => {
          const loadedCourse = hydrateLoadedCourse(courseId, data);
          setLoadedCourseIds((prev) => {
            if (prev.has(courseId)) return prev;
            const next = new Set(prev);
            next.add(courseId);
            return next;
          });
          return loadedCourse;
        })
        .finally(() => {
          inFlight.delete(courseId);
        });

      inFlight.set(courseId, promise);
    }

    return promise;
  }, []);

  const ensureAllLoaded = useCallback(async () => {
    await Promise.all(COURSE_LOADER_IDS.map((courseId) => ensureLoaded(courseId)));
  }, [ensureLoaded]);

  useEffect(() => {
    ensureLoaded(activeCourseId);
  }, [activeCourseId, ensureLoaded]);

  const isCourseLoaded = useCallback(
    (courseId) => loadedCourseIds.has(courseId) || Boolean(getLoadedCourse(courseId)),
    [loadedCourseIds],
  );

  const isActiveCourseLoaded = isCourseLoaded(activeCourseId);
  const allCoursesLoaded = COURSE_LOADER_IDS.every((courseId) => isCourseLoaded(courseId));

  const value = useMemo(
    () => ({
      courses: COURSES,
      loadedCourseIds,
      isCourseLoaded,
      activeCourseId,
      setActiveCourseId,
      isActiveCourseLoaded,
      getLoadedCourse,
      getQuiz,
      getQuizVariants,
      ensureLoaded,
      ensureCourseLoaded: ensureLoaded,
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
