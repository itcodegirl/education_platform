import { describe, expect, it } from 'vitest';
import { auditAuthenticatedPerformanceEvidence } from '../../scripts/check-authenticated-performance-evidence.mjs';

describe('authenticated performance evidence runbook', () => {
  it('keeps signed-in learner performance evidence explicit and honest', () => {
    const result = auditAuthenticatedPerformanceEvidence();

    expect(result.issues).toEqual([]);
    expect(result.passed).toContain('authenticated smoke command');
    expect(result.passed).toContain('mobile smoke command');
    expect(result.passed).toContain('Monaco lazy loading check');
    expect(result.passed).toContain('export lazy loading check');
  });
});
