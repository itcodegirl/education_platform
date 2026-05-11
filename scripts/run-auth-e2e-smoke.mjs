/* global console, process */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { loadAuthE2EEnvFile, runAuthE2EPreflight } from './auth-e2e-preflight.mjs';

const AUTH_SMOKE_SCOPES = Object.freeze({
  learning: {
    specs: [
      'tests/e2e/authenticated.smoke.spec.js',
      'tests/e2e/lesson-flow.spec.js',
      'tests/e2e/mobile-learning-smoke.spec.js',
    ],
    projects: [
      '--project=authenticated-chromium',
      '--project=authenticated-mobile-chrome',
    ],
  },
  authenticated: {
    specs: ['tests/e2e/authenticated.smoke.spec.js'],
    projects: ['--project=authenticated-chromium'],
  },
  lesson: {
    specs: ['tests/e2e/lesson-flow.spec.js'],
    projects: ['--project=authenticated-chromium'],
  },
  mobile: {
    specs: ['tests/e2e/mobile-learning-smoke.spec.js'],
    projects: ['--project=authenticated-mobile-chrome'],
  },
});

function getPlaywrightArgs(scopeName = 'learning') {
  const scope = AUTH_SMOKE_SCOPES[scopeName];
  if (!scope) {
    console.error(`Unknown authenticated E2E smoke scope "${scopeName}".`);
    console.error(`Available scopes: ${Object.keys(AUTH_SMOKE_SCOPES).join(', ')}`);
    process.exit(1);
  }

  return ['test', ...scope.specs, ...scope.projects];
}

function runPlaywright(scopeName) {
  const cliPath = path.join(process.cwd(), 'node_modules', 'playwright', 'cli.js');
  const result = spawnSync(process.execPath, [cliPath, ...getPlaywrightArgs(scopeName)], {
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

const scopeName = process.argv[2] || 'learning';
getPlaywrightArgs(scopeName);
const envFile = await loadAuthE2EEnvFile();
if (envFile.loaded) {
  console.log(`Loaded authenticated E2E env from ${path.basename(envFile.filePath)} (${envFile.keys.length} keys).`);
}

const preflight = await runAuthE2EPreflight();
if (!preflight.ok) {
  if (preflight.required) {
    console.error(preflight.message);
    process.exit(1);
  }

  console.log(`AUTH_E2E_SKIPPED (${preflight.reason || 'not_required'}): authenticated smoke did not run.`);
  console.log(`Skipping authenticated E2E smoke locally: ${preflight.message}`);
  console.log('This is not a signed-in validation pass.');
  process.exit(0);
}

console.log(preflight.message);
runPlaywright(scopeName);
