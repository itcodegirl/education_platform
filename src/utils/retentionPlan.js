export function getRetentionPlan({
  isLessonDone = false,
  hasLessonQuiz = false,
  masteryStatus = null,
  dueReviewCount = 0,
} = {}) {
  const reviewCount = Math.max(0, Number.isFinite(Number(dueReviewCount)) ? Number(dueReviewCount) : 0);
  const quizReady = masteryStatus?.isReady === true;
  const needsQuizReview = masteryStatus?.tone === 'review' || masteryStatus?.tone === 'attention';

  if (!isLessonDone) {
    return {
      state: 'After lesson',
      detail: 'First read and build. Retention starts after the idea has something to attach to.',
      tone: 'neutral',
      isRecallCurrent: false,
      reviewDetail: 'Review cards are most useful after a first attempt.',
    };
  }

  if (hasLessonQuiz && needsQuizReview) {
    return {
      state: 'Explain miss',
      detail: 'Use the missed explanation to name the rule in your own words before retrying.',
      tone: 'attention',
      isRecallCurrent: false,
      reviewDetail: 'Missed quiz items should come back later as spaced review.',
    };
  }

  if (reviewCount > 0) {
    return {
      state: 'Review first',
      detail: 'Clear a short review burst before adding more new material.',
      tone: 'attention',
      isRecallCurrent: false,
      reviewDetail: 'A short review burst protects older skills while you keep moving.',
    };
  }

  if (hasLessonQuiz && quizReady) {
    return {
      state: '1-minute recall',
      detail: 'Close the lesson and explain the main idea from memory before the next build.',
      tone: 'active',
      isRecallCurrent: true,
      reviewDetail: 'No cards are due. A quick memory check keeps the score honest.',
    };
  }

  return {
    state: 'Make it stick',
    detail: 'Write one note, explain one idea, or change the example once without looking.',
    tone: 'neutral',
    isRecallCurrent: false,
    reviewDetail: 'No review cards need attention right now.',
  };
}
