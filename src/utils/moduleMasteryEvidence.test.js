import { describe, expect, it } from 'vitest';
import { summarizeModuleMasteryEvidence } from './moduleMasteryEvidence';

const COURSES = [
  {
    id: 'html',
    label: 'HTML',
    accent: '#4ecdc4',
    modules: [
      {
        id: 'm1',
        title: 'Foundations',
        lessons: [{ id: 'l1', title: 'Elements' }],
      },
      {
        id: 'm2',
        title: 'Structure',
        lessons: [{ id: 'l2', title: 'Landmarks' }],
      },
    ],
  },
];

const getChallengesForCourse = () => [
  { id: 'challenge-1', title: 'Build a page', difficulty: 'beginner' },
  { id: 'challenge-2', title: 'Structure a layout', difficulty: 'advanced' },
];

describe('summarizeModuleMasteryEvidence', () => {
  it('marks completed modules with quiz and challenge proof as evidence ready', () => {
    const result = summarizeModuleMasteryEvidence({
      courses: COURSES,
      completedSet: new Set(['c:html|m:m1|l:l1']),
      quizResults: [{ key: 'l:html:l1', percent: 100 }],
      challengeCompletions: ['challenge-1'],
      getChallengesForCourse,
      srCards: [],
      now: 1000,
    });

    expect(result.modulesWithEvidence).toBe(1);
    expect(result.modulesReadyToAdvance).toBe(1);
    expect(result.focusModules[0]).toMatchObject({
      moduleTitle: 'Foundations',
      statusLabel: 'Ready to advance',
      readyToAdvance: true,
      lessonPercent: 100,
      quizPassed: 1,
      challengeDone: 1,
    });
  });

  it('prioritizes due review cards that carry quiz identity', () => {
    const result = summarizeModuleMasteryEvidence({
      courses: COURSES,
      completedSet: new Set(['c:html|m:m1|l:l1']),
      quizResults: [{ key: 'l:html:l1', percent: 60 }],
      challengeCompletions: [],
      getChallengesForCourse,
      srCards: [{ quizKey: 'l:html:l1', nextReview: 0 }],
      now: 1000,
    });

    expect(result.modulesNeedingReview).toBe(1);
    expect(result.focusModules[0]).toMatchObject({
      moduleTitle: 'Foundations',
      statusLabel: 'Review evidence due',
      readyToAdvance: false,
      reviewDue: 1,
      quizNeedsReview: 1,
    });
  });

  it('flags completed lessons without quiz proof as needing a quick check', () => {
    const result = summarizeModuleMasteryEvidence({
      courses: COURSES,
      completedSet: new Set(['c:html|m:m2|l:l2']),
      quizResults: [],
      challengeCompletions: [],
      getChallengesForCourse,
      srCards: [],
      now: 1000,
    });

    expect(result.focusModules[0]).toMatchObject({
      moduleTitle: 'Structure',
      statusLabel: 'Needs quick-check proof',
      nextAction: 'Pass a quick check before treating this module as ready.',
      readyToAdvance: false,
    });
  });

  it('flags passing quiz proof without available challenge proof as needing applied evidence', () => {
    const result = summarizeModuleMasteryEvidence({
      courses: COURSES,
      completedSet: new Set(['c:html|m:m2|l:l2']),
      quizResults: [{ key: 'l:html:l2', percent: 90 }],
      challengeCompletions: [],
      getChallengesForCourse,
      srCards: [],
      now: 1000,
    });

    expect(result.focusModules[0]).toMatchObject({
      moduleTitle: 'Structure',
      statusLabel: 'Needs applied evidence',
      nextAction: 'Finish one applied challenge before advancing.',
      readyToAdvance: false,
    });
  });

  it('does not treat lesson completion and challenge work as ready without passing quiz proof', () => {
    const result = summarizeModuleMasteryEvidence({
      courses: COURSES,
      completedSet: new Set(['c:html|m:m1|l:l1']),
      quizResults: [],
      challengeCompletions: ['challenge-1'],
      getChallengesForCourse,
      srCards: [],
      now: 1000,
    });

    expect(result.modulesReadyToAdvance).toBe(0);
    expect(result.focusModules[0]).toMatchObject({
      moduleTitle: 'Foundations',
      statusLabel: 'Needs quick-check proof',
      readinessDetail: 'A completed lesson still needs quiz evidence at 80% or better.',
    });
  });
});
