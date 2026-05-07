import { describe, expect, it } from 'vitest';
import { auditStagingValidationRunbook } from '../../scripts/check-staging-validation-runbook.mjs';

describe('staging Supabase validation runbook audit', () => {
  it('keeps the current staging validation runbook complete', () => {
    const result = auditStagingValidationRunbook();
    expect(result.issues).toEqual([]);
    expect(result.passed).toContain('explicit non-production status');
    expect(result.passed).toContain('validation record template fields');
  });

  it('flags missing production-readiness boundaries', () => {
    const result = auditStagingValidationRunbook({
      text: `
# Staging Supabase Validation Runbook

## Current Status
Backend sync is ready.

## Validation Record Template

\`\`\`md
Staging Supabase validation date:
Tester:
Decision:
\`\`\`
`,
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'missing explicit non-production status',
        'missing do-not-enable boundary',
        'validation record template: missing "Staging URL:"',
      ]),
    );
  });
});
