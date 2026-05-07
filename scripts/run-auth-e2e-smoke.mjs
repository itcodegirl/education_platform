/* global console, process */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { loadAuthE2EEnvFile, runAuthE2EPreflight } from './auth-e2e-preflight.mjs';

const playwrightArgs = [
  'test',
  'tests/e2e/authenticated.smoke.spec.js',
  'tests/e2e/lesson-flow.spec.js',
  'tests/e2e/mobile-learning-smoke.spec.js',
  '--project=authenticated-chromium',
  '--project=lesson-authenticated-chromium',
  '--project=mobile-authenticated-chrome',
];

function runPlaywright() {
  const cliPath = path.join(process.cwd(), 'node_modules', 'playwright', 'cli.js');
  const result = spawnSync(process.execPath, [cliPath, ...playwrightArgs], {
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

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

  console.log(`Skipping authenticated E2E smoke locally: ${preflight.message}`);
  process.exit(0);
}

console.log(preflight.message);
runPlaywright();
