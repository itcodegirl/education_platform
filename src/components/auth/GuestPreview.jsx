// ═══════════════════════════════════════════════
// GUEST PREVIEW — Read-only first lesson preview
// Lets potential users experience the content quality
// before signing up. No auth required.
// ═══════════════════════════════════════════════

import { useState } from 'react';
import { COURSES } from '../../data';
import { renderMarkdown } from '../../utils/markdown';
import { CodePreview } from '../learning/CodePreview';

export function GuestPreview({ onBack }) {
  const course = COURSES[0]; // HTML
  const firstModule = course.modules[0];
  const firstLesson = firstModule.lessons[0];
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="guest-preview">
      <div className="gp-topbar">
        <button type="button" className="gp-back" onClick={onBack}>
          ← Back to login
        </button>
        <span className="gp-badge">Preview Mode</span>
        <button type="button" className="gp-signup-btn" onClick={onBack}>
          Sign up free →
        </button>
      </div>

      <div className="gp-content">
        <div className="gp-banner">
          <span className="gp-banner-icon">👀</span>
          <p>
            You&apos;re previewing the first lesson.{' '}
            <button type="button" className="gp-inline-link" onClick={onBack}>
              Create a free account
            </button>{' '}
            to track progress, earn badges, and unlock the AI tutor.
          </p>
        </div>

        <div className="lv">
          <div className="lv-head">
            <span className="lv-emoji">{firstModule.emoji}</span>
            <div className="lv-head-text">
              <div className="lv-kicker">
                <span className="lv-kicker-label">Module</span>
                <span className="lv-kicker-value">{firstModule.title}</span>
              </div>
              <h2 className="lv-title">{firstLesson.title}</h2>
              {firstLesson.difficulty && (
                <div className="lv-meta">
                  <span className={`lv-diff lv-diff-${firstLesson.difficulty}`}>
                    {firstLesson.difficulty}
                  </span>
                  {firstLesson.duration && (
                    <span className="lv-dur">⏱ {firstLesson.duration}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lv-body">
            {/* Structured hook */}
            {firstLesson.hook?.accomplishments && (
              <div className="box sl-hook">
                <div className="box-label">🎯 In this lesson you will</div>
                <ul className="sl-hook-list">
                  {firstLesson.hook.accomplishments.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Do steps */}
            {firstLesson.do?.steps && (
              <>
                {firstLesson.do.title && (
                  <h3 className="sl-section-title">🛠️ {firstLesson.do.title}</h3>
                )}
                <ol className="sl-steps">
                  {firstLesson.do.steps.map((step, i) => (
                    <li key={i} className="sl-step">
                      <span className="sl-step-num">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}

            {/* Code preview */}
            {(firstLesson.code || firstLesson.do?.code) && (
              <CodePreview
                code={firstLesson.code || firstLesson.do?.code || ''}
                lang={course.id}
              />
            )}

            {/* Result */}
            {firstLesson.do?.result && (
              <div className="box output-box">
                <div className="box-label">▶ Result</div>
                <p>{firstLesson.do.result}</p>
              </div>
            )}

            {/* Concepts */}
            {firstLesson.understand?.concepts && (
              <>
                <h3 className="sl-section-title">💡 Understand</h3>
                <div className="sl-concepts">
                  {firstLesson.understand.concepts.map((c, i) => (
                    <div key={i} className="sl-concept-card">
                      <div className="sl-concept-name">{c.name}</div>
                      <p className="sl-concept-def">{c.definition}</p>
                      {c.analogy && (
                        <div className="sl-concept-analogy">
                          <span className="sl-analogy-icon">🔗</span>
                          <span><strong>Think of it like:</strong> {c.analogy}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Legacy content fallback */}
            {firstLesson.content && renderMarkdown(firstLesson.content)}
            {firstLesson.concepts && !firstLesson.understand && (
              <div className="concept-list">
                {firstLesson.concepts.map((c, i) => (
                  <div key={i} className="concept-item">
                    <span className="concept-bullet">→</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA at bottom */}
        <div className="gp-cta">
          <h3>Ready to keep going?</h3>
          <p>Create a free account to unlock all {COURSES.reduce((sum, c) => sum + c.modules.reduce((s, m) => s + m.lessons.length, 0), 0)}+ lessons, track your progress, earn badges, and use the AI tutor.</p>
          <button type="button" className="gp-cta-btn" onClick={onBack}>
            Create free account →
          </button>
        </div>
      </div>
    </div>
  );
}
