/* global console, process */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REQUIRED_TEMPLATES = Object.freeze([
  {
    path: '.github/ISSUE_TEMPLATE/authenticated-e2e-secrets.md',
    patterns: [
      /VITE_SUPABASE_URL/,
      /VITE_SUPABASE_ANON_KEY/,
      /E2E_EMAIL/,
      /E2E_PASSWORD/,
      /docs\/authenticated-e2e-ci\.md/,
    ],
  },
  {
    path: '.github/ISSUE_TEMPLATE/lighthouse-evidence-capture.md',
    patterns: [
      /lighthouse-ci-<run-id>-<attempt>/,
      /docs\/lighthouse-evidence\.md/,
      /Performance:/,
      /Do not cite scores/i,
    ],
  },
  {
    path: '.github/ISSUE_TEMPLATE/staging-supabase-validation.md',
    patterns: [
      /check:supabase-readiness/,
      /VITE_REWARD_BACKEND_SYNC_ENABLED=true/,
      /reward event idempotency/i,
      /docs\/staging-supabase-validation\.md/,
    ],
  },
]);

export function checkLaunchReadinessTemplates(rootDir = process.cwd()) {
  const failures = [];

  REQUIRED_TEMPLATES.forEach((template) => {
    const absolutePath = path.join(rootDir, template.path);

    if (!existsSync(absolutePath)) {
      failures.push(`${template.path} is missing.`);
      return;
    }

    const text = readFileSync(absolutePath, 'utf8');
    template.patterns.forEach((pattern) => {
      if (!pattern.test(text)) {
        failures.push(`${template.path} is missing required content: ${pattern}.`);
      }
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
  const result = checkLaunchReadinessTemplates();

  if (!result.ok) {
    console.error('Launch readiness template check failed:');
    result.failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Launch readiness template check passed.');
}
