// ═══════════════════════════════════════════════
// RICH LESSON BODY — Renders the "rich" and legacy-
// markdown lesson formats (older content that hasn't
// been migrated to the structured format yet).
//
// Formats handled here:
//   - Legacy markdown: `lesson.content` as a string
//   - Rich:            `lesson.concepts[]`, `lesson.tasks[]`,
//                      `lesson.tip`, `lesson.devFession`
//
// Pure presentational — parent owns checkedTasks state and
// the collapsed/expanded state of the Dev_Fession block.
// ═══════════════════════════════════════════════

import { memo } from 'react';
import { renderMarkdown } from '../../utils/markdown';
import { CodePreview } from './CodePreview';

// Memoized — only re-renders when its props change (lesson,
// checkedTasks Set ref, showDevFession). Skips re-renders driven
// by sibling state in LessonView (showNotes, the bookmark pill,
// the AI tutor open/close).
export const RichLessonBody = memo(function RichLessonBody({
  lesson,
  lang,
  scaffolding,
  codeForPreview,
  checkedTasks,
  onToggleTask,
  showDevFession,
  onToggleDevFession,
}) {
  const isRichFormat = !!(lesson.concepts || lesson.tasks || lesson.devFession);

  return (
    <>
      <div className="lesson-body">
        {lesson.content && renderMarkdown(lesson.content)}
        {isRichFormat && lesson.concepts && (
          <>
            <h3 className="sl-section-title">💡 Core ideas</h3>
            <p className="sl-section-intro">
              Keep these in your head while you read the example and try the practice below.
            </p>
            <div className="concept-list">
              {lesson.concepts.map((concept, index) => (
                <div key={index} className="concept-item">
                  <span className="concept-bullet" aria-hidden="true">→</span>
                  <span>{concept}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {codeForPreview && (
        <CodePreview code={codeForPreview} lang={lang} scaffolding={scaffolding} />
      )}

      {isRichFormat && lesson.output && (
        <div className="box output-box">
          <div className="box-label">▶ What you should see</div>
          <p>{lesson.output}</p>
        </div>
      )}

      {isRichFormat && lesson.tasks && lesson.tasks.length > 0 && (
        <div className="box tasks-box">
          <div className="box-label">✅ Your turn</div>
          <div className="tasks-list">
            {lesson.tasks.map((task, index) => {
              const isChecked = checkedTasks.has(index);
              return (
                <label key={index} className={`task-item ${isChecked ? 'done' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleTask(index)}
                    aria-label={task}
                  />
                  <span className="task-check">{isChecked ? '✓' : ''}</span>
                  <span className="task-text">{task}</span>
                </label>
              );
            })}
          </div>
          <div className="tasks-progress">
            {checkedTasks.size}/{lesson.tasks.length} completed
          </div>
        </div>
      )}

      {lesson.tip && (
        <div className="box tip">
          <div className="box-label">💡 Pro Tip</div>
          <p>{lesson.tip}</p>
        </div>
      )}

      {lesson.challenge && typeof lesson.challenge === 'string' && (
        <div className="box chal">
          <div className="box-label">🔥 Stretch challenge</div>
          <p>{lesson.challenge}</p>
        </div>
      )}

      {isRichFormat && lesson.devFession && (
        <div className="devfession">
          <button
            type="button"
            className={`devfession-toggle ${showDevFession ? 'open' : ''}`}
            onClick={onToggleDevFession}
            aria-expanded={showDevFession}
            aria-label="Toggle Dev_Fession — a real developer confession"
          >
            <span className="devfession-icon" aria-hidden="true">🤫</span>
            <span>Dev_Fession</span>
            <span className="devfession-sub">What real developers trip over here</span>
            <span className="devfession-arrow" aria-hidden="true">
              {showDevFession ? '▾' : '▸'}
            </span>
          </button>
          {showDevFession && (
            <div className="devfession-content">
              <p>&ldquo;{lesson.devFession}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </>
  );
});

