/* global console, process */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REQUIRED_ARTIFACTS = [
  {
    path: 'supabase-schema.sql',
    label: 'base schema',
    checks: [
      ['stable last_position course id', /course_id\s+text/i],
      ['stable last_position module id', /module_id\s+text/i],
      ['stable last_position lesson id', /lesson_id\s+text/i],
      ['module quiz resume flag', /is_module_quiz\s+boolean/i],
      ['aggregate public profile view', /create\s+or\s+replace\s+view\s+public\.public_profiles/i],
      ['public profile grant', /grant\s+select\s+on\s+public\.public_profiles\s+to\s+anon,\s*authenticated/i],
      ['raw progress anon revoke', /revoke\s+select\s+on\s+table\s+public\.progress\s+from\s+anon/i],
    ],
  },
  {
    path: 'supabase/migrations/202605070001_add_stable_last_position_columns.sql',
    label: 'stable resume migration',
    checks: [
      ['course_id additive column', /add\s+column\s+if\s+not\s+exists\s+course_id\s+text/i],
      ['module_id additive column', /add\s+column\s+if\s+not\s+exists\s+module_id\s+text/i],
      ['lesson_id additive column', /add\s+column\s+if\s+not\s+exists\s+lesson_id\s+text/i],
      ['is_module_quiz additive column', /add\s+column\s+if\s+not\s+exists\s+is_module_quiz\s+boolean/i],
    ],
  },
  {
    path: 'supabase/migrations/202605070002_harden_public_profile_privacy.sql',
    label: 'public profile privacy migration',
    checks: [
      ['aggregate public profile view', /create\s+or\s+replace\s+view\s+public\.public_profiles/i],
      ['public profile view grant', /grant\s+select\s+on\s+public\.public_profiles\s+to\s+anon,\s*authenticated/i],
      ['profiles anon revoke', /revoke\s+select\s+on\s+table\s+public\.profiles\s+from\s+anon/i],
      ['progress anon revoke', /revoke\s+select\s+on\s+table\s+public\.progress\s+from\s+anon/i],
      ['badges anon revoke', /revoke\s+select\s+on\s+table\s+public\.badges\s+from\s+anon/i],
    ],
  },
  {
    path: 'supabase/migrations/202604250001_create_reward_events.sql',
    label: 'reward event ledger migration',
    checks: [
      ['reward_events table', /create\s+table\s+if\s+not\s+exists\s+public\.reward_events/i],
      ['reward event idempotency key', /unique\s*\(\s*user_id,\s*event_key\s*\)/i],
      ['no direct browser write note', /Reward writes should go through public\.award_reward_event\(\)/i],
    ],
  },
  {
    path: 'supabase/migrations/202604250002_add_award_reward_event_rpc.sql',
    label: 'atomic reward RPC migration',
    checks: [
      ['award_reward_event RPC', /create\s+or\s+replace\s+function\s+public\.award_reward_event/i],
      ['auth-owned user id', /v_user_id\s+uuid\s*:=\s*auth\.uid\(\)/i],
      ['authenticated grant', /grant\s+execute\s+on\s+function\s+public\.award_reward_event[\s\S]+to\s+authenticated/i],
    ],
  },
  {
    path: 'supabase/migrations/202605060002_guard_reward_event_idempotency.sql',
    label: 'reward event idempotency guard',
    checks: [
      ['unique reward event index', /create\s+unique\s+index\s+if\s+not\s+exists\s+reward_events_user_event_key_key/i],
      ['user event key columns', /on\s+public\.reward_events\s*\(\s*user_id,\s*event_key\s*\)/i],
    ],
  },
  {
    path: 'supabase/migrations/202605060003_harden_profile_updates.sql',
    label: 'profile safe-field hardening migration',
    checks: [
      ['safe profile update grant', /grant\s+update\s*\(\s*display_name,\s*avatar_url,\s*is_public,\s*public_handle\s*\)/i],
      ['admin status RPC', /create\s+or\s+replace\s+function\s+public\.set_user_disabled/i],
      ['admin status RPC grant', /grant\s+execute\s+on\s+function\s+public\.set_user_disabled[\s\S]+to\s+authenticated/i],
    ],
  },
  {
    path: 'docs/supabase-production-readiness.md',
    label: 'Supabase production readiness docs',
    checks: [
      ['live deployment checklist', /##\s+Live Deployment Checklist/i],
      ['RLS smoke checks', /RLS smoke checks/i],
      ['authenticated E2E secrets boundary', /Authenticated E2E Secrets/i],
      ['backend reward sync boundary', /Backend Reward Sync Boundary/i],
    ],
  },
];

async function findDuplicateMigrationVersions(rootDir) {
  const migrationDir = path.join(rootDir, 'supabase', 'migrations');
  const entries = await readdir(migrationDir, { withFileTypes: true });
  const versions = new Map();

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.sql')) continue;
    const version = entry.name.match(/^(\d+)_/)?.[1];
    if (!version) continue;
    const files = versions.get(version) || [];
    files.push(entry.name);
    versions.set(version, files);
  }

  return [...versions.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([version, files]) => ({ version, files }));
}

async function readArtifact(rootDir, relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  return readFile(absolutePath, 'utf8');
}

export async function checkSupabaseReadiness(rootDir = process.cwd()) {
  const failures = [];
  const passed = [];

  try {
    const duplicates = await findDuplicateMigrationVersions(rootDir);
    if (duplicates.length === 0) {
      passed.push('migration inventory: unique timestamp prefixes');
    } else {
      duplicates.forEach(({ version, files }) => {
        failures.push(`migration inventory: duplicate timestamp ${version} used by ${files.join(', ')}`);
      });
    }
  } catch (error) {
    failures.push(`migration inventory: unable to read supabase/migrations (${error.code || error.message})`);
  }

  for (const artifact of REQUIRED_ARTIFACTS) {
    let content = '';
    try {
      content = await readArtifact(rootDir, artifact.path);
    } catch (error) {
      failures.push(`${artifact.label}: missing ${artifact.path} (${error.code || error.message})`);
      continue;
    }

    for (const [description, pattern] of artifact.checks) {
      if (pattern.test(content)) {
        passed.push(`${artifact.label}: ${description}`);
      } else {
        failures.push(`${artifact.label}: missing ${description} in ${artifact.path}`);
      }
    }
  }

  return {
    ok: failures.length === 0,
    passed,
    failures,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await checkSupabaseReadiness();

  if (result.ok) {
    console.log(`Supabase readiness static check passed (${result.passed.length} checks).`);
    process.exit(0);
  }

  console.error('Supabase readiness static check failed:');
  for (const failure of result.failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}
