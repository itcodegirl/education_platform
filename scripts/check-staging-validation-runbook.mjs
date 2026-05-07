/* global console, process */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_RUNBOOK_PATH = 'docs/staging-supabase-validation.md';

const REQUIRED_RUNBOOK_CHECKS = Object.freeze([
  {
    label: 'explicit non-production status',
    pattern: /not production-verified/i,
  },
  {
    label: 'do-not-enable boundary',
    pattern: /do not enable backend sync beyond staging/i,
  },
  {
    label: 'required access section',
    pattern: /## Required Access[\s\S]+Supabase project URL[\s\S]+Test learner account/i,
  },
  {
    label: 'required environment variables',
    pattern: /## Required Environment Variables[\s\S]+VITE_SUPABASE_URL[\s\S]+VITE_SUPABASE_ANON_KEY[\s\S]+VITE_REWARD_BACKEND_SYNC_ENABLED=true/i,
  },
  {
    label: 'required migrations section',
    pattern: /## Required Migrations[\s\S]+npm run check:supabase-readiness[\s\S]+award_reward_event/i,
  },
  {
    label: 'lesson completion validation',
    pattern: /### 1\. Lesson Completion[\s\S]+Pass criteria: one reward event, one XP award, no duplicate XP after reload\./i,
  },
  {
    label: 'duplicate reward validation',
    pattern: /### 2\. Duplicate Reward[\s\S]+no second row is created for the same `?\(user_id, event_key\)`?/i,
  },
  {
    label: 'quiz retry validation',
    pattern: /### 3\. Quiz Reward[\s\S]+retry does not inflate XP/i,
  },
  {
    label: 'challenge cross-session validation',
    pattern: /### 4\. Challenge Completion[\s\S]+appears in a second session for the same learner/i,
  },
  {
    label: 'daily streak validation',
    pattern: /### 5\. Daily And Streak[\s\S]+duplicate daily activity does not inflate/i,
  },
  {
    label: 'offline replay validation',
    pattern: /### 6\. Offline And Online Replay[\s\S]+replay awards once/i,
  },
  {
    label: 'SQL inspection checklist',
    pattern: /## SQL Inspection Checklist[\s\S]+Reward Event Idempotency[\s\S]+RLS Isolation/i,
  },
  {
    label: 'production readiness gate',
    pattern: /## Production Readiness Gate[\s\S]+No XP inflation is observed[\s\S]+No RLS failures are observed/i,
  },
  {
    label: 'rollback plan',
    pattern: /## Rollback Plan Requirement[\s\S]+VITE_REWARD_BACKEND_SYNC_ENABLED=false[\s\S]+Do not delete staging or production reward evidence/i,
  },
  {
    label: 'validation record template',
    pattern: /## Validation Record Template[\s\S]+Staging Supabase validation date:[\s\S]+Decision:/i,
  },
]);

const REQUIRED_TEMPLATE_FIELDS = Object.freeze([
  'Staging Supabase validation date:',
  'Tester:',
  'Staging URL:',
  'Build SHA / deploy id:',
  'Supabase project:',
  'Test learner email:',
  'Test learner user id:',
  'Migrations applied:',
  'Manual tests:',
  'SQL inspection:',
  'Observed XP inflation:',
  'Observed RLS failure:',
  'Rollback plan link:',
  'Decision:',
]);

function readRunbook(rootDir, runbookPath) {
  return readFileSync(path.join(rootDir, runbookPath), 'utf8');
}

function collectTemplateIssues(text) {
  const templateMatch = text.match(/```md\s*([\s\S]*?)```/i);
  const template = templateMatch?.[1] || '';

  if (!template) {
    return ['validation record template: missing fenced markdown template'];
  }

  return REQUIRED_TEMPLATE_FIELDS
    .filter((field) => !template.includes(field))
    .map((field) => `validation record template: missing "${field}"`);
}

export function auditStagingValidationRunbook({
  rootDir = process.cwd(),
  runbookPath = DEFAULT_RUNBOOK_PATH,
  text = readRunbook(rootDir, runbookPath),
} = {}) {
  const passed = [];
  const issues = [];

  REQUIRED_RUNBOOK_CHECKS.forEach(({ label, pattern }) => {
    if (pattern.test(text)) {
      passed.push(label);
      return;
    }

    issues.push(`missing ${label}`);
  });

  const templateIssues = collectTemplateIssues(text);
  if (templateIssues.length) {
    issues.push(...templateIssues);
  } else {
    passed.push('validation record template fields');
  }

  return {
    ok: issues.length === 0,
    passed,
    issues,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = auditStagingValidationRunbook();

  if (result.ok) {
    console.log(`Staging validation runbook check passed (${result.passed.length} checks).`);
    process.exit(0);
  }

  console.error('Staging validation runbook check failed:');
  result.issues.forEach((issue) => {
    console.error(`- ${issue}`);
  });
  process.exit(1);
}
