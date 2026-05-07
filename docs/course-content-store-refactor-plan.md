# Course Content Store Refactor Plan

## Current risk

The course catalog still exposes mutable module-level compatibility globals through `src/data/index.js`:

- `COURSES`
- `QUIZ_MAP`
- `QUIZ_VARIANTS`

That shape was practical while the app only had a handful of course tracks, but it becomes fragile as more content loads lazily:

- consumers can read partially hydrated data
- quiz lookups can drift if callers cache old keys
- module-init reads are easy to make and hard to notice in review
- broad mutable exports make it unclear which layer owns hydration

This branch narrows the mutation surface by centralizing hydration and scoped quiz registration in the data layer, while keeping legacy exports for compatibility.

## Target architecture

Move toward a small course-content store with one clear ownership boundary:

- a single hydration layer that loads and normalizes course payloads
- selector helpers for all reads
- provider hooks for UI consumers
- legacy mutable globals retired after consumers migrate

Recommended read API:

- `getLoadedCourse(courseId)`
- `getQuiz(courseId, type, id)`
- `getQuizVariants(courseId, type, id)`
- `hasQuiz(courseId, type, id)`
- `ensureCourseLoaded(courseId)`
- `useCourseContent()`

## Migration order

1. Keep `COURSES`, `QUIZ_MAP`, and `QUIZ_VARIANTS` as compatibility exports only.
2. Migrate quiz consumers to selector helpers first.
3. Migrate lazy-loading consumers to `useCourseContent()` helpers instead of importing mutable globals directly.
4. Introduce memoized selectors for derived views such as search, stats, and roadmap data.
5. Audit module-init readers and move them behind hooks or selector calls executed after hydration.
6. Remove direct mutable map reads once no runtime consumers depend on them.
7. Retire legacy exports after a full test pass and content audit.

## Selectors and hooks to adopt

Short term:

- `getLoadedCourse(courseId)`
- `getQuiz(courseId, type, id)`
- `getQuizVariants(courseId, type, id)`
- `hasQuiz(courseId, type, id)`
- `ensureCourseLoaded(courseId)`

Medium term:

- `useLoadedCourse(courseId)`
- `useCourseQuiz(courseId, type, id)`
- `useCourseSearchIndex()`
- `useCourseCatalog()`

## Components to update first

The next migration wave should focus on components that benefit most from explicit hydration state:

- `src/layouts/AppLayout.jsx`
- `src/components/panels/SearchPanel.jsx`
- `src/components/panels/RoadmapPanel.jsx`
- `src/components/panels/StudentStats.jsx`
- `src/components/shared/ProfilePage.jsx`
- `src/components/panels/BookmarksPanel.jsx`

## Risks to avoid

- rewriting the full course system in one branch
- changing route behavior while migrating content reads
- rebuilding search, roadmap, and stats at module import time
- removing compatibility exports before all consumers are moved
- mixing hydration writes into UI components
