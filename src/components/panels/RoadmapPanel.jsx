import { useEffect, useRef } from 'react';
import { COURSES } from '../../data';
import { useProgressData, useCourseContent } from '../../providers';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function RoadmapPanel({ onClose, onNavigate, currentCourseIdx }) {
  const { completed = [], completedSet = new Set() } = useProgressData();
  const { ensureAllLoaded, allCoursesLoaded } = useCourseContent();
  const modalRef = useRef(null);

  useEffect(() => {
    ensureAllLoaded();
  }, [ensureAllLoaded]);

  useFocusTrap(modalRef, { enabled: true, onEscape: onClose });

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="panel roadmap-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Your learning roadmap"
        tabIndex={-1}
      >
        <div className="panel-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Whole-platform view</p>
            <h2 className="panel-title">Your Learning Roadmap</h2>
          </div>
          <button type="button" className="panel-close" onClick={onClose} aria-label="Close roadmap">
            ×
          </button>
        </div>

        <div className="roadmap-body">
          <p className="panel-meta">
            See every course, spot what is complete, and jump straight into the next module that needs you.
          </p>

          {!allCoursesLoaded && (
            <p className="roadmap-loading" aria-live="polite">
              Loading the rest of your roadmap so progress stays accurate across every track...
            </p>
          )}

          {COURSES.map((course, courseIndex) => {
            const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
            const doneLessons = completed.filter((key) => key.startsWith(course.label)).length;
            const percent = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
            const isCurrent = courseIndex === currentCourseIdx;
            const isComplete = doneLessons === totalLessons && totalLessons > 0;

            return (
              <div
                key={course.id}
                className={`rm-course ${isCurrent ? 'rm-current' : ''} ${isComplete ? 'rm-complete' : ''}`}
              >
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
                    {isComplete ? 'Done' : `${percent}%`}
                  </div>
                </div>

                <div className="rm-bar">
                  <div
                    className="rm-bar-fill"
                    style={{ width: `${percent}%`, background: course.accent }}
                  />
                </div>

                <div className="rm-modules">
                  {course.modules.map((module, moduleIndex) => {
                    const moduleDone = module.lessons.filter((lesson) =>
                      completedSet.has(`${course.label}|${module.title}|${lesson.title}`),
                    ).length;
                    const moduleComplete = moduleDone === module.lessons.length;
                    const moduleStarted = moduleDone > 0 && !moduleComplete;

                    return (
                      <button
                        key={module.id}
                        type="button"
                        className={`rm-mod ${moduleComplete ? 'done' : moduleStarted ? 'partial' : ''}`}
                        style={moduleComplete ? { borderColor: course.accent } : undefined}
                        onClick={() => {
                          onNavigate(courseIndex, moduleIndex);
                          onClose();
                        }}
                        title={`${module.title} (${moduleDone}/${module.lessons.length})`}
                      >
                        <span className="rm-mod-emoji">{moduleComplete ? '✓' : module.emoji}</span>
                        <span className="rm-mod-name">{module.title}</span>
                        <span className="rm-mod-count">
                          {moduleDone}/{module.lessons.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {courseIndex < COURSES.length - 1 && (
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
