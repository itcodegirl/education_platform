import { describe, expect, it } from 'vitest';
import { auditAuthE2EReadiness } from '../../scripts/audit-auth-e2e-readiness.mjs';

const packageJsonText = JSON.stringify({
  scripts: {
    'test:e2e:auth:preflight': 'node scripts/auth-e2e-preflight.mjs',
  },
});

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

describe('authenticated E2E readiness audit', () => {
  it('flags workflows that do not run the auth preflight', () => {
    const result = auditAuthE2EReadiness({
      packageJsonText,
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
});
