import { describe, expect, it } from 'vitest';
import { getChallengePracticePlan } from './challengeProgress';

const challenges = [
  { id: 'advanced-1', title: 'Advanced Build', difficulty: 'advanced' },
  { id: 'beginner-1', title: 'Starter Build', difficulty: 'beginner' },
  { id: 'intermediate-1', title: 'Next Build', difficulty: 'intermediate' },
];

describe('challenge progress helpers', () => {
  it('recommends a beginner challenge first even when the data order is mixed', () => {
    const plan = getChallengePracticePlan(challenges, []);

    expect(plan.recommendedChallenge.title).toBe('Starter Build');
    expect(plan.progressLabel).toBe('0/3 complete');
    expect(plan.reason).toMatch(/turn lesson knowledge/i);
  });

  it('recommends the next open challenge after progress exists', () => {
    const plan = getChallengePracticePlan(challenges, ['advanced-1']);

    expect(plan.recommendedChallenge.title).toBe('Starter Build');
    expect(plan.completedCount).toBe(1);
    expect(plan.openCount).toBe(2);
    expect(plan.reason).toMatch(/next open challenge/i);
  });

  it('handles fully completed challenge sets', () => {
    const plan = getChallengePracticePlan(challenges, [
      'advanced-1',
      'beginner-1',
      'intermediate-1',
    ]);

    expect(plan.recommendedChallenge).toBeNull();
    expect(plan.openCount).toBe(0);
    expect(plan.reason).toMatch(/all available challenges/i);
  });
});
