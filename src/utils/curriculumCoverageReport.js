import { resolveQuizLessonId } from '../data/quizLessonIdResolver';
import {
  buildContentQualityReport,
  getContentQualitySignalLabel,
  getQuizQualityStatus,
} from './contentQualityReport';

export const CURRICULUM_COVERAGE_GAP_LABELS = Object.freeze({
  lessonQuiz: 'Lesson quiz',
  practicePrompt: 'Practice prompt',
  projectEvidence: 'Challenge/project evidence',
  lessonRubric: 'Lesson rubric depth',
  quizRubric: 'Quiz rubric depth',
});

export const CURRICULUM_COVERAGE_SUGGESTIONS = Object.freeze({
  lessonQuiz: 'Add or map a quiz that checks this exact lesson.',
  practicePrompt: 'Add an independent practice prompt, build goal, or challenge requirement.',
  projectEvidence: 'Map a challenge or project task to this module so learners can prove the skill.',
  lessonRubric: 'Add the missing lesson rubric signals before treating this lesson as fully covered.',
  quizRubric: 'Add quiz items for the missing reasoning, misconception, or application signals.',
});

const GAP_PRIORITY = Object.freeze({
  lessonQuiz: 50,
  projectEvidence: 40,
  quizRubric: 30,
  lessonRubric: 20,
  practicePrompt: 10,
});

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function hasPracticePrompt(lesson) {
  return (
    isNonEmptyString(lesson?.challenge) ||
    isNonEmptyString(lesson?.challenge?.mission) ||
    hasItems(lesson?.challenge?.requirements) ||
    isNonEmptyString(lesson?.build?.goal) ||
    hasItems(lesson?.do?.steps) ||
    hasItems(lesson?.tasks)
  );
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function pushList(map, key, value) {
  if (!key) return;
  if (!map.has(key)) {
    map.set(key, []);
  }
  map.get(key).push(value);
}

function toSortedCounts(map) {
  return [...map.entries()]
    .map(([name, count]) => ({
      name,
      label: getCurriculumCoverageGapLabel(name),
      count,
    }))
    .sort((left, right) =>
      right.count - left.count ||
      (GAP_PRIORITY[right.name] || 0) - (GAP_PRIORITY[left.name] || 0) ||
      left.label.localeCompare(right.label));
}

function toPercent(part, total) {
  if (!total) return 100;
  return Math.round((part / total) * 100);
}

function getCourseId(courseEntry = {}) {
  return courseEntry.courseMeta?.id || courseEntry.data?.id || 'unknown';
}

function getCourseLabel(courseEntry = {}) {
  const courseId = getCourseId(courseEntry);
  return courseEntry.courseMeta?.label || courseEntry.data?.label || courseId.toUpperCase();
}

function getLessonPath(courseId, moduleData, moduleIndex, lessonIndex) {
  return `${courseId}.${moduleData?.id || moduleIndex}.lessons[${lessonIndex}]`;
}

function getQuizPath(courseId, quizIndex) {
  return `${courseId}.quizzes[${quizIndex}]`;
}

function getQuestionMissingSignals(quiz) {
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  if (questions.length === 0) return [];

  return Object.entries(getQuizQualityStatus(questions))
    .filter(([, present]) => !present)
    .map(([signal]) => signal);
}

function buildCourseEntityIndex(courseId, modules = []) {
  const lessons = [];
  const modulesFlat = [];
  const lessonIdSet = new Set();
  const moduleIdSet = new Set();

  modules.forEach((moduleData, moduleIndex) => {
    const moduleRef = {
      courseId,
      moduleIndex,
      moduleId: moduleData?.id === undefined || moduleData?.id === null ? '' : String(moduleData.id),
      moduleTitle: moduleData?.title || 'Untitled module',
    };
    modulesFlat.push(moduleRef);
    if (moduleRef.moduleId) {
      moduleIdSet.add(moduleRef.moduleId);
    }

    (moduleData?.lessons || []).forEach((lesson, lessonIndex) => {
      const lessonRef = {
        ...moduleRef,
        lessonIndex,
        lesson,
        lessonId: lesson?.id === undefined || lesson?.id === null ? '' : String(lesson.id),
        lessonTitle: lesson?.title || 'Untitled lesson',
        path: getLessonPath(courseId, moduleData, moduleIndex, lessonIndex),
      };
      lessons.push(lessonRef);
      if (lessonRef.lessonId) {
        lessonIdSet.add(lessonRef.lessonId);
      }
    });
  });

  return {
    lessons,
    modules: modulesFlat,
    lessonIdSet,
    moduleIdSet,
  };
}

function indexQuizzes(courseId, quizzes, index) {
  const lessonQuizMap = new Map();
  const moduleQuizMap = new Map();

  (quizzes || []).forEach((quiz, quizIndex) => {
    const path = getQuizPath(courseId, quizIndex);
    const lessonResolution = resolveQuizLessonId(courseId, quiz?.lessonId, index.lessonIdSet);
    const missingSignals = getQuestionMissingSignals(quiz);
    const entry = {
      quiz,
      path,
      quizId: quiz?.id || `${courseId}-quiz-${quizIndex}`,
      rawLessonId: quiz?.lessonId === undefined || quiz?.lessonId === null ? '' : String(quiz.lessonId),
      resolvedLessonId: lessonResolution.resolvedLessonId === undefined || lessonResolution.resolvedLessonId === null
        ? ''
        : String(lessonResolution.resolvedLessonId),
      moduleId: quiz?.moduleId === undefined || quiz?.moduleId === null ? '' : String(quiz.moduleId),
      missingSignals,
      missingLabels: missingSignals.map(getContentQualitySignalLabel),
    };

    if (entry.resolvedLessonId) {
      pushList(lessonQuizMap, entry.resolvedLessonId, entry);
    }

    if (entry.moduleId && index.moduleIdSet.has(entry.moduleId)) {
      pushList(moduleQuizMap, entry.moduleId, entry);
    }
  });

  return { lessonQuizMap, moduleQuizMap };
}

function indexChallenges(challenges = []) {
  const challengeMap = new Map();
  const unmappedChallenges = [];

  challenges.forEach((challenge, challengeIndex) => {
    const entry = {
      challenge,
      challengeId: challenge?.id || `challenge-${challengeIndex}`,
      title: challenge?.title || 'Untitled challenge',
      recommendedModuleId: challenge?.recommendedModuleId === undefined || challenge?.recommendedModuleId === null
        ? ''
        : String(challenge.recommendedModuleId),
    };

    if (entry.recommendedModuleId) {
      pushList(challengeMap, entry.recommendedModuleId, entry);
    } else {
      unmappedChallenges.push(entry);
    }
  });

  return { challengeMap, unmappedChallenges };
}

function buildLessonGapDetails({ lessonQualityGap, quizEntries, hasQuizCoverage, hasPractice, hasProjectEvidence }) {
  const missing = [];
  const relatedSignals = new Map();

  if (!hasQuizCoverage) {
    missing.push('lessonQuiz');
  }

  if (!hasPractice) {
    missing.push('practicePrompt');
  }

  if (!hasProjectEvidence) {
    missing.push('projectEvidence');
  }

  if (lessonQualityGap) {
    missing.push('lessonRubric');
    relatedSignals.set('lessonRubric', lessonQualityGap.missingLabels || []);
  }

  const quizMissingLabels = quizEntries
    .flatMap((entry) => entry.missingLabels || [])
    .filter(Boolean);
  if (quizMissingLabels.length > 0) {
    missing.push('quizRubric');
    relatedSignals.set('quizRubric', [...new Set(quizMissingLabels)]);
  }

  return { missing, relatedSignals };
}

function getModuleRollups(moduleRows, lessonRows) {
  return moduleRows.map((moduleData) => {
    const moduleLessons = lessonRows.filter((lesson) =>
      lesson.moduleId === moduleData.moduleId && lesson.courseId === moduleData.courseId);
    const lessonCount = moduleLessons.length;
    const readyLessonCount = moduleLessons.filter((lesson) => lesson.ready).length;
    const gapCount = moduleLessons.reduce((total, lesson) => total + lesson.missing.length, 0);

    return {
      ...moduleData,
      lessonCount,
      readyLessonCount,
      gapCount,
      quizCoveragePercent: toPercent(
        moduleLessons.filter((lesson) => lesson.hasQuizCoverage).length,
        lessonCount,
      ),
      practiceCoveragePercent: toPercent(
        moduleLessons.filter((lesson) => lesson.hasPractice).length,
        lessonCount,
      ),
      projectEvidenceCoveragePercent: toPercent(
        moduleLessons.filter((lesson) => lesson.hasProjectEvidence).length,
        lessonCount,
      ),
    };
  });
}

function buildGapRows(lessonRows) {
  return lessonRows.flatMap((lesson) =>
    lesson.missing.map((gap) => ({
      id: `${lesson.path}:${gap}`,
      courseId: lesson.courseId,
      courseLabel: lesson.courseLabel,
      moduleId: lesson.moduleId,
      moduleTitle: lesson.moduleTitle,
      lessonId: lesson.lessonId,
      lessonTitle: lesson.lessonTitle,
      path: lesson.path,
      gap,
      gapLabel: getCurriculumCoverageGapLabel(gap),
      relatedSignals: lesson.relatedSignals[gap] || [],
      suggestion: CURRICULUM_COVERAGE_SUGGESTIONS[gap],
      priority: GAP_PRIORITY[gap] || 0,
    })))
    .sort((left, right) =>
      right.priority - left.priority ||
      left.courseLabel.localeCompare(right.courseLabel) ||
      left.moduleTitle.localeCompare(right.moduleTitle) ||
      left.lessonTitle.localeCompare(right.lessonTitle));
}

function summarizeCourse(course, lessonRows, moduleRows, projectIdeas) {
  const lessonCount = lessonRows.length;
  const readyLessonCount = lessonRows.filter((lesson) => lesson.ready).length;
  const quizReadyLessonCount = lessonRows.filter((lesson) => lesson.hasQuizCoverage).length;
  const practiceReadyLessonCount = lessonRows.filter((lesson) => lesson.hasPractice).length;
  const projectEvidenceReadyLessonCount = lessonRows
    .filter((lesson) => lesson.hasProjectEvidence)
    .length;
  const lessonRubricReadyCount = lessonRows.filter((lesson) =>
    !lesson.missing.includes('lessonRubric')).length;
  const quizRubricReadyCount = lessonRows.filter((lesson) =>
    !lesson.missing.includes('quizRubric')).length;
  const gapCount = lessonRows.reduce((total, lesson) => total + lesson.missing.length, 0);
  const modulesWithProjectEvidence = moduleRows
    .filter((moduleData) => moduleData.challengeCount > 0)
    .length;

  return {
    courseId: course.courseId,
    courseLabel: course.courseLabel,
    moduleCount: moduleRows.length,
    lessonCount,
    quizCount: course.quizCount,
    challengeCount: course.challengeCount,
    projectIdeaCount: projectIdeas.length,
    readyLessonCount,
    gapCount,
    lessonCoveragePercent: toPercent(readyLessonCount, lessonCount),
    quizCoveragePercent: toPercent(quizReadyLessonCount, lessonCount),
    practiceCoveragePercent: toPercent(practiceReadyLessonCount, lessonCount),
    projectEvidenceCoveragePercent: toPercent(projectEvidenceReadyLessonCount, lessonCount),
    lessonRubricCoveragePercent: toPercent(lessonRubricReadyCount, lessonCount),
    quizRubricCoveragePercent: toPercent(quizRubricReadyCount, lessonCount),
    modulesWithProjectEvidence,
    moduleProjectEvidencePercent: toPercent(modulesWithProjectEvidence, moduleRows.length),
  };
}

function analyzeCourse(courseEntry, qualityReport, projectsByCourse) {
  const courseId = getCourseId(courseEntry);
  const courseLabel = getCourseLabel(courseEntry);
  const modules = courseEntry.data?.modules || [];
  const quizzes = courseEntry.data?.quizzes || [];
  const challenges = courseEntry.data?.challenges || [];
  const projectIdeas = Array.isArray(projectsByCourse?.[courseId]) ? projectsByCourse[courseId] : [];
  const index = buildCourseEntityIndex(courseId, modules);
  const { lessonQuizMap, moduleQuizMap } = indexQuizzes(courseId, quizzes, index);
  const { challengeMap, unmappedChallenges } = indexChallenges(challenges);
  const lessonQualityGaps = new Map(
    (qualityReport.lessonGaps || [])
      .filter((row) => row.courseId === courseId)
      .map((row) => [row.path, row]),
  );

  const lessonRows = index.lessons.map((lessonRef) => {
    const lessonQuizEntries = lessonQuizMap.get(lessonRef.lessonId) || [];
    const moduleQuizEntries = moduleQuizMap.get(lessonRef.moduleId) || [];
    const quizEntries = [...lessonQuizEntries, ...moduleQuizEntries];
    const projectChallenges = challengeMap.get(lessonRef.moduleId) || [];
    const hasQuizCoverage = quizEntries.length > 0;
    const hasPractice = hasPracticePrompt(lessonRef.lesson);
    const hasProjectEvidence = projectChallenges.length > 0;
    const { missing, relatedSignals } = buildLessonGapDetails({
      lessonQualityGap: lessonQualityGaps.get(lessonRef.path),
      quizEntries,
      hasQuizCoverage,
      hasPractice,
      hasProjectEvidence,
    });

    return {
      courseId,
      courseLabel,
      moduleId: lessonRef.moduleId,
      moduleTitle: lessonRef.moduleTitle,
      lessonId: lessonRef.lessonId,
      lessonTitle: lessonRef.lessonTitle,
      path: lessonRef.path,
      hasQuizCoverage,
      hasLessonQuiz: lessonQuizEntries.length > 0,
      hasModuleQuiz: moduleQuizEntries.length > 0,
      quizCount: quizEntries.length,
      hasPractice,
      hasProjectEvidence,
      projectChallengeCount: projectChallenges.length,
      missing,
      missingLabels: missing.map(getCurriculumCoverageGapLabel),
      relatedSignals: Object.fromEntries(relatedSignals.entries()),
      ready: missing.length === 0,
    };
  });

  const moduleRows = getModuleRollups(
    index.modules.map((moduleData) => ({
      ...moduleData,
      courseLabel,
      challengeCount: (challengeMap.get(moduleData.moduleId) || []).length,
      moduleQuizCount: (moduleQuizMap.get(moduleData.moduleId) || []).length,
    })),
    lessonRows,
  );

  return {
    ...summarizeCourse(
      {
        courseId,
        courseLabel,
        quizCount: quizzes.length,
        challengeCount: challenges.length,
      },
      lessonRows,
      moduleRows,
      projectIdeas,
    ),
    modules: moduleRows,
    lessons: lessonRows,
    projectIdeas,
    unmappedChallenges,
  };
}

function summarizeTotals(courses, gapRows) {
  const totals = {
    courseCount: courses.length,
    moduleCount: 0,
    lessonCount: 0,
    quizCount: 0,
    challengeCount: 0,
    projectIdeaCount: 0,
    readyLessonCount: 0,
    coverageGapCount: gapRows.length,
    modulesWithProjectEvidence: 0,
  };

  courses.forEach((course) => {
    totals.moduleCount += course.moduleCount;
    totals.lessonCount += course.lessonCount;
    totals.quizCount += course.quizCount;
    totals.challengeCount += course.challengeCount;
    totals.projectIdeaCount += course.projectIdeaCount;
    totals.readyLessonCount += course.readyLessonCount;
    totals.modulesWithProjectEvidence += course.modulesWithProjectEvidence;
  });

  return {
    ...totals,
    lessonCoveragePercent: toPercent(totals.readyLessonCount, totals.lessonCount),
    moduleProjectEvidencePercent: toPercent(totals.modulesWithProjectEvidence, totals.moduleCount),
  };
}

function toCsvCell(value) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsvRow(values) {
  return values.map(toCsvCell).join(',');
}

export function getCurriculumCoverageGapLabel(gap) {
  return CURRICULUM_COVERAGE_GAP_LABELS[gap] || gap || 'Coverage gap';
}

export function getCurriculumCoverageStatusLabel(gapCount = 0) {
  return gapCount === 0 ? 'Covered' : `${gapCount} to map`;
}

export function buildCurriculumCoverageReport(courseEntries = [], { projectsByCourse = {} } = {}) {
  const qualityReport = buildContentQualityReport(courseEntries);
  const courses = courseEntries.map((courseEntry) =>
    analyzeCourse(courseEntry, qualityReport, projectsByCourse));
  const lessons = courses.flatMap((course) => course.lessons);
  const modules = courses.flatMap((course) => course.modules);
  const gapRows = buildGapRows(lessons);
  const gapCounts = new Map();

  gapRows.forEach((row) => increment(gapCounts, row.gap));

  return {
    totals: summarizeTotals(courses, gapRows),
    courses,
    modules,
    lessons,
    gapRows,
    gapsByType: toSortedCounts(gapCounts),
    qualityReport,
  };
}

export function buildCurriculumCoverageCsv(report = {}, generatedAt = new Date().toISOString()) {
  const rows = [[
    'generated_at',
    'course_id',
    'course',
    'module_id',
    'module',
    'lesson_id',
    'lesson',
    'gap_type',
    'gap_label',
    'related_signals',
    'suggestion',
    'path',
  ]];

  (report.gapRows || []).forEach((row) => {
    rows.push([
      generatedAt,
      row.courseId,
      row.courseLabel,
      row.moduleId,
      row.moduleTitle,
      row.lessonId,
      row.lessonTitle,
      row.gap,
      row.gapLabel,
      row.relatedSignals,
      row.suggestion,
      row.path,
    ]);
  });

  return `${rows.map(toCsvRow).join('\n')}\n`;
}
