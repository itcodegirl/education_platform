import { describe, it, expect } from 'vitest';
import {
  APP_ROUTES,
  buildLearnPath,
  parseLearnPath,
  parsePublicProfilePath,
  toPathFromLegacyHash,
} from './routePaths';

describe('routePaths', () => {
  it('maps known legacy hash routes to path routes', () => {
    expect(toPathFromLegacyHash('#admin')).toBe(APP_ROUTES.admin);
    expect(toPathFromLegacyHash('#profile')).toBe(APP_ROUTES.profile);
    expect(toPathFromLegacyHash('#styleguide')).toBe(APP_ROUTES.styleguide);
  });

  it('maps legacy learn hashes into deep-link learn paths', () => {
    expect(toPathFromLegacyHash('#learn/html/basics/lesson-01')).toBe('/learn/html/basics/lesson-01');
  });

  it('parses learn paths into route ids', () => {
    expect(parseLearnPath('/learn/html/basics/lesson-01')).toEqual({
      courseId: 'html',
      moduleId: 'basics',
      lessonId: 'lesson-01',
    });
  });

  it('accepts valid public profile handles and rejects invalid ones', () => {
    expect(parsePublicProfilePath('/u/codeherway_dev')).toBe('codeherway_dev');
    expect(parsePublicProfilePath('/u/!bad-handle')).toBe(null);
  });

  it('builds quiz-aware lesson paths from ids', () => {
    const course = { id: 'react' };
    const moduleData = { id: 'hooks' };
    const lesson = { id: 'use-state' };

    expect(buildLearnPath(course, moduleData, lesson, false)).toBe('/learn/react/hooks/use-state');
    expect(buildLearnPath(course, moduleData, lesson, true)).toBe('/learn/react/hooks/quiz');
  });
});

