// ═══════════════════════════════════════════════
// LESSON PREVIEW VIEW — Renders the current draft
// the way students will see it in a real lesson card.
// ═══════════════════════════════════════════════

export function LessonPreviewView({ moduleInfo, lesson }) {
  return (
    <div className="lb-preview">
      <div className="lb-preview-card">
        <div className="lb-pv-head">
          <span className="lb-pv-emoji">{moduleInfo.emoji || '📄'}</span>
          <div className="lb-pv-head-text">
            <div className="lb-pv-module">{moduleInfo.title || 'Untitled Module'}</div>
            <h2 className="lb-pv-title">{lesson.title || 'Untitled Lesson'}</h2>
            <div className="lb-pv-meta">
              <span className={`lb-pv-diff lb-pv-diff-${lesson.difficulty}`}>
                {lesson.difficulty}
              </span>
              {lesson.duration && <span className="lb-pv-dur">{lesson.duration}</span>}
            </div>
          </div>
        </div>

        {lesson.concepts.filter(Boolean).length > 0 && (
          <div className="lb-pv-concepts">
            {lesson.concepts.filter(Boolean).map((c, i) => (
              <div key={i} className="lb-pv-concept">
                <span className="lb-pv-bullet">{'>'}</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        )}

        {lesson.code && (
          <div className="lb-pv-code-block">
            <div className="lb-pv-code-header">Code</div>
            <pre className="lb-pv-code">{lesson.code}</pre>
          </div>
        )}

        {lesson.output && (
          <div className="lb-pv-box lb-pv-output">
            <div className="lb-pv-box-label">Output</div>
            <p>{lesson.output}</p>
          </div>
        )}

        {lesson.tasks.filter(Boolean).length > 0 && (
          <div className="lb-pv-box lb-pv-tasks">
            <div className="lb-pv-box-label">Tasks</div>
            {lesson.tasks.filter(Boolean).map((t, i) => (
              <div key={i} className="lb-pv-task">
                <span className="lb-pv-task-check">○</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        )}

        {lesson.challenge && (
          <div className="lb-pv-box lb-pv-challenge">
            <div className="lb-pv-box-label">Challenge</div>
            <p>{lesson.challenge}</p>
          </div>
        )}

        {lesson.devFession && (
          <div className="lb-pv-devfession">
            <span className="lb-pv-devfession-icon">💬</span>
            <p>{lesson.devFession}</p>
          </div>
        )}
      </div>
    </div>
  );
}
