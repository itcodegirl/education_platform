export function getLessonKeyVariants(course, moduleData, lesson) {
  const stable = course?.id && moduleData?.id && lesson?.id
    ? `c:${course.id}|m:${moduleData.id}|l:${lesson.id}`
    : '';
  const legacy = course?.label && moduleData?.title && lesson?.title
    ? `${course.label}|${moduleData.title}|${lesson.title}`
    : '';
  return { stable, legacy };
}

function hasKey(container, key) {
  if (!key) return false;
  if (container instanceof Set) return container.has(key);
  return Array.isArray(container) ? container.includes(key) : false;
}

export function hasLessonCompletion(container, course, moduleData, lesson) {
  const { stable, legacy } = getLessonKeyVariants(course, moduleData, lesson);
  return hasKey(container, stable) || hasKey(container, legacy);
}

export function getCourseCompletedLessonCount(container, course) {
  if (!course?.modules?.length) return 0;
  let done = 0;
  for (const moduleData of course.modules) {
    for (const lesson of moduleData.lessons) {
      if (hasLessonCompletion(container, course, moduleData, lesson)) {
        done += 1;
      }
    }
  }
  return done;
}

export function lessonKeyBelongsToCourse(lessonKey, course) {
  if (!lessonKey || !course) return false;
  return lessonKey.startsWith(`c:${course.id}|`) || lessonKey.startsWith(`${course.label}|`);
}

export function lessonKeyMatchesLesson(lessonKey, course, moduleData, lesson) {
  const { stable, legacy } = getLessonKeyVariants(course, moduleData, lesson);
  return lessonKey === stable || lessonKey === legacy;
}

export function resolveStableLessonKey(course, lessonKey) {
  if (!course?.modules?.length || !lessonKey) return null;

  for (const moduleData of course.modules) {
    for (const lesson of moduleData.lessons) {
      if (lessonKeyMatchesLesson(lessonKey, course, moduleData, lesson)) {
        return getLessonKeyVariants(course, moduleData, lesson).stable;
      }
    }
  }

  return null;
}

export function findLessonByKey(lessonKey, courses = []) {
  if (!lessonKey || !Array.isArray(courses) || courses.length === 0) return null;

  for (let courseIndex = 0; courseIndex < courses.length; courseIndex += 1) {
    const course = courses[courseIndex];
    if (!course?.modules?.length) continue;

    for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex += 1) {
      const moduleData = course.modules[moduleIndex];
      if (!moduleData?.lessons?.length) continue;

      for (let lessonIndex = 0; lessonIndex < moduleData.lessons.length; lessonIndex += 1) {
        const lesson = moduleData.lessons[lessonIndex];
        if (!lessonKeyMatchesLesson(lessonKey, course, moduleData, lesson)) continue;

        const { stable, legacy } = getLessonKeyVariants(course, moduleData, lesson);
        return {
          course,
          moduleData,
          lesson,
          courseIndex,
          moduleIndex,
          lessonIndex,
          stableKey: stable,
          legacyKey: legacy,
        };
      }
    }
  }

  return null;
}

export function resolveStableLessonKeyAcrossCourses(lessonKey, courses = []) {
  if (!lessonKey) return '';
  if (lessonKey.startsWith('c:')) return lessonKey;

  const match = findLessonByKey(lessonKey, courses);
  return match?.stableKey || lessonKey;
}

export function lessonKeysEquivalent(leftKey, rightKey, courses = []) {
  if (!leftKey || !rightKey) return false;
  if (leftKey === rightKey) return true;

  const leftStable = resolveStableLessonKeyAcrossCourses(leftKey, courses);
  const rightStable = resolveStableLessonKeyAcrossCourses(rightKey, courses);
  return leftStable === rightStable;
}
