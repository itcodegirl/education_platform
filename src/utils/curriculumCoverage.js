const GAP_LABELS = Object.freeze({
  missingQuiz: 'Missing quiz',
  missingProject: 'Missing project',
  missingRubric: 'Missing rubric',
  missingObjectives: 'Needs explicit objectives',
  missingPractice: 'Missing practice',
  missingSupportNotes: 'Missing support/a11y notes',
  quizObjectiveAlignment: 'Quiz needs objective map',
  projectRubricAlignment: 'Project needs rubric',
});

const REVIEW_STATUS = Object.freeze({
  complete: 'complete',
  needsReview: 'needs-review',
  missingAssessment: 'missing-assessment',
});

const ACCESSIBILITY_KEYWORDS = [
  'accessibility',
  'screen reader',
  'keyboard',
  'aria',
  'alt text',
  'focus',
  'contrast',
  'reduced motion',
  'wcag',
];

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === false) return [];
  return [value];
}

function hasText(value) {
  return typeof value === 'string' ? value.trim().length > 0 : value != null;
}

function flattenText(value, depth = 0) {
  if (value == null || depth > 5) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => flattenText(item, depth + 1)).join(' ');
  }
  if (typeof value === 'object') {
    return Object.values(value)
      .filter((item) => typeof item !== 'function')
      .map((item) => flattenText(item, depth + 1))
      .join(' ');
  }
  return '';
}

function normalizeTitle(value, fallback = 'Untitled') {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
}

function countQuestions(quiz) {
  return Array.isArray(quiz?.questions) ? quiz.questions.length : 0;
}

function summarizeQuizVariants(variants) {
  if (!variants?.primary) {
    return {
      count: 0,
      questionCount: 0,
      hasQuiz: false,
    };
  }

  const quizzes = [variants.primary, ...asArray(variants.bonus)];
  return {
    count: quizzes.length,
    questionCount: quizzes.reduce((sum, quiz) => sum + countQuestions(quiz), 0),
    hasQuiz: quizzes.some((quiz) => countQuestions(quiz) > 0),
  };
}

function collectExplicitObjectives(lesson) {
  return [
    ...asArray(lesson?.objectives),
    ...asArray(lesson?.learningObjectives),
    ...asArray(lesson?.standards),
    ...asArray(lesson?.summary?.capabilities),
    ...asArray(lesson?.hook?.accomplishments),
  ].filter(hasText);
}

function collectConceptSignals(lesson) {
  return [
    ...asArray(lesson?.concepts),
    ...asArray(lesson?.understand?.concepts),
    lesson?.understand?.keyTakeaway,
  ].filter(hasText);
}

function summarizeObjectives(lesson) {
  const explicit = collectExplicitObjectives(lesson);
  const inferred = explicit.length > 0 ? [] : collectConceptSignals(lesson);

  return {
    explicitCount: explicit.length,
    inferredCount: inferred.length,
    count: explicit.length || inferred.length,
    source: explicit.length > 0 ? 'explicit' : inferred.length > 0 ? 'inferred' : 'missing',
    hasExplicitObjectives: explicit.length > 0,
  };
}

function summarizePractice(lesson) {
  const items = [
    ...asArray(lesson?.do?.steps),
    ...asArray(lesson?.tasks),
    ...asArray(lesson?.practice),
    ...asArray(lesson?.activities),
    lesson?.build?.goal,
    lesson?.build?.code,
    lesson?.build?.codeComparison,
    lesson?.challenge,
  ].filter(hasText);

  return {
    count: items.length,
    hasPractice: items.length > 0,
  };
}

function summarizeProject(lesson) {
  const challenge = lesson?.project || lesson?.challenge || null;
  if (!challenge) {
    return {
      hasProject: false,
      title: '',
    };
  }

  return {
    hasProject: true,
    title: normalizeTitle(challenge.title || challenge.mission || challenge, 'Project challenge'),
  };
}

function summarizeRubric(lesson) {
  const challenge = lesson?.project || lesson?.challenge || {};
  const criteria = [
    ...asArray(lesson?.rubric),
    ...asArray(lesson?.criteria),
    ...asArray(challenge?.rubric),
    ...asArray(challenge?.criteria),
    ...asArray(challenge?.requirements),
  ].filter(hasText);

  return {
    criteriaCount: criteria.length,
    hasRubric: criteria.length > 0,
  };
}

function summarizeSupport(lesson) {
  const supportItems = [
    ...asArray(lesson?.supportNotes),
    ...asArray(lesson?.accessibilityNotes),
    lesson?.hint,
    lesson?.do?.proofRequired,
    lesson?.build?.hint,
    lesson?.challenge?.hint,
    lesson?.challenge?.bonusChallenge,
    lesson?.bridge?.preview,
    lesson?.devFession,
  ].filter(hasText);

  const searchableText = flattenText(lesson).toLowerCase();
  const hasAccessibilitySignal = ACCESSIBILITY_KEYWORDS.some((keyword) =>
    searchableText.includes(keyword),
  );

  return {
    supportCount: supportItems.length,
    hasSupportNotes: supportItems.length > 0,
    hasAccessibilitySignal,
    hasSupportOrAccessibility: supportItems.length > 0 || hasAccessibilitySignal,
  };
}

function determineReviewStatus(gaps) {
  if (gaps.includes('missingQuiz')) return REVIEW_STATUS.missingAssessment;
  if (gaps.length > 0) return REVIEW_STATUS.needsReview;
  return REVIEW_STATUS.complete;
}

function buildLessonCoverageRow({
  course,
  moduleData,
  lesson,
  lessonIndex,
  getQuizVariants,
}) {
  const quiz = summarizeQuizVariants(getQuizVariants?.(course.id, 'l', lesson.id));
  const objectives = summarizeObjectives(lesson);
  const practice = summarizePractice(lesson);
  const project = summarizeProject(lesson);
  const rubric = summarizeRubric(lesson);
  const support = summarizeSupport(lesson);

  const gaps = [];
  if (!quiz.hasQuiz) gaps.push('missingQuiz');
  if (!project.hasProject) gaps.push('missingProject');
  if (!rubric.hasRubric) gaps.push('missingRubric');
  if (!objectives.hasExplicitObjectives) gaps.push('missingObjectives');
  if (!practice.hasPractice) gaps.push('missingPractice');
  if (!support.hasSupportOrAccessibility) gaps.push('missingSupportNotes');
  if (quiz.hasQuiz && !objectives.hasExplicitObjectives) gaps.push('quizObjectiveAlignment');
  if (project.hasProject && !rubric.hasRubric) gaps.push('projectRubricAlignment');

  const status = determineReviewStatus(gaps);

  return {
    id: `${course.id}:${moduleData.id}:${lesson.id}`,
    courseId: course.id,
    courseLabel: course.label,
    moduleId: moduleData.id,
    moduleTitle: moduleData.title,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    lessonNumber: lessonIndex + 1,
    quiz,
    project,
    rubric,
    objectives,
    practice,
    support,
    gaps,
    status,
  };
}

function statusFromLessonRows(lessonRows) {
  if (lessonRows.some((row) => row.status === REVIEW_STATUS.missingAssessment)) {
    return REVIEW_STATUS.missingAssessment;
  }
  if (lessonRows.some((row) => row.status === REVIEW_STATUS.needsReview)) {
    return REVIEW_STATUS.needsReview;
  }
  return REVIEW_STATUS.complete;
}

function summarizeModule({ course, moduleData, lessonRows, getQuizVariants }) {
  const moduleQuiz = summarizeQuizVariants(getQuizVariants?.(course.id, 'm', moduleData.id));
  const gapKeys = new Set();
  lessonRows.forEach((row) => row.gaps.forEach((gap) => gapKeys.add(gap)));

  return {
    id: `${course.id}:${moduleData.id}`,
    courseId: course.id,
    courseLabel: course.label,
    moduleId: moduleData.id,
    moduleTitle: moduleData.title,
    lessonCount: lessonRows.length,
    lessonQuizCount: lessonRows.filter((row) => row.quiz.hasQuiz).length,
    lessonQuizQuestionCount: lessonRows.reduce((sum, row) => sum + row.quiz.questionCount, 0),
    moduleQuiz,
    projectCount: lessonRows.filter((row) => row.project.hasProject).length,
    rubricCount: lessonRows.filter((row) => row.rubric.hasRubric).length,
    objectiveCount: lessonRows.filter((row) => row.objectives.hasExplicitObjectives).length,
    practiceCount: lessonRows.filter((row) => row.practice.hasPractice).length,
    supportCount: lessonRows.filter((row) => row.support.hasSupportOrAccessibility).length,
    gapKeys: [...gapKeys],
    status: statusFromLessonRows(lessonRows),
  };
}

function summarizeCourse(course, moduleRows, lessonRows, courseChallenges) {
  return {
    id: course.id,
    label: course.label,
    icon: course.icon,
    accent: course.accent,
    moduleCount: moduleRows.length,
    lessonCount: lessonRows.length,
    lessonQuizCount: lessonRows.filter((row) => row.quiz.hasQuiz).length,
    projectCount: lessonRows.filter((row) => row.project.hasProject).length,
    rubricCount: lessonRows.filter((row) => row.rubric.hasRubric).length,
    objectiveCount: lessonRows.filter((row) => row.objectives.hasExplicitObjectives).length,
    practiceCount: lessonRows.filter((row) => row.practice.hasPractice).length,
    supportCount: lessonRows.filter((row) => row.support.hasSupportOrAccessibility).length,
    courseChallengeCount: courseChallenges.length,
    completeCount: lessonRows.filter((row) => row.status === REVIEW_STATUS.complete).length,
    needsReviewCount: lessonRows.filter((row) => row.status === REVIEW_STATUS.needsReview).length,
    missingAssessmentCount: lessonRows.filter((row) => row.status === REVIEW_STATUS.missingAssessment).length,
    status: statusFromLessonRows(lessonRows),
  };
}

function summarizeTotals(courseRows, moduleRows, lessonRows) {
  return {
    courses: courseRows.length,
    modules: moduleRows.length,
    totalLessons: lessonRows.length,
    complete: lessonRows.filter((row) => row.status === REVIEW_STATUS.complete).length,
    needsReview: lessonRows.filter((row) => row.status === REVIEW_STATUS.needsReview).length,
    missingAssessment: lessonRows.filter((row) => row.status === REVIEW_STATUS.missingAssessment).length,
    lessonsWithQuiz: lessonRows.filter((row) => row.quiz.hasQuiz).length,
    lessonsWithProjects: lessonRows.filter((row) => row.project.hasProject).length,
    lessonsWithRubrics: lessonRows.filter((row) => row.rubric.hasRubric).length,
    lessonsWithObjectives: lessonRows.filter((row) => row.objectives.hasExplicitObjectives).length,
    lessonsWithPractice: lessonRows.filter((row) => row.practice.hasPractice).length,
    lessonsWithSupport: lessonRows.filter((row) => row.support.hasSupportOrAccessibility).length,
    gapCount: lessonRows.reduce((sum, row) => sum + row.gaps.length, 0),
  };
}

export function buildCurriculumCoverage(courses = [], {
  getQuizVariants = () => null,
  getChallengesForCourse = () => [],
} = {}) {
  const courseRows = [];
  const moduleRows = [];
  const lessonRows = [];

  courses.forEach((course) => {
    const courseLessonRows = [];
    const courseModuleRows = [];
    const modules = Array.isArray(course?.modules) ? course.modules : [];

    modules.forEach((moduleData) => {
      const moduleLessonRows = (moduleData.lessons || []).map((lesson, lessonIndex) =>
        buildLessonCoverageRow({
          course,
          moduleData,
          lesson,
          lessonIndex,
          getQuizVariants,
        }),
      );

      const moduleSummary = summarizeModule({
        course,
        moduleData,
        lessonRows: moduleLessonRows,
        getQuizVariants,
      });

      courseModuleRows.push(moduleSummary);
      moduleRows.push(moduleSummary);
      courseLessonRows.push(...moduleLessonRows);
      lessonRows.push(...moduleLessonRows);
    });

    const courseChallenges = asArray(getChallengesForCourse(course.id));
    courseRows.push(summarizeCourse(course, courseModuleRows, courseLessonRows, courseChallenges));
  });

  return {
    courseRows,
    moduleRows,
    lessonRows,
    totals: summarizeTotals(courseRows, moduleRows, lessonRows),
  };
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function formatCoverageStatus(status) {
  if (status === REVIEW_STATUS.complete) return 'Complete';
  if (status === REVIEW_STATUS.missingAssessment) return 'Missing assessment';
  return 'Needs review';
}

export function formatGapLabel(gapKey) {
  return GAP_LABELS[gapKey] || gapKey;
}

export function coverageToCsv(matrix) {
  const headers = [
    'Status',
    'Course',
    'Module',
    'Lesson',
    'Lesson ID',
    'Quiz count',
    'Quiz questions',
    'Project',
    'Rubric criteria',
    'Explicit objectives',
    'Practice activities',
    'Support or accessibility notes',
    'Gaps',
  ];

  const rows = (matrix?.lessonRows || []).map((row) => [
    formatCoverageStatus(row.status),
    row.courseLabel,
    row.moduleTitle,
    row.lessonTitle,
    row.lessonId,
    row.quiz.count,
    row.quiz.questionCount,
    row.project.hasProject ? row.project.title : '',
    row.rubric.criteriaCount,
    row.objectives.explicitCount,
    row.practice.count,
    row.support.hasSupportOrAccessibility ? 'yes' : 'no',
    row.gaps.map(formatGapLabel).join('; '),
  ]);

  return [headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n');
}

export { GAP_LABELS, REVIEW_STATUS };
