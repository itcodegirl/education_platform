const HTML_LEGACY_LESSON_ALIASES = Object.freeze({
  'h1-1': 'lesson-05',
  'h1-2': 'lesson-06',
  'h3-1': 'lesson-01',
  'h4-1': 'lesson-01',
  'h4-2': 'lesson-01',
  'h5-1': 'lesson-01',
  'h5-2': 'lesson-08',
  'h5-3': 'lesson-08',
  'h6-1': 'lesson-02',
  'h7-1': 'lesson-03',
  'h7-2': 'lesson-09',
  'h8-1': 'lesson-04',
  'h9-1': 'lesson-06',
  'h10-1': 'lesson-07',
  'h10-2': 'lesson-07',
  'h12-1': 'lesson-05',
  'h12-2': 'lesson-05',
  'h12-3': 'lesson-05',
  'h13-1': 'lesson-03',
  'h14-1': 'lesson-12',
  'h15-1': 'lesson-12',
  'h18-1': 'lesson-12',
  'h20-2': 'lesson-12',
});

function resolveCssLegacyLessonId(rawLessonId) {
  const match = /^c(\d+)-(\d+)$/.exec(rawLessonId);
  if (!match) return null;
  return `css-${match[1]}-${match[2]}`;
}

function resolveJsLegacyLessonId(rawLessonId) {
  const match = /^j(\d+)-(\d+)$/.exec(rawLessonId);
  if (!match) return null;
  return `js-${match[1]}-${match[2]}`;
}

function resolveLegacyLessonId(courseId, rawLessonId) {
  if (!rawLessonId) return null;

  if (courseId === 'html') {
    return HTML_LEGACY_LESSON_ALIASES[rawLessonId] || null;
  }

  if (courseId === 'css') {
    return resolveCssLegacyLessonId(rawLessonId);
  }

  if (courseId === 'js') {
    return resolveJsLegacyLessonId(rawLessonId);
  }

  // React/Python: do not infer broad remaps.
  return null;
}

function normalizeLessonIdSet(lessonIdSet) {
  if (lessonIdSet instanceof Set) return lessonIdSet;
  if (Array.isArray(lessonIdSet)) return new Set(lessonIdSet);
  return new Set();
}

export function resolveQuizLessonId(courseId, rawLessonId, lessonIdSet) {
  if (!rawLessonId) {
    return {
      rawLessonId: null,
      resolvedLessonId: null,
      resolution: 'missing',
    };
  }

  const lessonIds = normalizeLessonIdSet(lessonIdSet);
  if (lessonIds.has(rawLessonId)) {
    return {
      rawLessonId,
      resolvedLessonId: rawLessonId,
      resolution: 'direct',
    };
  }

  const aliasedLessonId = resolveLegacyLessonId(courseId, rawLessonId);
  if (aliasedLessonId && lessonIds.has(aliasedLessonId)) {
    return {
      rawLessonId,
      resolvedLessonId: aliasedLessonId,
      resolution: 'alias',
    };
  }

  return {
    rawLessonId,
    resolvedLessonId: null,
    resolution: 'unresolved',
  };
}

export function getHtmlLegacyLessonAliases() {
  return HTML_LEGACY_LESSON_ALIASES;
}
