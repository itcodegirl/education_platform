import { hasLessonCompletion } from './lessonKeys';

// Returns true when the lesson at (moduleIndex, lessonIndex) is
// reachable in guided-order mode. The first lesson of the first
// module is always unlocked. Otherwise the predecessor must be
// completed:
//   - within a module: the previous lesson must be done
//   - at a module boundary: the last lesson of the previous module
//     must be done
//
// Pure helper — no React, no DOM. Re-used by Sidebar and
// SidebarModuleList. The companion `lockMode` flag lives at the
// caller; this helper is unconditional and answers the structural
// "is this reachable" question only.
export function isLessonUnlocked(course, modules, moduleIndex, lessonIndex, completedSet) {
  if (moduleIndex === 0 && lessonIndex === 0) return true;

  if (lessonIndex > 0) {
    const prevLesson = modules[moduleIndex].lessons[lessonIndex - 1];
    return hasLessonCompletion(completedSet, course, modules[moduleIndex], prevLesson);
  }

  if (moduleIndex > 0) {
    const prevMod = modules[moduleIndex - 1];
    const lastLesson = prevMod.lessons[prevMod.lessons.length - 1];
    return hasLessonCompletion(completedSet, course, prevMod, lastLesson);
  }

  return true;
}
