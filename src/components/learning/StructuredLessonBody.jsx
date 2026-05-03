// ═══════════════════════════════════════════════
// STRUCTURED LESSON BODY — Renders the opinionated
// six-step lesson format:
//
//   hook       — what you'll accomplish
//   do         — step-by-step instructions + proof
//   understand — concepts with definitions and analogies
//   build      — extend the starter code
//   challenge  — your turn + requirements checklist
//   summary    — what you can now do
//   bridge     — teaser for the next lesson
//
// Pure presentational — the parent passes checkedTasks +
// onToggleTask so the challenge checklist can persist state.
// ═══════════════════════════════════════════════

import { memo } from 'react';
import { CodePreview } from './CodePreview';

// Memoized — same rationale as RichLessonBody: skip re-renders
// driven by sibling state in LessonView (showNotes, AI tutor
// open/close) when none of this component's props changed.
export const StructuredLessonBody = memo(function StructuredLessonBody({
  lesson,
  lang,
  scaffolding,
  codeForPreview,
  checkedTasks,
  onToggleTask,
}) {
  return (
    <div className="lesson-body">
      {/* Hook — what you'll accomplish */}
      {lesson.hook?.accomplishments && (
        <div className="box sl-hook">
          <div className="box-label">🎯 What you will ship</div>
          <ul className="sl-hook-list">
            {lesson.hook.accomplishments.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Do — step-by-step instructions */}
      {lesson.do && (
        <>
          {lesson.do.title && <h3 className="sl-section-title">🛠️ {lesson.do.title}</h3>}
          <p className="sl-section-intro">
            Follow the steps, watch the output change, and keep your eyes on what the code is doing as you go.
          </p>
          {lesson.do.steps && (
            <ol className="sl-steps">
              {lesson.do.steps.map((step, i) => (
                <li key={i} className="sl-step">
                  <span className="sl-step-num">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      {/* Code preview */}
      {codeForPreview && (
        <CodePreview code={codeForPreview} lang={lang} scaffolding={scaffolding} />
      )}

      {/* Do — result + proof */}
      {lesson.do?.result && (
        <div className="box output-box">
          <div className="box-label">▶ Result</div>
          <p>{lesson.do.result}</p>
        </div>
      )}
      {lesson.do?.proofRequired && (
        <div className="sl-proof">
          <span className="sl-proof-icon" aria-hidden="true">📸</span>
          <span>
            <strong>Show your work:</strong> {lesson.do.proofRequired}
          </span>
        </div>
      )}

      {/* Understand — concepts with definitions + analogies */}
      {lesson.understand?.concepts && (
        <>
          <h3 className="sl-section-title">💡 Understand</h3>
          <p className="sl-section-intro">
            These are the ideas underneath the code so you can reuse the pattern, not just copy it.
          </p>
          <div className="sl-concepts">
            {lesson.understand.concepts.map((c, i) => (
              <div key={i} className="sl-concept-card">
                <div className="sl-concept-name">{c.name}</div>
                <p className="sl-concept-def">{c.definition}</p>
                {c.analogy && (
                  <div className="sl-concept-analogy">
                    <span className="sl-analogy-icon" aria-hidden="true">🔗</span>
                    <span>
                      <strong>Think of it like:</strong> {c.analogy}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {lesson.understand.keyTakeaway && (
            <div className="box tip">
              <div className="box-label">🔑 Key Takeaway</div>
              <p>{lesson.understand.keyTakeaway}</p>
            </div>
          )}
        </>
      )}

      {/* Build — extend the code */}
      {lesson.build && (
        <>
          <h3 className="sl-section-title">🔨 Build on it</h3>
          <p className="sl-section-intro">
            Push the starter a little further so the lesson becomes something you can actually shape yourself.
          </p>
          {lesson.build.goal && <p className="lp">{lesson.build.goal}</p>}
          {lesson.build.codeComparison && (
            <div className="sl-comparison">
              <div className="sl-comparison-pane">
                <div className="sl-comparison-label">Before</div>
                <pre className="sl-comparison-code">{lesson.build.codeComparison.old}</pre>
              </div>
              <div className="sl-comparison-pane sl-comparison-new">
                <div className="sl-comparison-label">After</div>
                <pre className="sl-comparison-code">{lesson.build.codeComparison.new}</pre>
              </div>
            </div>
          )}
          {lesson.build.hint && (
            <div className="box tip">
              <div className="box-label">💡 Hint</div>
              <p>{lesson.build.hint}</p>
            </div>
          )}
        </>
      )}

      {/* Challenge */}
      {lesson.challenge &&
        typeof lesson.challenge === 'object' &&
        lesson.challenge.mission && (
          <>
            <h3 className="sl-section-title">🔥 Challenge: {lesson.challenge.title}</h3>
            <p className="sl-section-intro">
              This is the rep that turns recognition into recall. Try it before peeking at anything else.
            </p>
            <p className="lp">{lesson.challenge.mission}</p>
            {lesson.challenge.requirements && (
              <div className="box tasks-box">
                <div className="box-label">✅ Requirements</div>
                <div className="tasks-list">
                  {lesson.challenge.requirements.map((req, i) => {
                    const key = `ch-${i}`;
                    const isChecked = checkedTasks.has(key);
                    return (
                      <label
                        key={i}
                        className={`task-item ${isChecked ? 'done' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleTask(key)}
                          aria-label={req}
                        />
                        <span className="task-check">{isChecked ? '✓' : ''}</span>
                        <span className="task-text">{req}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            {lesson.challenge.starterCode && (
              <CodePreview
                code={lesson.challenge.starterCode}
                lang={lang}
                scaffolding="starter"
              />
            )}
            {lesson.challenge.bonusChallenge && (
              <div className="box chal">
                <div className="box-label">⭐ Bonus</div>
                <p>{lesson.challenge.bonusChallenge}</p>
              </div>
            )}
          </>
        )}

      {/* Summary — what you can now do */}
      {lesson.summary?.capabilities && (
        <div className="sl-summary">
          <div className="sl-summary-title">🏁 You can now</div>
          <ul className="sl-summary-list">
            {lesson.summary.capabilities.map((cap, i) => (
              <li key={i}>
                <span className="sl-summary-check" aria-hidden="true">✓</span>
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bridge — teaser for next lesson */}
      {lesson.bridge?.preview && (
        <div className="sl-bridge">
          <div className="sl-bridge-label">Coming up next</div>
          <p>{lesson.bridge.preview}</p>
        </div>
      )}
    </div>
  );
});

