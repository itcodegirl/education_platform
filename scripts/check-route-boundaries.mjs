/* global console, process */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const STATIC_IMPORT_RE = /^\s*import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"];?/gm;

export const ROUTE_BOUNDARY_RULES = [
  {
    file: 'src/routes/appRouter.jsx',
    forbiddenSources: ['../layouts/AuthLayout'],
    reason: 'Auth/landing UI must stay behind a lazy route boundary so signed-in learners do not pay for it on initial route setup.',
  },
  {
    file: 'src/components/learning/LessonView.jsx',
    forbiddenSources: ['./AITutor'],
    reason: 'The AI tutor must remain interaction-loaded through DeferredAITutor so lesson reading does not eagerly load chat/service code.',
  },
  {
    file: 'src/components/learning/CodeChallenge.jsx',
    forbiddenSources: ['@monaco-editor/react', 'monaco-editor'],
    reason: 'Monaco must remain lazy and opt-out on mobile/reduced-data paths.',
  },
  {
    file: 'src/components/PanelManager.jsx',
    forbiddenSources: ['jspdf', 'html2canvas', '@monaco-editor/react', 'monaco-editor'],
    reason: 'PanelManager should orchestrate lazy surfaces without importing heavy export/editor dependencies.',
  },
];

export const GLOBAL_STATIC_IMPORT_RULES = [
  {
    root: 'src',
    forbiddenSources: ['jspdf', 'html2canvas'],
    reason: 'PDF/export dependencies must stay behind explicit user actions and must not enter route, shell, or panel setup chunks.',
  },
];

const SOURCE_FILE_RE = /\.(js|jsx|ts|tsx)$/i;

function readStaticImportSources(rootDir, relativeFilePath) {
  const absolutePath = path.join(rootDir, relativeFilePath);
  const source = fs.readFileSync(absolutePath, 'utf8');
  return Array.from(source.matchAll(STATIC_IMPORT_RE), (match) => match[1]);
}

function walkSourceFiles(rootDir, relativeDir) {
  const absoluteDir = path.join(rootDir, relativeDir);

  if (!fs.existsSync(absoluteDir)) return [];

  return fs.readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDir, entry.name);

    if (entry.isDirectory()) {
      return walkSourceFiles(rootDir, relativePath);
    }

    return SOURCE_FILE_RE.test(entry.name)
      ? [relativePath.replaceAll(path.sep, '/')]
      : [];
  });
}

function checkConfiguredRouteBoundaries(rootDir, rules = ROUTE_BOUNDARY_RULES) {
  const failures = [];

  rules.forEach((rule) => {
    const imports = readStaticImportSources(rootDir, rule.file);
    const blockedImports = imports.filter((source) =>
      rule.forbiddenSources.some((forbiddenSource) => source === forbiddenSource),
    );

    blockedImports.forEach((source) => {
      failures.push(`${rule.file} statically imports ${source}. ${rule.reason}`);
    });
  });

  return failures;
}

export function checkGlobalStaticImportBoundaries(
  rootDir = process.cwd(),
  rules = GLOBAL_STATIC_IMPORT_RULES,
) {
  const failures = [];

  rules.forEach((rule) => {
    walkSourceFiles(rootDir, rule.root).forEach((file) => {
      const imports = readStaticImportSources(rootDir, file);
      const blockedImports = imports.filter((source) =>
        rule.forbiddenSources.some((forbiddenSource) => source === forbiddenSource),
      );

      blockedImports.forEach((source) => {
        failures.push(`${file} statically imports ${source}. ${rule.reason}`);
      });
    });
  });

  return failures;
}

export function checkRouteBoundaries(rootDir = process.cwd()) {
  const failures = [
    ...checkConfiguredRouteBoundaries(rootDir),
    ...checkGlobalStaticImportBoundaries(rootDir),
  ];

  return {
    failures,
    ok: failures.length === 0,
  };
}

const isCliRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isCliRun) {
  const result = checkRouteBoundaries();

  if (!result.ok) {
    console.error('Route boundary audit failed:');
    result.failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Route boundary audit passed.');
}
