import { describe, expect, it } from 'vitest';
import {
  normalizeReviewCardLearningContext,
  summarizeModuleMasteryEvidence,
} from './moduleMasteryEvidence';

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
  it('normalizes review-card learning context across old and new field names', () => {
    expect(normalizeReviewCardLearningContext({
      quiz_key: 'l:html:l1',
      question_id: 'q1',
    })).toMatchObject({
      quizKey: 'l:html:l1',
      quizType: 'lesson',
      courseId: 'html',
      lessonId: 'l1',
      questionId: 'q1',
    });

    expect(normalizeReviewCardLearningContext({
      course_id: 'html',
      module_id: 'm1',
      lesson_key: 'c:html|m:m1|l:l1',
    })).toMatchObject({
      courseId: 'html',
      moduleId: 'm1',
      lessonKey: 'c:html|m:m1|l:l1',
    });
  });

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
      remediationTarget: {
        lessonId: 'l1',
        label: 'Review lesson: Elements',
      },
    });
  });

  it('maps due review cards that only have legacy lesson metadata', () => {
    const result = summarizeModuleMasteryEvidence({
      courses: COURSES,
      completedSet: new Set(['c:html|m:m1|l:l1']),
      quizResults: [{ key: 'l:html:l1', percent: 100 }],
      challengeCompletions: ['challenge-1'],
      getChallengesForCourse,
      srCards: [
        { course_id: 'html', lesson_id: 'l1', nextReview: 0 },
        { lessonKey: 'c:html|m:m2|l:l2', nextReview: 0 },
      ],
      now: 1000,
    });

    const foundations = result.modules.find((moduleEvidence) =>
      moduleEvidence.moduleId === 'm1',
    );
    const structure = result.modules.find((moduleEvidence) =>
      moduleEvidence.moduleId === 'm2',
    );

    expect(foundations).toMatchObject({
      statusLabel: 'Review evidence due',
      reviewDue: 1,
    });
    expect(structure).toMatchObject({
      reviewDue: 1,
    });
    expect(result.reviewFocusModules.map((moduleEvidence) => moduleEvidence.moduleId)).toEqual(['m1', 'm2']);
  });

  it('does not map legacy review cards across an explicit wrong course', () => {
    const result = summarizeModuleMasteryEvidence({
      courses: COURSES,
      completedSet: new Set(['c:html|m:m1|l:l1']),
      quizResults: [{ key: 'l:html:l1', percent: 100 }],
      challengeCompletions: ['challenge-1'],
      getChallengesForCourse,
      srCards: [{ courseId: 'css', lessonId: 'l1', nextReview: 0 }],
      now: 1000,
    });

    expect(result.modules.find((moduleEvidence) => moduleEvidence.moduleId === 'm1')).toMatchObject({
      reviewDue: 0,
      statusLabel: 'Ready to advance',
    });
  });

  it('does not map bare module ids across courses when module ids are reused', () => {
    const duplicateModuleCourses = [
      {
        id: 'js',
        label: 'JS',
        accent: '#ffa726',
        modules: [{ id: 301, title: 'JavaScript Basics', lessons: [{ id: 'js-l1', title: 'Buttons' }] }],
      },
      {
        id: 'react',
        label: 'React',
        accent: '#61dafb',
        modules: [{ id: 301, title: 'React Basics', lessons: [{ id: 'react-l1', title: 'State' }] }],
      },
    ];

    const result = summarizeModuleMasteryEvidence({
      courses: duplicateModuleCourses,
      completedSet: new Set(),
      quizResults: [],
      challengeCompletions: [],
      getChallengesForCourse: () => [],
      srCards: [{ module_id: '301', nextReview: 0 }],
      now: 1000,
    });

    expect(result.modules.every((moduleEvidence) => moduleEvidence.reviewDue === 0)).toBe(true);
  });

  it('maps stable module quiz keys to numeric module ids within the matching course', () => {
    const result = summarizeModuleMasteryEvidence({
      courses: [
        {
          id: 'js',
          label: 'JS',
          accent: '#ffa726',
          modules: [{ id: 301, title: 'JavaScript Basics', lessons: [{ id: 'js-l1', title: 'Buttons' }] }],
        },
      ],
      completedSet: new Set(),
      quizResults: [{ key: 'm:js:301', percent: 60 }],
      challengeCompletions: [],
      getChallengesForCourse: () => [],
      srCards: [{ quizKey: 'm:js:301', nextReview: 0 }],
      now: 1000,
    });

    expect(result.modules[0]).toMatchObject({
      quizAttempted: 1,
      reviewDue: 1,
      statusLabel: 'Review evidence due',
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

  it('points weak checks to the prerequisite lesson when one exists', () => {
    const result = summarizeModuleMasteryEvidence({
      courses: [
        {
          id: 'html',
          label: 'HTML',
          accent: '#4ecdc4',
          modules: [
            {
              id: 'm1',
              title: 'Foundations',
              lessons: [{ id: 'intro', title: 'HTML Intro' }],
            },
            {
              id: 'm2',
              title: 'Forms',
              lessons: [{ id: 'forms', title: 'Form Labels', prereqs: ['intro'] }],
            },
          ],
        },
      ],
      completedSet: new Set(['c:html|m:m2|l:forms']),
      quizResults: [{ key: 'l:html:forms', percent: 50 }],
      challengeCompletions: [],
      getChallengesForCourse: () => [],
      srCards: [],
      now: 1000,
    });

    expect(result.focusModules[0]).toMatchObject({
      moduleTitle: 'Forms',
      statusLabel: 'Review evidence due',
      remediationTarget: {
        lessonId: 'intro',
        label: 'Review prerequisite: HTML Intro',
        detail: 'Then retry Form Labels so the weak check has a stronger base.',
      },
    });
  });
});
