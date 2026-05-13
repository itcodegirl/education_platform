function firstNonEmpty(items) {
  return items.find((item) => typeof item === 'string' && item.trim())?.trim() || '';
}

function getRequirement(lesson) {
  if (Array.isArray(lesson?.challenge?.requirements)) {
    return firstNonEmpty(lesson.challenge.requirements);
  }

  if (Array.isArray(lesson?.tasks)) {
    return firstNonEmpty(lesson.tasks);
  }

  if (typeof lesson?.challenge === 'string') {
    return lesson.challenge.trim();
  }

  return '';
}

function buildTransitionPrompt(lesson) {
  const capability = firstNonEmpty(lesson?.summary?.capabilities || []);
  const proof = lesson?.do?.proofRequired || lesson?.proofRequired || '';
  const requirement = getRequirement(lesson);
  const bridge = lesson?.bridge?.preview || '';

  if (!capability && !proof && !requirement && !bridge) return null;

  return {
    recall: capability
      ? `Explain this without looking: ${capability}.`
      : 'Explain the main idea in one sentence before opening the next lesson.',
    apply: proof
      ? `Use your proof of work as evidence: ${proof}.`
      : requirement
        ? `Redo one requirement without looking: ${requirement}.`
        : 'Change one small detail in your code and predict the result before running it.',
    bridge,
  };
}

export function LessonTransitionPrompt({ lesson }) {
  const prompt = buildTransitionPrompt(lesson);
  if (!prompt) return null;

  return (
    <div className="lesson-transition" role="note" aria-label="Lesson transition practice">
      <div className="lesson-transition-label">Before moving on</div>
      <div className="lesson-transition-grid">
        <div className="lesson-transition-step">
          <span className="lesson-transition-step-label">Recall</span>
          <p>{prompt.recall}</p>
        </div>
        <div className="lesson-transition-step">
          <span className="lesson-transition-step-label">Apply</span>
          <p>{prompt.apply}</p>
        </div>
        {prompt.bridge && (
          <div className="lesson-transition-step">
            <span className="lesson-transition-step-label">Next</span>
            <p>{prompt.bridge}</p>
          </div>
        )}
      </div>
    </div>
  );
}
