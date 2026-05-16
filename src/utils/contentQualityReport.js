const QUIZ_SIGNAL_LABELS = Object.freeze({
  misconception: 'Misconception check',
  reasoning: 'Reasoning check',
  application: 'Application scenario',
});

const LESSON_SIGNAL_LABELS = Object.freeze({
  objective: 'Clear objective',
  misconceptionCheck: 'Common mistake',
  retrievalPrompt: 'Recall prompt',
  guidedPractice: 'Guided practice',
  independentPractice: 'Independent practice',
  transfer: 'Transfer bridge',
});

export const CONTENT_QUALITY_SUGGESTIONS = Object.freeze({
  misconception: 'Add one question that asks learners to identify or fix a common mistake.',
  reasoning: 'Add one predict-or-explain question that forces a why/because answer.',
  application: 'Add one small real-project scenario where learners choose the best approach.',
  objective: 'Add a learner-facing goal for what the lesson unlocks.',
  misconceptionCheck: 'Add a common mistake, watch-out, or debugging note.',
  retrievalPrompt: 'Add a short recall question learners can answer without looking.',
  transfer: 'Add a next-project or next-lesson bridge showing where this skill applies.',
});

export const CONTENT_QUALITY_FIX_TEMPLATES = Object.freeze({
  misconception: Object.freeze({
    title: 'Misconception quiz item',
    template: 'Ask learners to choose the bug, then explain why the tempting answer is wrong.',
  }),
  reasoning: Object.freeze({
    title: 'Predict/explain quiz item',
    template: 'Ask what happens before code runs, and require a because-style explanation.',
  }),
  application: Object.freeze({
    title: 'Scenario quiz item',
    template: 'Give a tiny project situation and ask which approach fits best.',
  }),
  objective: Object.freeze({
    title: 'Learning target',
    template: 'Learning target: By the end, learners can use this skill to complete a concrete UI task.',
  }),
  misconceptionCheck: Object.freeze({
    title: 'Common mistake',
    template: 'Common mistake: Learners often ___. Fix it by ___.',
  }),
  retrievalPrompt: Object.freeze({
    title: 'Recall prompt',
    template: 'Quick check: Without looking back, explain ___ in one sentence.',
  }),
  guidedPractice: Object.freeze({
    title: 'Guided practice',
    template: 'Model the first step, then ask learners to repeat it with one small change.',
  }),
  independentPractice: Object.freeze({
    title: 'Independent practice',
    template: 'Build a small version from scratch using the pattern from the lesson.',
  }),
  transfer: Object.freeze({
    title: 'Transfer bridge',
    template: 'Next, use this skill in a portfolio feature such as ___.',
  }),
});

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function textIncludesAny(value, terms) {
  const text = String(value || '').toLowerCase();
  return terms.some((term) => text.includes(term));
}

function getQuestionPromptText(question) {
  const feedback = question?.optionFeedback || question?.wrongAnswerFeedback || question?.feedback;
  const feedbackText = Array.isArray(feedback)
    ? feedback.join(' ')
    : typeof feedback === 'object' && feedback !== null
      ? Object.values(feedback).join(' ')
      : feedback;

  return [
    question?.question,
    question?.code,
    ...(Array.isArray(question?.lines) ? question.lines : []),
    question?.explanation,
    feedbackText,
  ].join(' ');
}

export function getQuizQualityStatus(questions = []) {
  const promptText = questions.map(getQuestionPromptText).join(' ');
  const types = new Set(questions.map((question) => question?.type || 'mc'));

  return {
    misconception:
      textIncludesAny(promptText, ['bug', 'mistake', 'incorrect', 'wrong', 'avoid', 'not valid', 'debug']),
    reasoning:
      types.has('code') ||
      types.has('bug') ||
      types.has('order') ||
      textIncludesAny(promptText, ['why', 'what happens', 'interpret', 'predict', 'because']),
    application:
      types.has('code') ||
      types.has('bug') ||
      textIncludesAny(promptText, ['scenario', 'best', 'should you', 'when would', 'real project']),
  };
}

function hasPracticePrompt(lesson) {
  return (
    isNonEmptyString(lesson?.challenge) ||
    isNonEmptyString(lesson?.challenge?.mission) ||
    hasItems(lesson?.challenge?.requirements) ||
    isNonEmptyString(lesson?.build?.goal) ||
    hasItems(lesson?.do?.steps)
  );
}

function getLessonQualityStatus(lesson) {
  const taskText = [
    ...(Array.isArray(lesson?.tasks) ? lesson.tasks : []),
    ...(Array.isArray(lesson?.do?.steps) ? lesson.do.steps : []),
    lesson?.challenge?.mission,
    lesson?.challenge?.bonusChallenge,
    lesson?.summary?.reflection,
  ].join(' ');
  const conceptText = [
    lesson?.content,
    lesson?.understand?.keyTakeaway,
    ...(Array.isArray(lesson?.concepts) ? lesson.concepts : []),
    ...(Array.isArray(lesson?.understand?.concepts)
      ? lesson.understand.concepts.map((concept) =>
        `${concept.term || concept.name || ''} ${concept.definition || concept.meaning || ''}`)
      : []),
  ].join(' ');

  return {
    objective:
      hasItems(lesson?.hook?.accomplishments) ||
      isNonEmptyString(lesson?.learningFrame?.learn) ||
      isNonEmptyString(lesson?.build?.goal),
    misconceptionCheck:
      hasItems(lesson?.understand?.commonMistakes) ||
      hasItems(lesson?.commonMistakes) ||
      textIncludesAny(`${conceptText} ${taskText}`, ['mistake', 'common error', 'watch out', 'avoid', 'debug']),
    retrievalPrompt:
      isNonEmptyString(lesson?.learningFrame?.check) ||
      textIncludesAny(`${taskText} ${lesson?.summary?.nextStep || ''}`, ['from memory', 'explain', 'recall', 'without looking', 'why']),
    guidedPractice:
      isNonEmptyString(lesson?.code) ||
      hasItems(lesson?.do?.steps) ||
      isNonEmptyString(lesson?.do?.code),
    independentPractice: hasPracticePrompt(lesson),
    transfer:
      isNonEmptyString(lesson?.bridge?.preview) ||
      isNonEmptyString(lesson?.learningFrame?.next) ||
      textIncludesAny(`${taskText} ${lesson?.output || ''}`, ['project', 'portfolio', 'real', 'next lesson', 'apply']),
  };
}

function getMissingSignals(status) {
  return Object.entries(status)
    .filter(([, present]) => !present)
    .map(([signal]) => signal);
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function toSortedCounts(map) {
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

function getQuizTargetLabel(quiz) {
  if (isNonEmptyString(quiz?.lessonId)) return `Lesson ${quiz.lessonId}`;
  if (isNonEmptyString(quiz?.moduleId)) return `Module ${quiz.moduleId}`;
  return 'Unmapped quiz';
}

function getSuggestion(missing) {
  return missing
    .map((signal) => CONTENT_QUALITY_SUGGESTIONS[signal])
    .find(Boolean) || 'Add one learner-facing evidence prompt.';
}

export function getContentQualitySignalLabel(signal) {
  return QUIZ_SIGNAL_LABELS[signal] || LESSON_SIGNAL_LABELS[signal] || signal;
}

export function getContentQualityFixTemplates(missing = []) {
  return [...new Set(missing)]
    .map((signal) => {
      const template = CONTENT_QUALITY_FIX_TEMPLATES[signal];
      if (!template) return null;
      return {
        signal,
        label: getContentQualitySignalLabel(signal),
        ...template,
      };
    })
    .filter(Boolean);
}

function toCsvCell(value) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsvRow(values) {
  return values.map(toCsvCell).join(',');
}

export function buildContentQualityReport(courseEntries = []) {
  const quizGaps = [];
  const lessonGaps = [];
  const missingSignals = new Map();
  const warningsByCourse = new Map();

  courseEntries.forEach(({ courseMeta, data }) => {
    const courseId = courseMeta?.id || data?.id || 'unknown';
    const courseLabel = courseMeta?.label || data?.label || courseId.toUpperCase();

    (data?.quizzes || []).forEach((quiz, quizIndex) => {
      const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
      if (questions.length === 0) return;

      const missing = getMissingSignals(getQuizQualityStatus(questions));
      if (missing.length === 0) return;

      missing.forEach((signal) => increment(missingSignals, signal));
      increment(warningsByCourse, courseId);
      quizGaps.push({
        id: quiz?.id || `${courseId}-quiz-${quizIndex}`,
        path: `${courseId}.quizzes[${quizIndex}]`,
        courseId,
        courseLabel,
        target: getQuizTargetLabel(quiz),
        missing,
        missingLabels: missing.map((signal) => QUIZ_SIGNAL_LABELS[signal] || signal),
        suggestion: getSuggestion(missing),
        fixTemplates: getContentQualityFixTemplates(missing),
      });
    });

    (data?.modules || []).forEach((moduleData, moduleIndex) => {
      (moduleData?.lessons || []).forEach((lesson, lessonIndex) => {
        const status = getLessonQualityStatus(lesson);
        const presentCount = Object.values(status).filter(Boolean).length;
        if (presentCount >= 4) return;

        const missing = getMissingSignals(status);
        missing.forEach((signal) => increment(missingSignals, signal));
        increment(warningsByCourse, courseId);
        lessonGaps.push({
          id: lesson?.id || `${courseId}-lesson-${moduleIndex}-${lessonIndex}`,
          path: `${courseId}.${moduleData?.id || moduleIndex}.lessons[${lessonIndex}]`,
          courseId,
          courseLabel,
          moduleTitle: moduleData?.title || 'Untitled module',
          lessonTitle: lesson?.title || 'Untitled lesson',
          presentCount,
          missing,
          missingLabels: missing.map((signal) => LESSON_SIGNAL_LABELS[signal] || signal),
          suggestion: getSuggestion(missing),
          fixTemplates: getContentQualityFixTemplates(missing),
        });
      });
    });
  });

  return {
    warningCount: quizGaps.length + lessonGaps.length,
    quizGapCount: quizGaps.length,
    lessonGapCount: lessonGaps.length,
    quizGaps,
    lessonGaps,
    warningsByCourse: toSortedCounts(warningsByCourse),
    missingSignals: toSortedCounts(missingSignals),
  };
}

function getActionBucket(map, row) {
  if (!map.has(row.courseId)) {
    map.set(row.courseId, {
      courseId: row.courseId,
      courseLabel: row.courseLabel,
      totalGaps: 0,
      quizGaps: 0,
      lessonGaps: 0,
      signals: new Map(),
    });
  }

  return map.get(row.courseId);
}

function addGapToActionBucket(bucket, row, type) {
  bucket.totalGaps += 1;
  if (type === 'quiz') {
    bucket.quizGaps += 1;
  } else {
    bucket.lessonGaps += 1;
  }
  (row.missing || []).forEach((signal) => increment(bucket.signals, signal));
}

function getActionPriority(row, type) {
  const missingCount = Array.isArray(row.missing) ? row.missing.length : 0;
  if (type === 'lesson') {
    return missingCount + Math.max(0, 4 - Number(row.presentCount || 0));
  }
  return missingCount;
}

export function buildContentQualityActionPlan(report = {}, { limit = 5 } = {}) {
  const courseBuckets = new Map();

  (report.quizGaps || []).forEach((row) => {
    addGapToActionBucket(getActionBucket(courseBuckets, row), row, 'quiz');
  });

  (report.lessonGaps || []).forEach((row) => {
    addGapToActionBucket(getActionBucket(courseBuckets, row), row, 'lesson');
  });

  const sprintFocus = [...courseBuckets.values()]
    .map((bucket) => {
      const topSignal = toSortedCounts(bucket.signals)[0] || null;
      return {
        courseId: bucket.courseId,
        courseLabel: bucket.courseLabel,
        totalGaps: bucket.totalGaps,
        quizGaps: bucket.quizGaps,
        lessonGaps: bucket.lessonGaps,
        topSignal: topSignal?.name || '',
        topSignalLabel: topSignal ? getContentQualitySignalLabel(topSignal.name) : 'Clear',
        topSignalCount: topSignal?.count || 0,
        suggestedNextStep: topSignal
          ? getSuggestion([topSignal.name])
          : 'Keep monitoring this course as new content ships.',
      };
    })
    .sort((left, right) =>
      right.totalGaps - left.totalGaps ||
      right.lessonGaps - left.lessonGaps ||
      left.courseLabel.localeCompare(right.courseLabel))
    .slice(0, limit);

  const allFixes = [
    ...(report.lessonGaps || []).map((row) => ({
      ...row,
      type: 'lesson',
      label: `${row.courseLabel} - ${row.lessonTitle}`,
      priority: getActionPriority(row, 'lesson'),
    })),
    ...(report.quizGaps || []).map((row) => ({
      ...row,
      type: 'quiz',
      label: `${row.courseLabel} - ${row.target}`,
      priority: getActionPriority(row, 'quiz'),
    })),
  ]
    .sort((left, right) =>
      right.priority - left.priority ||
      left.courseLabel.localeCompare(right.courseLabel) ||
      left.label.localeCompare(right.label));

  const nextFixes = allFixes.slice(0, limit);

  return { sprintFocus, nextFixes, allFixes };
}

export function buildContentQualityCsv(report = {}, generatedAt = new Date().toISOString()) {
  const rows = [[
    'generated_at',
    'type',
    'course_id',
    'course',
    'item',
    'path',
    'missing_signals',
    'missing_labels',
    'suggestion',
  ]];

  (report.quizGaps || []).forEach((row) => {
    rows.push([
      generatedAt,
      'quiz',
      row.courseId,
      row.courseLabel,
      row.target || row.id,
      row.path,
      row.missing,
      row.missingLabels,
      row.suggestion,
    ]);
  });

  (report.lessonGaps || []).forEach((row) => {
    rows.push([
      generatedAt,
      'lesson',
      row.courseId,
      row.courseLabel,
      `${row.moduleTitle || 'Module'} - ${row.lessonTitle || row.id}`,
      row.path,
      row.missing,
      row.missingLabels,
      row.suggestion,
    ]);
  });

  return `${rows.map(toCsvRow).join('\n')}\n`;
}
