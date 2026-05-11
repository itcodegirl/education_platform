import { describe, expect, it } from 'vitest';
import { getChallengeEvidenceSummary } from './challengeEvidence';

describe('challenge evidence summary', () => {
  it('summarizes requirements, checks, and completion scope', () => {
    const summary = getChallengeEvidenceSummary({
      difficulty: 'beginner',
      requirements: ['Use semantic HTML', 'Connect labels'],
      tests: [{ label: 'Has nav' }, { label: 'Has labels' }],
    }, { isCompleted: true });

    expect(summary.statusLabel).toBe('Evidence ready');
    expect(summary.statusDetail).toMatch(/same-browser CodeHerWay progress/i);
    expect(summary.proofItems).toEqual([
      '2 requirements',
      '2 automated checks',
      'beginner practice',
    ]);
    expect(summary.capabilityItems).toEqual(['Use semantic HTML', 'Connect labels']);
    expect(summary.reflectionPrompts).toHaveLength(3);
  });

  it('falls back to test labels when requirements are missing', () => {
    const summary = getChallengeEvidenceSummary({
      tests: [{ label: 'Renders a card' }],
    });

    expect(summary.statusLabel).toBe('Evidence in progress');
    expect(summary.proofItems).toContain('0 requirements');
    expect(summary.capabilityItems).toEqual(['Renders a card']);
  });
});
