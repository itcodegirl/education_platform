import { memo } from 'react';
import { FIRST_SESSION_STEPS } from '../../utils/learnerContract';

export const FirstRunGuide = memo(function FirstRunGuide({ learnerName, courseLabel }) {
  return (
    <section className="first-run-guide" aria-label="Getting started">
      <div className="frg-content">
        <p className="frg-kicker">Start here</p>
        <h2 className="frg-title">
          {learnerName ? `Start with this lesson, ${learnerName}.` : 'Start with this lesson.'}
        </h2>
        {courseLabel && (
          <p className="frg-course">
            You&apos;re at the beginning of <strong>{courseLabel}</strong> — one lesson at a time, in order.
          </p>
        )}
        <p className="frg-copy">
          Read the frame, try the build, then press <strong>Complete lesson</strong>.
          That saves reading progress and points you to what comes next.
        </p>
        <p className="frg-sub">Leave the tools for later unless something blocks you.</p>
      </div>
      <ol className="frg-steps" aria-label="First session steps">
        {FIRST_SESSION_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
});
