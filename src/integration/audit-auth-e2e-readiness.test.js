import { describe, expect, it } from 'vitest';
import { auditAuthE2EReadiness } from '../../scripts/audit-auth-e2e-readiness.mjs';

const packageScripts = {
  'test:e2e:auth:preflight': 'node scripts/auth-e2e-preflight.mjs',
  'test:e2e:smoke:learning': 'node scripts/run-auth-e2e-smoke.mjs',
  'test:e2e:smoke:lesson': 'node scripts/run-auth-e2e-smoke.mjs lesson',
  'test:e2e:smoke:mobile': 'node scripts/run-auth-e2e-smoke.mjs mobile',
  'test:e2e:smoke:authenticated': 'node scripts/run-auth-e2e-smoke.mjs authenticated',
};

function packageJsonText(overrides = {}) {
  return JSON.stringify({
    scripts: {
      ...packageScripts,
      ...overrides,
    },
  });
}

const validWorkflow = `
env:
  E2E_AUTH_REQUIRED: \${{ secrets.VITE_SUPABASE_URL != '' && secrets.VITE_SUPABASE_ANON_KEY != '' && secrets.E2E_EMAIL != '' && secrets.E2E_PASSWORD != '' }}
  VITE_SUPABASE_URL: \${{ secrets.VITE_SUPABASE_URL || '' }}
  VITE_SUPABASE_ANON_KEY: \${{ secrets.VITE_SUPABASE_ANON_KEY || '' }}
  E2E_EMAIL: \${{ secrets.E2E_EMAIL || '' }}
  E2E_PASSWORD: \${{ secrets.E2E_PASSWORD || '' }}
steps:
  - name: Preflight authenticated E2E Supabase config
    run: npm run test:e2e:auth:preflight
`;

const validAuthSmokeScript = `
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
`;

describe('authenticated E2E readiness audit', () => {
  it('flags workflows that do not run the auth preflight', () => {
    const result = auditAuthE2EReadiness({
      packageJsonText: packageJsonText(),
      authSmokeScriptText: validAuthSmokeScript,
      workflowFiles: [
        {
          filePath: '.github/workflows/e2e-smoke.yml',
          text: validWorkflow.replace('run: npm run test:e2e:auth:preflight', 'run: npm run test:e2e:smoke:public'),
        },
      ],
    });

    expect(result.issues).toEqual([
      {
        source: '.github/workflows/e2e-smoke.yml',
        message: 'Workflow does not run npm run test:e2e:auth:preflight.',
      },
    ]);
  });

  it('keeps current auth smoke workflows aligned with the preflight contract', () => {
    const result = auditAuthE2EReadiness();
    expect(result.issues).toEqual([]);
  });

  it('guards the authenticated smoke runner from losing critical signed-in specs', () => {
    const result = auditAuthE2EReadiness({
      packageJsonText: packageJsonText(),
      authSmokeScriptText: validAuthSmokeScript.replaceAll("'tests/e2e/mobile-learning-smoke.spec.js'", ''),
      workflowFiles: [{ filePath: '.github/workflows/e2e-smoke.yml', text: validWorkflow }],
    });

    expect(result.issues).toEqual([
      {
        source: 'scripts/run-auth-e2e-smoke.mjs',
        message: 'Authenticated smoke runner must include tests/e2e/mobile-learning-smoke.spec.js.',
      },
    ]);
  });

  it('guards scoped authenticated scripts from bypassing the preflight runner', () => {
    const result = auditAuthE2EReadiness({
      packageJsonText: packageJsonText({
        'test:e2e:smoke:lesson': 'playwright test tests/e2e/lesson-flow.spec.js --project=authenticated-chromium',
      }),
      authSmokeScriptText: validAuthSmokeScript,
      workflowFiles: [{ filePath: '.github/workflows/e2e-smoke.yml', text: validWorkflow }],
    });

    expect(result.issues).toEqual([
      {
        source: 'package.json scripts.test:e2e:smoke:lesson',
        message: 'Scoped authenticated smoke script must run node scripts/run-auth-e2e-smoke.mjs lesson.',
      },
    ]);
  });

  it('guards authenticated setup from hiding configured auth failures as skips', () => {
    const result = auditAuthE2EReadiness({
      packageJsonText: packageJsonText(),
      authSmokeScriptText: validAuthSmokeScript,
      authSetupSpecText: `
        if (!authReady.ok) {
          markAuthUnavailable(authReady.reason);
          test.skip(true, authReady.reason);
        }
      `,
      workflowFiles: [{ filePath: '.github/workflows/e2e-smoke.yml', text: validWorkflow }],
    });

    expect(result.issues).toEqual([
      {
        source: 'tests/e2e/authenticated.setup.spec.js',
        message: 'Authenticated setup must fail, not skip, when configured credentials cannot reach the learner shell.',
      },
      {
        source: 'tests/e2e/authenticated.setup.spec.js',
        message: 'Authenticated setup must throw authReady.reason after marking configured auth unavailable.',
      },
    ]);
  });
});
