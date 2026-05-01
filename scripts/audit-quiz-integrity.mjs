/* global console */
import process from 'node:process';
import { createServer } from 'vite';
import { resolveQuizLessonId } from '../src/data/quizLessonIdResolver.js';
import {
  COURSE_ORPHAN_CLASSIFICATION_POLICIES,
  LESSON_QUIZ_ORPHAN_CLASSIFICATIONS,
} from './quiz-orphan-registry.mjs';
import { INTENTIONAL_LESSON_QUIZ_VARIANTS } from './quiz-variant-registry.mjs';

const args = new Set(process.argv.slice(2));
const strictMode = args.has('--strict');
const forceModuleQuizExpectation = args.has('--expect-module-quizzes');

const DEFAULT_LESSON_QUIZ_COVERAGE_POLICY = Object.freeze({
  status: 'expected',
  label: 'active coverage expected',
  reason: 'Active frontend course lessons should have matching lesson quizzes.',
});

const LESSON_QUIZ_COVERAGE_POLICIES = Object.freeze({});

function getLessonQuizCoveragePolicy(courseId) {
  return LESSON_QUIZ_COVERAGE_POLICIES[courseId] || DEFAULT_LESSON_QUIZ_COVERAGE_POLICY;
}

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

function buildCourseEntityIndex(courseId, modules) {
  const lessons = [];
  const modulesFlat = [];

  for (const moduleData of modules || []) {
    const moduleRef = {
      courseId,
      moduleId: moduleData.id,
      moduleTitle: moduleData.title,
    };
    modulesFlat.push(moduleRef);

    for (const lesson of moduleData.lessons || []) {
      lessons.push({
        courseId,
        moduleId: moduleData.id,
        moduleTitle: moduleData.title,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
      });
    }
  }

  return {
    lessons,
    modules: modulesFlat,
    lessonIdSet: new Set(lessons.map((lesson) => lesson.lessonId)),
    moduleIdSet: new Set(modulesFlat.map((moduleData) => moduleData.moduleId)),
  };
}

function makeQuizEntry(quiz, index, lessonResolution) {
  return {
    index,
    quizId: quiz?.id || null,
    rawLessonId: quiz?.lessonId || null,
    resolvedLessonId: lessonResolution?.resolvedLessonId || null,
    lessonResolution: lessonResolution?.resolution || 'missing',
    moduleId: quiz?.moduleId || null,
    questionCount: Array.isArray(quiz?.questions) ? quiz.questions.length : 0,
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
      reason: 'Intentional variant metadata no longer matches the reported primary/bonus quiz IDs.',
    };
  }

  return {
    status: lockedVariant.status,
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
      reason: 'No orphan quiz classification metadata registered.',
    };
  }

  return classification;
}

function countByClassification(entries, reviewField) {
  return entries.reduce((counts, entry) => {
    const classification = entry[reviewField]?.classification || 'unclassified';
    counts[classification] = (counts[classification] || 0) + 1;
    return counts;
  }, {});
}

function mergeClassificationCounts(target, source) {
  Object.entries(source).forEach(([classification, count]) => {
    target[classification] = (target[classification] || 0) + count;
  });
}

function formatClassificationCounts(counts) {
  const entries = Object.entries(counts).sort(([left], [right]) => left.localeCompare(right));

  if (!entries.length) {
    return 'none';
  }

  return entries
    .map(([classification, count]) => `${classification}=${count}`)
    .join(', ');
}

function formatQuizEntry(entry) {
  const idText = entry.quizId ? entry.quizId : '<none>';
  return `#${entry.index + 1} id=${idText} questions=${entry.questionCount}`;
}

function formatLessonResolution(entry) {
  if (!entry.rawLessonId) return 'lessonId=<none>';

  if (!entry.resolvedLessonId) {
    return `lessonId=${entry.rawLessonId} (unresolved)`;
  }

  if (entry.resolvedLessonId === entry.rawLessonId) {
    return `lessonId=${entry.resolvedLessonId} (${entry.lessonResolution})`;
  }

  return `lessonId=${entry.rawLessonId} -> ${entry.resolvedLessonId} (${entry.lessonResolution})`;
}

function printIssueGroup(title, entries, formatter, limit = 25) {
  console.log(`  - ${title}: ${entries.length}`);
  if (!entries.length) return;

  const clipped = entries.slice(0, limit);
  for (const entry of clipped) {
    console.log(`      * ${formatter(entry)}`);
  }

  if (entries.length > limit) {
    console.log(`      * ... +${entries.length - limit} more`);
  }
}

function analyzeCourse(courseMeta, loadedCourse) {
  const { id: courseId, label: courseLabel } = courseMeta;
  const modules = loadedCourse.modules || [];
  const quizzes = loadedCourse.quizzes || [];
  const index = buildCourseEntityIndex(courseId, modules);
  const lessonQuizCoveragePolicy = getLessonQuizCoveragePolicy(courseId);
  const orphanClassificationPolicy = COURSE_ORPHAN_CLASSIFICATION_POLICIES[courseId] || null;

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
    const entry = makeQuizEntry(quiz, indexInArray, lessonResolution);

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

  const duplicateActiveLessonIds = summarizeMapDuplicates(activeLessonIdMap);
  const duplicateRawQuizIds = summarizeMapDuplicates(rawQuizIdMap);
  const duplicateScopedLessonKeys = summarizeMapDuplicates(scopedLessonKeyMap);
  const duplicateScopedModuleKeys = summarizeMapDuplicates(scopedModuleKeyMap);

  const lessonsWithNoQuiz = index.lessons.filter((lesson) => {
    const scopedLessonKey = keyForLesson(courseId, lesson.lessonId);
    return !validLessonKeyMap.has(scopedLessonKey);
  });

  const moduleQuizExpectationEnabled = forceModuleQuizExpectation || validModuleKeyMap.size > 0;
  const modulesWithNoQuiz = moduleQuizExpectationEnabled
    ? index.modules.filter((moduleData) => {
      const scopedModuleKey = keyForModule(courseId, moduleData.moduleId);
      return !validModuleKeyMap.has(scopedModuleKey);
    })
    : [];

  const lessonVariantGroups = [...validLessonKeyMap.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([scopedLessonKey, entries]) => ({
      scopedLessonKey,
      primary: entries[0],
      bonus: entries.slice(1),
      review: reviewLessonVariantGroup(scopedLessonKey, entries[0], entries.slice(1)),
    }));

  return {
    courseId,
    courseLabel,
    moduleCount: index.modules.length,
    lessonCount: index.lessons.length,
    quizCount: quizzes.length,
    lessonQuizCoveragePolicy,
    orphanClassificationPolicy,
    duplicateActiveLessonIds,
    duplicateRawQuizIds,
    duplicateScopedLessonKeys,
    duplicateScopedModuleKeys,
    orphanLessonQuizzes,
    orphanLessonQuizClassificationCounts: countByClassification(orphanLessonQuizzes, 'orphanReview'),
    orphanModuleQuizzes,
    lessonsWithNoQuiz,
    moduleQuizExpectationEnabled,
    modulesWithNoQuiz,
    lessonVariantGroups,
  };
}

function formatLessonVariantGroup({ scopedLessonKey, primary, bonus, review }) {
  const bonusText = bonus
    .map((entry) => `${formatQuizEntry(entry)} ${formatLessonResolution(entry)}`)
    .join(' | ');

  return (
    `[${review.status}] ${scopedLessonKey} `
    + `primary=[${formatQuizEntry(primary)} ${formatLessonResolution(primary)}] `
    + `bonus=[${bonusText}] reason=${review.reason}`
  );
}

function formatOrphanLessonQuiz(entry) {
  return (
    `${formatQuizEntry(entry)} ${formatLessonResolution(entry)} `
    + `[${entry.orphanReview.classification}] reason=${entry.orphanReview.reason}`
  );
}

function printCourseReport(report) {
  console.log(`\n[${report.courseId}] ${report.courseLabel}`);
  console.log(`  modules=${report.moduleCount} lessons=${report.lessonCount} quizzes=${report.quizCount}`);
  console.log(
    `  lesson quiz coverage policy: ${report.lessonQuizCoveragePolicy.label} - ${report.lessonQuizCoveragePolicy.reason}`,
  );
  if (report.lessonQuizCoveragePolicy.checkpointPolicy) {
    console.log(`  future checkpoint policy: ${report.lessonQuizCoveragePolicy.checkpointPolicy}`);
  }
  if (report.orphanClassificationPolicy) {
    console.log(
      `  orphan quiz inventory policy: ${report.orphanClassificationPolicy.classification} - `
      + report.orphanClassificationPolicy.reason,
    );
  }

  printIssueGroup(
    'Duplicate active lesson IDs',
    report.duplicateActiveLessonIds,
    ({ key, entries }) => `${key} -> ${entries.map((lesson) => `${lesson.moduleId}/${lesson.lessonTitle}`).join(' | ')}`,
  );

  printIssueGroup(
    'Duplicate raw quiz IDs',
    report.duplicateRawQuizIds,
    ({ key, entries }) => `${key} -> ${entries.map(formatQuizEntry).join(' | ')}`,
  );

  printIssueGroup(
    'Duplicate scoped lesson quiz keys',
    report.duplicateScopedLessonKeys,
    ({ key, entries }) => `${key} -> ${entries.map((entry) => `${formatQuizEntry(entry)} ${formatLessonResolution(entry)}`).join(' | ')}`,
  );

  printIssueGroup(
    'Duplicate scoped module quiz keys',
    report.duplicateScopedModuleKeys,
    ({ key, entries }) => `${key} -> ${entries.map(formatQuizEntry).join(' | ')}`,
  );

  printIssueGroup(
    'Orphan lesson quizzes',
    report.orphanLessonQuizzes,
    formatOrphanLessonQuiz,
  );
  if (report.orphanLessonQuizzes.length) {
    console.log(
      `  - Orphan lesson quiz classifications: ${
        formatClassificationCounts(report.orphanLessonQuizClassificationCounts)
      }`,
    );
  }

  printIssueGroup(
    'Orphan module quizzes',
    report.orphanModuleQuizzes,
    (entry) => `${formatQuizEntry(entry)} moduleId=${entry.moduleId}`,
  );

  printIssueGroup(
    report.lessonQuizCoveragePolicy.status === 'deferred'
      ? 'Lessons with no matching lesson quiz (deferred/roadmap)'
      : 'Lessons with no matching lesson quiz',
    report.lessonsWithNoQuiz,
    (lesson) => `${lesson.moduleId}/${lesson.lessonId} :: ${lesson.lessonTitle}`,
    40,
  );

  if (report.moduleQuizExpectationEnabled) {
    printIssueGroup(
      'Modules with no matching module quiz',
      report.modulesWithNoQuiz,
      (moduleData) => `${moduleData.moduleId} :: ${moduleData.moduleTitle}`,
    );
  } else {
    console.log('  - Modules with no matching module quiz: skipped (module quizzes not expected for this course)');
  }

  printIssueGroup(
    'Lesson quiz variants (primary + bonus)',
    report.lessonVariantGroups,
    formatLessonVariantGroup,
  );

  printIssueGroup(
    'Intentional locked lesson quiz variants',
    report.lessonVariantGroups.filter((group) => group.review.status === 'intentional'),
    formatLessonVariantGroup,
  );

  printIssueGroup(
    'Suspicious/unreviewed lesson quiz variants',
    report.lessonVariantGroups.filter((group) => group.review.status !== 'intentional'),
    formatLessonVariantGroup,
  );
}

function summarizeReports(reports) {
  const total = {
    duplicateActiveLessonIds: 0,
    duplicateRawQuizIds: 0,
    duplicateScopedLessonKeys: 0,
    duplicateScopedModuleKeys: 0,
    orphanLessonQuizzes: 0,
    orphanLessonQuizClassificationCounts: {},
    classifiedOrphanLessonQuizzes: 0,
    unclassifiedOrphanLessonQuizzes: 0,
    orphanModuleQuizzes: 0,
    lessonsWithNoQuiz: 0,
    activeExpectedLessonsWithNoQuiz: 0,
    deferredLessonsWithNoQuiz: 0,
    modulesWithNoQuiz: 0,
    lessonVariantGroups: 0,
    intentionalLessonVariantGroups: 0,
    suspiciousLessonVariantGroups: 0,
  };

  reports.forEach((report) => {
    total.duplicateActiveLessonIds += report.duplicateActiveLessonIds.length;
    total.duplicateRawQuizIds += report.duplicateRawQuizIds.length;
    total.duplicateScopedLessonKeys += report.duplicateScopedLessonKeys.length;
    total.duplicateScopedModuleKeys += report.duplicateScopedModuleKeys.length;
    total.orphanLessonQuizzes += report.orphanLessonQuizzes.length;
    mergeClassificationCounts(
      total.orphanLessonQuizClassificationCounts,
      report.orphanLessonQuizClassificationCounts,
    );
    total.classifiedOrphanLessonQuizzes += report.orphanLessonQuizzes
      .filter((entry) => entry.orphanReview?.classification !== 'unclassified')
      .length;
    total.unclassifiedOrphanLessonQuizzes += report.orphanLessonQuizzes
      .filter((entry) => entry.orphanReview?.classification === 'unclassified')
      .length;
    total.orphanModuleQuizzes += report.orphanModuleQuizzes.length;
    total.lessonsWithNoQuiz += report.lessonsWithNoQuiz.length;
    if (report.lessonQuizCoveragePolicy.status === 'deferred') {
      total.deferredLessonsWithNoQuiz += report.lessonsWithNoQuiz.length;
    } else {
      total.activeExpectedLessonsWithNoQuiz += report.lessonsWithNoQuiz.length;
    }
    total.modulesWithNoQuiz += report.moduleQuizExpectationEnabled ? report.modulesWithNoQuiz.length : 0;
    total.lessonVariantGroups += report.lessonVariantGroups.length;
    total.intentionalLessonVariantGroups += report.lessonVariantGroups
      .filter((group) => group.review.status === 'intentional')
      .length;
    total.suspiciousLessonVariantGroups += report.lessonVariantGroups
      .filter((group) => group.review.status !== 'intentional')
      .length;
  });

  return total;
}

function strictIssueCount(total) {
  return (
    total.duplicateRawQuizIds +
    total.duplicateActiveLessonIds +
    total.duplicateScopedLessonKeys +
    total.duplicateScopedModuleKeys +
    total.orphanLessonQuizzes +
    total.orphanModuleQuizzes +
    total.lessonsWithNoQuiz +
    total.modulesWithNoQuiz
  );
}

function printEngineStabilizationSummary(totals) {
  const activeCoverageStatus = totals.activeExpectedLessonsWithNoQuiz === 0
    ? 'complete for active HTML/CSS/JavaScript/React lessons'
    : `needs attention (${totals.activeExpectedLessonsWithNoQuiz} active-coverage lesson gaps)`;
  const variantStatus = totals.suspiciousLessonVariantGroups === 0
    ? `locked (${totals.intentionalLessonVariantGroups}/${totals.lessonVariantGroups} intentional, 0 unreviewed)`
    : `needs review (${totals.suspiciousLessonVariantGroups} unreviewed or mismatched group(s))`;
  const orphanStatus = totals.unclassifiedOrphanLessonQuizzes === 0
    ? `classified (${totals.orphanLessonQuizzes} total, 0 unclassified)`
    : `needs classification (${totals.unclassifiedOrphanLessonQuizzes} unclassified)`;
  const strictStatus = strictMode
    ? 'enabled for this run'
    : 'not enabled; report-only mode remains in use until CI criteria are finalized';

  console.log('\nEngine Stabilization Summary');
  console.log(`  active frontend quiz coverage: ${activeCoverageStatus}`);
  console.log(`  variant group inventory: ${variantStatus}`);
  console.log(`  orphan quiz inventory: ${orphanStatus}`);
  console.log(`  strict-mode CI gate: ${strictStatus}`);
}

async function loadAllCourseData() {
  const viteServer = await createServer({
    logLevel: 'silent',
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    const { COURSE_METADATA } = await viteServer.ssrLoadModule('/src/data/metadata.js');
    const { loadCourse } = await viteServer.ssrLoadModule('/src/data/loaders.js');

    const loaded = [];
    for (const courseMeta of COURSE_METADATA) {
      const data = await loadCourse(courseMeta.id);
      loaded.push({
        courseMeta,
        data,
      });
    }
    return loaded;
  } finally {
    await viteServer.close();
  }
}

async function main() {
  const modeLabel = strictMode ? 'strict' : 'report-only';
  console.log(`Quiz Integrity Audit (${modeLabel})`);
  console.log(`Flags: --strict=${strictMode} --expect-module-quizzes=${forceModuleQuizExpectation}`);

  const loadedCourses = await loadAllCourseData();
  const reports = loadedCourses.map(({ courseMeta, data }) => analyzeCourse(courseMeta, data));

  reports.forEach(printCourseReport);

  const totals = summarizeReports(reports);
  console.log('\nGlobal Summary');
  console.log(`  duplicate active lesson IDs: ${totals.duplicateActiveLessonIds}`);
  console.log(`  duplicate raw quiz IDs: ${totals.duplicateRawQuizIds}`);
  console.log(`  duplicate scoped lesson quiz keys: ${totals.duplicateScopedLessonKeys}`);
  console.log(`  duplicate scoped module quiz keys: ${totals.duplicateScopedModuleKeys}`);
  console.log(`  orphan lesson quizzes: ${totals.orphanLessonQuizzes}`);
  console.log(`  classified orphan lesson quizzes: ${totals.classifiedOrphanLessonQuizzes}`);
  console.log(`  unclassified orphan lesson quizzes: ${totals.unclassifiedOrphanLessonQuizzes}`);
  console.log(
    `  orphan lesson quiz classifications: ${
      formatClassificationCounts(totals.orphanLessonQuizClassificationCounts)
    }`,
  );
  console.log(`  orphan module quizzes: ${totals.orphanModuleQuizzes}`);
  console.log(`  lessons with no matching lesson quiz: ${totals.lessonsWithNoQuiz}`);
  console.log(`  active-coverage lessons with no matching lesson quiz: ${totals.activeExpectedLessonsWithNoQuiz}`);
  console.log(`  deferred-policy lessons with no matching lesson quiz: ${totals.deferredLessonsWithNoQuiz}`);
  console.log(`  modules with no matching module quiz (expected courses only): ${totals.modulesWithNoQuiz}`);
  console.log(`  lesson variant groups (primary + bonus): ${totals.lessonVariantGroups}`);
  console.log(`  intentional locked lesson variant groups: ${totals.intentionalLessonVariantGroups}`);
  console.log(`  suspicious/unreviewed lesson variant groups: ${totals.suspiciousLessonVariantGroups}`);

  printEngineStabilizationSummary(totals);

  const blockingIssues = strictIssueCount(totals);
  if (strictMode && blockingIssues > 0) {
    console.error(`\nStrict mode failed with ${blockingIssues} integrity issue(s).`);
    process.exitCode = 1;
    return;
  }

  if (!strictMode && blockingIssues > 0) {
    console.log('\nReport-only mode: known issues were found, but exit code remains 0.');
  } else {
    console.log('\nNo blocking quiz integrity issues detected for the selected mode.');
  }
}

main().catch((error) => {
  console.error('Quiz integrity audit failed to run.');
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
