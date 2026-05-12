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

function readStaticImportSources(rootDir, relativeFilePath) {
  const absolutePath = path.join(rootDir, relativeFilePath);
  const source = fs.readFileSync(absolutePath, 'utf8');
  return Array.from(source.matchAll(STATIC_IMPORT_RE), (match) => match[1]);
}

export function checkRouteBoundaries(rootDir = process.cwd()) {
  const failures = [];

  ROUTE_BOUNDARY_RULES.forEach((rule) => {
    const imports = readStaticImportSources(rootDir, rule.file);
    const blockedImports = imports.filter((source) =>
      rule.forbiddenSources.some((forbiddenSource) => source === forbiddenSource),
    );

    blockedImports.forEach((source) => {
      failures.push(`${rule.file} statically imports ${source}. ${rule.reason}`);
    });
  });

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
