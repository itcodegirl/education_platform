import { describe, expect, it } from 'vitest';
import { getChallengeProgressionPlan } from './challengeProgression';

const course = {
  id: 'css',
  modules: [
    {
      id: 'foundations',
      title: 'CSS Foundations',
      lessons: [{ id: 'l1', title: 'Selectors' }],
    },
    {
      id: 'layout',
      title: 'Layout Mastery',
      lessons: [{ id: 'l2', title: 'Flexbox' }],
    },
    {
      id: 'advanced',
      title: 'Advanced Styling',
      lessons: [{ id: 'l3', title: 'Variables' }],
    },
  ],
};

describe('challenge progression plan', () => {
  it('targets beginner challenges to the first course module', () => {
    const plan = getChallengeProgressionPlan({
      course,
      challenges: [{ id: 'challenge-1', title: 'Starter', difficulty: 'beginner' }],
    });

    expect(plan.recommended.targetModuleTitle).toBe('CSS Foundations');
    expect(plan.recommended.readinessLabel).toBe('Ready for practice');
  });

  it('uses explicit recommended module ids when present', () => {
    const plan = getChallengeProgressionPlan({
      course,
      challenges: [
        {
          id: 'challenge-2',
          title: 'Grid Project',
          difficulty: 'beginner',
          recommendedModuleId: 'layout',
        },
      ],
    });

    expect(plan.recommended.targetModuleTitle).toBe('Layout Mastery');
    expect(plan.recommended.readinessLabel).toMatch(/Best after Layout Mastery/i);
  });

  it('skips completed challenges when selecting the recommendation', () => {
    const plan = getChallengeProgressionPlan({
      course,
      completedChallengeIds: ['challenge-1'],
      challenges: [
        { id: 'challenge-1', title: 'Starter', difficulty: 'beginner' },
        { id: 'challenge-2', title: 'Next', difficulty: 'beginner' },
      ],
    });

    expect(plan.completedCount).toBe(1);
    expect(plan.recommended.id).toBe('challenge-2');
  });
});
