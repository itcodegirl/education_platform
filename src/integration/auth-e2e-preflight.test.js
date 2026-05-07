import { describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import {
  loadAuthE2EEnvFile,
  parseAuthE2EEnvFile,
  runAuthE2EPreflight,
  validateAuthE2EEnv,
} from '../../scripts/auth-e2e-preflight.mjs';

const validEnv = {
  VITE_SUPABASE_URL: 'https://secret-project-ref.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'secret-anon-key',
  E2E_EMAIL: 'learner@example.test',
  E2E_PASSWORD: 'secret-password',
};

describe('authenticated E2E preflight', () => {
  it('parses the local authenticated E2E env template shape', () => {
    const parsed = parseAuthE2EEnvFile(`
      # local test credentials
      export VITE_SUPABASE_URL="https://secret-project-ref.supabase.co"
      VITE_SUPABASE_ANON_KEY='secret-anon-key'
      E2E_EMAIL=learner@example.test
      E2E_PASSWORD="secret-password"
      E2E_AUTH_REQUIRED=false
    `);

    expect(parsed).toEqual({
      VITE_SUPABASE_URL: 'https://secret-project-ref.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'secret-anon-key',
      E2E_EMAIL: 'learner@example.test',
      E2E_PASSWORD: 'secret-password',
      E2E_AUTH_REQUIRED: 'false',
    });
  });

  it('loads local env-file values without overriding explicit shell config', async () => {
    const env = {
      E2E_EMAIL: 'explicit-shell-user@example.test',
    };

    const result = await loadAuthE2EEnvFile({
      env,
      envFileText: `
        VITE_SUPABASE_URL=${validEnv.VITE_SUPABASE_URL}
        VITE_SUPABASE_ANON_KEY=${validEnv.VITE_SUPABASE_ANON_KEY}
        E2E_EMAIL=${validEnv.E2E_EMAIL}
        E2E_PASSWORD=${validEnv.E2E_PASSWORD}
      `,
    });

    expect(result.loaded).toBe(true);
    expect(result.keys).toEqual([
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'E2E_PASSWORD',
    ]);
    expect(env).toMatchObject({
      VITE_SUPABASE_URL: validEnv.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: validEnv.VITE_SUPABASE_ANON_KEY,
      E2E_EMAIL: 'explicit-shell-user@example.test',
      E2E_PASSWORD: validEnv.E2E_PASSWORD,
    });
  });

  it('does not load local env-file values automatically in CI', async () => {
    const env = { CI: 'true' };

    const result = await loadAuthE2EEnvFile({
      env,
      envFileText: `
        VITE_SUPABASE_URL=${validEnv.VITE_SUPABASE_URL}
        VITE_SUPABASE_ANON_KEY=${validEnv.VITE_SUPABASE_ANON_KEY}
        E2E_EMAIL=${validEnv.E2E_EMAIL}
        E2E_PASSWORD=${validEnv.E2E_PASSWORD}
      `,
    });

    expect(result).toMatchObject({
      loaded: false,
      keys: [],
      skipped: 'ci',
    });
    expect(env.VITE_SUPABASE_URL).toBeUndefined();
  });

  it('can run a successful preflight from local env-file values', async () => {
    const env = { E2E_AUTH_REQUIRED: 'true' };
    const checkReachability = vi.fn(async () => ({ status: 200 }));

    await loadAuthE2EEnvFile({
      env,
      envFileText: `
        VITE_SUPABASE_URL=${validEnv.VITE_SUPABASE_URL}
        VITE_SUPABASE_ANON_KEY=${validEnv.VITE_SUPABASE_ANON_KEY}
        E2E_EMAIL=${validEnv.E2E_EMAIL}
        E2E_PASSWORD=${validEnv.E2E_PASSWORD}
      `,
    });

    const result = await runAuthE2EPreflight(env, { checkReachability });

    expect(result.ok).toBe(true);
    expect(result.message).toContain('Authenticated E2E preflight passed');
    expect(result.message).not.toContain('secret-project-ref');
  });

  it('reports missing config without requiring local runs to fail', () => {
    const result = validateAuthE2EEnv({});

    expect(result.ok).toBe(false);
    expect(result.required).toBe(false);
    expect(result.missing).toEqual([
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'E2E_EMAIL',
      'E2E_PASSWORD',
    ]);
  });

  it('allows CI to skip authenticated E2E when the full secret set is absent', () => {
    const result = validateAuthE2EEnv({
      CI: 'true',
      E2E_AUTH_REQUIRED: 'false',
    });

    expect(result.ok).toBe(false);
    expect(result.required).toBe(false);
    expect(result.problems.map((problem) => problem.code)).toEqual(['missing_env']);
  });

  it('rejects localhost and placeholder Supabase config when auth E2E is required', () => {
    const result = validateAuthE2EEnv({
      ...validEnv,
      E2E_AUTH_REQUIRED: 'true',
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: 'example-anon-key',
    });

    expect(result.ok).toBe(false);
    expect(result.problems.map((problem) => problem.code)).toEqual([
      'local_supabase_in_ci',
      'placeholder_anon_key',
    ]);
  });

  it('rejects invalid Supabase URLs before any reachability check', () => {
    const result = validateAuthE2EEnv({
      ...validEnv,
      E2E_AUTH_REQUIRED: 'true',
      VITE_SUPABASE_URL: 'not a url',
    });

    expect(result.ok).toBe(false);
    expect(result.problems.map((problem) => problem.code)).toContain('invalid_url');
  });

  it('redacts configured values in successful diagnostics', async () => {
    const checkReachability = vi.fn(async () => ({ status: 200 }));

    const result = await runAuthE2EPreflight({
      ...validEnv,
      E2E_AUTH_REQUIRED: 'true',
    }, {
      checkReachability,
    });

    expect(result.ok).toBe(true);
    expect(result.message).toContain('Authenticated E2E preflight passed');
    expect(result.message).toContain('https://[redacted-host]');
    expect(result.message).not.toContain('secret-project-ref');
    expect(result.message).not.toContain(validEnv.VITE_SUPABASE_ANON_KEY);
    expect(result.message).not.toContain(validEnv.E2E_EMAIL);
    expect(result.message).not.toContain(validEnv.E2E_PASSWORD);
  });

  it('fails required preflight with redacted unreachable-host diagnostics', async () => {
    const checkReachability = vi.fn(async () => {
      const error = new Error('getaddrinfo ENOTFOUND secret-project-ref.supabase.co');
      error.code = 'ENOTFOUND';
      throw error;
    });

    const result = await runAuthE2EPreflight({
      ...validEnv,
      E2E_AUTH_REQUIRED: 'true',
    }, {
      checkReachability,
    });

    expect(result.ok).toBe(false);
    expect(result.required).toBe(true);
    expect(result.message).toContain('Supabase host is unreachable');
    expect(result.message).toContain('Reason: ENOTFOUND');
    expect(result.message).not.toContain('secret-project-ref');
    expect(result.message).not.toContain(validEnv.VITE_SUPABASE_ANON_KEY);
  });

  it('lets the CLI drain naturally after async network checks', async () => {
    const scriptText = await readFile('scripts/auth-e2e-preflight.mjs', 'utf8');

    expect(scriptText).not.toContain('process.exit(');
    expect(scriptText).toContain('process.exitCode');
  });
});
