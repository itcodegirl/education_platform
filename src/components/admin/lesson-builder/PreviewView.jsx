// PreviewView — shows the active lesson roughly the way a learner
// would see it inside the platform. Pure presentation; reads only
// from moduleInfo + the current lesson.

export function PreviewView({ moduleInfo, lesson }) {
  const visibleConcepts = (lesson.concepts || []).filter(Boolean);
  const visibleTasks = (lesson.tasks || []).filter(Boolean);

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

        {visibleConcepts.length > 0 && (
          <div className="lb-pv-concepts">
            {visibleConcepts.map((c, i) => (
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

        {visibleTasks.length > 0 && (
          <div className="lb-pv-box lb-pv-tasks">
            <div className="lb-pv-box-label">Tasks</div>
            {visibleTasks.map((t, i) => (
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
