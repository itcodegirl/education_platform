import { memo } from 'react';

export const FirstRunGuide = memo(function FirstRunGuide({ learnerName }) {
  return (
    <section className="first-run-guide" aria-label="Getting started">
      <div className="frg-content">
        <p className="frg-kicker">Start here</p>
        <h2 className="frg-title">
          {learnerName ? `Start with this lesson, ${learnerName}.` : 'Start with this lesson.'}
        </h2>
        <p className="frg-copy">
          Read the frame, try the build, then press <strong>Complete lesson</strong>.
          That saves this step and points you to what comes next.
        </p>
        <p className="frg-sub">Leave the tools for later unless something blocks you.</p>
      </div>
      <ol className="frg-steps" aria-label="First session steps">
        <li>Read the goal.</li>
        <li>Try the example.</li>
        <li>Save reading progress with Complete lesson.</li>
      </ol>
    </section>
  );
});

