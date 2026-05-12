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
      challenges: [{
        id: 'challenge-1',
        title: 'Starter',
        difficulty: 'beginner',
        requirements: ['Use a selector'],
        tests: [{ label: 'selector' }, { label: 'style' }],
      }],
    });

    expect(plan.recommended.targetModuleTitle).toBe('CSS Foundations');
    expect(plan.recommended.readinessLabel).toBe('Ready for practice');
    expect(plan.recommended.evidenceLabel).toBe('1 requirement backed by 2 checks');
    expect(plan.recommended.readinessReasons).toContain('Good starter practice for this course');
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
    expect(plan.recommended.nextPracticeStep).toMatch(/practice, not guessing/i);
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

  it('shows completed challenges as refactor or portfolio evidence opportunities', () => {
    const plan = getChallengeProgressionPlan({
      course,
      completedChallengeIds: ['challenge-1'],
      challenges: [
        {
          id: 'challenge-1',
          title: 'Starter',
          difficulty: 'beginner',
          requirements: ['Use flex'],
          tests: [{ label: 'flex' }],
        },
      ],
    });

    expect(plan.challenges[0].readinessReasons).toEqual([
      'Completed in this browser',
      '1 requirement backed by 1 check',
    ]);
    expect(plan.challenges[0].nextPracticeStep).toMatch(/portfolio note/i);
  });
});
