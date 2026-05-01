// ═══════════════════════════════════════════════
// COURSE LOADERS — Dynamic imports for each course's
// heavy content. Called by CourseContentProvider on
// demand. Each loader pulls:
//
//   - modules[]    — lessons grouped by module
//   - quizzes[]    — per-lesson and per-module quizzes
//   - challenges[] — code challenges (used by the
//                    Challenges panel, not the main flow)
//
// These dynamic imports are what lets Vite split each
// course into its own chunk AND keep those chunks out
// of the initial modulepreload list — the reason we
// did this refactor in the first place.
// ═══════════════════════════════════════════════

const loaders = {
  html: async () => {
    const [course, quizzes, challenges] = await Promise.all([
      import('./html/course'),
      import('./html/quizzes'),
      import('./html/challenges'),
    ]);
    return {
      modules: course.HTML_MODULES,
      quizzes: quizzes.HTML_QUIZZES,
      challenges: challenges.HTML_CHALLENGES || [],
    };
  },
  css: async () => {
    const [course, quizzes, challenges] = await Promise.all([
      import('./css/course'),
      import('./css/quizzes'),
      import('./css/challenges'),
    ]);
    return {
      modules: course.CSS_MODULES,
      quizzes: quizzes.CSS_QUIZZES,
      challenges: challenges.CSS_CHALLENGES || [],
    };
  },
  js: async () => {
    const [course, quizzes, challenges] = await Promise.all([
      import('./js/course'),
      import('./js/quizzes'),
      import('./js/challenges'),
    ]);
    return {
      modules: course.JS_MODULES,
      quizzes: quizzes.JS_QUIZZES,
      challenges: challenges.JS_CHALLENGES || [],
    };
  },
  react: async () => {
    const [course, quizzes, challenges] = await Promise.all([
      import('./react/course'),
      import('./react/quizzes'),
      import('./react/challenges'),
    ]);
    return {
      modules: course.REACT_MODULES,
      quizzes: quizzes.REACT_QUIZZES,
      challenges: challenges.REACT_CHALLENGES || [],
    };
  },
};

export function loadCourse(id) {
  const loader = loaders[id];
  if (!loader) {
    return Promise.reject(new Error(`Unknown course id: ${id}`));
  }
  return loader();
}

export const COURSE_LOADER_IDS = Object.keys(loaders);
