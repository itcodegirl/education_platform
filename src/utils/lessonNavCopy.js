// Pure helpers that derive the prev/next title labels and the
// learner-facing "next step" hint shown under the lesson nav.
// Extracted from AppLayout so the layout component stays focused
// on render glue and side effects.

export function getPrevLessonTitle({ isFirst, showModQuiz, modIdx, lesIdx, mod, modules }) {
  if (isFirst || showModQuiz) return null;
  if (lesIdx > 0) return mod.lessons?.[lesIdx - 1]?.title || null;
  if (modIdx > 0) {
    const prevMod = modules[modIdx - 1];
    const lastLesson = prevMod?.lessons?.[prevMod.lessons.length - 1];
    return lastLesson?.title || null;
  }
  return null;
}

export function getNextLessonTitle({
  isLast,
  isLastLesson,
  moduleQuiz,
  showModQuiz,
  modIdx,
  lesIdx,
  mod,
  modules,
}) {
  if (isLast) return null;
  if (isLastLesson && moduleQuiz && !showModQuiz) return `${mod.title} Quiz`;
  if (showModQuiz) {
    const nextMod = modules[modIdx + 1];
    return nextMod?.lessons?.[0]?.title || null;
  }
  if (lesIdx < (mod.lessons?.length || 0) - 1) {
    return mod.lessons?.[lesIdx + 1]?.title || null;
  }
  const nextMod = modules[modIdx + 1];
  return nextMod?.lessons?.[0]?.title || null;
}

export function getNextStepHint({ isLast, showModQuiz, isDone }) {
  if (isLast) return 'Track complete. Pick another course or review key lessons.';
  if (showModQuiz) return 'Finish this quiz to move into the next module.';
  if (!isDone) return 'Mark this lesson done, then continue to the next lesson.';
  return 'Nice progress. Continue when you are ready.';
}

export function getLessonPositionLabel({ showModQuiz, modTitle, lesIdx, lessonsLength }) {
  if (showModQuiz) return `Module quiz for ${modTitle}`;
  return `Lesson ${lesIdx + 1} of ${lessonsLength}`;
}
