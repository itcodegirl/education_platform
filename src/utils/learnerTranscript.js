function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getPercent(done, total) {
  const safeDone = Math.max(0, toNumber(done));
  const safeTotal = Math.max(0, toNumber(total));
  if (safeTotal === 0) return 0;
  return Math.min(100, Math.round((safeDone / safeTotal) * 100));
}

export function buildLearnerTranscriptSummary({
  completedLessons = 0,
  totalLessons = 0,
  quizChecksPassed = 0,
  quizChecksAttempted = 0,
  quizChecksNeedsReview = 0,
  completedChallenges = 0,
  totalChallenges = 0,
  dueReviewCards = 0,
  totalReviewCards = 0,
} = {}) {
  const readingDone = Math.max(0, toNumber(completedLessons));
  const readingTotal = Math.max(0, toNumber(totalLessons));
  const passedQuizzes = Math.max(0, toNumber(quizChecksPassed));
  const attemptedQuizzes = Math.max(0, toNumber(quizChecksAttempted));
  const reviewQuizzes = Math.max(0, toNumber(quizChecksNeedsReview));
  const challengeDone = Math.max(0, toNumber(completedChallenges));
  const challengeTotal = Math.max(0, toNumber(totalChallenges));
  const reviewDue = Math.max(0, toNumber(dueReviewCards));
  const reviewTotal = Math.max(0, toNumber(totalReviewCards));

  const proofSignals = passedQuizzes + challengeDone;
  const proofPercent = readingDone > 0
    ? Math.min(100, Math.round((proofSignals / readingDone) * 100))
    : 0;

  const status = getTranscriptStatus({
    readingDone,
    proofPercent,
    reviewDue,
    reviewQuizzes,
    challengeDone,
  });

  return {
    status,
    proofSignals,
    proofPercent,
    items: [
      {
        key: 'reading',
        label: 'Reading progress',
        value: `${readingDone}/${readingTotal}`,
        detail: `${getPercent(readingDone, readingTotal)}% of lessons marked complete.`,
        tone: readingDone > 0 ? 'complete' : 'empty',
      },
      {
        key: 'recall',
        label: 'Recall checks',
        value: `${passedQuizzes}/${attemptedQuizzes}`,
        detail: reviewQuizzes > 0
          ? `${reviewQuizzes} quiz check${reviewQuizzes === 1 ? '' : 's'} need review.`
          : 'Quiz checks at 80% or better count as recall evidence.',
        tone: attemptedQuizzes === 0 ? 'empty' : reviewQuizzes > 0 ? 'review' : 'complete',
      },
      {
        key: 'application',
        label: 'Application proof',
        value: challengeTotal > 0 ? `${challengeDone}/${challengeTotal}` : String(challengeDone),
        detail: challengeDone > 0
          ? 'Completed challenges show the skill in code.'
          : 'Add a challenge to prove the skill outside reading.',
        tone: challengeDone > 0 ? 'complete' : 'empty',
      },
      {
        key: 'review',
        label: 'Review health',
        value: `${reviewDue}/${reviewTotal}`,
        detail: reviewDue > 0
          ? `${reviewDue} review card${reviewDue === 1 ? '' : 's'} due now.`
          : 'No review cards are due right now.',
        tone: reviewDue > 0 ? 'review' : reviewTotal > 0 ? 'complete' : 'empty',
      },
    ],
  };
}

function getTranscriptStatus({
  readingDone,
  proofPercent,
  reviewDue,
  reviewQuizzes,
  challengeDone,
}) {
  if (readingDone === 0) {
    return {
      tone: 'empty',
      label: 'Transcript not started',
      detail: 'Complete one lesson first, then add recall or application evidence.',
    };
  }

  if (reviewDue > 0 || reviewQuizzes > 0) {
    return {
      tone: 'review',
      label: 'Review before adding more',
      detail: 'Some proof signals need another pass before this transcript looks steady.',
    };
  }

  if (proofPercent >= 80 && challengeDone > 0) {
    return {
      tone: 'strong',
      label: 'Strong learning proof',
      detail: 'Reading progress is backed by recall and applied challenge evidence.',
    };
  }

  return {
    tone: 'building',
    label: 'Proof is building',
    detail: 'Pair completed lessons with quick checks, review, and challenges.',
  };
}
