import { memo } from 'react';

export const ResumeNextPanel = memo(function ResumeNextPanel({
  recommendation,
  onAction,
}) {
  if (!recommendation) return null;

  return (
    <section
      className={`resume-next resume-next-${recommendation.type}`}
      aria-label="Recommended next step"
      aria-live="polite"
    >
      <div className="resume-next-copy">
        <p className="resume-next-kicker">{recommendation.eyebrow}</p>
        <h2 className="resume-next-title">{recommendation.title}</h2>
        <p className="resume-next-detail">{recommendation.detail}</p>
      </div>
      <button
        type="button"
        className="resume-next-action"
        onClick={() => onAction?.(recommendation)}
      >
        {recommendation.cta}
      </button>
    </section>
  );
});
