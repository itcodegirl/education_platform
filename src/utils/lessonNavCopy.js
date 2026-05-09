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
  if (isLast) return 'Track complete. Pick another course or review a lesson that deserves another pass.';
  if (showModQuiz) return 'Submit the quiz when ready. Your best score saves, and retries will not duplicate XP.';
  if (!isDone) return 'Read, build the example, then Mark done so this lesson saves to your progress.';
  return 'Progress is saved here. Use Next to keep going, or review before moving on.';
}

export function getLessonPositionLabel({ showModQuiz, modTitle, lesIdx, lessonsLength }) {
  if (showModQuiz) return `Module quiz for ${modTitle}`;
  return `Lesson ${lesIdx + 1} of ${lessonsLength}`;
}
