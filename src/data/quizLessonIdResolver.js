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

const CSS_HIGH_CONFIDENCE_LEGACY_LESSON_ALIASES = Object.freeze({
  'c5-1': 'css-1-4',
  'c6-1': 'css-2-5',
  'c6-2': 'css-2-1',
  'c6-3': 'css-2-3',
  'c7-1': 'css-3-2',
  'c7-3': 'css-4-1',
  'c8-1': 'css-4-3',
  'c10-3': 'css-4-6',
});

const JS_HIGH_CONFIDENCE_LEGACY_LESSON_ALIASES = Object.freeze({
  'j7-1': 'js-2-1',
  'j7-2': 'js-2-2',
  'j8-1': 'js-2-3',
  'j8-2': 'js-2-3',
  'j9-2': 'js-3-2',
  'j10-1': 'js-3-2',
  'j12-2': 'js-5-2',
  'j12-3': 'js-5-2',
  'j14-1': 'js-5-3',
  'j18-1': 'js-1-4',
  'j21-2': 'js-3-1',
  'j21-3': 'js-5-3',
});

const REACT_HIGH_CONFIDENCE_LEGACY_LESSON_ALIASES = Object.freeze({
  'r3-1': 'r1-3',
  'r4-1': 'r1-4',
  'r5-1': 'r2-1',
  'r6-1': 'r1-5',
  'r6-3': 'r19-3',
  'r7-1': 'r2-2',
  'r7-2': 'r2-3',
  'r10-2': 'r9-3',
  'r11-1': 'r15-2',
  'r14-1': 'r9-2',
  'r18-1': 'r16-2',
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
    const explicitAlias = CSS_HIGH_CONFIDENCE_LEGACY_LESSON_ALIASES[rawLessonId];
    if (explicitAlias) return explicitAlias;
    return resolveCssLegacyLessonId(rawLessonId);
  }

  if (courseId === 'js') {
    const explicitAlias = JS_HIGH_CONFIDENCE_LEGACY_LESSON_ALIASES[rawLessonId];
    if (explicitAlias) return explicitAlias;
    return resolveJsLegacyLessonId(rawLessonId);
  }

  if (courseId === 'react') {
    return REACT_HIGH_CONFIDENCE_LEGACY_LESSON_ALIASES[rawLessonId] || null;
  }

  // Python: do not infer broad remaps.
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
