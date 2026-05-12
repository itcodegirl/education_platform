export function getProgressSnapshotItems({
  totalDone = 0,
  totalLessons = 0,
  quizzesTaken = 0,
  masteryEvidence = {},
  srDue = 0,
} = {}) {
  const checksPassed = Number(masteryEvidence.quizChecksPassed || 0);
  const checksAttempted = Number(masteryEvidence.quizChecksAttempted || 0);
  const reviewDue = Math.max(0, Number(srDue) || 0);

  return [
    {
      key: 'lessons',
      label: 'Lessons saved',
      value: `${totalDone}/${totalLessons}`,
      detail: totalDone > 0
        ? 'Reading progress has a clear trail.'
        : 'Complete one lesson to start the trail.',
      tone: totalDone > 0 ? 'ready' : 'quiet',
    },
    {
      key: 'mastery',
      label: 'Mastery checks',
      value: checksAttempted > 0 ? `${checksPassed}/${checksAttempted}` : 'Not yet',
      detail: quizzesTaken > 0
        ? 'Quiz evidence is separate from practice XP.'
        : 'Quick checks will appear after lesson practice.',
      tone: checksAttempted > 0 && checksPassed === checksAttempted ? 'ready' : 'quiet',
    },
    {
      key: 'review',
      label: 'Review due',
      value: reviewDue > 0 ? String(reviewDue) : 'Clear',
      detail: reviewDue > 0
        ? 'Clear this before adding much new material.'
        : 'No spaced review needs attention right now.',
      tone: reviewDue > 0 ? 'attention' : 'ready',
    },
  ];
}
