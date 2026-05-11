export function getReviewLoadSummary({ dueCount = 0, totalCount = 0 } = {}) {
  const due = Math.max(0, Number.isFinite(Number(dueCount)) ? Number(dueCount) : 0);
  const total = Math.max(0, Number.isFinite(Number(totalCount)) ? Number(totalCount) : 0);
  const scheduledLater = Math.max(0, total - due);
  const sessionTarget = due > 0 ? Math.min(due, 5) : 0;

  if (due > 0) {
    return {
      tone: 'due',
      title: `${due} due now`,
      detail: `Do ${sessionTarget} card${sessionTarget === 1 ? '' : 's'} in this burst, then return to the lesson.`,
      scheduledLater,
      sessionTarget,
    };
  }

  if (scheduledLater > 0) {
    return {
      tone: 'scheduled',
      title: 'Nothing due now',
      detail: `${scheduledLater} card${scheduledLater === 1 ? '' : 's'} scheduled for later. Let spacing do its job.`,
      scheduledLater,
      sessionTarget,
    };
  }

  return {
    tone: 'empty',
    title: 'No review load yet',
    detail: 'Missed quiz questions and generated cards will appear here for spaced practice.',
    scheduledLater,
    sessionTarget,
  };
}
