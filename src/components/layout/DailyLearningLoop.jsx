import { memo } from 'react';

export const DailyLearningLoop = memo(function DailyLearningLoop({
  steps,
  onOpenReview,
  onOpenChallenges,
  onAction,
}) {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  const hasReviewAction = typeof onOpenReview === 'function';
  const hasChallengesAction = typeof onOpenChallenges === 'function';

  const handleOpenReview = () => {
    if (!hasReviewAction) return;
    onAction?.('review');
    onOpenReview();
  };

  const handleOpenChallenges = () => {
    if (!hasChallengesAction) return;
    onAction?.('challenges');
    onOpenChallenges();
  };

  return (
    <section className="daily-loop" aria-label="Today's learning loop">
      <div className="daily-loop-head">
        <div>
          <p className="daily-loop-kicker">Today&apos;s learning loop</p>
          <h2 className="daily-loop-title">Keep progress useful</h2>
        </div>
        {(hasReviewAction || hasChallengesAction) && (
          <div className="daily-loop-actions">
            {hasReviewAction && (
              <button type="button" className="daily-loop-action" onClick={handleOpenReview}>
                Review
              </button>
            )}
            {hasChallengesAction && (
              <button type="button" className="daily-loop-action" onClick={handleOpenChallenges}>
                Challenges
              </button>
            )}
          </div>
        )}
      </div>
      <ol className="daily-loop-steps" aria-label="Learning flow steps">
        {steps.map((step) => (
          <li
            key={step.key}
            className={`daily-loop-step daily-loop-step-${step.tone}${step.isCurrent ? ' daily-loop-step-current' : ''}`}
            aria-current={step.isCurrent ? 'step' : undefined}
          >
            <span className="daily-loop-step-label">
              {step.label}
              {step.isCurrent && (
                <span className="daily-loop-step-current-label">Current</span>
              )}
            </span>
            <strong className="daily-loop-step-state">{step.state}</strong>
            <span className="daily-loop-step-detail">{step.detail}</span>
          </li>
        ))}
      </ol>
    </section>
  );
});
