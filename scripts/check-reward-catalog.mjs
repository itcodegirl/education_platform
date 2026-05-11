/* global console, process */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const COURSE_IDS = ['html', 'css', 'js', 'react'];
const MIGRATION_PATH = path.join(
  'supabase',
  'migrations',
  '202605110001_harden_reward_event_trust_boundaries.sql',
);

const EXPECTED_XP_SEEDS = [
  {
    rewardType: 'LESSON_COMPLETE',
    sourceCte: 'lesson_entities',
    xp: 25,
  },
  {
    rewardType: 'QUIZ_BASE',
    sourceCte: 'quiz_entities',
    xp: 40,
  },
  {
    rewardType: 'QUIZ_PERFECT',
    sourceCte: 'quiz_entities',
    xp: 60,
  },
  {
    rewardType: 'CHALLENGE_COMPLETE',
    sourceCte: 'challenge_entities',
    xp: 25,
  },
];

function resolveRoot(rootDir = process.cwd()) {
  return path.resolve(rootDir);
}

async function importModule(rootDir, relativePath) {
  const modulePath = path.join(rootDir, relativePath);
  return import(pathToFileURL(modulePath).href);
}

async function loadJsonModules(rootDir, courseId) {
  const moduleDir = path.join(rootDir, 'src', 'data', courseId, 'modules');
  const files = (await fs.readdir(moduleDir))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));

  return Promise.all(
    files.map(async (fileName) => {
      const content = await fs.readFile(path.join(moduleDir, fileName), 'utf8');
      return JSON.parse(content);
    }),
  );
}

async function loadCourseModules(rootDir, courseId) {
  if (courseId === 'react') {
    const { REACT_MODULES } = await importModule(rootDir, 'src/data/react/course.js');
    return REACT_MODULES;
  }

  return loadJsonModules(rootDir, courseId);
}

async function loadNamedDataExport(rootDir, courseId, suffix) {
  const prefix = courseId.toUpperCase();
  const moduleName = suffix === 'QUIZZES' ? 'quizzes.js' : 'challenges.js';
  const exportName = `${prefix}_${suffix}`;
  const moduleExports = await importModule(rootDir, `src/data/${courseId}/${moduleName}`);
  return moduleExports[exportName] ?? [];
}

function toSortedArray(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

async function buildExpectedRewardCatalog(rootDir) {
  const { resolveQuizLessonId } = await importModule(
    rootDir,
    'src/data/quizLessonIdResolver.js',
  );

  const lessonEntities = new Set();
  const quizEntities = new Set();
  const challengeEntities = new Set();

  for (const courseId of COURSE_IDS) {
    const modules = await loadCourseModules(rootDir, courseId);
    const lessonIds = new Set();
    const moduleIds = new Set();

    modules.forEach((moduleData) => {
      const moduleId = String(moduleData.id);
      moduleIds.add(moduleId);

      (moduleData.lessons ?? []).forEach((lesson) => {
        const lessonId = String(lesson.id);
        lessonIds.add(lessonId);
        lessonEntities.add(`c:${courseId}|m:${moduleId}|l:${lessonId}`);
      });
    });

    const quizzes = await loadNamedDataExport(rootDir, courseId, 'QUIZZES');
    quizzes.forEach((quiz) => {
      const { resolvedLessonId } = resolveQuizLessonId(courseId, quiz.lessonId, lessonIds);

      if (resolvedLessonId) {
        quizEntities.add(`l:${courseId}:${resolvedLessonId}`);
      }

      if (quiz.moduleId && moduleIds.has(String(quiz.moduleId))) {
        quizEntities.add(`m:${courseId}:${quiz.moduleId}`);
      }
    });

    const challenges = await loadNamedDataExport(rootDir, courseId, 'CHALLENGES');
    challenges.forEach((challenge) => {
      challengeEntities.add(String(challenge.id));
    });
  }

  return {
    challenge_entities: toSortedArray(challengeEntities),
    lesson_entities: toSortedArray(lessonEntities),
    quiz_entities: toSortedArray(quizEntities),
  };
}

function extractEntityArray(sql, cteName) {
  const pattern = new RegExp(
    `${cteName}\\s*\\(entity_id\\)\\s+as\\s*\\([\\s\\S]*?unnest\\(array\\[([\\s\\S]*?)\\]\\s*::text\\[\\]`,
    'i',
  );
  const match = sql.match(pattern);

  if (!match) {
    return null;
  }

  return toSortedArray(
    new Set(
      [...match[1].matchAll(/'((?:''|[^'])*)'/g)].map((value) =>
        value[1].replaceAll("''", "'"),
      ),
    ),
  );
}

function compareSets(label, expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = expected.filter((value) => !actualSet.has(value));
  const extra = actual.filter((value) => !expectedSet.has(value));

  if (!missing.length && !extra.length) {
    return [];
  }

  const failures = [`${label} is out of sync with curriculum data.`];

  if (missing.length) {
    failures.push(
      `  Missing from migration (${missing.length}): ${missing.slice(0, 8).join(', ')}`,
    );
  }

  if (extra.length) {
    failures.push(
      `  Extra in migration (${extra.length}): ${extra.slice(0, 8).join(', ')}`,
    );
  }

  return failures;
}

function assertExpectedXpSeeds(sql) {
  return EXPECTED_XP_SEEDS.flatMap(({ rewardType, sourceCte, xp }) => {
    const pattern = new RegExp(
      `select\\s+'${rewardType}'\\s*,\\s*entity_id\\s*,\\s*${xp}\\s+from\\s+${sourceCte}`,
      'i',
    );

    return pattern.test(sql)
      ? []
      : [`Expected ${rewardType} to seed ${xp} XP from ${sourceCte}.`];
  });
}

export async function checkRewardCatalog(rootDir = process.cwd()) {
  const root = resolveRoot(rootDir);
  const migrationPath = path.join(root, MIGRATION_PATH);
  const [expected, sql] = await Promise.all([
    buildExpectedRewardCatalog(root),
    fs.readFile(migrationPath, 'utf8'),
  ]);

  const failures = [];
  const actual = {};

  for (const cteName of Object.keys(expected)) {
    const values = extractEntityArray(sql, cteName);

    if (!values) {
      failures.push(`Could not find ${cteName} seed array in ${MIGRATION_PATH}.`);
      continue;
    }

    actual[cteName] = values;
    failures.push(...compareSets(cteName, expected[cteName], values));
  }

  failures.push(...assertExpectedXpSeeds(sql));

  return {
    actual,
    expected,
    failures,
    ok: failures.length === 0,
  };
}

function formatCounts(groups) {
  return Object.entries(groups)
    .map(([label, values]) => `${label}: ${values.length}`)
    .join(', ');
}

const isCliRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isCliRun) {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const result = await checkRewardCatalog(path.join(scriptDir, '..'));

  if (!result.ok) {
    console.error('Reward catalog audit failed:');
    result.failures.forEach((failure) => console.error(failure));
    process.exit(1);
  }

  console.log(`Reward catalog audit passed (${formatCounts(result.expected)}).`);
}
