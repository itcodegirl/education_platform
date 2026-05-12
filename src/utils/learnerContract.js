export const FIRST_SESSION_STEPS = Object.freeze([
  'Read the goal and what you are building.',
  'Try the example and compare the result.',
  'Use Complete lesson to save reading progress.',
]);

export const LEARNING_EVIDENCE_STEPS = Object.freeze([
  {
    key: 'completion',
    label: 'Complete',
    detail: 'Completion saves reading progress. It does not claim mastery by itself.',
  },
  {
    key: 'quick-check',
    label: 'Quick check',
    detail: 'A quiz confirms what stuck while the lesson is still fresh.',
  },
  {
    key: 'review',
    label: 'Review',
    detail: 'Spaced review brings older ideas back before they fade.',
  },
  {
    key: 'apply',
    label: 'Apply',
    detail: 'A small challenge proves the skill in code.',
  },
]);

export function getMomentumGuidancePoints() {
  return [
    'If a quick check appears, use it to confirm what stuck.',
    'If review is due, clear the short queue before adding more new material.',
    'If everything is clear, try one small challenge to prove the skill.',
  ];
}
