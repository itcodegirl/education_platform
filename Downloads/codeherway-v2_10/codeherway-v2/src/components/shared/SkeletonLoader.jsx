// ═══════════════════════════════════════════════
// SKELETON LOADERS — Animated placeholders
// Shows while data loads from Supabase
// ═══════════════════════════════════════════════

export function SidebarSkeleton() {
  return (
    <div className="sk-sidebar">
      {/* Brand area */}
      <div className="sk-brand">
        <div className="sk-line sk-w40 sk-h20"></div>
      </div>
      {/* Course tabs */}
      <div className="sk-tabs">
        <div className="sk-pill"></div>
        <div className="sk-pill"></div>
        <div className="sk-pill"></div>
        <div className="sk-pill"></div>
      </div>
      {/* Stats */}
      <div className="sk-stats">
        <div className="sk-line sk-w60 sk-h12"></div>
        <div className="sk-bar"></div>
      </div>
      {/* Module list */}
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="sk-module">
          <div className="sk-line sk-w80 sk-h14"></div>
          <div className="sk-line sk-w50 sk-h10"></div>
        </div>
      ))}
    </div>
  );
}

export function LessonSkeleton() {
  return (
    <div className="sk-lesson">
      {/* Title area */}
      <div className="sk-lesson-head">
        <div className="sk-circle"></div>
        <div className="sk-lesson-title">
          <div className="sk-line sk-w70 sk-h20"></div>
          <div className="sk-line sk-w30 sk-h12"></div>
        </div>
      </div>
      {/* Concepts */}
      <div className="sk-section">
        <div className="sk-line sk-w20 sk-h12"></div>
        <div className="sk-line sk-w90 sk-h14"></div>
        <div className="sk-line sk-w80 sk-h14"></div>
        <div className="sk-line sk-w85 sk-h14"></div>
        <div className="sk-line sk-w70 sk-h14"></div>
      </div>
      {/* Code block */}
      <div className="sk-code">
        <div className="sk-code-header">
          <div className="sk-pill sk-small"></div>
          <div className="sk-pill sk-small"></div>
        </div>
        <div className="sk-code-body">
          <div className="sk-line sk-w60 sk-h12"></div>
          <div className="sk-line sk-w80 sk-h12"></div>
          <div className="sk-line sk-w50 sk-h12"></div>
          <div className="sk-line sk-w70 sk-h12"></div>
          <div className="sk-line sk-w40 sk-h12"></div>
        </div>
      </div>
      {/* Tasks */}
      <div className="sk-section">
        <div className="sk-line sk-w15 sk-h12"></div>
        <div className="sk-task">
          <div className="sk-check"></div>
          <div className="sk-line sk-w80 sk-h14"></div>
        </div>
        <div className="sk-task">
          <div className="sk-check"></div>
          <div className="sk-line sk-w70 sk-h14"></div>
        </div>
        <div className="sk-task">
          <div className="sk-check"></div>
          <div className="sk-line sk-w75 sk-h14"></div>
        </div>
      </div>
    </div>
  );
}

export function ConnectionError({ onRetry }) {
  return (
    <div className="conn-error">
      <span className="conn-icon">📡</span>
      <h3 className="conn-title">Connection Issue</h3>
      <p className="conn-msg">
        Could not connect to the database. Check your internet connection or try again.
      </p>
      <button className="conn-retry" onClick={onRetry}>
        ↺ Retry Connection
      </button>
    </div>
  );
}
