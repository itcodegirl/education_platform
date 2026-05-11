import { describe, expect, it } from 'vitest';
import {
  getChallengeAnalyticsPayload,
  getLearningLoopActionPayload,
} from './learningAnalyticsPayloads';

describe('learning analytics payloads', () => {
  it('builds a compact learning loop action payload', () => {
    expect(getLearningLoopActionPayload({
      action: 'review',
      course: { id: 'html' },
      moduleData: { id: 'foundations' },
      lesson: { id: 'intro' },
      dueReviewCount: 2,
      isLessonDone: true,
      hasLessonQuiz: true,
      masteryStatus: { tone: 'review', isReady: false },
    })).toEqual({
      action: 'review',
      courseId: 'html',
      moduleId: 'foundations',
      lessonId: 'intro',
      dueReviewCount: 2,
      isLessonDone: true,
      hasLessonQuiz: true,
      masteryTone: 'review',
      masteryReady: false,
    });
  });

  it('builds a challenge payload without leaking source code', () => {
    expect(getChallengeAnalyticsPayload({
      courseId: 'css',
      source: 'recommendation',
      isCompleted: true,
      challenge: {
        id: 'css-ch-1',
        difficulty: 'beginner',
        readinessLabel: 'Ready for practice',
        targetModuleId: 'layout',
        requirements: ['Use grid'],
        tests: [{ label: 'uses grid' }],
        starter: '<div>code is not tracked</div>',
      },
    })).toEqual({
      courseId: 'css',
      challengeId: 'css-ch-1',
      difficulty: 'beginner',
      source: 'recommendation',
      readinessLabel: 'Ready for practice',
      targetModuleId: 'layout',
      isCompleted: true,
      requirementCount: 1,
      testCount: 1,
    });
  });
});
