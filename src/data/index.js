// ═══════════════════════════════════════════════
// DATA INDEX — Public API for course data
//
// COURSES and QUIZ_MAP are now MUTABLE, lazy-filled containers.
// They start with metadata only (empty modules, empty map) and get
// populated by CourseContentProvider as courses are loaded on
// demand. That's how we keep ~900 KB of course content out of the
// initial module preload list.
//
// Important: components that read COURSES or QUIZ_MAP at module
// init time (or in the body of a static import) will see the EMPTY
// state. Only components that read them from a live render (after
// CourseContentProvider has loaded the active course) see populated
// data. The provider triggers a re-render when new data lands, so
// React's natural reactivity handles the update.
//
// If you need a guaranteed-loaded set of courses (e.g. search,
// roadmap, admin dashboard), call ensureAllLoaded() from the
// useCourseContent() hook before rendering.
// ═══════════════════════════════════════════════

import { COURSE_METADATA } from './metadata';

export { COURSE_METADATA } from './metadata';
export { loadCourse, COURSE_LOADER_IDS } from './loaders';
export { BADGE_DEFS } from './badges';

// Mutable! CourseContentProvider writes to `modules` as courses load.
// Components should prefer reading via useCourseContent() so React
// re-renders them when new data arrives.
export const COURSES = COURSE_METADATA.map((m) => ({
  ...m,
  modules: [],
}));

// Mutable map of scoped quiz keys -> canonical quiz.
// Keys are course-scoped to avoid cross-course collisions:
//   l:<courseId>:<lessonId>
//   m:<courseId>:<moduleId>
// Starts empty and is filled by CourseContentProvider as courses load.
export const QUIZ_MAP = new Map();

// Optional index of scoped quiz relationships:
// key -> { primary: quiz, bonus: quiz[] }.
// Policy: the first valid quiz for a scoped key is canonical `primary`;
// later duplicates for the same key are tracked as `bonus`.
export const QUIZ_VARIANTS = new Map();
