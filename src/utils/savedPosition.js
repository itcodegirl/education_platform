// Pure resolver that maps a saved-position payload (course/module/
// lesson labels persisted by AppLayout.savePosition) back to stable
// (courseIndex, moduleIndex, lessonIndex, isModuleQuiz) coordinates.
//
// Extracted out of useNavigation so the matching rules can be
// exercised without the rest of the navigation machinery.
//
// Matching strategy (per field):
//   1. strict equality with the entity's primary text
//   2. strict equality with the emoji-prefixed form AppLayout writes
//   3. substring fallback (legacy compatibility for older saves)
//
// Strict-first matching matters because emoji+title labels can share
// substrings — without it, a saved position pointing at one course
// could resolve to a different one whose label is a substring of the
// saved value. The substring fallback stays in place so saves written
// by older builds still resume correctly.

export function resolveSavedPosition(lastPosition, courses) {
  if (!lastPosition?.course || !lastPosition?.mod || !lastPosition?.les) {
    return null;
  }
  if (!Array.isArray(courses) || courses.length === 0) {
    return null;
  }

  const courseIndex = courses.findIndex((course) => courseLabelMatches(course, lastPosition.course));
  if (courseIndex === -1) return null;

  const course = courses[courseIndex];
  if (!course.modules?.length) return null;

  const moduleIndex = course.modules.findIndex((module) => moduleLabelMatches(module, lastPosition.mod));
  if (moduleIndex === -1) return null;

  const lessons = course.modules[moduleIndex].lessons || [];
  if (lessons.length === 0) return null;

  const isModuleQuiz = lastPosition.les.toLowerCase().includes('module quiz');
  const lessonIndex = isModuleQuiz
    ? lessons.length - 1
    : lessons.findIndex((lesson) => lesson.title === lastPosition.les);

  if (lessonIndex === -1) return null;

  return { courseIndex, moduleIndex, lessonIndex, isModuleQuiz };
}

function courseLabelMatches(course, savedLabel) {
  const label = course.label;
  if (!label) return false;
  if (savedLabel === label) return true;
  if (savedLabel === `${course.icon} ${label}`) return true;
  return savedLabel.includes(label);
}

function moduleLabelMatches(module, savedLabel) {
  const title = module.title;
  if (!title) return false;
  if (savedLabel === title) return true;
  if (savedLabel === `${module.emoji} ${title}`) return true;
  return savedLabel.includes(title);
}
