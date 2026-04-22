// SKELETON LOADERS — Animated placeholders
// Shows while data loads from Supabase

export function SidebarSkeleton() {
  return (
    <div className="skeleton-sidebar">
      {/* Brand area */}
      <div className="skeleton-brand">
        <div className="skeleton-line skeleton-w40 skeleton-h20"></div>
      </div>
      {/* Course tabs */}
      <div className="skeleton-tabs">
        <div className="skeleton-pill"></div>
        <div className="skeleton-pill"></div>
        <div className="skeleton-pill"></div>
        <div className="skeleton-pill"></div>
      </div>
      {/* Stats */}
      <div className="skeleton-stats">
        <div className="skeleton-line skeleton-w60 skeleton-h12"></div>
        <div className="skeleton-bar"></div>
      </div>
      {/* Module list */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-module">
          <div className="skeleton-line skeleton-w80 skeleton-h14"></div>
          <div className="skeleton-line skeleton-w50 skeleton-h10"></div>
        </div>
      ))}
    </div>
  );
}

export function LessonSkeleton() {
  return (
    <div className="skeleton-lesson">
      {/* Title area */}
      <div className="skeleton-lesson-head">
        <div className="skeleton-circle"></div>
        <div className="skeleton-lesson-title">
          <div className="skeleton-line skeleton-w70 skeleton-h20"></div>
          <div className="skeleton-line skeleton-w30 skeleton-h12"></div>
        </div>
      </div>
      {/* Concepts */}
      <div className="skeleton-section">
        <div className="skeleton-line skeleton-w20 skeleton-h12"></div>
        <div className="skeleton-line skeleton-w90 skeleton-h14"></div>
        <div className="skeleton-line skeleton-w80 skeleton-h14"></div>
        <div className="skeleton-line skeleton-w85 skeleton-h14"></div>
        <div className="skeleton-line skeleton-w70 skeleton-h14"></div>
      </div>
      {/* Code block */}
      <div className="skeleton-code">
        <div className="skeleton-code-header">
          <div className="skeleton-pill skeleton-small"></div>
          <div className="skeleton-pill skeleton-small"></div>
        </div>
        <div className="skeleton-code-body">
          <div className="skeleton-line skeleton-w60 skeleton-h12"></div>
          <div className="skeleton-line skeleton-w80 skeleton-h12"></div>
          <div className="skeleton-line skeleton-w50 skeleton-h12"></div>
          <div className="skeleton-line skeleton-w70 skeleton-h12"></div>
          <div className="skeleton-line skeleton-w40 skeleton-h12"></div>
        </div>
      </div>
      {/* Tasks */}
      <div className="skeleton-section">
        <div className="skeleton-line skeleton-w15 skeleton-h12"></div>
        <div className="skeleton-task">
          <div className="skeleton-check"></div>
          <div className="skeleton-line skeleton-w80 skeleton-h14"></div>
        </div>
        <div className="skeleton-task">
          <div className="skeleton-check"></div>
          <div className="skeleton-line skeleton-w70 skeleton-h14"></div>
        </div>
        <div className="skeleton-task">
          <div className="skeleton-check"></div>
          <div className="skeleton-line skeleton-w75 skeleton-h14"></div>
        </div>
      </div>
    </div>
  );
}

export function ConnectionError({ onRetry }) {
  return (
    <div className="conn-error" role="alert" aria-live="assertive">
      <span className="conn-icon" aria-hidden="true">!</span>
      <h3 className="conn-title">Connection Issue</h3>
      <p className="conn-msg">
        Could not connect to the database. Check your internet connection or try again.
      </p>
      <button type="button" className="conn-retry" onClick={onRetry}>
        Retry Connection
      </button>
    </div>
  );
}

