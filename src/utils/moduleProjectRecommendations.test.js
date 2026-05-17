import { describe, expect, it } from 'vitest';
import {
  getModuleProjectRecommendations,
  getProjectEvidenceLabel,
} from './moduleProjectRecommendations';

describe('moduleProjectRecommendations', () => {
  it('returns challenges explicitly mapped to the active module', () => {
    const recommendations = getModuleProjectRecommendations({
      moduleId: 'forms',
      challenges: [
        {
          id: 'wrong',
          title: 'Other Project',
          recommendedModuleId: 'routing',
          requirements: ['Use links'],
        },
        {
          id: 'right',
          title: 'Signup Project',
          recommendedModuleId: 'forms',
          requirements: ['Validate email', 'Show errors'],
          tests: [{ label: 'email check' }],
        },
      ],
    });

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0]).toMatchObject({
      id: 'right',
      evidenceLabel: '2 requirements / 1 check',
    });
  });

  it('limits the number of module recommendations', () => {
    const recommendations = getModuleProjectRecommendations({
      moduleId: 'basics',
      limit: 1,
      challenges: [
        { id: 'first', recommendedModuleId: 'basics' },
        { id: 'second', recommendedModuleId: 'basics' },
      ],
    });

    expect(recommendations.map((challenge) => challenge.id)).toEqual(['first']);
  });

  it('describes evidence even when a challenge has only one signal type', () => {
    expect(getProjectEvidenceLabel({ requirements: ['Build a hero'] })).toBe('1 requirement');
    expect(getProjectEvidenceLabel({ tests: [{ label: 'renders hero' }, { label: 'has CTA' }] })).toBe('2 checks');
    expect(getProjectEvidenceLabel({})).toBe('Practice evidence');
  });
});
