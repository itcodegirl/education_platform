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
  const currentStep = steps.find((step) => step.isCurrent) || steps[0];
  const currentAction = getCurrentAction({
    currentStep,
    hasReviewAction,
    hasChallengesAction,
    handleOpenReview,
    handleOpenChallenges,
  });

  return (
    <section className="daily-loop" aria-label="Today's learning loop">
      <div className="daily-loop-head">
        <div>
          <p className="daily-loop-kicker">Learning path</p>
          <h2 className="daily-loop-title">One next honest step</h2>
        </div>
      </div>
      <div className={`daily-loop-current daily-loop-current-${currentStep.tone}`}>
        <span className="daily-loop-current-label">Current focus</span>
        <strong className="daily-loop-current-state">
          {currentStep.label}: {currentStep.state}
        </strong>
        <span className="daily-loop-current-detail">{currentStep.detail}</span>
        {currentAction && (
          <button type="button" className="daily-loop-action" onClick={currentAction.onClick}>
            {currentAction.label}
          </button>
        )}
      </div>
      <ol className="daily-loop-steps" aria-label="Learning path overview">
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

function getCurrentAction({
  currentStep,
  hasReviewAction,
  hasChallengesAction,
  handleOpenReview,
  handleOpenChallenges,
}) {
  if (currentStep?.key === 'review' && hasReviewAction) {
    return { label: 'Open review queue', onClick: handleOpenReview };
  }

  if (currentStep?.key === 'apply' && hasChallengesAction) {
    return { label: 'Open challenges', onClick: handleOpenChallenges };
  }

  return null;
}
