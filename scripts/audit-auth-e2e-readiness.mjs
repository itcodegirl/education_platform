/* global console, process */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { REQUIRED_AUTH_ENV } from './auth-e2e-preflight.mjs';

const WORKFLOW_FILES = Object.freeze([
  '.github/workflows/ci-smoke.yml',
  '.github/workflows/e2e-smoke.yml',
]);

const AUTH_PREFLIGHT_SCRIPT = 'npm run test:e2e:auth:preflight';
const AUTH_SMOKE_SCRIPT = 'node scripts/run-auth-e2e-smoke.mjs';
const AUTH_SCOPE_SCRIPTS = Object.freeze({
  'test:e2e:smoke:lesson': `${AUTH_SMOKE_SCRIPT} lesson`,
  'test:e2e:smoke:mobile': `${AUTH_SMOKE_SCRIPT} mobile`,
  'test:e2e:smoke:authenticated': `${AUTH_SMOKE_SCRIPT} authenticated`,
});
const REQUIRED_AUTH_SMOKE_SPECS = Object.freeze([
  'tests/e2e/authenticated.smoke.spec.js',
  'tests/e2e/lesson-flow.spec.js',
  'tests/e2e/mobile-learning-smoke.spec.js',
]);
const REQUIRED_AUTH_SMOKE_PROJECTS = Object.freeze([
  '--project=authenticated-chromium',
  '--project=authenticated-mobile-chrome',
]);

function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

function addIssue(issues, source, message) {
  issues.push({ source, message });
}

function workflowHasSecretGate(workflowText, envName) {
  return workflowText.includes(`secrets.${envName}`);
}

export function auditAuthE2EReadiness({
  rootDir = process.cwd(),
  packageJsonText = readText(path.join(rootDir, 'package.json')),
  authSmokeScriptText = readText(path.join(rootDir, 'scripts/run-auth-e2e-smoke.mjs')),
  workflowFiles = WORKFLOW_FILES.map((filePath) => ({
    filePath,
    text: readText(path.join(rootDir, filePath)),
  })),
} = {}) {
  const issues = [];
  const packageJson = JSON.parse(packageJsonText);
  const authPreflightScript = packageJson.scripts?.['test:e2e:auth:preflight'];

  if (authPreflightScript !== 'node scripts/auth-e2e-preflight.mjs') {
    addIssue(
      issues,
      'package.json scripts.test:e2e:auth:preflight',
      'Authenticated E2E preflight script must run scripts/auth-e2e-preflight.mjs.',
    );
  }

  if (packageJson.scripts?.['test:e2e:smoke:learning'] !== AUTH_SMOKE_SCRIPT) {
    addIssue(
      issues,
      'package.json scripts.test:e2e:smoke:learning',
      `Authenticated learning smoke script must run ${AUTH_SMOKE_SCRIPT}.`,
    );
  }

  Object.entries(AUTH_SCOPE_SCRIPTS).forEach(([scriptName, expectedCommand]) => {
    if (packageJson.scripts?.[scriptName] !== expectedCommand) {
      addIssue(
        issues,
        `package.json scripts.${scriptName}`,
        `Scoped authenticated smoke script must run ${expectedCommand}.`,
      );
    }
  });

  REQUIRED_AUTH_SMOKE_SPECS.forEach((specPath) => {
    if (!authSmokeScriptText.includes(specPath)) {
      addIssue(
        issues,
        'scripts/run-auth-e2e-smoke.mjs',
        `Authenticated smoke runner must include ${specPath}.`,
      );
    }
  });

  REQUIRED_AUTH_SMOKE_PROJECTS.forEach((projectName) => {
    if (!authSmokeScriptText.includes(projectName)) {
      addIssue(
        issues,
        'scripts/run-auth-e2e-smoke.mjs',
        `Authenticated smoke runner must include ${projectName}.`,
      );
    }
  });

  for (const { filePath, text } of workflowFiles) {
    if (!text.includes('E2E_AUTH_REQUIRED:')) {
      addIssue(issues, filePath, 'Workflow does not declare E2E_AUTH_REQUIRED.');
    }

    if (!text.includes(AUTH_PREFLIGHT_SCRIPT)) {
      addIssue(issues, filePath, `Workflow does not run ${AUTH_PREFLIGHT_SCRIPT}.`);
    }

    for (const envName of REQUIRED_AUTH_ENV) {
      if (!text.includes(`${envName}:`) && !text.includes(`${envName}: \${{`)) {
        addIssue(issues, filePath, `Workflow does not pass ${envName} into the job environment.`);
      }

      if (!workflowHasSecretGate(text, envName)) {
        addIssue(issues, filePath, `E2E_AUTH_REQUIRED does not gate on secrets.${envName}.`);
      }
    }
  }

  return { issues };
}

function printEntries(title, entries) {
  if (!entries.length) return;

  console.log(`\n${title} (${entries.length}):`);
  entries.forEach((entry) => {
    console.log(`  - ${entry.source}: ${entry.message}`);
  });
}

function main() {
  console.log('Authenticated E2E Readiness Audit');
  const result = auditAuthE2EReadiness();

  printEntries('Blocking issues', result.issues);

  if (result.issues.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log('\n  authenticated E2E workflow readiness checks passed.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
