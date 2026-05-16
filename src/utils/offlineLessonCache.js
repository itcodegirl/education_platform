const CACHE_CURRENT_LESSON_MESSAGE = 'CACHE_CURRENT_LESSON';

function isSafeLearnPath(path) {
  return typeof path === 'string'
    && path.startsWith('/learn/')
    && !path.startsWith('//')
    && !path.includes('\\');
}

export function requestOfflineLessonCache({
  path,
  courseId = '',
  moduleId = '',
  lessonId = '',
  title = '',
} = {}) {
  if (!isSafeLearnPath(path)) return false;
  if (typeof navigator === 'undefined') return false;

  const controller = navigator.serviceWorker?.controller;
  if (!controller || typeof controller.postMessage !== 'function') return false;

  controller.postMessage({
    type: CACHE_CURRENT_LESSON_MESSAGE,
    payload: {
      path,
      courseId,
      moduleId,
      lessonId,
      title,
    },
  });
  return true;
}
