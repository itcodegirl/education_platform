import { memo } from 'react';

export const FirstRunGuide = memo(function FirstRunGuide({ learnerName }) {
  return (
    <section className="first-run-guide" aria-label="Getting started">
      <div className="frg-content">
        <p className="frg-kicker">First login</p>
        <h2 className="frg-title">
          Welcome to your learning path, {learnerName}.
        </h2>
        <p className="frg-copy">
          You are on the first lesson to set your pace. Read this lesson,
          complete it, then use <strong>Complete lesson</strong> to save this step.
        </p>
        <p className="frg-sub">Course switching is in the sidebar when you are ready.</p>
      </div>
      <ol className="frg-steps" aria-label="First session steps">
        <li>Read the learning frame.</li>
        <li>Build the example and check the result.</li>
        <li>Complete the lesson, then take the quick check.</li>
      </ol>
    </section>
  );
});

