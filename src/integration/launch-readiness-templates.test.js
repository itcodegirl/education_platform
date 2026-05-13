import { describe, expect, it } from 'vitest';
import { checkLaunchReadinessTemplates } from '../../scripts/check-launch-readiness-templates.mjs';

describe('launch readiness issue templates', () => {
  it('keeps production-readiness follow-up templates actionable', () => {
    const result = checkLaunchReadinessTemplates();

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
