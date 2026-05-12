import { lazy, Suspense, useState } from 'react';

const AITutor = lazy(() =>
  import('./AITutor').then((module) => ({ default: module.AITutor })),
);

export function DeferredAITutor(props) {
  const [shouldLoadTutor, setShouldLoadTutor] = useState(false);

  if (shouldLoadTutor) {
    return (
      <Suspense
        fallback={(
          <div className="ai-tutor ai-tutor-loading" role="status" aria-live="polite">
            Opening AI Tutor...
          </div>
        )}
      >
        <AITutor {...props} initialOpen />
      </Suspense>
    );
  }

  return (
    <div className="ai-tutor">
      <button
        type="button"
        className="ai-tutor-toggle"
        onClick={() => setShouldLoadTutor(true)}
        aria-expanded="false"
      >
        <span className="ai-tutor-icon" aria-hidden="true">AI</span>
        <span className="ai-tutor-label">AI Tutor</span>
        <span className="ai-tutor-hint">Ask about this lesson</span>
        <span className="ai-tutor-arrow" aria-hidden="true">&gt;</span>
      </button>
    </div>
  );
}
