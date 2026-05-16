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
