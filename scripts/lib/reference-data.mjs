import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { COURSE_METADATA } from '../../src/data/metadata.js';
import { GLOSSARY } from '../../src/data/reference/glossary.js';
import { buildSearchIndexFromCourses } from '../../src/data/reference/search-index-core.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const COURSE_DEFINITIONS = [
  {
    id: 'html',
    courseFile: 'src/data/html/course.js',
    courseExport: 'HTML_MODULES',
    quizFile: 'src/data/html/quizzes.js',
    quizExport: 'HTML_QUIZZES',
  },
  {
    id: 'css',
    courseFile: 'src/data/css/course.js',
    courseExport: 'CSS_MODULES',
    quizFile: 'src/data/css/quizzes.js',
    quizExport: 'CSS_QUIZZES',
  },
  {
    id: 'js',
    courseFile: 'src/data/js/course.js',
    courseExport: 'JS_MODULES',
    quizFile: 'src/data/js/quizzes.js',
    quizExport: 'JS_QUIZZES',
  },
  {
    id: 'react',
    courseFile: 'src/data/react/course.js',
    courseExport: 'REACT_MODULES',
    quizFile: 'src/data/react/quizzes.js',
    quizExport: 'REACT_QUIZZES',
  },
];

function resolveProjectPath(relativePath) {
  return path.join(projectRoot, relativePath);
}

async function importJsModule(relativePath) {
  const absolutePath = resolveProjectPath(relativePath);
  return import(pathToFileURL(absolutePath).href);
}

function parseImportSpec(importClause) {
  const trimmed = importClause.trim();

  if (trimmed.startsWith('{')) {
    const body = trimmed.slice(1, -1).trim();
    const [rawImported, rawLocal] = body.split(/\s+as\s+/);
    const imported = rawImported.trim();
    const local = (rawLocal || imported).trim();
    return { imported, local };
  }

  return { imported: 'default', local: trimmed };
}

async function loadCourseModules(relativeCourseFile, courseExport) {
  if (relativeCourseFile.includes('/react/')) {
    const module = await importJsModule(relativeCourseFile);
    return module[courseExport] || [];
  }

  const absoluteCourseFile = resolveProjectPath(relativeCourseFile);
  const source = await fs.readFile(absoluteCourseFile, 'utf8');

  const importEntries = [...source.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"];?$/gm)].map((match) => ({
    ...parseImportSpec(match[1]),
    relativePath: match[2],
  }));

  const exportMatch = source.match(
    new RegExp(`export\\s+const\\s+${courseExport}\\s*=\\s*\\[([\\s\\S]*?)\\];`),
  );

  if (!exportMatch) {
    throw new Error(`Could not resolve ${courseExport} from ${relativeCourseFile}`);
  }

  const exportOrder = exportMatch[1]
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const importMap = new Map(importEntries.map((entry) => [entry.local, entry]));

  const modules = await Promise.all(exportOrder.map(async (localName) => {
    const entry = importMap.get(localName);
    if (!entry) {
      throw new Error(`Missing import for ${localName} in ${relativeCourseFile}`);
    }

    const resolvedPath = path.resolve(path.dirname(absoluteCourseFile), entry.relativePath);
    if (resolvedPath.endsWith('.json')) {
      const jsonSource = await fs.readFile(resolvedPath, 'utf8');
      return JSON.parse(jsonSource);
    }

    const module = await import(pathToFileURL(resolvedPath).href);
    return entry.imported === 'default' ? module.default : module[entry.imported];
  }));

  return modules;
}

function buildQuizVariantLookup(quizzes = []) {
  const scopedVariants = new Map();

  const registerQuiz = (type, entityId, quiz) => {
    if (!entityId) return;
    const key = `${type}:${entityId}`;
    const variant = scopedVariants.get(key);

    if (!variant) {
      scopedVariants.set(key, { primary: quiz, bonus: [] });
      return;
    }

    variant.bonus.push(quiz);
  };

  quizzes.forEach((quiz) => {
    registerQuiz('l', quiz.lessonId, quiz);
    registerQuiz('m', quiz.moduleId, quiz);
  });

  return (type, entityId) => scopedVariants.get(`${type}:${entityId}`) || null;
}

export async function loadReferenceCourses() {
  return Promise.all(COURSE_DEFINITIONS.map(async (definition) => {
    const metadata = COURSE_METADATA.find((course) => course.id === definition.id);
    const modules = await loadCourseModules(definition.courseFile, definition.courseExport);
    const quizModule = await importJsModule(definition.quizFile);
    const quizzes = quizModule[definition.quizExport] || [];

    return {
      ...metadata,
      modules,
      quizzes,
    };
  }));
}

export async function buildReferenceData() {
  const coursesWithRuntimeData = await loadReferenceCourses();
  const quizVariantResolvers = new Map(
    coursesWithRuntimeData.map((course) => [course.id, buildQuizVariantLookup(course.quizzes)]),
  );
  const searchIndex = buildSearchIndexFromCourses(
    coursesWithRuntimeData,
    GLOSSARY,
    {
      getQuizVariants: (courseId, type, entityId) => {
        const resolver = quizVariantResolvers.get(courseId);
        return resolver ? resolver(type, entityId) : null;
      },
    },
  );

  const courseCatalog = coursesWithRuntimeData.map((course) => ({
    id: course.id,
    label: course.label,
    icon: course.icon,
    accent: course.accent,
    modules: course.modules.map((moduleData) => ({
      id: moduleData.id,
      title: moduleData.title,
      emoji: moduleData.emoji || '',
      lessons: (moduleData.lessons || []).map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
      })),
    })),
  }));

  return { searchIndex, courseCatalog };
}

function toModuleSource(constantName, payload) {
  return [
    `export const ${constantName} = Object.freeze(`,
    `${JSON.stringify(payload, null, 2)}`,
    ');',
    '',
  ].join('\n');
}

export async function writeReferenceDataFiles({
  searchIndex,
  courseCatalog,
  searchOutputFile = 'src/data/reference/search-manifest.generated.js',
  courseCatalogOutputFile = 'src/data/reference/course-catalog.generated.js',
} = {}) {
  await fs.writeFile(
    resolveProjectPath(searchOutputFile),
    toModuleSource('SEARCH_INDEX_MANIFEST', searchIndex),
    'utf8',
  );
  await fs.writeFile(
    resolveProjectPath(courseCatalogOutputFile),
    toModuleSource('COURSE_CATALOG', courseCatalog),
    'utf8',
  );
}

export async function readReferenceDataFiles({
  searchOutputFile = 'src/data/reference/search-manifest.generated.js',
  courseCatalogOutputFile = 'src/data/reference/course-catalog.generated.js',
} = {}) {
  const [searchSource, courseCatalogSource] = await Promise.all([
    fs.readFile(resolveProjectPath(searchOutputFile), 'utf8'),
    fs.readFile(resolveProjectPath(courseCatalogOutputFile), 'utf8'),
  ]);

  return {
    searchSource,
    courseCatalogSource,
  };
}
