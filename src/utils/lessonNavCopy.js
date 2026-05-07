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
  if (showModQuiz) return 'Finish the quiz to save this checkpoint, then continue into the next module.';
  if (!isDone) return 'Complete the lesson when the idea clicks. This saves reading progress; quizzes and challenges stay separate.';
  return 'Saved. Continue to the next lesson when you are ready.';
}

export function getLessonPositionLabel({ showModQuiz, modTitle, lesIdx, lessonsLength }) {
  if (showModQuiz) return `Module quiz for ${modTitle}`;
  return `Lesson ${lesIdx + 1} of ${lessonsLength}`;
}

export function getCurrentStepCopy({ isLast, showModQuiz, isDone, nextTitle }) {
  if (showModQuiz) {
    return {
      title: 'Module quiz',
      copy: nextTitle
        ? `Finish this quiz to save the checkpoint. Then continue to ${nextTitle}.`
        : 'Finish this quiz to save the checkpoint before choosing what to review next.',
    };
  }

  if (isDone) {
    if (isLast) {
      return {
        title: 'Track complete',
        copy: 'This course is complete. Review a lesson, open another course, or polish a project when you are ready.',
      };
    }

    return {
      title: 'Continue learning',
      copy: nextTitle
        ? `Progress is saved. Continue to ${nextTitle}.`
        : 'Progress is saved. Continue to the next lesson when you are ready.',
    };
  }

  return {
    title: 'Continue learning',
    copy: 'Read this lesson, try the build, then use Complete lesson to save reading progress.',
  };
}
