import { describe, expect, it } from 'vitest';
import { getCoursePathway, getCourseReadiness } from './learningPath';

describe('learning path helpers', () => {
  it('returns explicit instructional roles for core courses', () => {
    expect(getCoursePathway('html')).toMatchObject({
      stage: 'Stage 1',
      role: 'Structure',
    });
    expect(getCoursePathway('react')).toMatchObject({
      stage: 'Stage 4',
      role: 'Product UI',
    });
  });

  it('labels a current empty course as the starting point', () => {
    expect(getCourseReadiness({
      courseId: 'html',
      doneLessons: 0,
      totalLessons: 12,
      isCurrent: true,
    })).toMatchObject({
      label: 'Start here',
      tone: 'current',
      percent: 0,
    });
  });

  it('asks for evidence when most lessons are complete but the course is not finished', () => {
    expect(getCourseReadiness({
      courseId: 'css',
      doneLessons: 9,
      totalLessons: 10,
      isCurrent: true,
    })).toMatchObject({
      label: 'Evidence due',
      tone: 'evidence',
      percent: 90,
    });
  });

  it('separates complete courses from motivational progress', () => {
    expect(getCourseReadiness({
      courseId: 'js',
      doneLessons: 10,
      totalLessons: 10,
    })).toMatchObject({
      label: 'Complete',
      tone: 'complete',
      nextAction: expect.stringMatching(/portfolio evidence/i),
    });
  });
});
