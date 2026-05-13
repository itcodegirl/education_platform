import { describe, expect, it } from 'vitest';
import { auditAssetPerformancePolicy } from '../../scripts/check-asset-performance-policy.mjs';

describe('asset performance policy', () => {
  it('keeps image, font, and preload guardrails explicit', () => {
    const result = auditAssetPerformancePolicy();

    expect(result.issues).toEqual([]);
    expect(result.passed).toContain('compressed image budget');
    expect(result.passed).toContain('font preload boundary');
    expect(result.passed).toContain('forbidden dependency preloads');
    expect(result.passed).toContain('asset size audit command');
    expect(result.passed).toContain('font size budget');
  });
});
