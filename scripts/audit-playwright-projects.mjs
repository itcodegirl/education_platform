/* global console, process */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import playwrightConfig from '../playwright.config.js';

const PROJECT_REF_PATTERN = /--project(?:=|\s+)(["']?)([A-Za-z0-9_-]+)\1/g;

function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

export function collectProjectReferences({
  packageJsonText = readText(path.join(process.cwd(), 'package.json')),
  scriptFiles = readdirSync(path.join(process.cwd(), 'scripts'), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.mjs'))
    .map((entry) => path.join(process.cwd(), 'scripts', entry.name)),
} = {}) {
  const references = [];
  const packageJson = JSON.parse(packageJsonText);

  for (const [scriptName, command] of Object.entries(packageJson.scripts || {})) {
    collectFromText(references, `package.json scripts.${scriptName}`, String(command));
  }

  for (const filePath of scriptFiles) {
    collectFromText(references, path.relative(process.cwd(), filePath), readText(filePath));
  }

  return references;
}

function collectFromText(references, source, text) {
  for (const match of text.matchAll(PROJECT_REF_PATTERN)) {
    references.push({ source, project: match[2] });
  }
}

export function auditPlaywrightProjectReferences({
  config = playwrightConfig,
  references = collectProjectReferences(),
} = {}) {
  const configuredProjects = new Set((config.projects || []).map((project) => project.name));
  const invalidReferences = references
    .filter((reference) => !configuredProjects.has(reference.project))
    .map(({ source, project }) => ({ source, project }));

  return {
    configuredProjects: [...configuredProjects].sort(),
    references,
    invalidReferences,
  };
}

export function runPlaywrightProjectAudit() {
  return auditPlaywrightProjectReferences();
}

function main() {
  console.log('Playwright Project Reference Audit');
  const result = runPlaywrightProjectAudit();

  console.log(`  configured projects: ${result.configuredProjects.join(', ')}`);
  console.log(`  referenced projects: ${result.references.length}`);
  console.log(`  invalid project references: ${result.invalidReferences.length}`);

  if (result.invalidReferences.length > 0) {
    result.invalidReferences.forEach((reference) => {
      console.log(`  - ${reference.source}: ${reference.project}`);
    });
    process.exitCode = 1;
    return;
  }

  console.log('No invalid Playwright project references detected.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
