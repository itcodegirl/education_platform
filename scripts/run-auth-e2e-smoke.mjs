/* global console, process, URL */
import { spawnSync } from 'node:child_process';
import { promises as dns } from 'node:dns';
import path from 'node:path';

const REQUIRED_AUTH_ENV = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'E2E_EMAIL',
  'E2E_PASSWORD',
];

const LOCAL_SUPABASE_URL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;
const PLACEHOLDER_SUPABASE_ANON_KEY = 'example-anon-key';

const playwrightArgs = [
  'test',
  'tests/e2e/authenticated.smoke.spec.js',
  'tests/e2e/lesson-flow.spec.js',
  'tests/e2e/mobile-learning-smoke.spec.js',
  '--project=authenticated-chromium',
  '--project=lesson-authenticated-chromium',
  '--project=mobile-authenticated-chrome',
];

function getMissingAuthConfig(env = process.env) {
  const missing = REQUIRED_AUTH_ENV.filter((name) => !env[name]);
  const isCi = env.CI === 'true';
  const allowLocalSupabase = env.E2E_ALLOW_LOCAL_SUPABASE === 'true';
  const supabaseUrl = env.VITE_SUPABASE_URL?.trim() || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim() || '';

  if (isCi && !allowLocalSupabase && LOCAL_SUPABASE_URL.test(supabaseUrl)) {
    missing.push('VITE_SUPABASE_URL');
  }

  if (isCi && supabaseAnonKey === PLACEHOLDER_SUPABASE_ANON_KEY) {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }

  return [...new Set(missing)];
}

async function canResolveSupabaseHost() {
  const isCi = process.env.CI === 'true';
  const allowLocalSupabase = process.env.E2E_ALLOW_LOCAL_SUPABASE === 'true';
  if (!isCi || allowLocalSupabase) return true;

  const { hostname } = new URL(process.env.VITE_SUPABASE_URL);
  await dns.lookup(hostname);
  return true;
}

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

const missing = getMissingAuthConfig();
if (missing.length > 0) {
  console.log(`Skipping authenticated E2E smoke: set ${missing.join(', ')} to enable it.`);
  process.exit(0);
}

try {
  await canResolveSupabaseHost();
} catch (error) {
  console.log(`Skipping authenticated E2E smoke: Supabase host is unreachable (${error.code || error.message}).`);
  process.exit(0);
}

runPlaywright();
