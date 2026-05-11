import { memo } from 'react';

export const DailyLearningLoop = memo(function DailyLearningLoop({
  steps,
  onOpenReview,
  onOpenChallenges,
}) {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  return (
    <section className="daily-loop" aria-label="Today's learning loop">
      <div className="daily-loop-head">
        <div>
          <p className="daily-loop-kicker">Today&apos;s learning loop</p>
          <h2 className="daily-loop-title">Keep progress useful</h2>
        </div>
        <div className="daily-loop-actions">
          <button type="button" className="daily-loop-action" onClick={onOpenReview}>
            Review
          </button>
          <button type="button" className="daily-loop-action" onClick={onOpenChallenges}>
            Challenges
          </button>
        </div>
      </div>
      <div className="daily-loop-steps">
        {steps.map((step) => (
          <div key={step.key} className={`daily-loop-step daily-loop-step-${step.tone}`}>
            <span className="daily-loop-step-label">{step.label}</span>
            <strong className="daily-loop-step-state">{step.state}</strong>
            <span className="daily-loop-step-detail">{step.detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
});
