function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function getQuizResultFeedback({ pct = 0, wrongCount = 0, total = 0 } = {}) {
  const safePct = Number.isFinite(Number(pct)) ? Number(pct) : 0;
  const safeWrongCount = Math.max(0, Number.isFinite(Number(wrongCount)) ? Number(wrongCount) : 0);
  const safeTotal = Math.max(0, Number.isFinite(Number(total)) ? Number(total) : 0);
  const missedCopy = pluralize(safeWrongCount, 'missed question');
  const hasMisses = safeWrongCount > 0;

  if (safeTotal === 0) {
    return {
      label: 'No score available',
      meaning: 'This quiz has no questions, so it cannot produce a learning signal yet.',
      actions: ['Return to the lesson or choose another checkpoint.'],
    };
  }

  if (safePct === 100) {
    return {
      label: 'Confident for now',
      meaning: 'Full marks this round. That is a good sign the idea is fresh — a quick recap locks it in.',
      actions: [
        'Explain one answer out loud before moving on.',
        'Try an applied challenge if one is available for this course.',
        'No review cards were added from this attempt.',
      ],
    };
  }

  if (safePct >= 80) {
    return {
      label: 'Almost — one review pass',
      meaning: `You got most of this, with ${missedCopy}. The miss is where the learning is.`,
      actions: [
        'Review the missed explanation before continuing.',
        'Retry only after you can explain why the correction is true.',
        hasMisses
          ? 'The missed item was added to spaced review for a later rep.'
          : 'No review cards were added from this attempt.',
      ],
    };
  }

  if (safePct >= 60) {
    return {
      label: 'Partial — review the misses',
      meaning: `This is a partial signal: ${missedCopy} still needs attention.`,
      actions: [
        'Reread the lesson frame and the explanations for missed questions.',
        'Retry after changing one answer from memory, not by guessing.',
        hasMisses
          ? 'Missed items were added to spaced review so they come back later.'
          : 'No review cards were added from this attempt.',
      ],
    };
  }

  return {
    label: 'Rebuild the basics first',
    meaning: `This result says the concept is not stable yet: ${missedCopy} missed.`,
    actions: [
      'Pause here and rebuild the lesson example before retrying.',
      'Use the explanations to name what each wrong answer was testing.',
      hasMisses
        ? 'Missed items were added to spaced review; clear those before rushing ahead.'
        : 'No review cards were added from this attempt.',
    ],
  };
}
