// ═══════════════════════════════════════════════
// srAlgorithm — pure spaced-repetition scheduling.
//
// Variant of the classic SM-2 algorithm:
//   - On a correct answer, interval grows by `ease`,
//     and `ease` itself nudges up by 0.1 (capped at 3.0).
//   - On a wrong answer, the card is rescheduled to
//     tomorrow (interval = 1) and `ease` drops by 0.2
//     (floored at 1.3 so cards stay reviewable).
//
// Extracted from ProgressContext.updateSRCard so the
// math is unit-testable and the context callback is
// just state + persistence.
// ═══════════════════════════════════════════════

import { TIMING } from '../utils/helpers';

const EASE_MIN = 1.3;
const EASE_MAX = 3.0;
const EASE_BUMP_CORRECT = 0.1;
const EASE_PENALTY_WRONG = 0.2;
const WRONG_ANSWER_INTERVAL = 1;

// Returns the new (interval, ease, nextReview) for a card after
// the learner answers. Caller is responsible for merging this into
// the existing card and persisting; the function is pure (no I/O)
// so tests can drive thousands of correct/wrong sequences without
// any setup.
//
// `now` is parameterized so tests can pin the clock; defaults to
// Date.now() in production.
export function nextSRCardState({ card, correct, now = Date.now() }) {
  const ease = correct
    ? Math.min(card.ease + EASE_BUMP_CORRECT, EASE_MAX)
    : Math.max(card.ease - EASE_PENALTY_WRONG, EASE_MIN);

  const interval = correct
    ? Math.round(card.interval * card.ease)
    : WRONG_ANSWER_INTERVAL;

  // Wrong answers always reschedule for tomorrow regardless of the
  // card's current interval; correct answers grow by `card.ease`
  // (the BEFORE-update ease, matching SM-2's "use the prior ease as
  // the multiplier" convention).
  const nextReview = now + (correct ? interval : WRONG_ANSWER_INTERVAL) * TIMING.dayMs;

  return { interval, ease, nextReview };
}
