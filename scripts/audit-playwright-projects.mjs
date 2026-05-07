/* global console, process */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import playwrightConfig from '../playwright.config.js';

const PROJECT_ARG_RE = /--project(?:=|\s+)(["']?)([A-Za-z0-9_-]+)\1/g;

export function collectProjectReferences({ packageJsonText, scriptFiles }) {
  const references = [];
  const packageJson = JSON.parse(packageJsonText);

  Object.entries(packageJson.scripts || {}).forEach(([scriptName, command]) => {
    collectFromText({
      source: `package.json scripts.${scriptName}`,
      text: command,
      references,
    });
  });

  scriptFiles.forEach(({ source, text }) => {
    collectFromText({ source, text, references });
  });

  return references;
}

export function auditPlaywrightProjectReferences({ config, references }) {
  const projectNames = new Set((config.projects || []).map((project) => project.name));
  const invalidReferences = references.filter((reference) => !projectNames.has(reference.project));

  return {
    projectNames: [...projectNames].sort(),
    references,
    invalidReferences,
  };
}

function collectFromText({ source, text, references }) {
  PROJECT_ARG_RE.lastIndex = 0;
  let match = PROJECT_ARG_RE.exec(text);

  while (match) {
    references.push({
      source,
      project: match[2],
    });
    match = PROJECT_ARG_RE.exec(text);
  }
}

function loadScriptFiles(rootDir) {
  const scriptsDir = path.join(rootDir, 'scripts');
  return readdirSync(scriptsDir)
    .filter((fileName) => fileName.endsWith('.mjs'))
    .map((fileName) => {
      const filePath = path.join(scriptsDir, fileName);
      return {
        source: path.relative(rootDir, filePath).replaceAll(path.sep, '/'),
        text: readFileSync(filePath, 'utf8'),
      };
    });
}

export function runPlaywrightProjectAudit(rootDir = process.cwd()) {
  const packageJsonText = readFileSync(path.join(rootDir, 'package.json'), 'utf8');
  const references = collectProjectReferences({
    packageJsonText,
    scriptFiles: loadScriptFiles(rootDir),
  });

  return auditPlaywrightProjectReferences({
    config: playwrightConfig,
    references,
  });
}

function printAuditResult(result) {
  console.log('Playwright Project Reference Audit');
  console.log(`  configured projects: ${result.projectNames.join(', ')}`);
  console.log(`  referenced projects: ${result.references.length}`);

  if (!result.invalidReferences.length) {
    console.log('  invalid project references: 0');
    console.log('No invalid Playwright project references detected.');
    return;
  }

  console.error(`  invalid project references: ${result.invalidReferences.length}`);
  result.invalidReferences.forEach((reference) => {
    console.error(`  - ${reference.source}: --project=${reference.project}`);
  });
}

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const result = runPlaywrightProjectAudit();
  printAuditResult(result);

  if (result.invalidReferences.length) {
    process.exitCode = 1;
  }
}
