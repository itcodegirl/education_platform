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
    expect(summary.rubricItems).toEqual([
      'Every visible requirement is represented in the code.',
      'Automated checks pass without changing the grader.',
      'You can explain one code decision and one improvement.',
    ]);
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

  it('uses challenge-specific rubric items when provided', () => {
    const summary = getChallengeEvidenceSummary({
      requirements: ['Uses useState'],
      rubric: [
        'Reset reliably returns the count to zero',
        'You can explain why functional state updates avoid stale values',
      ],
    });

    expect(summary.rubricItems).toEqual([
      'Reset reliably returns the count to zero',
      'You can explain why functional state updates avoid stale values',
    ]);
  });
});
