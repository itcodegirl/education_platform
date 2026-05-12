function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getReviewTime(card) {
  const raw = card?.nextReview ?? card?.next_review;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return numeric;

  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function plural(count, singular, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`;
}

export function buildRetentionSignalSummary({
  quizResults = [],
  srCards = [],
  reviewFocusModules = [],
  now = Date.now(),
} = {}) {
  const dueReviewCards = srCards.filter((card) => getReviewTime(card) <= now).length;
  const scheduledReviewCards = Math.max(0, srCards.length - dueReviewCards);
  const weakQuizChecks = quizResults.filter((result) => toNumber(result?.percent, 100) < 80).length;
  const moduleFocusCount = Array.isArray(reviewFocusModules) ? reviewFocusModules.length : 0;

  let status = {
    tone: 'empty',
    label: 'No retention loop yet',
    detail: 'Missed checks and review cards will create a retention loop after the learner practices.',
  };

  if (dueReviewCards > 0) {
    status = {
      tone: 'due',
      label: 'Review due now',
      detail: `Clear ${plural(dueReviewCards, 'due card')} before adding much new material.`,
    };
  } else if (weakQuizChecks > 0) {
    status = {
      tone: 'weak',
      label: 'Weak checks need retry',
      detail: `Retry ${plural(weakQuizChecks, 'weak check')} so missed ideas turn into usable recall.`,
    };
  } else if (scheduledReviewCards > 0) {
    status = {
      tone: 'scheduled',
      label: 'Spacing is active',
      detail: `${plural(scheduledReviewCards, 'card')} scheduled for later. Let the delay do its job.`,
    };
  }

  return {
    ...status,
    metrics: [
      {
        key: 'due',
        label: 'Due now',
        value: String(dueReviewCards),
      },
      {
        key: 'scheduled',
        label: 'Scheduled later',
        value: String(scheduledReviewCards),
      },
      {
        key: 'weak',
        label: 'Weak checks',
        value: String(weakQuizChecks),
      },
      {
        key: 'modules',
        label: 'Module focus',
        value: String(moduleFocusCount),
      },
    ],
  };
}
