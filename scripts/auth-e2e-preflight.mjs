/* global AbortController, clearTimeout, console, fetch, process, setTimeout, URL */
import { promises as dns } from 'node:dns';
import { pathToFileURL } from 'node:url';

export const REQUIRED_AUTH_ENV = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'E2E_EMAIL',
  'E2E_PASSWORD',
];

const LOCAL_SUPABASE_URL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;
const PLACEHOLDER_SUPABASE_ANON_KEY = 'example-anon-key';
const REACHABILITY_TIMEOUT_MS = 10000;

function isCi(env = process.env) {
  return env.CI === 'true';
}

function isAuthRequired(env = process.env) {
  if (env.E2E_AUTH_REQUIRED === 'false') return false;
  return env.E2E_AUTH_REQUIRED === 'true' || isCi(env);
}

function shouldAllowLocalSupabase(env = process.env) {
  return env.E2E_ALLOW_LOCAL_SUPABASE === 'true';
}

function normalizeEnvValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatList(values) {
  return values.map((value) => `- ${value}`).join('\n');
}

function redactUrl(url) {
  if (!url) return '[not configured]';

  return `${url.protocol}//[redacted-host]`;
}

export function validateAuthE2EEnv(env = process.env) {
  const missing = REQUIRED_AUTH_ENV.filter((name) => !normalizeEnvValue(env[name]));
  const supabaseUrlValue = normalizeEnvValue(env.VITE_SUPABASE_URL);
  const supabaseAnonKey = normalizeEnvValue(env.VITE_SUPABASE_ANON_KEY);
  const problems = [];
  let url = null;

  if (missing.length > 0) {
    problems.push({
      code: 'missing_env',
      message: `Missing required authenticated E2E environment variables:\n${formatList(missing)}`,
    });
  }

  if (supabaseUrlValue) {
    try {
      url = new URL(supabaseUrlValue);
      if (!['http:', 'https:'].includes(url.protocol)) {
        problems.push({
          code: 'invalid_url_protocol',
          message: 'VITE_SUPABASE_URL must use http or https.',
        });
      }
    } catch {
      problems.push({
        code: 'invalid_url',
        message: 'VITE_SUPABASE_URL must be a valid URL.',
      });
    }
  }

  if (
    url &&
    !shouldAllowLocalSupabase(env) &&
    isAuthRequired(env) &&
    LOCAL_SUPABASE_URL.test(supabaseUrlValue)
  ) {
    problems.push({
      code: 'local_supabase_in_ci',
      message: 'VITE_SUPABASE_URL points to local Supabase. Configure the GitHub Secret for the E2E Supabase project, or set E2E_ALLOW_LOCAL_SUPABASE=true only for an intentional local-Supabase CI job.',
    });
  }

  if (isAuthRequired(env) && supabaseAnonKey === PLACEHOLDER_SUPABASE_ANON_KEY) {
    problems.push({
      code: 'placeholder_anon_key',
      message: 'VITE_SUPABASE_ANON_KEY is still the placeholder value.',
    });
  }

  return {
    ok: problems.length === 0,
    required: isAuthRequired(env),
    missing,
    problems,
    url,
  };
}

async function fetchWithTimeout(url, timeoutMs = REACHABILITY_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkSupabaseReachability(url) {
  const healthUrl = new URL('/auth/v1/health', url.origin);

  await dns.lookup(url.hostname);

  const response = await fetchWithTimeout(healthUrl);
  if (response.status >= 500) {
    throw new Error(`Supabase health endpoint returned HTTP ${response.status}.`);
  }

  return {
    status: response.status,
  };
}

export async function runAuthE2EPreflight(env = process.env, options = {}) {
  const validation = validateAuthE2EEnv(env);
  const checkReachability = options.checkReachability || checkSupabaseReachability;

  if (!validation.ok) {
    return {
      ok: false,
      required: validation.required,
      message: [
        'Authenticated E2E preflight failed.',
        ...validation.problems.map((problem) => problem.message),
        'Required GitHub Secrets: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, E2E_EMAIL, E2E_PASSWORD.',
      ].join('\n\n'),
    };
  }

  try {
    const reachability = await checkReachability(validation.url);
    return {
      ok: true,
      required: validation.required,
      message: `Authenticated E2E preflight passed for ${redactUrl(validation.url)} (HTTP ${reachability.status}).`,
    };
  } catch (error) {
    return {
      ok: false,
      required: validation.required,
      message: [
        'Authenticated E2E preflight failed.',
        `Supabase host is unreachable for ${redactUrl(validation.url)}.`,
        `Reason: ${error?.code || error?.name || error?.message || 'unknown_error'}.`,
        'Verify the VITE_SUPABASE_URL GitHub Secret points to the E2E Supabase project and that GitHub Actions can reach it.',
      ].join('\n\n'),
    };
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runAuthE2EPreflight();

  if (result.ok) {
    console.log(result.message);
    process.exit(0);
  }

  if (!result.required) {
    console.log(`Skipping authenticated E2E preflight locally: ${result.message}`);
    process.exit(0);
  }

  console.error(result.message);
  process.exit(1);
}
