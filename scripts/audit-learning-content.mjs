/* global console */
import process from 'node:process';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { withViteAuditRuntime } from './vite-audit-runtime.mjs';

const EXPECTED_COURSE_IDS = Object.freeze(['html', 'css', 'js', 'react']);
const KNOWN_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);
const RESERVED_LESSON_ROUTE_SEGMENTS = new Set(['quiz']);

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

function getRouteIdIssue(entityName, value, { reservedSegments = new Set() } = {}) {
  if (value === undefined || value === null || value === '') return null;

  const id = String(value);
  if (id.trim() !== id) {
    return `${entityName} id must not include leading or trailing whitespace.`;
  }

  if (/[/?#]/.test(id)) {
    return `${entityName} id "${id}" contains URL separator characters.`;
  }

  if (reservedSegments.has(id)) {
    return `${entityName} id "${id}" is reserved for lesson routing.`;
  }

  return null;
}

async function loadAllCourseData() {
  return withViteAuditRuntime(async ({ importModule }) => {
    const { COURSE_METADATA } = await importModule('/src/data/metadata.js');
    const { loadCourse } = await importModule('/src/data/loaders.js');

    const loaded = [];
    for (const courseMeta of COURSE_METADATA) {
      const data = await loadCourse(courseMeta.id);
      loaded.push({ courseMeta, data });
    }
    return { courseMetadata: COURSE_METADATA, loaded };
  });
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

function getInstructionalScaffoldStatus(lesson) {
  return {
    objective:
      hasItems(lesson.hook?.accomplishments) ||
      isNonEmptyString(lesson.do?.title) ||
      isNonEmptyString(lesson.build?.goal),
    explanation:
      isNonEmptyString(lesson.content) ||
      hasItems(lesson.concepts) ||
      hasItems(lesson.understand?.concepts),
    guidedPractice:
      isNonEmptyString(lesson.code) ||
      hasItems(lesson.tasks) ||
      hasItems(lesson.do?.steps),
    independentPractice: hasPracticePrompt(lesson),
    consolidation:
      isNonEmptyString(lesson.output) ||
      isNonEmptyString(lesson.understand?.keyTakeaway) ||
      hasItems(lesson.summary?.capabilities),
    transfer:
      isNonEmptyString(lesson.bridge?.preview) ||
      isNonEmptyString(lesson.challenge?.mission),
  };
}

function textIncludesAny(value, terms) {
  const text = String(value || '').toLowerCase();
  return terms.some((term) => text.includes(term));
}

function getLessonQualityRubricStatus(lesson) {
  const taskText = [
    ...(Array.isArray(lesson.tasks) ? lesson.tasks : []),
    ...(Array.isArray(lesson.do?.steps) ? lesson.do.steps : []),
    lesson.challenge?.mission,
    lesson.challenge?.bonusChallenge,
    lesson.summary?.reflection,
  ].join(' ');
  const conceptText = [
    lesson.content,
    lesson.understand?.keyTakeaway,
    ...(Array.isArray(lesson.concepts) ? lesson.concepts : []),
    ...(Array.isArray(lesson.understand?.concepts)
      ? lesson.understand.concepts.map((concept) => `${concept.term || ''} ${concept.definition || concept.meaning || ''}`)
      : []),
  ].join(' ');

  return {
    objective:
      hasItems(lesson.hook?.accomplishments) ||
      isNonEmptyString(lesson.learningFrame?.learn) ||
      isNonEmptyString(lesson.build?.goal),
    misconceptionCheck:
      hasItems(lesson.understand?.commonMistakes) ||
      hasItems(lesson.commonMistakes) ||
      textIncludesAny(`${conceptText} ${taskText}`, ['mistake', 'common error', 'watch out', 'avoid', 'debug']),
    retrievalPrompt:
      isNonEmptyString(lesson.learningFrame?.check) ||
      textIncludesAny(`${taskText} ${lesson.summary?.nextStep || ''}`, ['from memory', 'explain', 'recall', 'without looking', 'why']),
    guidedPractice:
      isNonEmptyString(lesson.code) ||
      hasItems(lesson.do?.steps) ||
      isNonEmptyString(lesson.do?.code),
    independentPractice:
      hasPracticePrompt(lesson),
    transfer:
      isNonEmptyString(lesson.bridge?.preview) ||
      isNonEmptyString(lesson.learningFrame?.next) ||
      textIncludesAny(`${taskText} ${lesson.output || ''}`, ['project', 'portfolio', 'real', 'next lesson', 'apply']),
  };
}

function analyzeLearningQualityRubric(lesson, lessonPath, warnings) {
  const status = getLessonQualityRubricStatus(lesson);
  const entries = Object.entries(status);
  const presentCount = entries.filter(([, present]) => present).length;

  if (presentCount >= 4) return;

  const missing = entries
    .filter(([, present]) => !present)
    .map(([name]) => name);

  addWarning(
    warnings,
    lessonPath,
    `Lesson quality rubric is thin (${presentCount}/6); missing ${missing.join(', ')}.`,
  );
}

function analyzeInstructionalScaffolding(lesson, lessonPath, warnings) {
  const status = getInstructionalScaffoldStatus(lesson);
  const entries = Object.entries(status);
  const presentCount = entries.filter(([, present]) => present).length;

  if (presentCount >= 4) return;

  const missing = entries
    .filter(([, present]) => !present)
    .map(([name]) => name);

  addWarning(
    warnings,
    lessonPath,
    `Lesson has shallow instructional scaffolding (${presentCount}/6); missing ${missing.join(', ')}.`,
  );
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

function getQuizQualityStatus(questions) {
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

function analyzeQuizQuality(quiz, quizPath, warnings) {
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  if (questions.length === 0) return;

  const status = getQuizQualityStatus(questions);
  const missing = Object.entries(status)
    .filter(([, present]) => !present)
    .map(([name]) => name);

  if (missing.length === 0) return;

  addWarning(
    warnings,
    quizPath,
    `Quiz quality rubric is missing ${missing.join(', ')} item coverage.`,
  );
}

function isValidIndex(value, length) {
  return Number.isInteger(value) && value >= 0 && value < length;
}

function analyzeChoiceAnswerShape(question, questionPath, issues, { sourceKey = 'options' } = {}) {
  const choices = question?.[sourceKey];
  if (!hasItems(choices) || choices.length < 2) {
    addIssue(issues, questionPath, `Question type "${question.type || 'mc'}" needs at least two ${sourceKey}.`);
    return;
  }

  if (!isValidIndex(question.correct, choices.length)) {
    addIssue(
      issues,
      questionPath,
      `Question correct index "${question.correct}" does not match ${sourceKey} length ${choices.length}.`,
    );
  }

  if (Array.isArray(question.optionFeedback) && question.optionFeedback.length !== choices.length) {
    addIssue(
      issues,
      questionPath,
      `Question optionFeedback length ${question.optionFeedback.length} does not match options length ${choices.length}.`,
    );
  }
}

function analyzeFillAnswerShape(question, questionPath, issues) {
  const acceptedAnswers = Array.isArray(question.correct) ? question.correct : [question.correct];
  const hasAcceptedAnswer = acceptedAnswers.some((answer) =>
    typeof answer === 'string' || typeof answer === 'number',
  );

  if (!hasAcceptedAnswer) {
    addIssue(issues, questionPath, 'Fill question needs at least one string or numeric accepted answer.');
  }
}

function analyzeOrderAnswerShape(question, questionPath, issues) {
  if (!hasItems(question.items) || question.items.length < 2) {
    addIssue(issues, questionPath, 'Order question needs at least two items.');
    return;
  }

  if (!Array.isArray(question.correct) || question.correct.length !== question.items.length) {
    addIssue(
      issues,
      questionPath,
      `Order question correct sequence must include ${question.items.length} item indexes.`,
    );
    return;
  }

  const sorted = [...question.correct].sort((left, right) => left - right);
  const expected = question.items.map((_, index) => index);
  if (JSON.stringify(sorted) !== JSON.stringify(expected)) {
    addIssue(issues, questionPath, 'Order question correct sequence must reference each item exactly once.');
  }
}

function analyzeQuestionAnswerShape(question, questionPath, issues) {
  const type = question?.type || 'mc';

  switch (type) {
    case 'mc':
    case 'code':
      analyzeChoiceAnswerShape(question, questionPath, issues);
      break;
    case 'bug':
      analyzeChoiceAnswerShape(question, questionPath, issues, { sourceKey: 'lines' });
      break;
    case 'fill':
      analyzeFillAnswerShape(question, questionPath, issues);
      break;
    case 'order':
      analyzeOrderAnswerShape(question, questionPath, issues);
      break;
    default:
      addIssue(issues, questionPath, `Question type "${type}" has no registered renderer.`);
  }
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
    const routeIdIssue = getRouteIdIssue('Course', course.id);
    if (routeIdIssue) {
      addIssue(issues, `metadata.${course.id}`, routeIdIssue);
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
      const routeIdIssue = getRouteIdIssue('Module', moduleData.id);
      if (routeIdIssue) {
        addIssue(issues, modulePath, routeIdIssue);
      }
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
        const routeIdIssue = getRouteIdIssue('Lesson', lesson.id, {
          reservedSegments: RESERVED_LESSON_ROUTE_SEGMENTS,
        });
        if (routeIdIssue) {
          addIssue(issues, lessonPath, routeIdIssue);
        }
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
      analyzeInstructionalScaffolding(lesson, lessonPath, warnings);
      analyzeLearningQualityRubric(lesson, lessonPath, warnings);

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

function analyzeQuizzes(courseId, quizzes, issues, warnings) {
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

    analyzeQuizQuality(quiz, quizPath, warnings);
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
      analyzeQuestionAnswerShape(question, questionPath, issues);
    });
  });
}

function analyzeChallenges(courseId, challenges, moduleIds, issues, warnings) {
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
    if (!isNonEmptyString(challenge.recommendedModuleId)) {
      addWarning(
        warnings,
        challengePath,
        'Challenge is missing recommendedModuleId; module readiness will fall back to difficulty-based placement.',
      );
    } else if (!moduleIds.has(String(challenge.recommendedModuleId))) {
      addIssue(
        issues,
        challengePath,
        `Challenge recommendedModuleId "${challenge.recommendedModuleId}" does not match an active module in ${courseId}.`,
      );
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
    } else {
      challenge.tests.forEach((test, testIndex) => {
        const testPath = `${challengePath}.tests[${testIndex}]`;
        if (!isNonEmptyString(test?.label)) {
          addIssue(issues, testPath, 'Challenge test is missing a learner-facing label.');
        }
        if (typeof test?.check !== 'function') {
          addIssue(issues, testPath, 'Challenge test is missing an executable check function.');
        }
      });
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

function getCourseIdFromPath(path) {
  return String(path || '').split('.')[0] || 'unknown';
}

function getWarningCategory(message) {
  const text = String(message || '');
  if (text.startsWith('Lesson quality rubric is thin')) return 'lesson-quality-rubric';
  if (text.startsWith('Lesson has shallow instructional scaffolding')) return 'instructional-scaffolding';
  if (text.startsWith('Quiz quality rubric is missing')) return 'quiz-quality-rubric';
  if (text.startsWith('Challenge is missing recommendedModuleId')) return 'challenge-module-mapping';
  if (text.startsWith('Challenge is missing')) return 'challenge-evidence';
  return 'other';
}

function getMissingSignals(message) {
  const match = String(message || '').match(/missing ([^.;]+)[.;]/i);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((signal) => signal.trim())
    .filter(Boolean);
}

function incrementCount(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function toSortedCountEntries(map) {
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

export function buildAuditSummary({ issues = [], warnings = [], counts = {} } = {}) {
  const warningsByCourse = new Map();
  const warningsByCategory = new Map();
  const missingSignals = new Map();

  warnings.forEach((warning) => {
    incrementCount(warningsByCourse, getCourseIdFromPath(warning.path));
    incrementCount(warningsByCategory, getWarningCategory(warning.message));
    getMissingSignals(warning.message).forEach((signal) => incrementCount(missingSignals, signal));
  });

  return {
    counts,
    issueCount: issues.length,
    warningCount: warnings.length,
    warningsByCourse: toSortedCountEntries(warningsByCourse),
    warningsByCategory: toSortedCountEntries(warningsByCategory),
    missingSignals: toSortedCountEntries(missingSignals),
  };
}

function printAuditSummary(result) {
  const summary = buildAuditSummary(result);

  console.log('\nActionable summary:');
  console.log(`  blocking issues: ${summary.issueCount}`);
  console.log(`  report-only warnings: ${summary.warningCount}`);

  if (summary.warningsByCourse.length > 0) {
    console.log('\n  warnings by course:');
    summary.warningsByCourse.forEach((entry) => {
      console.log(`    - ${entry.name}: ${entry.count}`);
    });
  }

  if (summary.warningsByCategory.length > 0) {
    console.log('\n  warnings by category:');
    summary.warningsByCategory.forEach((entry) => {
      console.log(`    - ${entry.name}: ${entry.count}`);
    });
  }

  if (summary.missingSignals.length > 0) {
    console.log('\n  most common missing signals:');
    summary.missingSignals.slice(0, 12).forEach((entry) => {
      console.log(`    - ${entry.name}: ${entry.count}`);
    });
  }
}

function getCliOptionValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return '';
  return process.argv[index + 1] || '';
}

function budgetEntriesToMap(entries = []) {
  return new Map(
    (Array.isArray(entries) ? entries : [])
      .filter((entry) => entry && typeof entry.name === 'string')
      .map((entry) => [entry.name, Number(entry.count) || 0]),
  );
}

function compareBudgetEntries(actualEntries, budgetEntries, label, failures) {
  const budgetMap = budgetEntriesToMap(budgetEntries);

  actualEntries.forEach((entry) => {
    const allowed = budgetMap.has(entry.name) ? budgetMap.get(entry.name) : 0;
    if (entry.count > allowed) {
      failures.push(`${label} "${entry.name}" increased from ${allowed} to ${entry.count}.`);
    }
  });
}

export function checkAuditWarningBudget(summary, budget = {}) {
  const failures = [];
  const maxWarnings = Number(budget.warningCount);

  if (Number.isFinite(maxWarnings) && summary.warningCount > maxWarnings) {
    failures.push(`Total report-only warnings increased from ${maxWarnings} to ${summary.warningCount}.`);
  }

  compareBudgetEntries(summary.warningsByCourse, budget.warningsByCourse, 'Course warnings', failures);
  compareBudgetEntries(summary.warningsByCategory, budget.warningsByCategory, 'Warning category', failures);
  compareBudgetEntries(summary.missingSignals, budget.missingSignals, 'Missing signal', failures);

  return failures;
}

async function loadWarningBudget(budgetPath) {
  if (!budgetPath) return null;
  const raw = await readFile(budgetPath, 'utf8');
  return JSON.parse(raw);
}

function printBudgetResult(failures) {
  if (failures.length === 0) {
    console.log('\nWarning budget: ok');
    return;
  }

  console.log('\nWarning budget exceeded:');
  failures.forEach((failure) => {
    console.log(`  - ${failure}`);
  });
}

export function analyzeLearningContent({ courseMetadata, loaded }) {
  const issues = [];
  const warnings = [];
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

    const lessonAnalysis = analyzeLessons(courseId, modules, lessonIndexes, issues, warnings);
    analyzeQuizzes(courseId, data?.quizzes || [], issues, warnings);
    analyzeChallenges(courseId, data?.challenges || [], lessonAnalysis.moduleIds, issues, warnings);
  }

  return {
    issues,
    warnings,
    counts: {
      courses: loaded.length,
      modules: moduleCount,
      lessons: lessonCount,
      quizzes: quizCount,
      challenges: challengeCount,
    },
  };
}

async function main() {
  const showSummary = process.argv.includes('--summary');
  const budgetPath = getCliOptionValue('--budget');

  console.log('Learning Content Audit');

  const { courseMetadata, loaded } = await loadAllCourseData();
  const result = analyzeLearningContent({ courseMetadata, loaded });

  console.log(`  courses: ${result.counts.courses}`);
  console.log(`  modules: ${result.counts.modules}`);
  console.log(`  lessons: ${result.counts.lessons}`);
  console.log(`  quizzes: ${result.counts.quizzes}`);
  console.log(`  challenges: ${result.counts.challenges}`);

  printEntries('Warnings', result.warnings);
  printEntries('Blocking issues', result.issues);
  if (showSummary) {
    printAuditSummary(result);
  }

  const warningBudget = await loadWarningBudget(budgetPath);
  if (warningBudget) {
    const budgetFailures = checkAuditWarningBudget(buildAuditSummary(result), warningBudget);
    printBudgetResult(budgetFailures);
    if (budgetFailures.length > 0) {
      process.exitCode = 1;
      return;
    }
  }

  if (result.issues.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log('\n  no blocking content integrity issues.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('Learning content audit failed:', err);
    process.exitCode = 1;
  });
}
