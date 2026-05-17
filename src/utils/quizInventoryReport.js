import { resolveQuizLessonId } from '../data/quizLessonIdResolver';
import {
  INTENTIONAL_LESSON_QUIZ_VARIANTS,
  LESSON_QUIZ_ORPHAN_CLASSIFICATIONS,
} from './quizInventoryRegistry';

const QUIZ_INVENTORY_CLASSIFICATION_LABELS = Object.freeze({
  'future-advanced-content': 'Future advanced',
  'legacy-archived': 'Legacy archived',
  'possible-reuse-later': 'Possible reuse',
  stale: 'Stale',
  unclassified: 'Unclassified',
});

function pushList(map, key, value) {
  if (!map.has(key)) {
    map.set(key, []);
  }
  map.get(key).push(value);
}

function summarizeMapDuplicates(map) {
  return [...map.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([key, entries]) => ({ key, entries }));
}

function toSortedCounts(map) {
  return [...map.entries()]
    .map(([name, count]) => ({
      name,
      label: getQuizInventoryClassificationLabel(name),
      count,
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function mergeClassificationCounts(target, source) {
  Object.entries(source || {}).forEach(([classification, count]) => {
    target[classification] = (target[classification] || 0) + count;
  });
}

function buildCourseEntityIndex(courseId, modules = []) {
  const lessons = [];
  const modulesFlat = [];

  modules.forEach((moduleData) => {
    const moduleRef = {
      courseId,
      moduleId: moduleData?.id || '',
      moduleTitle: moduleData?.title || 'Untitled module',
    };
    modulesFlat.push(moduleRef);

    (moduleData?.lessons || []).forEach((lesson) => {
      lessons.push({
        ...moduleRef,
        lessonId: lesson?.id || '',
        lessonTitle: lesson?.title || 'Untitled lesson',
      });
    });
  });

  return {
    lessons,
    modules: modulesFlat,
    lessonIdSet: new Set(lessons.map((lesson) => lesson.lessonId).filter(Boolean)),
    moduleIdSet: new Set(modulesFlat.map((moduleData) => moduleData.moduleId).filter(Boolean)),
  };
}

function makeQuizEntry(courseId, courseLabel, quiz, index, lessonResolution) {
  return {
    courseId,
    courseLabel,
    index,
    quizId: quiz?.id || null,
    rawLessonId: quiz?.lessonId || null,
    resolvedLessonId: lessonResolution?.resolvedLessonId || null,
    lessonResolution: lessonResolution?.resolution || 'missing',
    moduleId: quiz?.moduleId || null,
    questionCount: Array.isArray(quiz?.questions) ? quiz.questions.length : 0,
    path: `${courseId}.quizzes[${index}]`,
  };
}

function keyForLesson(courseId, lessonId) {
  return `l:${courseId}:${lessonId}`;
}

function keyForModule(courseId, moduleId) {
  return `m:${courseId}:${moduleId}`;
}

function keyForOrphanLessonQuiz(courseId, rawLessonId) {
  return `o:${courseId}:${rawLessonId}`;
}

function rawLessonIdsForEntries(entries) {
  return entries.map((entry) => entry.rawLessonId).filter(Boolean);
}

function arraysMatch(left, right) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function reviewLessonVariantGroup(scopedLessonKey, primary, bonus) {
  const lockedVariant = INTENTIONAL_LESSON_QUIZ_VARIANTS[scopedLessonKey];

  if (!lockedVariant) {
    return {
      status: 'unreviewed',
      label: 'Unreviewed',
      reason: 'No intentional variant metadata registered.',
    };
  }

  const expectedPrimary = lockedVariant.primaryRawLessonIds || [];
  const expectedBonus = lockedVariant.bonusRawLessonIds || [];
  const actualPrimary = rawLessonIdsForEntries([primary]);
  const actualBonus = rawLessonIdsForEntries(bonus);

  if (!arraysMatch(actualPrimary, expectedPrimary) || !arraysMatch(actualBonus, expectedBonus)) {
    return {
      status: 'metadata-mismatch',
      label: 'Metadata mismatch',
      reason: 'Intentional variant metadata no longer matches the reported primary/bonus quiz IDs.',
    };
  }

  return {
    status: lockedVariant.status,
    label: lockedVariant.status === 'intentional' ? 'Intentional' : lockedVariant.status,
    reason: lockedVariant.reason,
  };
}

function reviewOrphanLessonQuiz(courseId, entry) {
  const classification = LESSON_QUIZ_ORPHAN_CLASSIFICATIONS[
    keyForOrphanLessonQuiz(courseId, entry.rawLessonId)
  ];

  if (!classification) {
    return {
      classification: 'unclassified',
      label: getQuizInventoryClassificationLabel('unclassified'),
      reason: 'No orphan quiz classification metadata registered.',
    };
  }

  return {
    ...classification,
    label: getQuizInventoryClassificationLabel(classification.classification),
  };
}

function countByClassification(entries) {
  return entries.reduce((counts, entry) => {
    const classification = entry.orphanReview?.classification || 'unclassified';
    counts[classification] = (counts[classification] || 0) + 1;
    return counts;
  }, {});
}

function getCourseBlockingIssueCount(report) {
  return (
    report.duplicateRawQuizIds.length +
    report.duplicateActiveLessonIds.length +
    report.duplicateScopedModuleKeys.length +
    report.suspiciousLessonVariantGroups.length +
    report.unclassifiedOrphanLessonQuizCount +
    report.orphanModuleQuizzes.length +
    report.lessonsWithNoQuiz.length +
    report.modulesWithNoQuiz.length
  );
}

function analyzeCourse(courseEntry) {
  const { courseMeta, data } = courseEntry || {};
  const courseId = courseMeta?.id || data?.id || 'unknown';
  const courseLabel = courseMeta?.label || data?.label || courseId.toUpperCase();
  const modules = data?.modules || [];
  const quizzes = data?.quizzes || [];
  const index = buildCourseEntityIndex(courseId, modules);

  const activeLessonIdMap = new Map();
  const rawQuizIdMap = new Map();
  const scopedLessonKeyMap = new Map();
  const scopedModuleKeyMap = new Map();
  const validLessonKeyMap = new Map();
  const validModuleKeyMap = new Map();
  const orphanLessonQuizzes = [];
  const orphanModuleQuizzes = [];

  index.lessons.forEach((lesson) => {
    pushList(activeLessonIdMap, lesson.lessonId, lesson);
  });

  quizzes.forEach((quiz, indexInArray) => {
    const lessonResolution = resolveQuizLessonId(courseId, quiz?.lessonId, index.lessonIdSet);
    const entry = makeQuizEntry(courseId, courseLabel, quiz, indexInArray, lessonResolution);

    if (entry.quizId) {
      pushList(rawQuizIdMap, entry.quizId, entry);
    }

    if (entry.resolvedLessonId) {
      const scopedLessonKey = keyForLesson(courseId, entry.resolvedLessonId);
      pushList(scopedLessonKeyMap, scopedLessonKey, entry);
      pushList(validLessonKeyMap, scopedLessonKey, entry);
    } else if (entry.rawLessonId) {
      entry.orphanReview = reviewOrphanLessonQuiz(courseId, entry);
      orphanLessonQuizzes.push(entry);
    }

    if (entry.moduleId) {
      const scopedModuleKey = keyForModule(courseId, entry.moduleId);
      pushList(scopedModuleKeyMap, scopedModuleKey, entry);

      if (index.moduleIdSet.has(entry.moduleId)) {
        pushList(validModuleKeyMap, scopedModuleKey, entry);
      } else {
        orphanModuleQuizzes.push(entry);
      }
    }
  });

  const lessonsWithNoQuiz = index.lessons.filter((lesson) =>
    !validLessonKeyMap.has(keyForLesson(courseId, lesson.lessonId)));
  const moduleQuizExpectationEnabled = validModuleKeyMap.size > 0;
  const modulesWithNoQuiz = moduleQuizExpectationEnabled
    ? index.modules.filter((moduleData) =>
      !validModuleKeyMap.has(keyForModule(courseId, moduleData.moduleId)))
    : [];

  const lessonVariantGroups = [...validLessonKeyMap.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([scopedLessonKey, entries]) => ({
      scopedLessonKey,
      primary: entries[0],
      bonus: entries.slice(1),
      review: reviewLessonVariantGroup(scopedLessonKey, entries[0], entries.slice(1)),
    }));
  const intentionalLessonVariantGroups = lessonVariantGroups
    .filter((group) => group.review.status === 'intentional');
  const suspiciousLessonVariantGroups = lessonVariantGroups
    .filter((group) => group.review.status !== 'intentional');
  const orphanLessonQuizClassificationCounts = countByClassification(orphanLessonQuizzes);
  const unclassifiedOrphanLessonQuizCount = orphanLessonQuizzes
    .filter((entry) => entry.orphanReview?.classification === 'unclassified')
    .length;
  const classifiedOrphanLessonQuizCount = orphanLessonQuizzes.length - unclassifiedOrphanLessonQuizCount;

  const report = {
    courseId,
    courseLabel,
    moduleCount: index.modules.length,
    lessonCount: index.lessons.length,
    quizCount: quizzes.length,
    duplicateActiveLessonIds: summarizeMapDuplicates(activeLessonIdMap),
    duplicateRawQuizIds: summarizeMapDuplicates(rawQuizIdMap),
    duplicateScopedLessonKeys: summarizeMapDuplicates(scopedLessonKeyMap),
    duplicateScopedModuleKeys: summarizeMapDuplicates(scopedModuleKeyMap),
    orphanLessonQuizzes,
    orphanLessonQuizClassificationCounts,
    orphanLessonQuizClassificationSummary: toSortedCounts(
      new Map(Object.entries(orphanLessonQuizClassificationCounts)),
    ),
    classifiedOrphanLessonQuizCount,
    unclassifiedOrphanLessonQuizCount,
    orphanModuleQuizzes,
    lessonsWithNoQuiz,
    moduleQuizExpectationEnabled,
    modulesWithNoQuiz,
    lessonVariantGroups,
    intentionalLessonVariantGroups,
    suspiciousLessonVariantGroups,
  };

  return {
    ...report,
    blockingIssueCount: getCourseBlockingIssueCount(report),
  };
}

function summarizeCourses(courses) {
  const totals = {
    courseCount: courses.length,
    moduleCount: 0,
    lessonCount: 0,
    quizCount: 0,
    duplicateActiveLessonIds: 0,
    duplicateRawQuizIds: 0,
    duplicateScopedModuleKeys: 0,
    orphanLessonQuizzes: 0,
    classifiedOrphanLessonQuizzes: 0,
    unclassifiedOrphanLessonQuizzes: 0,
    orphanModuleQuizzes: 0,
    activeExpectedLessonsWithNoQuiz: 0,
    modulesWithNoQuiz: 0,
    lessonVariantGroups: 0,
    intentionalLessonVariantGroups: 0,
    suspiciousLessonVariantGroups: 0,
    blockingIssueCount: 0,
    classificationCounts: {},
  };

  courses.forEach((course) => {
    totals.moduleCount += course.moduleCount;
    totals.lessonCount += course.lessonCount;
    totals.quizCount += course.quizCount;
    totals.duplicateActiveLessonIds += course.duplicateActiveLessonIds.length;
    totals.duplicateRawQuizIds += course.duplicateRawQuizIds.length;
    totals.duplicateScopedModuleKeys += course.duplicateScopedModuleKeys.length;
    totals.orphanLessonQuizzes += course.orphanLessonQuizzes.length;
    totals.classifiedOrphanLessonQuizzes += course.classifiedOrphanLessonQuizCount;
    totals.unclassifiedOrphanLessonQuizzes += course.unclassifiedOrphanLessonQuizCount;
    totals.orphanModuleQuizzes += course.orphanModuleQuizzes.length;
    totals.activeExpectedLessonsWithNoQuiz += course.lessonsWithNoQuiz.length;
    totals.modulesWithNoQuiz += course.modulesWithNoQuiz.length;
    totals.lessonVariantGroups += course.lessonVariantGroups.length;
    totals.intentionalLessonVariantGroups += course.intentionalLessonVariantGroups.length;
    totals.suspiciousLessonVariantGroups += course.suspiciousLessonVariantGroups.length;
    totals.blockingIssueCount += course.blockingIssueCount;
    mergeClassificationCounts(totals.classificationCounts, course.orphanLessonQuizClassificationCounts);
  });

  return {
    ...totals,
    classificationSummary: toSortedCounts(new Map(Object.entries(totals.classificationCounts))),
  };
}

function toCsvCell(value) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsvRow(values) {
  return values.map(toCsvCell).join(',');
}

export function getQuizInventoryClassificationLabel(classification) {
  return QUIZ_INVENTORY_CLASSIFICATION_LABELS[classification] || classification || 'Unclassified';
}

export function getQuizInventoryStatusLabel(blockingIssueCount = 0) {
  return blockingIssueCount === 0 ? 'Ready' : `${blockingIssueCount} to review`;
}

export function buildQuizInventoryReport(courseEntries = []) {
  const courses = courseEntries.map(analyzeCourse);
  const totals = summarizeCourses(courses);

  return {
    courses,
    totals,
  };
}

export function buildQuizInventoryCsv(report = {}, generatedAt = new Date().toISOString()) {
  const rows = [[
    'generated_at',
    'course_id',
    'course',
    'lessons',
    'quizzes',
    'active_lesson_gaps',
    'orphan_lesson_quizzes',
    'classified_orphan_lesson_quizzes',
    'unclassified_orphan_lesson_quizzes',
    'lesson_variant_groups',
    'intentional_lesson_variant_groups',
    'suspicious_lesson_variant_groups',
    'blocking_inventory_issues',
    'classification_summary',
  ]];

  (report.courses || []).forEach((course) => {
    rows.push([
      generatedAt,
      course.courseId,
      course.courseLabel,
      course.lessonCount,
      course.quizCount,
      course.lessonsWithNoQuiz.length,
      course.orphanLessonQuizzes.length,
      course.classifiedOrphanLessonQuizCount,
      course.unclassifiedOrphanLessonQuizCount,
      course.lessonVariantGroups.length,
      course.intentionalLessonVariantGroups.length,
      course.suspiciousLessonVariantGroups.length,
      course.blockingIssueCount,
      course.orphanLessonQuizClassificationSummary
        .map((entry) => `${entry.label}: ${entry.count}`),
    ]);
  });

  return `${rows.map(toCsvRow).join('\n')}\n`;
}
