// ═══════════════════════════════════════════════
// COURSE LOADERS — Dynamic imports for each course's
// heavy content. Runtime routes only need modules and
// quizzes; challenge data is loaded separately by the
// challenge surfaces. Full course loads remain available
// for audits and other non-runtime analysis paths.
//
//   - modules[]    — lessons grouped by module
//   - quizzes[]    — per-lesson and per-module quizzes
//   - challenges[] — code challenges (audit/full-load only)
//
// These dynamic imports are what lets Vite split each
// course into its own chunk AND keep those chunks out
// of the initial modulepreload list — the reason we
// did this refactor in the first place.
// ═══════════════════════════════════════════════

const runtimeLoaders = {
  html: async () => {
    const [course, quizzes] = await Promise.all([
      import('./html/course'),
      import('./html/quizzes'),
    ]);
    return {
      modules: course.HTML_MODULES,
      quizzes: quizzes.HTML_QUIZZES,
    };
  },
  css: async () => {
    const [course, quizzes] = await Promise.all([
      import('./css/course'),
      import('./css/quizzes'),
    ]);
    return {
      modules: course.CSS_MODULES,
      quizzes: quizzes.CSS_QUIZZES,
    };
  },
  js: async () => {
    const [course, quizzes] = await Promise.all([
      import('./js/course'),
      import('./js/quizzes'),
    ]);
    return {
      modules: course.JS_MODULES,
      quizzes: quizzes.JS_QUIZZES,
    };
  },
  react: async () => {
    const [course, quizzes] = await Promise.all([
      import('./react/course'),
      import('./react/quizzes'),
    ]);
    return {
      modules: course.REACT_MODULES,
      quizzes: quizzes.REACT_QUIZZES,
    };
  },
};

const challengeLoaders = {
  html: async () => {
    const challenges = await import('./html/challenges');
    return challenges.HTML_CHALLENGES || [];
  },
  css: async () => {
    const challenges = await import('./css/challenges');
    return challenges.CSS_CHALLENGES || [];
  },
  js: async () => {
    const challenges = await import('./js/challenges');
    return challenges.JS_CHALLENGES || [];
  },
  react: async () => {
    const challenges = await import('./react/challenges');
    return challenges.REACT_CHALLENGES || [];
  },
};

export function loadCourseRuntime(id) {
  const loader = runtimeLoaders[id];
  if (!loader) {
    return Promise.reject(new Error(`Unknown course id: ${id}`));
  }
  return loader();
}

export async function loadCourse(id) {
  const runtimeLoader = runtimeLoaders[id];
  const challengeLoader = challengeLoaders[id];
  if (!runtimeLoader || !challengeLoader) {
    return Promise.reject(new Error(`Unknown course id: ${id}`));
  }

  const [runtimeData, challenges] = await Promise.all([
    runtimeLoader(),
    challengeLoader(),
  ]);

  return {
    ...runtimeData,
    challenges,
  };
}

export function loadCourseChallenges(id) {
  const loader = challengeLoaders[id];
  if (!loader) {
    return Promise.reject(new Error(`Unknown course id: ${id}`));
  }
  return loader();
}

export const COURSE_LOADER_IDS = Object.keys(runtimeLoaders);
