/* global console */
import process from 'node:process';
import { createServer } from 'vite';

const EXPECTED_COURSE_IDS = Object.freeze(['html', 'css', 'js', 'react']);
const KNOWN_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function addIssue(issues, path, message) {
  issues.push({ path, message });
}

function addWarning(warnings, path, message) {
  warnings.push({ path, message });
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
      loaded.push({ courseMeta, data });
    }
    return { courseMetadata: COURSE_METADATA, loaded };
  } finally {
    await viteServer.close();
  }
}

function hasLearnerContent(lesson) {
  return (
    isNonEmptyString(lesson.content) ||
    isNonEmptyString(lesson.code) ||
    isNonEmptyString(lesson.output) ||
    isNonEmptyString(lesson.challenge) ||
    hasItems(lesson.concepts) ||
    hasItems(lesson.tasks) ||
    hasItems(lesson.hook?.accomplishments) ||
    hasItems(lesson.do?.steps) ||
    hasItems(lesson.understand?.concepts) ||
    hasItems(lesson.summary?.capabilities)
  );
}

function hasPracticePrompt(lesson) {
  return (
    isNonEmptyString(lesson.challenge) ||
    isNonEmptyString(lesson.challenge?.mission) ||
    hasItems(lesson.challenge?.requirements) ||
    isNonEmptyString(lesson.build?.goal) ||
    hasItems(lesson.do?.steps)
  );
}

function hasDurationSignal(lesson) {
  return isNonEmptyString(lesson.duration) || Number.isFinite(Number(lesson.metadata?.estimatedTime));
}

function buildLessonIndexes(loaded) {
  const courseIds = new Set();
  const lessonsByCourse = new Map();

  loaded.forEach(({ courseMeta, data }) => {
    const courseId = courseMeta.id;
    const lessonIds = new Set();
    courseIds.add(courseId);

    (data?.modules || []).forEach((moduleData) => {
      (moduleData.lessons || []).forEach((lesson) => {
        if (isNonEmptyString(lesson?.id)) {
          lessonIds.add(String(lesson.id));
        }
      });
    });

    lessonsByCourse.set(courseId, lessonIds);
  });

  return { courseIds, lessonsByCourse };
}

function analyzeMetadata(courseMetadata, issues, warnings) {
  const ids = new Set();
  const actualIds = courseMetadata.map((course) => course.id);

  for (const course of courseMetadata) {
    if (!isNonEmptyString(course.id)) {
      addIssue(issues, 'metadata', 'Course metadata entry is missing an id.');
      continue;
    }
    if (ids.has(course.id)) {
      addIssue(issues, `metadata.${course.id}`, 'Course id is duplicated.');
    }
    ids.add(course.id);

    if (!isNonEmptyString(course.label)) {
      addIssue(issues, `metadata.${course.id}`, 'Course is missing a label.');
    }
    if (!isNonEmptyString(course.accent)) {
      addWarning(warnings, `metadata.${course.id}`, 'Course is missing an accent color.');
    }
  }

  for (const expectedId of EXPECTED_COURSE_IDS) {
    if (!actualIds.includes(expectedId)) {
      addIssue(issues, `metadata.${expectedId}`, 'Expected portfolio course id is missing.');
    }
  }
}

function analyzeLessons(courseId, modules, lessonIndexes, issues, warnings) {
  const moduleIds = new Set();
  const lessonIds = new Set();
  const lessonEntries = [];

  modules.forEach((moduleData, moduleIndex) => {
    const modulePath = `${courseId}.modules[${moduleIndex}]`;

    if (!moduleData || typeof moduleData !== 'object') {
      addIssue(issues, modulePath, 'Module entry is not an object.');
      return;
    }

    if (moduleData.id === undefined || moduleData.id === null || moduleData.id === '') {
      addIssue(issues, modulePath, 'Module is missing an id.');
    } else {
      const moduleKey = String(moduleData.id);
      if (moduleIds.has(moduleKey)) {
        addIssue(issues, `${courseId}.${moduleKey}`, 'Module id is duplicated within this course.');
      }
      moduleIds.add(moduleKey);
    }

    if (!isNonEmptyString(moduleData.title)) {
      addIssue(issues, modulePath, 'Module is missing a title.');
    }
    if (!hasItems(moduleData.lessons)) {
      addIssue(issues, modulePath, 'Module has no lessons.');
      return;
    }

    moduleData.lessons.forEach((lesson, lessonIndex) => {
      const lessonPath = `${courseId}.${moduleData.id}.lessons[${lessonIndex}]`;

      if (!lesson || typeof lesson !== 'object') {
        addIssue(issues, lessonPath, 'Lesson entry is not an object.');
        return;
      }

      if (!isNonEmptyString(lesson.id)) {
        addIssue(issues, lessonPath, 'Lesson is missing an id.');
      } else {
        const lessonKey = String(lesson.id);
        if (lessonIds.has(lessonKey)) {
          addIssue(issues, `${courseId}.${lessonKey}`, 'Lesson id is duplicated within this course.');
        }
        lessonIds.add(lessonKey);
      }

      if (!isNonEmptyString(lesson.title)) {
        addIssue(issues, lessonPath, 'Lesson is missing a title.');
      }
      if (!hasDurationSignal(lesson)) {
        addIssue(issues, lessonPath, 'Lesson is missing a duration or metadata.estimatedTime signal.');
      }
      if (isNonEmptyString(lesson.difficulty) && !KNOWN_DIFFICULTIES.has(lesson.difficulty)) {
        addWarning(warnings, lessonPath, `Lesson uses an unrecognized difficulty: ${lesson.difficulty}.`);
      }
      if (!hasLearnerContent(lesson)) {
        addIssue(issues, lessonPath, 'Lesson is missing learner-facing content blocks.');
      }
      if (!hasPracticePrompt(lesson)) {
        addWarning(warnings, lessonPath, 'Lesson has no obvious practice prompt.');
      }

      lessonEntries.push({ lesson, lessonPath });
    });
  });

  for (const { lesson, lessonPath } of lessonEntries) {
    (lesson.prereqs || []).forEach((prereqId) => {
      if (!lessonIds.has(String(prereqId))) {
        addIssue(issues, lessonPath, `Prerequisite "${prereqId}" does not match an active lesson in ${courseId}.`);
      }
    });

    const bridge = lesson.bridge || {};
    const nextLessonId = bridge.nextLessonId;
    const nextCourseId = bridge.nextCourseId || courseId;

    if (bridge.nextCourseId && !lessonIndexes.courseIds.has(String(bridge.nextCourseId))) {
      addIssue(issues, lessonPath, `Bridge nextCourseId "${bridge.nextCourseId}" does not match an active course.`);
    }

    if (bridge.nextCourseId && !nextLessonId) {
      addIssue(issues, lessonPath, 'Bridge declares nextCourseId but is missing nextLessonId.');
    }

    if (nextLessonId) {
      const targetLessonIds = lessonIndexes.lessonsByCourse.get(String(nextCourseId)) || new Set();
      const existsInAnotherCourse = [...lessonIndexes.lessonsByCourse.entries()].some(
        ([candidateCourseId, candidateLessonIds]) =>
          candidateCourseId !== courseId && candidateLessonIds.has(String(nextLessonId)),
      );

      if (!targetLessonIds.has(String(nextLessonId))) {
        if (!bridge.nextCourseId && existsInAnotherCourse) {
          addIssue(
            issues,
            lessonPath,
            `Bridge nextLessonId "${nextLessonId}" points outside ${courseId}; add nextCourseId for an explicit cross-course handoff.`,
          );
        } else {
          addIssue(issues, lessonPath, `Bridge target "${nextCourseId}/${nextLessonId}" does not match an active lesson.`);
        }
      }
    }
  }

  return { lessonIds, moduleIds };
}

function analyzeQuizzes(courseId, quizzes, issues) {
  if (!Array.isArray(quizzes)) {
    addIssue(issues, `${courseId}.quizzes`, 'Course quizzes export is not an array.');
    return;
  }

  const quizIds = new Set();

  quizzes.forEach((quiz, quizIndex) => {
    const quizPath = `${courseId}.quizzes[${quizIndex}]`;

    if (!quiz || typeof quiz !== 'object') {
      addIssue(issues, quizPath, 'Quiz entry is not an object.');
      return;
    }
    if (isNonEmptyString(quiz.id)) {
      if (quizIds.has(quiz.id)) {
        addIssue(issues, quizPath, `Quiz id "${quiz.id}" is duplicated within this course.`);
      }
      quizIds.add(quiz.id);
    }

    if (!isNonEmptyString(quiz.lessonId) && !isNonEmptyString(quiz.moduleId)) {
      addIssue(issues, quizPath, 'Quiz is missing both lessonId and moduleId.');
    }
    if (!hasItems(quiz.questions)) {
      addIssue(issues, quizPath, 'Quiz has no questions.');
      return;
    }

    const questionIds = new Set();
    quiz.questions.forEach((question, questionIndex) => {
      const questionPath = `${quizPath}.questions[${questionIndex}]`;
      if (!isNonEmptyString(question.id)) {
        addIssue(issues, questionPath, 'Question is missing an id.');
      } else if (questionIds.has(question.id)) {
        addIssue(issues, questionPath, `Question id "${question.id}" is duplicated within this quiz.`);
      } else {
        questionIds.add(question.id);
      }
      if (
        !isNonEmptyString(question.question) &&
        !isNonEmptyString(question.code) &&
        !hasItems(question.lines)
      ) {
        addIssue(issues, questionPath, 'Question is missing prompt text.');
      }
      if (!isNonEmptyString(question.explanation)) {
        addIssue(issues, questionPath, 'Question is missing an explanation.');
      }
    });
  });
}

function analyzeChallenges(courseId, challenges, issues, warnings) {
  if (!Array.isArray(challenges)) {
    addIssue(issues, `${courseId}.challenges`, 'Course challenges export is not an array.');
    return;
  }

  const challengeIds = new Set();

  challenges.forEach((challenge, index) => {
    const challengePath = `${courseId}.challenges[${index}]`;

    if (!challenge || typeof challenge !== 'object') {
      addIssue(issues, challengePath, 'Challenge entry is not an object.');
      return;
    }
    if (!isNonEmptyString(challenge.id)) {
      addIssue(issues, challengePath, 'Challenge is missing an id.');
    } else if (challengeIds.has(challenge.id)) {
      addIssue(issues, challengePath, `Challenge id "${challenge.id}" is duplicated within this course.`);
    } else {
      challengeIds.add(challenge.id);
    }

    if (isNonEmptyString(challenge.courseId) && challenge.courseId !== courseId) {
      addIssue(issues, challengePath, `Challenge courseId "${challenge.courseId}" does not match "${courseId}".`);
    }
    if (!isNonEmptyString(challenge.title)) {
      addIssue(issues, challengePath, 'Challenge is missing a title.');
    }
    if (!isNonEmptyString(challenge.description)) {
      addWarning(warnings, challengePath, 'Challenge is missing a learner-facing description.');
    }
    if (!hasItems(challenge.requirements)) {
      addIssue(issues, challengePath, 'Challenge is missing requirements.');
    }
    if (!hasItems(challenge.tests)) {
      addIssue(issues, challengePath, 'Challenge is missing tests.');
    }
    if (!isNonEmptyString(challenge.starter)) {
      addWarning(warnings, challengePath, 'Challenge is missing starter code.');
    }
    if (!isNonEmptyString(challenge.solution)) {
      addWarning(warnings, challengePath, 'Challenge is missing a sample solution.');
    }
  });
}

function printEntries(title, entries, limit = 30) {
  if (!entries.length) return;

  console.log(`\n${title} (${entries.length}):`);
  entries.slice(0, limit).forEach((entry) => {
    console.log(`  - ${entry.path}: ${entry.message}`);
  });
  if (entries.length > limit) {
    console.log(`  - ... +${entries.length - limit} more`);
  }
}

async function main() {
  console.log('Learning Content Audit');

  const issues = [];
  const warnings = [];
  const { courseMetadata, loaded } = await loadAllCourseData();
  const lessonIndexes = buildLessonIndexes(loaded);

  analyzeMetadata(courseMetadata, issues, warnings);

  let moduleCount = 0;
  let lessonCount = 0;
  let quizCount = 0;
  let challengeCount = 0;

  for (const { courseMeta, data } of loaded) {
    const courseId = courseMeta.id;
    const modules = data?.modules || [];
    moduleCount += modules.length;
    lessonCount += modules.reduce((total, moduleData) => total + (moduleData.lessons || []).length, 0);
    quizCount += (data?.quizzes || []).length;
    challengeCount += (data?.challenges || []).length;

    analyzeLessons(courseId, modules, lessonIndexes, issues, warnings);
    analyzeQuizzes(courseId, data?.quizzes || [], issues);
    analyzeChallenges(courseId, data?.challenges || [], issues, warnings);
  }

  console.log(`  courses: ${loaded.length}`);
  console.log(`  modules: ${moduleCount}`);
  console.log(`  lessons: ${lessonCount}`);
  console.log(`  quizzes: ${quizCount}`);
  console.log(`  challenges: ${challengeCount}`);

  printEntries('Warnings', warnings);
  printEntries('Blocking issues', issues);

  if (issues.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log('\n  no blocking content integrity issues.');
}

main().catch((err) => {
  console.error('Learning content audit failed:', err);
  process.exitCode = 1;
});
