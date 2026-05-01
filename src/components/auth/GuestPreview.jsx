import { useEffect, useMemo } from 'react';
import { COURSES } from '../../data';
import { useCourseContent } from '../../providers';
import { renderMarkdown } from '../../utils/markdown';
import { CodePreview } from '../learning/CodePreview';

export function GuestPreview({ onBack }) {
  // HTML is lazy-loaded. CourseContentProvider auto-fetches the default active
  // course on mount, so this is usually a no-op by the time a guest clicks
  // "preview a lesson", but we still show a short state while it loads.
  const { ensureLoaded, isCourseLoaded } = useCourseContent();
  useEffect(() => {
    ensureLoaded('html');
  }, [ensureLoaded]);

  const htmlReady = isCourseLoaded('html');
  const course = COURSES[0];
  const firstModule = htmlReady ? course.modules[0] : null;
  const firstLesson = firstModule?.lessons?.[0] || null;
  const totalLessons = useMemo(
    () =>
      COURSES.reduce((sum, currentCourse) => sum + currentCourse.modules.reduce(
        (moduleSum, module) => moduleSum + module.lessons.length,
        0,
      ), 0),
    [],
  );

  if (!htmlReady || !firstLesson) {
    return (
      <main className="guest-preview guest-preview-loading" aria-live="polite" role="status">
        <p>Loading lesson preview...</p>
      </main>
    );
  }

  return (
    <main className="guest-preview">
      <div className="gp-topbar">
        <button
          type="button"
          className="gp-back ui-btn ui-btn-secondary ui-btn-compact"
          onClick={onBack}
          aria-label="Return to authentication page"
        >
          &larr; Back to login
        </button>
        <span className="gp-badge">Preview Mode</span>
      </div>

      <div className="gp-content">
        <div className="gp-banner">
          <span className="gp-banner-icon" aria-hidden="true">&#128640;</span>
          <p>
            You&apos;re previewing the first lesson. Create a free account when you&apos;re
            ready to track progress, earn badges, and unlock the AI tutor.
          </p>
        </div>

        <section className="lesson-surface">
          <div className="lesson-head">
            <span className="lesson-emoji" aria-hidden="true">{firstModule.emoji}</span>
            <div className="lesson-head-text">
              <div className="lesson-kicker">
                <span className="lesson-kicker-label">Module</span>
                <span className="lesson-kicker-value">{firstModule.title}</span>
              </div>
              <h2 className="lesson-title">{firstLesson.title}</h2>
              {firstLesson.difficulty && (
                <div className="lesson-meta">
                  <span className={`lesson-diff lesson-diff-${firstLesson.difficulty}`}>
                    {firstLesson.difficulty}
                  </span>
                  {firstLesson.duration && (
                    <span className="lesson-dur">⏱ {firstLesson.duration}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lesson-body">
            {firstLesson.hook?.accomplishments && (
              <div className="box sl-hook">
                <div className="box-label">In this lesson you will</div>
                <ul className="sl-hook-list">
                  {firstLesson.hook.accomplishments.map((item, i) => (
                    <li key={item + i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {firstLesson.do?.steps && (
              <>
                {firstLesson.do.title && (
                  <h3 className="sl-section-title">🧭 {firstLesson.do.title}</h3>
                )}
                <ol className="sl-steps">
                  {firstLesson.do.steps.map((step, i) => (
                    <li key={step + i} className="sl-step">
                      <span className="sl-step-num">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}

            {(firstLesson.code || firstLesson.do?.code) && (
              <CodePreview
                code={firstLesson.code || firstLesson.do?.code || ''}
                lang={course.id}
              />
            )}

            {firstLesson.do?.result && (
              <div className="box output-box">
                <div className="box-label">Result</div>
                <p>{firstLesson.do.result}</p>
              </div>
            )}

            {firstLesson.understand?.concepts && (
              <>
                <h3 className="sl-section-title">Understand</h3>
                <div className="sl-concepts">
                  {firstLesson.understand.concepts.map((concept, i) => (
                    <article key={concept.name + i} className="sl-concept-card">
                      <div className="sl-concept-name">{concept.name}</div>
                      <p className="sl-concept-def">{concept.definition}</p>
                      {concept.analogy && (
                        <div className="sl-concept-analogy">
                          <span className="sl-analogy-icon">&#129300;</span>
                          <span><strong>Think of it like:</strong> {concept.analogy}</span>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}

            {firstLesson.content && renderMarkdown(firstLesson.content)}

            {firstLesson.concepts && !firstLesson.understand && (
              <div className="concept-list">
                {firstLesson.concepts.map((concept, i) => (
                  <div key={concept + i} className="concept-item">
                    <span className="concept-bullet">→</span>
                    <span>{concept}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="gp-cta" aria-label="Preview call to action">
          <h3>Ready to keep going?</h3>
          <p>
            Create a free account to unlock all {totalLessons}+ lessons, track your progress,
            earn badges, and use the AI tutor.
          </p>
          <button type="button" className="gp-cta-btn ui-btn ui-btn-primary ui-btn-pill" onClick={onBack} aria-label="Create free account">
            Create free account
          </button>
        </section>
      </div>
    </main>
  );
}

