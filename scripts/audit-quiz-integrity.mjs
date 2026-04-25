/* global console */
import process from 'node:process';
import { createServer } from 'vite';
import { resolveQuizLessonId } from '../src/data/quizLessonIdResolver.js';

const args = new Set(process.argv.slice(2));
const strictMode = args.has('--strict');
const forceModuleQuizExpectation = args.has('--expect-module-quizzes');

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

  const rawQuizIdMap = new Map();
  const scopedLessonKeyMap = new Map();
  const scopedModuleKeyMap = new Map();
  const validLessonKeyMap = new Map();
  const validModuleKeyMap = new Map();
  const orphanLessonQuizzes = [];
  const orphanModuleQuizzes = [];

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
    }));

  return {
    courseId,
    courseLabel,
    moduleCount: index.modules.length,
    lessonCount: index.lessons.length,
    quizCount: quizzes.length,
    duplicateRawQuizIds,
    duplicateScopedLessonKeys,
    duplicateScopedModuleKeys,
    orphanLessonQuizzes,
    orphanModuleQuizzes,
    lessonsWithNoQuiz,
    moduleQuizExpectationEnabled,
    modulesWithNoQuiz,
    lessonVariantGroups,
  };
}

function printCourseReport(report) {
  console.log(`\n[${report.courseId}] ${report.courseLabel}`);
  console.log(`  modules=${report.moduleCount} lessons=${report.lessonCount} quizzes=${report.quizCount}`);

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
    (entry) => `${formatQuizEntry(entry)} ${formatLessonResolution(entry)}`,
  );

  printIssueGroup(
    'Orphan module quizzes',
    report.orphanModuleQuizzes,
    (entry) => `${formatQuizEntry(entry)} moduleId=${entry.moduleId}`,
  );

  printIssueGroup(
    'Lessons with no matching lesson quiz',
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
    ({ scopedLessonKey, primary, bonus }) => (
      `${scopedLessonKey} primary=[${formatQuizEntry(primary)} ${formatLessonResolution(primary)}] bonus=[${bonus.map((entry) => `${formatQuizEntry(entry)} ${formatLessonResolution(entry)}`).join(' | ')}]`
    ),
  );
}

function summarizeReports(reports) {
  const total = {
    duplicateRawQuizIds: 0,
    duplicateScopedLessonKeys: 0,
    duplicateScopedModuleKeys: 0,
    orphanLessonQuizzes: 0,
    orphanModuleQuizzes: 0,
    lessonsWithNoQuiz: 0,
    modulesWithNoQuiz: 0,
    lessonVariantGroups: 0,
  };

  reports.forEach((report) => {
    total.duplicateRawQuizIds += report.duplicateRawQuizIds.length;
    total.duplicateScopedLessonKeys += report.duplicateScopedLessonKeys.length;
    total.duplicateScopedModuleKeys += report.duplicateScopedModuleKeys.length;
    total.orphanLessonQuizzes += report.orphanLessonQuizzes.length;
    total.orphanModuleQuizzes += report.orphanModuleQuizzes.length;
    total.lessonsWithNoQuiz += report.lessonsWithNoQuiz.length;
    total.modulesWithNoQuiz += report.moduleQuizExpectationEnabled ? report.modulesWithNoQuiz.length : 0;
    total.lessonVariantGroups += report.lessonVariantGroups.length;
  });

  return total;
}

function strictIssueCount(total) {
  return (
    total.duplicateRawQuizIds +
    total.duplicateScopedLessonKeys +
    total.duplicateScopedModuleKeys +
    total.orphanLessonQuizzes +
    total.orphanModuleQuizzes +
    total.lessonsWithNoQuiz +
    total.modulesWithNoQuiz
  );
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
  console.log(`  duplicate raw quiz IDs: ${totals.duplicateRawQuizIds}`);
  console.log(`  duplicate scoped lesson quiz keys: ${totals.duplicateScopedLessonKeys}`);
  console.log(`  duplicate scoped module quiz keys: ${totals.duplicateScopedModuleKeys}`);
  console.log(`  orphan lesson quizzes: ${totals.orphanLessonQuizzes}`);
  console.log(`  orphan module quizzes: ${totals.orphanModuleQuizzes}`);
  console.log(`  lessons with no matching lesson quiz: ${totals.lessonsWithNoQuiz}`);
  console.log(`  modules with no matching module quiz (expected courses only): ${totals.modulesWithNoQuiz}`);
  console.log(`  lesson variant groups (primary + bonus): ${totals.lessonVariantGroups}`);

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
