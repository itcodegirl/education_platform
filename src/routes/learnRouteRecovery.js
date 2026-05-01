import { COURSES } from '../data';
import { resolveStableLessonKeyAcrossCourses } from '../utils/lessonKeys';

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildLessonCandidates(rawLessonKey) {
  const lessonKey = resolveStableLessonKeyAcrossCourses(rawLessonKey, COURSES) || rawLessonKey;
  const lessonKeys = Array.from(new Set([lessonKey, rawLessonKey].filter(Boolean)));
  return { lessonKey, lessonKeys };
}

export function createRecoverableLearnActionWrite(intent, payload = {}) {
  const mode = normalizeText(payload.mode);

  if (intent === 'toggle-progress') {
    const rawLessonKey = normalizeText(payload.lessonKey);
    if (!rawLessonKey) return null;

    const { lessonKey, lessonKeys } = buildLessonCandidates(rawLessonKey);
    if (mode === 'complete') {
      return {
        operation: 'addLesson',
        payload: { lessonKey },
      };
    }

    if (mode === 'uncomplete') {
      return {
        operation: 'removeLessonVariants',
        payload: {
          lessonKeys,
          dedupeLessonKey: lessonKey,
        },
      };
    }

    return null;
  }

  if (intent === 'toggle-bookmark') {
    const rawLessonKey = normalizeText(payload.lessonKey);
    const courseId = normalizeText(payload.courseId);
    const lessonTitle = normalizeText(payload.lessonTitle);
    if (!rawLessonKey || !courseId || !lessonTitle) return null;

    const { lessonKey, lessonKeys } = buildLessonCandidates(rawLessonKey);
    if (mode === 'save') {
      return {
        operation: 'addBookmark',
        payload: {
          bookmark: {
            lessonKey,
            courseId,
            lessonTitle,
          },
        },
      };
    }

    if (mode === 'remove') {
      return {
        operation: 'removeBookmarkVariants',
        payload: {
          lessonKeys,
          dedupeLessonKey: lessonKey,
        },
      };
    }

    return null;
  }

  return null;
}
