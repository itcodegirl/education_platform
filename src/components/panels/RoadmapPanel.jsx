// ═══════════════════════════════════════════════
// ROADMAP PANEL — Visual learning journey
// Bird's-eye view of all 4 courses with module
// progress, completion status, and current position.
// ═══════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { COURSES } from '../../data';
import { useProgress, useCourseContent } from '../../providers';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function RoadmapPanel({ onClose, onNavigate, currentCourseIdx }) {
  const { completed = [], completedSet = new Set() } = useProgress();
  // RoadmapPanel shows every course, so trigger the full load on
  // mount. If the user has only visited HTML so far, the other 4
  // course chunks haven't been fetched yet and their .modules
  // arrays are empty — without this the roadmap cards would
  // silently show "0/0 lessons" for the unloaded courses.
  const { ensureAllLoaded, allCoursesLoaded } = useCourseContent();
  useEffect(() => { ensureAllLoaded(); }, [ensureAllLoaded]);
  const modalRef = useRef(null);
  useFocusTrap(modalRef, { enabled: true, onEscape: onClose });

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="panel roadmap-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Your learning roadmap"
        tabIndex={-1}
      >
        <div className="panel-head">
          <h2 className="panel-title">🗺️ Your Learning Roadmap</h2>
          <button type="button" className="panel-close" onClick={onClose} aria-label="Close roadmap">
            ✕
          </button>
        </div>

        <div className="roadmap-body">
          {!allCoursesLoaded && (
            <p className="roadmap-loading" aria-live="polite">Loading roadmap…</p>
          )}
          {COURSES.map((course, ci) => {
            const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
            const doneLessons = completed.filter((k) => k.startsWith(course.label)).length;
            const pct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
            const isCurrent = ci === currentCourseIdx;
            const isComplete = doneLessons === totalLessons && totalLessons > 0;

            return (
              <div
                key={course.id}
                className={`rm-course ${isCurrent ? 'rm-current' : ''} ${isComplete ? 'rm-complete' : ''}`}
              >
                {/* Course header */}
                <div className="rm-course-head">
                  <div className="rm-course-info">
                    <span className="rm-course-icon">{course.icon}</span>
                    <div>
                      <span className="rm-course-label" style={{ color: course.accent }}>
                        {course.label}
                      </span>
                      <span className="rm-course-count">
                        {doneLessons}/{totalLessons} lessons
                      </span>
                    </div>
                  </div>
                  <div className="rm-course-pct" style={{ color: course.accent }}>
                    {isComplete ? '✓' : `${pct}%`}
                  </div>
                </div>

                {/* Course progress bar */}
                <div className="rm-bar">
                  <div
                    className="rm-bar-fill"
                    style={{ width: `${pct}%`, background: course.accent }}
                  />
                </div>

                {/* Module pills */}
                <div className="rm-modules">
                  {course.modules.map((mod, mi) => {
                    const modDone = mod.lessons.filter((l) =>
                      completedSet.has(`${course.label}|${mod.title}|${l.title}`),
                    ).length;
                    const modComplete = modDone === mod.lessons.length;
                    const modStarted = modDone > 0 && !modComplete;

                    return (
                      <button
                        key={mod.id}
                        type="button"
                        className={`rm-mod ${modComplete ? 'done' : modStarted ? 'partial' : ''}`}
                        style={modComplete ? { borderColor: course.accent } : undefined}
                        onClick={() => {
                          onNavigate(ci, mi);
                          onClose();
                        }}
                        title={`${mod.title} (${modDone}/${mod.lessons.length})`}
                      >
                        <span className="rm-mod-emoji">
                          {modComplete ? '✓' : mod.emoji}
                        </span>
                        <span className="rm-mod-name">{mod.title}</span>
                        <span className="rm-mod-count">
                          {modDone}/{mod.lessons.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Connector arrow between courses */}
                {ci < COURSES.length - 1 && (
                  <div className="rm-connector" aria-hidden="true">
                    <span>↓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
