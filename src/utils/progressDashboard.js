import { getDashboardReadiness } from './learnerReadiness';

export function getProgressSnapshotItems({
  totalDone = 0,
  totalLessons = 0,
  masteryEvidence = {},
  srDue = 0,
} = {}) {
  const reviewDue = Math.max(0, Number(srDue) || 0);
  const readiness = getDashboardReadiness({
    totalDone,
    masteryEvidence,
    srDue: reviewDue,
  });

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
      key: 'readiness',
      label: 'Current state',
      value: readiness.label,
      detail: readiness.detail,
      tone: readiness.tone,
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
