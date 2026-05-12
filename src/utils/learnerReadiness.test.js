import { describe, expect, it } from 'vitest';
import {
  LEARNER_READINESS_STATES,
  getDashboardReadiness,
  getLearnerReadinessLabel,
  getLessonReadiness,
  getModuleReadiness,
} from './learnerReadiness';

describe('learner readiness helpers', () => {
  it('maps readiness ids to learner-facing labels', () => {
    expect(getLearnerReadinessLabel(LEARNER_READINESS_STATES.NOT_STARTED)).toBe('Not started');
    expect(getLearnerReadinessLabel(LEARNER_READINESS_STATES.READY_TO_CONTINUE)).toBe('Ready to continue');
  });

  it('keeps unfinished lessons in reading-in-progress state', () => {
    expect(
      getLessonReadiness({ hasLessonQuiz: true, isLessonDone: false }),
    ).toMatchObject({
      state: LEARNER_READINESS_STATES.READING_IN_PROGRESS,
      label: 'Reading in progress',
      parsedScore: null,
    });
  });

  it('marks saved lessons without a passing quick check as evidence needed', () => {
    expect(
      getLessonReadiness({ hasLessonQuiz: true, isLessonDone: true }),
    ).toMatchObject({
      state: LEARNER_READINESS_STATES.EVIDENCE_NEEDED,
      label: 'Evidence needed',
    });
  });

  it('marks weaker quick checks as review needed', () => {
    expect(
      getLessonReadiness({ hasLessonQuiz: true, isLessonDone: true, scoreValue: '2/5' }),
    ).toMatchObject({
      state: LEARNER_READINESS_STATES.REVIEW_NEEDED,
      label: 'Review needed',
      parsedScore: expect.objectContaining({ pct: 40 }),
    });
  });

  it('marks strong quick checks as ready to continue', () => {
    expect(
      getLessonReadiness({ hasLessonQuiz: true, isLessonDone: true, scoreValue: '4/5' }),
    ).toMatchObject({
      state: LEARNER_READINESS_STATES.READY_TO_CONTINUE,
      label: 'Ready to continue',
      parsedScore: expect.objectContaining({ pct: 80 }),
    });
  });

  it('keeps the dashboard calm for brand-new learners', () => {
    expect(
      getDashboardReadiness({ totalDone: 0 }),
    ).toMatchObject({
      state: LEARNER_READINESS_STATES.NOT_STARTED,
      label: 'Not started',
      tone: 'quiet',
    });
  });

  it('escalates the dashboard to review needed when weak checks or cards are due', () => {
    expect(
      getDashboardReadiness({
        totalDone: 3,
        masteryEvidence: { quizChecksNeedsReview: 1 },
        srDue: 0,
      }),
    ).toMatchObject({
      state: LEARNER_READINESS_STATES.REVIEW_NEEDED,
      label: 'Review needed',
      tone: 'attention',
    });
  });

  it('shows ready to continue when evidence and progress are aligned', () => {
    expect(
      getDashboardReadiness({
        totalDone: 3,
        masteryEvidence: { quizChecksPassed: 2, completedChallenges: 1 },
        srDue: 0,
      }),
    ).toMatchObject({
      state: LEARNER_READINESS_STATES.READY_TO_CONTINUE,
      label: 'Ready to continue',
      tone: 'ready',
    });
  });

  it('keeps the current module in reading-in-progress before saved lessons', () => {
    expect(
      getModuleReadiness({ completedLessons: 0, totalLessons: 3, isCurrentModule: true }),
    ).toMatchObject({
      state: LEARNER_READINESS_STATES.READING_IN_PROGRESS,
      label: 'Reading in progress',
      tone: 'active',
      isComplete: false,
    });
  });

  it('marks partially completed modules as evidence needed', () => {
    expect(
      getModuleReadiness({ completedLessons: 1, totalLessons: 3 }),
    ).toMatchObject({
      state: LEARNER_READINESS_STATES.EVIDENCE_NEEDED,
      label: 'Evidence needed',
      tone: 'attention',
      isComplete: false,
    });
  });

  it('marks completed modules as ready to continue', () => {
    expect(
      getModuleReadiness({ completedLessons: 3, totalLessons: 3 }),
    ).toMatchObject({
      state: LEARNER_READINESS_STATES.READY_TO_CONTINUE,
      label: 'Ready to continue',
      tone: 'ready',
      isComplete: true,
    });
  });
});
